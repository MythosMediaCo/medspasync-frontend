import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { promisify } from 'util';
import { Redis } from 'ioredis';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Transaction {
  id: string;
  customerName: string;
  amount: number;
  date: Date;
  service: string;
  email?: string;
  phone?: string;
  program?: string;
  location?: string;
  metadata?: Record<string, any>;
}

interface MatchResult {
  rewardTransaction: Transaction;
  posTransaction: Transaction;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'ml' | 'hybrid';
  features: {
    nameSimilarity: number;
    amountSimilarity: number;
    dateProximity: number;
    serviceSimilarity: number;
    emailMatch: number;
    phoneMatch: number;
  };
  processingTime: number;
  algorithm: string;
}

interface ReconciliationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalTransactions: number;
  processedTransactions: number;
  matchesFound: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  progress: number;
  performance: {
    processingTime: number;
    transactionsPerSecond: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

interface ReconciliationConfig {
  maxWorkers: number;
  batchSize: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  confidenceThreshold: number;
  enableML: boolean;
  enableFuzzy: boolean;
  enableExact: boolean;
  performanceMonitoring: boolean;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TransactionSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1),
  amount: z.number().positive(),
  date: z.date(),
  service: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  program: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const ReconciliationConfigSchema = z.object({
  maxWorkers: z.number().min(1).max(16),
  batchSize: z.number().min(10).max(1000),
  cacheEnabled: z.boolean(),
  cacheTTL: z.number().min(60).max(3600),
  confidenceThreshold: z.number().min(0).max(1),
  enableML: z.boolean(),
  enableFuzzy: z.boolean(),
  enableExact: z.boolean(),
  performanceMonitoring: z.boolean(),
});

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      throw new Error(`Timer ${name} was not started`);
    }

    const duration = performance.now() - startTime;
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    this.startTimes.delete(name);
    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, times] of this.metrics) {
      result[name] = this.getAverageTime(name);
    }
    return result;
  }

  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

class CacheManager {
  private redis: Redis;
  private localCache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly localCacheSize = 1000;

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    }
  }

  private generateKey(prefix: string, data: any): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  async get<T>(key: string): Promise<T | null> {
    // Check local cache first
    const localItem = this.localCache.get(key);
    if (localItem && localItem.expiry > Date.now()) {
      return localItem.data as T;
    }
    this.localCache.delete(key);

    // Check Redis if available
    if (this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Store in local cache
          this.setLocalCache(key, parsed, 300000); // 5 minutes
          return parsed as T;
        }
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }

    return null;
  }

  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    // Store in local cache
    this.setLocalCache(key, data, Math.min(ttl * 1000, 300000));

    // Store in Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(data));
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }
  }

  private setLocalCache(key: string, data: any, ttl: number): void {
    // Implement LRU eviction
    if (this.localCache.size >= this.localCacheSize) {
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }

    this.localCache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear local cache entries matching pattern
    for (const key of this.localCache.keys()) {
      if (key.includes(pattern)) {
        this.localCache.delete(key);
      }
    }

    // Clear Redis cache entries matching pattern
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis cache invalidation error:', error);
      }
    }
  }
}

// ============================================================================
// OPTIMIZED RECONCILIATION ENGINE
// ============================================================================

export class OptimizedReconciliationEngine extends EventEmitter {
  private prisma: PrismaClient;
  private cache: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  private config: ReconciliationConfig;
  private activeJobs: Map<string, ReconciliationJob> = new Map();
  private workerPool: Worker[] = [];
  private isShuttingDown = false;

