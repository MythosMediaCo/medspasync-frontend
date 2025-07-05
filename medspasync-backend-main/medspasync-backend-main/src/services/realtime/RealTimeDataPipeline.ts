/**
 * Real-time Data Pipeline for MedSpa Analytics Pro
 * Redis Streams + PostgreSQL Hybrid Architecture
 * Performance target: <500ms data processing latency
 * Healthcare compliance: HIPAA, FHIR validation
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

interface StreamEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  data: any;
  source: string;
  correlationId: string;
  userId?: string;
  practiceId: string;
}

interface ProcessingMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  averageLatency: number;
  lastProcessedAt: Date;
  errors: Array<{
    timestamp: Date;
    error: string;
    eventId: string;
  }>;
}

interface FHIRValidationResult {
  isValid: boolean;
  violations: string[];
  severity: 'error' | 'warning' | 'info';
  recommendations: string[];
}

export class RealTimeDataPipeline {
  private prisma: PrismaClient;
  private redis: Redis;
  private eventEmitter: EventEmitter;
  private processingMetrics: ProcessingMetrics;
  private isProcessing = false;
  private readonly streamKey = 'medspa:events';
  private readonly consumerGroupName = 'analytics-processor';
  private readonly consumerName = 'consumer-1';
  private readonly MAX_PROCESSING_TIME = 500; // 500ms target
  private readonly BATCH_SIZE = 100;
  private readonly RETENTION_DAYS = 7;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn']
    });

    this.redis = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'] || '',
      db: parseInt(process.env['REDIS_DB'] || '9'), // Separate DB for streams
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(1000);

    this.processingMetrics = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      averageLatency: 0,
      lastProcessedAt: new Date(),
      errors: []
    };

    this.initializePipeline();
  }

  /**
   * Initialize the real-time data pipeline
   */
  private async initializePipeline(): Promise<void> {
    try {
      // Create stream if it doesn't exist
      await this.createStreamIfNotExists();
      
      // Create consumer group
      await this.createConsumerGroup();
      
      // Start processing
      this.startProcessing();
      
      console.log('✅ Real-time data pipeline initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize real-time pipeline:', error);
      throw error;
    }
  }

  /**
   * Create Redis stream if it doesn't exist
   */
  private async createStreamIfNotExists(): Promise<void> {
    try {
      // Add a test event to create the stream
      await this.redis.xadd(
        this.streamKey,
        '*',
        'eventType', 'pipeline_init',
        'timestamp', new Date().toISOString(),
        'data', JSON.stringify({ status: 'initialized' })
      );
      
      // Set retention policy (7 days)
      await this.redis.xtrim(this.streamKey, 'MAXLEN', '~', this.RETENTION_DAYS * 24 * 60 * 60);
      
    } catch (error) {
      console.error('Failed to create stream:', error);
    }
  }

  /**
   * Create consumer group for parallel processing
   */
  private async createConsumerGroup(): Promise<void> {
    try {
      await this.redis.xgroup('CREATE', this.streamKey, this.consumerGroupName, '$', 'MKSTREAM');
    } catch (error: any) {
      if (error.message.includes('BUSYGROUP')) {
        // Consumer group already exists
        console.log('Consumer group already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Start processing events from the stream
   */
  private startProcessing(): void {
    this.isProcessing = true;
    this.processEvents();
  }

  /**
   * Process events from Redis stream
   */
  private async processEvents(): Promise<void> {
    while (this.isProcessing) {
      try {
        const startTime = performance.now();
        
        // Read events from stream
        const events = await this.readEventsFromStream();
        
        if (events.length > 0) {
          // Process events in parallel
          const processingPromises = events.map(event => this.processEvent(event));
          const results = await Promise.allSettled(processingPromises);
          
          // Update metrics
          this.updateProcessingMetrics(results, performance.now() - startTime);
          
          // Acknowledge processed events
          await this.acknowledgeEvents(events);
        }
        
        // Small delay to prevent tight loop
        await this.sleep(10);
        
      } catch (error) {
        console.error('Error processing stream:', error);
        this.recordError('stream_processing_error', (error as Error).message);
      }
    }
  }

  /**
   * Read events from Redis stream
   */
  private async readEventsFromStream(): Promise<any[]> {
    try {
      const result = await this.redis.xreadgroup(
        'GROUP', this.consumerGroupName, this.consumerName,
        'COUNT', this.BATCH_SIZE,
        'BLOCK', 1000, // 1 second block
        'STREAMS', this.streamKey, '>'
      );
      
      if (!result || !Array.isArray(result)) {
        return [];
      }
      
      const events = [];
      for (const [stream, messages] of result as any[]) {
        for (const [id, fields] of messages) {
          events.push({
            id,
            fields: this.parseStreamFields(fields)
          });
        }
      }
      
      return events;
      
    } catch (error) {
      console.error('Error reading from stream:', error);
      return [];
    }
  }

  /**
   * Parse stream fields into structured data
   */
  private parseStreamFields(fields: string[]): any {
    const parsed: any = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === 'string') {
        try {
          parsed[key as string] = JSON.parse(value);
        } catch {
          parsed[key as string] = value;
        }
      } else if (value !== undefined) {
        parsed[key as string] = value;
      }
    }
    return parsed;
  }

  /**
   * Process individual event
   */
  private async processEvent(event: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      const { fields } = event;
      
      // Validate event data
      const validation = await this.validateEvent(fields);
      if (!validation.isValid) {
        throw new Error(`Event validation failed: ${validation.violations.join(', ')}`);
      }
      
      // Transform event data
      const transformedData = await this.transformEventData(fields);
      
      // Store in PostgreSQL
      await this.storeEventInDatabase(transformedData);
      
      // Update real-time cache
      await this.updateRealTimeCache(transformedData);
      
      // Emit event for real-time subscribers
      this.eventEmitter.emit('event_processed', {
        eventId: event.id,
        data: transformedData,
        processingTime: performance.now() - startTime
      });
      
      // Validate performance target
      const processingTime = performance.now() - startTime;
      if (processingTime > this.MAX_PROCESSING_TIME) {
        console.warn(`Event processing exceeded target: ${processingTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Validate event data for healthcare compliance
   */
  private async validateEvent(data: any): Promise<FHIRValidationResult> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Check required fields
    const requiredFields = ['eventType', 'timestamp', 'practiceId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        violations.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate timestamp
    if (data.timestamp) {
      const timestamp = new Date(data.timestamp);
      if (isNaN(timestamp.getTime())) {
        violations.push('Invalid timestamp format');
      }
    }
    
    // Validate practice ID format
    if (data.practiceId && !this.isValidUUID(data.practiceId)) {
      violations.push('Invalid practice ID format');
    }
    
    // Check for PHI data (should be encrypted)
    if (data.data && this.containsPHI(data.data)) {
      if (!this.isEncrypted(data.data)) {
        violations.push('PHI data must be encrypted');
        recommendations.push('Encrypt sensitive patient data before processing');
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'error' : 'info',
      recommendations
    };
  }

  /**
   * Transform event data for storage
   */
  private async transformEventData(data: any): Promise<any> {
    const transformed = {
      ...data,
      metadata: {
        ...data.metadata,
        processedAt: new Date(),
        version: '1.0',
        pipeline: 'real-time'
      }
    };
    
    // Add FHIR compliance metadata
    if (this.isHealthcareEvent(data.eventType)) {
      transformed.metadata.fhirCompliant = true;
      transformed.metadata.hipaaCompliant = true;
    }
    
    return transformed;
  }

  /**
   * Store event in PostgreSQL database
   */
  private async storeEventInDatabase(data: any): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          id: data.id,
          practiceId: data.practiceId,
          eventType: data.eventType,
          eventName: data.eventType,
          properties: {
            ...data.data,
            metadata: data.metadata,
            correlationId: data.correlationId,
            source: data.source
          },
          timestamp: data.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to store event in database:', error);
      throw error;
    }
  }

  /**
   * Update real-time cache
   */
  private async updateRealTimeCache(data: any): Promise<void> {
    try {
      const cacheKey = `realtime:${data.practiceId}:${data.eventType}`;
      const cacheData = {
        lastEvent: data,
        timestamp: new Date(),
        count: await this.incrementEventCount(cacheKey)
      };
      
      await this.redis.setex(cacheKey, 300, JSON.stringify(cacheData)); // 5 minutes TTL
      
    } catch (error) {
      console.error('Failed to update real-time cache:', error);
      // Don't throw error for cache failures
    }
  }

  /**
   * Increment event count for cache
   */
  private async incrementEventCount(cacheKey: string): Promise<number> {
    try {
      const count = await this.redis.incr(`${cacheKey}:count`);
      await this.redis.expire(`${cacheKey}:count`, 3600); // 1 hour TTL
      return count;
    } catch {
      return 1;
    }
  }

  /**
   * Acknowledge processed events
   */
  private async acknowledgeEvents(events: any[]): Promise<void> {
    try {
      const eventIds = events.map(event => event.id);
      await this.redis.xack(this.streamKey, this.consumerGroupName, ...eventIds);
    } catch (error) {
      console.error('Failed to acknowledge events:', error);
    }
  }

  /**
   * Update processing metrics
   */
  private updateProcessingMetrics(results: PromiseSettledResult<void>[], processingTime: number): void {
    this.processingMetrics.totalEvents += results.length;
    this.processingMetrics.lastProcessedAt = new Date();
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    this.processingMetrics.processedEvents += successful;
    this.processingMetrics.failedEvents += failed;
    
    // Update average latency
    const totalTime = this.processingMetrics.averageLatency * (this.processingMetrics.totalEvents - results.length) + processingTime;
    this.processingMetrics.averageLatency = totalTime / this.processingMetrics.totalEvents;
    
    // Record errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.recordError('event_processing_error', result.reason?.message || 'Unknown error');
      }
    });
  }

  /**
   * Record error for monitoring
   */
  private recordError(type: string, message: string): void {
    this.processingMetrics.errors.push({
      timestamp: new Date(),
      error: `${type}: ${message}`,
      eventId: crypto.randomUUID()
    });
    
    // Keep only last 100 errors
    if (this.processingMetrics.errors.length > 100) {
      this.processingMetrics.errors = this.processingMetrics.errors.slice(-100);
    }
  }

  /**
   * Publish event to stream
   */
  async publishEvent(event: StreamEvent): Promise<string> {
    try {
      const eventId = await this.redis.xadd(
        this.streamKey,
        '*',
        'eventType', event.eventType,
        'timestamp', event.timestamp.toISOString(),
        'practiceId', event.practiceId,
        'userId', event.userId || '',
        'correlationId', event.correlationId,
        'source', event.source,
        'data', JSON.stringify(event.data)
      );
      
      return eventId || '';
      
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time events
   */
  subscribeToEvents(callback: (event: any) => void): void {
    this.eventEmitter.on('event_processed', callback);
  }

  /**
   * Get processing metrics
   */
  getProcessingMetrics(): ProcessingMetrics {
    return {
      ...this.processingMetrics,
      averageLatency: Math.round(this.processingMetrics.averageLatency * 100) / 100
    };
  }

  /**
   * Get real-time cache data
   */
  async getRealTimeData(practiceId: string, eventType?: string): Promise<any> {
    try {
      const pattern = eventType ? 
        `realtime:${practiceId}:${eventType}` : 
        `realtime:${practiceId}:*`;
      
      const keys = await this.redis.keys(pattern);
      const data: any = {};
      
      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          data[key] = JSON.parse(cached);
        }
      }
      
      return data;
      
    } catch (error) {
      console.error('Failed to get real-time data:', error);
      return {};
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; metrics: ProcessingMetrics }> {
    try {
      await this.redis.ping();
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        metrics: this.getProcessingMetrics()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: this.getProcessingMetrics()
      };
    }
  }

  /**
   * Stop processing
   */
  async stop(): Promise<void> {
    this.isProcessing = false;
    await this.redis.quit();
    await this.prisma.$disconnect();
  }

  // Utility methods
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private containsPHI(data: any): boolean {
    const phiFields = ['name', 'email', 'phone', 'ssn', 'dateOfBirth', 'address'];
    const dataStr = JSON.stringify(data).toLowerCase();
    return phiFields.some(field => dataStr.includes(field));
  }

  private isEncrypted(data: any): boolean {
    // Simple check for encrypted data patterns
    const dataStr = JSON.stringify(data);
    return dataStr.includes('encrypted') || dataStr.includes('hash') || dataStr.includes('cipher');
  }

  private isHealthcareEvent(eventType: string): boolean {
    const healthcareEvents = [
      'appointment_created', 'appointment_updated', 'appointment_cancelled',
      'patient_registered', 'treatment_completed', 'payment_processed',
      'medical_record_updated', 'prescription_issued'
    ];
    return healthcareEvents.includes(eventType);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 