  constructor(
    prisma: PrismaClient,
    config: Partial<ReconciliationConfig> = {},
    redisUrl?: string
  ) {
    super();

    this.prisma = prisma;
    this.cache = new CacheManager(redisUrl);
    this.performanceMonitor = new PerformanceMonitor();
    this.config = ReconciliationConfigSchema.parse({
      maxWorkers: 4,
      batchSize: 100,
      cacheEnabled: true,
      cacheTTL: 3600,
      confidenceThreshold: 0.8,
      enableML: true,
      enableFuzzy: true,
      enableExact: true,
      performanceMonitoring: true,
      ...config,
    });

    this.initializeWorkerPool();
    this.setupGracefulShutdown();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeWorkerPool(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker = new Worker(__filename, {
        workerData: { workerId: i, config: this.config },
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });

      worker.on('error', (error) => {
        console.error(`Worker ${i} error:`, error);
        this.replaceWorker(i);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${i} exited with code ${code}`);
          this.replaceWorker(i);
        }
      });

      this.workerPool.push(worker);
    }
  }

  private replaceWorker(index: number): void {
    if (this.isShuttingDown) return;

    const newWorker = new Worker(__filename, {
      workerData: { workerId: index, config: this.config },
    });

    newWorker.on('message', (message) => {
      this.handleWorkerMessage(message);
    });

    newWorker.on('error', (error) => {
      console.error(`Replacement worker ${index} error:`, error);
    });

    this.workerPool[index] = newWorker;
  }

  private setupGracefulShutdown(): void {
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  // ============================================================================
  // MAIN RECONCILIATION METHODS
  // ============================================================================

  async startReconciliation(
    rewardTransactions: Transaction[],
    posTransactions: Transaction[],
    options: Partial<ReconciliationConfig> = {}
  ): Promise<string> {
    const jobId = this.generateJobId();
    const mergedConfig = { ...this.config, ...options };

    // Validate inputs
    this.validateTransactions(rewardTransactions);
    this.validateTransactions(posTransactions);

    const job: ReconciliationJob = {
      id: jobId,
      status: 'pending',
      totalTransactions: rewardTransactions.length * posTransactions.length,
      processedTransactions: 0,
      matchesFound: 0,
      startTime: new Date(),
      progress: 0,
      performance: {
        processingTime: 0,
        transactionsPerSecond: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
    };

    this.activeJobs.set(jobId, job);
    this.emit('jobStarted', jobId);

    // Start processing in background
    this.processReconciliationJob(jobId, rewardTransactions, posTransactions, mergedConfig);

    return jobId;
  }

  async getJobStatus(jobId: string): Promise<ReconciliationJob | null> {
    return this.activeJobs.get(jobId) || null;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Job cancelled by user';
    job.endTime = new Date();
    this.emit('jobCancelled', jobId);

    return true;
  }

  // ============================================================================
  // PROCESSING LOGIC
  // ============================================================================

  private async processReconciliationJob(
    jobId: string,
    rewardTransactions: Transaction[],
    posTransactions: Transaction[],
    config: ReconciliationConfig
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    this.performanceMonitor.startTimer(`job_${jobId}`);
    job.status = 'processing';

    try {
      // Phase 1: Exact matching
      if (config.enableExact) {
        await this.processExactMatches(jobId, rewardTransactions, posTransactions, config);
      }

      // Phase 2: Fuzzy matching
      if (config.enableFuzzy) {
        await this.processFuzzyMatches(jobId, rewardTransactions, posTransactions, config);
      }

      // Phase 3: ML matching
      if (config.enableML) {
        await this.processMLMatches(jobId, rewardTransactions, posTransactions, config);
      }

      // Finalize job
      job.status = 'completed';
      job.endTime = new Date();
      job.progress = 100;
      job.performance.processingTime = this.performanceMonitor.endTimer(`job_${jobId}`);
      job.performance.transactionsPerSecond = job.totalTransactions / (job.performance.processingTime / 1000);

      this.emit('jobCompleted', jobId, job);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
      this.emit('jobFailed', jobId, error);
    }
  }

  private async processExactMatches(
    jobId: string,
    rewardTransactions: Transaction[],
    posTransactions: Transaction[],
    config: ReconciliationConfig
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    this.performanceMonitor.startTimer(`exact_${jobId}`);

    const exactMatches: MatchResult[] = [];
    const processedRewards = new Set<string>();
    const processedPos = new Set<string>();

    for (const reward of rewardTransactions) {
      for (const pos of posTransactions) {
        if (processedRewards.has(reward.id) || processedPos.has(pos.id)) {
          continue;
        }

        const match = this.findExactMatch(reward, pos);
        if (match && match.confidence >= config.confidenceThreshold) {
          exactMatches.push(match);
          processedRewards.add(reward.id);
          processedPos.add(pos.id);
          job.matchesFound++;
        }

        job.processedTransactions++;
        job.progress = (job.processedTransactions / job.totalTransactions) * 100;
      }
    }

    // Store results in cache
    if (config.cacheEnabled) {
      await this.cache.set(`exact_matches_${jobId}`, exactMatches, config.cacheTTL);
    }

    this.performanceMonitor.endTimer(`exact_${jobId}`);
    this.emit('phaseCompleted', jobId, 'exact', exactMatches.length);
  }

  private async processFuzzyMatches(
    jobId: string,
    rewardTransactions: Transaction[],
    posTransactions: Transaction[],
    config: ReconciliationConfig
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    this.performanceMonitor.startTimer(`fuzzy_${jobId}`);

    // Get unmatched transactions
    const exactMatches = await this.cache.get<MatchResult[]>(`exact_matches_${jobId}`) || [];
    const matchedRewardIds = new Set(exactMatches.map(m => m.rewardTransaction.id));
    const matchedPosIds = new Set(exactMatches.map(m => m.posTransaction.id));

    const unmatchedRewards = rewardTransactions.filter(t => !matchedRewardIds.has(t.id));
    const unmatchedPos = posTransactions.filter(t => !matchedPosIds.has(t.id));

    // Process in batches using worker pool
    const batchSize = config.batchSize;
    const fuzzyMatches: MatchResult[] = [];

    for (let i = 0; i < unmatchedRewards.length; i += batchSize) {
      const batch = unmatchedRewards.slice(i, i + batchSize);
      
      // Distribute work across workers
      const workerPromises = this.workerPool.map((worker, index) => {
        const workerBatch = batch.filter((_, idx) => idx % this.workerPool.length === index);
        return this.sendToWorker(worker, {
          type: 'fuzzy_match',
          jobId,
          rewardTransactions: workerBatch,
          posTransactions: unmatchedPos,
          config,
        });
      });

      const batchResults = await Promise.all(workerPromises);
      for (const result of batchResults) {
        if (result.success && result.matches) {
          fuzzyMatches.push(...result.matches);
          job.matchesFound += result.matches.length;
        }
      }

      job.processedTransactions += batch.length * unmatchedPos.length;
      job.progress = (job.processedTransactions / job.totalTransactions) * 100;
    }

    // Store results in cache
    if (config.cacheEnabled) {
      await this.cache.set(`fuzzy_matches_${jobId}`, fuzzyMatches, config.cacheTTL);
    }

    this.performanceMonitor.endTimer(`fuzzy_${jobId}`);
    this.emit('phaseCompleted', jobId, 'fuzzy', fuzzyMatches.length);
  }

  private async processMLMatches(
    jobId: string,
    rewardTransactions: Transaction[],
    posTransactions: Transaction[],
    config: ReconciliationConfig
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    this.performanceMonitor.startTimer(`ml_${jobId}`);

    // Get remaining unmatched transactions
    const exactMatches = await this.cache.get<MatchResult[]>(`exact_matches_${jobId}`) || [];
    const fuzzyMatches = await this.cache.get<MatchResult[]>(`fuzzy_matches_${jobId}`) || [];
    
    const allMatchedRewardIds = new Set([
      ...exactMatches.map(m => m.rewardTransaction.id),
      ...fuzzyMatches.map(m => m.rewardTransaction.id),
    ]);
    const allMatchedPosIds = new Set([
      ...exactMatches.map(m => m.posTransaction.id),
      ...fuzzyMatches.map(m => m.posTransaction.id),
    ]);

    const remainingRewards = rewardTransactions.filter(t => !allMatchedRewardIds.has(t.id));
    const remainingPos = posTransactions.filter(t => !allMatchedPosIds.has(t.id));

    // Use ML model for remaining transactions
    const mlMatches = await this.runMLPrediction(remainingRewards, remainingPos, config);

    // Store results in cache
    if (config.cacheEnabled) {
      await this.cache.set(`ml_matches_${jobId}`, mlMatches, config.cacheTTL);
    }

    job.matchesFound += mlMatches.length;
    this.performanceMonitor.endTimer(`ml_${jobId}`);
    this.emit('phaseCompleted', jobId, 'ml', mlMatches.length);
  }

  // ============================================================================
  // MATCHING ALGORITHMS
  // ============================================================================

  private findExactMatch(reward: Transaction, pos: Transaction): MatchResult | null {
    const startTime = performance.now();

    // Exact match criteria
    const nameMatch = reward.customerName.toLowerCase() === pos.customerName.toLowerCase();
    const amountMatch = Math.abs(reward.amount - pos.amount) < 0.01;
    const dateMatch = Math.abs(reward.date.getTime() - pos.date.getTime()) < 24 * 60 * 60 * 1000; // 24 hours
    const serviceMatch = reward.service.toLowerCase() === pos.service.toLowerCase();

    if (nameMatch && amountMatch && dateMatch && serviceMatch) {
      return {
        rewardTransaction: reward,
        posTransaction: pos,
        confidence: 1.0,
        matchType: 'exact',
        features: {
          nameSimilarity: 1.0,
          amountSimilarity: 1.0,
          dateProximity: 1.0,
          serviceSimilarity: 1.0,
          emailMatch: reward.email && pos.email ? (reward.email === pos.email ? 1.0 : 0.0) : 0.0,
          phoneMatch: reward.phone && pos.phone ? (reward.phone === pos.phone ? 1.0 : 0.0) : 0.0,
        },
        processingTime: performance.now() - startTime,
        algorithm: 'exact_match',
      };
    }

    return null;
  }

  private async runMLPrediction(
    rewardTransactions: Transaction[],
    posTransactions: Transaction[],
    config: ReconciliationConfig
  ): Promise<MatchResult[]> {
    // This would integrate with your actual ML model
    // For now, we'll use a simplified scoring algorithm
    const matches: MatchResult[] = [];

    for (const reward of rewardTransactions) {
      let bestMatch: MatchResult | null = null;
      let bestScore = 0;

      for (const pos of posTransactions) {
        const score = this.calculateMLScore(reward, pos);
        if (score > bestScore && score >= config.confidenceThreshold) {
          bestScore = score;
          bestMatch = {
            rewardTransaction: reward,
            posTransaction: pos,
            confidence: score,
            matchType: 'ml',
            features: this.extractFeatures(reward, pos),
            processingTime: 0,
            algorithm: 'ml_prediction',
          };
        }
      }

      if (bestMatch) {
        matches.push(bestMatch);
      }
    }

    return matches;
  }

  private calculateMLScore(reward: Transaction, pos: Transaction): number {
    const features = this.extractFeatures(reward, pos);
    
    // Weighted scoring (replace with actual ML model)
    const weights = {
      nameSimilarity: 0.3,
      amountSimilarity: 0.25,
      dateProximity: 0.2,
      serviceSimilarity: 0.15,
      emailMatch: 0.05,
      phoneMatch: 0.05,
    };

    return Object.entries(features).reduce((score, [key, value]) => {
      return score + (value * weights[key as keyof typeof weights]);
    }, 0);
  }

  private extractFeatures(reward: Transaction, pos: Transaction) {
    return {
      nameSimilarity: this.calculateNameSimilarity(reward.customerName, pos.customerName),
      amountSimilarity: this.calculateAmountSimilarity(reward.amount, pos.amount),
      dateProximity: this.calculateDateProximity(reward.date, pos.date),
      serviceSimilarity: this.calculateServiceSimilarity(reward.service, pos.service),
      emailMatch: reward.email && pos.email ? (reward.email === pos.email ? 1.0 : 0.0) : 0.0,
      phoneMatch: reward.phone && pos.phone ? (reward.phone === pos.phone ? 1.0 : 0.0) : 0.0,
    };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Implement fuzzy string matching (e.g., Levenshtein distance, Jaro-Winkler)
    const normalized1 = name1.toLowerCase().replace(/[^a-z\s]/g, '');
    const normalized2 = name2.toLowerCase().replace(/[^a-z\s]/g, '');
    
    if (normalized1 === normalized2) return 1.0;
    
    // Simple similarity calculation (replace with proper algorithm)
    const words1 = normalized1.split(/\s+/);
    const words2 = normalized2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateAmountSimilarity(amount1: number, amount2: number): number {
    const difference = Math.abs(amount1 - amount2);
    const maxAmount = Math.max(amount1, amount2);
    
    if (maxAmount === 0) return 1.0;
    
    const similarity = 1 - (difference / maxAmount);
    return Math.max(0, similarity);
  }

  private calculateDateProximity(date1: Date, date2: Date): number {
    const difference = Math.abs(date1.getTime() - date2.getTime());
    const maxDifference = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (difference > maxDifference) return 0.0;
    
    return 1 - (difference / maxDifference);
  }

  private calculateServiceSimilarity(service1: string, service2: string): number {
    const normalized1 = service1.toLowerCase().replace(/[^a-z\s]/g, '');
    const normalized2 = service2.toLowerCase().replace(/[^a-z\s]/g, '');
    
    if (normalized1 === normalized2) return 1.0;
    
    // Simple word-based similarity
    const words1 = normalized1.split(/\s+/);
    const words2 = normalized2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // ============================================================================
  // WORKER COMMUNICATION
  // ============================================================================

  private async sendToWorker(worker: Worker, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 30000);

      const handler = (response: any) => {
        clearTimeout(timeout);
        worker.off('message', handler);
        resolve(response);
      };

      worker.on('message', handler);
      worker.postMessage(message);
    });
  }

  private handleWorkerMessage(message: any): void {
    // Handle worker responses
    if (message.type === 'fuzzy_match_result') {
      this.emit('workerResult', message.jobId, message.result);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateJobId(): string {
    return `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateTransactions(transactions: Transaction[]): void {
    for (const transaction of transactions) {
      TransactionSchema.parse(transaction);
    }
  }

  getPerformanceMetrics(): Record<string, number> {
    return this.performanceMonitor.getMetrics();
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // Terminate all workers
    await Promise.all(this.workerPool.map(worker => worker.terminate()));
    
    // Close database connection
    await this.prisma.$disconnect();
    
    // Clear caches
    this.activeJobs.clear();
    this.performanceMonitor.reset();
    
    this.emit('shutdown');
  }
}

// ============================================================================
// WORKER THREAD LOGIC
// ============================================================================

if (!isMainThread && parentPort) {
  const { workerId, config } = workerData;

  parentPort.on('message', async (message) => {
    if (message.type === 'fuzzy_match') {
      try {
        const matches = await processFuzzyMatchBatch(
          message.rewardTransactions,
          message.posTransactions,
          message.config
        );

        parentPort!.postMessage({
          type: 'fuzzy_match_result',
          jobId: message.jobId,
          success: true,
          matches,
        });
      } catch (error) {
        parentPort!.postMessage({
          type: 'fuzzy_match_result',
          jobId: message.jobId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
}

async function processFuzzyMatchBatch(
  rewardTransactions: Transaction[],
  posTransactions: Transaction[],
  config: ReconciliationConfig
): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];

  for (const reward of rewardTransactions) {
    for (const pos of posTransactions) {
      const score = calculateFuzzyScore(reward, pos);
      if (score >= config.confidenceThreshold) {
        matches.push({
          rewardTransaction: reward,
          posTransaction: pos,
          confidence: score,
          matchType: 'fuzzy',
          features: extractFeatures(reward, pos),
          processingTime: 0,
          algorithm: 'fuzzy_match',
        });
      }
    }
  }

  return matches;
}

function calculateFuzzyScore(reward: Transaction, pos: Transaction): number {
  // Implement fuzzy matching logic here
  const nameSimilarity = calculateNameSimilarity(reward.customerName, pos.customerName);
  const amountSimilarity = calculateAmountSimilarity(reward.amount, pos.amount);
  const dateProximity = calculateDateProximity(reward.date, pos.date);
  const serviceSimilarity = calculateServiceSimilarity(reward.service, pos.service);

  return (nameSimilarity * 0.4 + amountSimilarity * 0.3 + dateProximity * 0.2 + serviceSimilarity * 0.1);
}

function extractFeatures(reward: Transaction, pos: Transaction) {
  return {
    nameSimilarity: calculateNameSimilarity(reward.customerName, pos.customerName),
    amountSimilarity: calculateAmountSimilarity(reward.amount, pos.amount),
    dateProximity: calculateDateProximity(reward.date, pos.date),
    serviceSimilarity: calculateServiceSimilarity(reward.service, pos.service),
    emailMatch: reward.email && pos.email ? (reward.email === pos.email ? 1.0 : 0.0) : 0.0,
    phoneMatch: reward.phone && pos.phone ? (reward.phone === pos.phone ? 1.0 : 0.0) : 0.0,
  };
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = name1.toLowerCase().replace(/[^a-z\s]/g, '');
  const normalized2 = name2.toLowerCase().replace(/[^a-z\s]/g, '');
  
  if (normalized1 === normalized2) return 1.0;
  
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

function calculateAmountSimilarity(amount1: number, amount2: number): number {
  const difference = Math.abs(amount1 - amount2);
  const maxAmount = Math.max(amount1, amount2);
  
  if (maxAmount === 0) return 1.0;
  
  const similarity = 1 - (difference / maxAmount);
  return Math.max(0, similarity);
}

function calculateDateProximity(date1: Date, date2: Date): number {
  const difference = Math.abs(date1.getTime() - date2.getTime());
  const maxDifference = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  if (difference > maxDifference) return 0.0;
  
  return 1 - (difference / maxDifference);
}

function calculateServiceSimilarity(service1: string, service2: string): number {
  const normalized1 = service1.toLowerCase().replace(/[^a-z\s]/g, '');
  const normalized2 = service2.toLowerCase().replace(/[^a-z\s]/g, '');
  
  if (normalized1 === normalized2) return 1.0;
  
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  return commonWords.length / Math.max(words1.length, words2.length);
} 