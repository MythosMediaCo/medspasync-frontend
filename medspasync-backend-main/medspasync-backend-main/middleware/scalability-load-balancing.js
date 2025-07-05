/**
 * Scalability & Load Balancing Middleware
 * Horizontal scaling, load distribution, and high availability for MedSpaSync Pro
 */

const cluster = require('cluster');
const os = require('os');
const { Pool } = require('pg');
const redis = require('redis');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

class ScalabilityManager {
  constructor() {
    this.isMaster = cluster.isMaster;
    this.workerId = cluster.isWorker ? cluster.worker.id : 'master';
    this.instanceId = crypto.randomUUID();
    this.startTime = Date.now();
    
    // Load balancing configuration
    this.loadBalancerConfig = {
      algorithm: process.env.LOAD_BALANCER_ALGORITHM || 'round_robin', // round_robin, least_connections, ip_hash, weighted
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
      connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 30000,
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
      circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5,
      circuitBreakerTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 60000
    };

    // Database connection pools for different services
    this.databasePools = {
      primary: new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX) || 20,
        min: parseInt(process.env.DB_POOL_MIN) || 5,
        idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
        acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000
      }),
      readReplica: new Pool({
        connectionString: process.env.DATABASE_READ_REPLICA_URL || process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_READ_POOL_MAX) || 15,
        min: parseInt(process.env.DB_READ_POOL_MIN) || 3,
        idle: parseInt(process.env.DB_READ_POOL_IDLE) || 10000,
        acquire: parseInt(process.env.DB_READ_POOL_ACQUIRE) || 30000
      })
    };

    // Redis cluster configuration
    this.redisCluster = {
      primary: redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retry_strategy: this.getRetryStrategy(),
        max_attempts: 3,
        connect_timeout: 10000,
        command_timeout: 5000
      }),
      cache: redis.createClient({
        host: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_CACHE_PORT || process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_CACHE_PASSWORD || process.env.REDIS_PASSWORD,
        db: process.env.REDIS_CACHE_DB || 1,
        retry_strategy: this.getRetryStrategy(),
        max_attempts: 3,
        connect_timeout: 10000,
        command_timeout: 5000
      }),
      session: redis.createClient({
        host: process.env.REDIS_SESSION_HOST || process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_SESSION_PORT || process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_SESSION_PASSWORD || process.env.REDIS_PASSWORD,
        db: process.env.REDIS_SESSION_DB || 2,
        retry_strategy: this.getRetryStrategy(),
        max_attempts: 3,
        connect_timeout: 10000,
        command_timeout: 5000
      })
    };

    // Service discovery and health tracking
    this.serviceRegistry = new Map();
    this.healthStatus = {
      database: { status: 'unknown', lastCheck: null, responseTime: null },
      redis: { status: 'unknown', lastCheck: null, responseTime: null },
      external: { status: 'unknown', lastCheck: null, responseTime: null }
    };

    // Load balancing state
    this.loadBalancerState = {
      currentIndex: 0,
      connectionCounts: new Map(),
      healthChecks: new Map(),
      circuitBreakers: new Map()
    };

    this.initializeScalability();
  }

  /**
   * Initialize scalability features
   */
  initializeScalability() {
    if (this.isMaster) {
      this.initializeMasterProcess();
    } else {
      this.initializeWorkerProcess();
    }

    this.initializeHealthMonitoring();
    this.initializeServiceDiscovery();
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize master process
   */
  initializeMasterProcess() {
    console.log('🚀 Master process started, initializing cluster...');
    
    // Fork workers based on CPU cores
    const numCPUs = os.cpus().length;
    const workerCount = parseInt(process.env.WORKER_COUNT) || Math.max(1, numCPUs - 1);
    
    console.log(`📊 Forking ${workerCount} workers...`);
    
    for (let i = 0; i < workerCount; i++) {
      const worker = cluster.fork();
      
      // Track worker health
      this.loadBalancerState.healthChecks.set(worker.id, {
        status: 'starting',
        lastHeartbeat: Date.now(),
        responseTime: null,
        errorCount: 0
      });
    }

    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
      this.loadBalancerState.healthChecks.delete(worker.id);
      
      // Restart worker
      const newWorker = cluster.fork();
      this.loadBalancerState.healthChecks.set(newWorker.id, {
        status: 'starting',
        lastHeartbeat: Date.now(),
        responseTime: null,
        errorCount: 0
      });
    });

    cluster.on('message', (worker, message) => {
      if (message.type === 'health_update') {
        this.updateWorkerHealth(worker.id, message.data);
      } else if (message.type === 'metrics_update') {
        this.updateWorkerMetrics(worker.id, message.data);
      }
    });

    // Start load balancer health monitoring
    setInterval(() => {
      this.monitorWorkerHealth();
    }, this.loadBalancerConfig.healthCheckInterval);
  }

  /**
   * Initialize worker process
   */
  initializeWorkerProcess() {
    console.log(`🔧 Worker ${this.workerId} started`);
    
    // Send periodic health updates to master
    setInterval(() => {
      process.send({
        type: 'health_update',
        data: {
          workerId: this.workerId,
          status: 'healthy',
          uptime: Date.now() - this.startTime,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      });
    }, 10000);

    // Send metrics updates
    setInterval(() => {
      this.collectWorkerMetrics().then(metrics => {
        process.send({
          type: 'metrics_update',
          data: {
            workerId: this.workerId,
            metrics: metrics
          }
        });
      });
    }, 30000);
  }

  /**
   * Initialize health monitoring
   */
  initializeHealthMonitoring() {
    // Monitor database health
    setInterval(() => {
      this.checkDatabaseHealth();
    }, 30000);

    // Monitor Redis health
    setInterval(() => {
      this.checkRedisHealth();
    }, 30000);

    // Monitor external services
    setInterval(() => {
      this.checkExternalServicesHealth();
    }, 60000);
  }

  /**
   * Initialize service discovery
   */
  initializeServiceDiscovery() {
    // Register this instance
    this.registerService({
      id: this.instanceId,
      type: this.isMaster ? 'master' : 'worker',
      workerId: this.workerId,
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 3000,
      health: 'healthy',
      capabilities: ['api', 'database', 'cache'],
      load: 0,
      lastSeen: Date.now()
    });

    // Periodic service registration update
    setInterval(() => {
      this.updateServiceRegistration();
    }, 30000);
  }

  /**
   * Initialize circuit breakers
   */
  initializeCircuitBreakers() {
    // Initialize circuit breakers for external services
    const externalServices = [
      'database_primary',
      'database_read_replica',
      'redis_primary',
      'redis_cache',
      'redis_session',
      'external_api'
    ];

    externalServices.forEach(service => {
      this.loadBalancerState.circuitBreakers.set(service, {
        status: 'closed', // closed, open, half-open
        failureCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        threshold: this.loadBalancerConfig.circuitBreakerThreshold,
        timeout: this.loadBalancerConfig.circuitBreakerTimeout
      });
    });
  }

  /**
   * Load balancing middleware
   */
  loadBalancingMiddleware() {
    return (req, res, next) => {
      // Add load balancer headers
      res.setHeader('X-Load-Balancer', 'MedSpaSync-Pro');
      res.setHeader('X-Worker-ID', this.workerId);
      res.setHeader('X-Instance-ID', this.instanceId);
      
      // Track request for load balancing
      this.trackRequest(req);
      
      // Check circuit breakers
      if (this.isCircuitBreakerOpen('database_primary')) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Database service is experiencing issues'
        });
      }
      
      next();
    };
  }

  /**
   * Database load balancing middleware
   */
  databaseLoadBalancingMiddleware() {
    return async (req, res, next) => {
      // Determine which database to use based on operation type
      const isReadOperation = this.isReadOperation(req);
      const pool = isReadOperation ? this.databasePools.readReplica : this.databasePools.primary;
      
      // Add database pool to request for use in route handlers
      req.dbPool = pool;
      req.isReadOperation = isReadOperation;
      
      // Check circuit breaker for selected database
      const circuitBreakerKey = isReadOperation ? 'database_read_replica' : 'database_primary';
      if (this.isCircuitBreakerOpen(circuitBreakerKey)) {
        return res.status(503).json({
          error: 'Database temporarily unavailable',
          message: 'Database service is experiencing issues'
        });
      }
      
      next();
    };
  }

  /**
   * Redis load balancing middleware
   */
  redisLoadBalancingMiddleware() {
    return (req, res, next) => {
      // Determine which Redis instance to use based on operation type
      const redisType = this.getRedisType(req);
      const redisClient = this.redisCluster[redisType];
      
      // Add Redis client to request
      req.redisClient = redisClient;
      req.redisType = redisType;
      
      // Check circuit breaker for Redis
      const circuitBreakerKey = `redis_${redisType}`;
      if (this.isCircuitBreakerOpen(circuitBreakerKey)) {
        return res.status(503).json({
          error: 'Cache temporarily unavailable',
          message: 'Cache service is experiencing issues'
        });
      }
      
      next();
    };
  }

  /**
   * Auto-scaling middleware
   */
  autoScalingMiddleware() {
    return (req, res, next) => {
      // Monitor system load
      const systemLoad = this.getSystemLoad();
      
      // Check if scaling is needed
      if (systemLoad.cpu > 80 || systemLoad.memory > 85) {
        this.triggerAutoScaling(systemLoad);
      }
      
      // Add load information to response headers
      res.setHeader('X-System-Load', JSON.stringify(systemLoad));
      
      next();
    };
  }

  /**
   * High availability middleware
   */
  highAvailabilityMiddleware() {
    return (req, res, next) => {
      // Implement request deduplication
      const requestId = this.generateRequestId(req);
      req.requestId = requestId;
      
      // Add request ID to response headers
      res.setHeader('X-Request-ID', requestId);
      
      // Implement graceful degradation
      req.gracefulDegradation = this.getGracefulDegradationLevel();
      
      next();
    };
  }

  /**
   * Service mesh middleware
   */
  serviceMeshMiddleware() {
    return (req, res, next) => {
      // Add service mesh headers
      res.setHeader('X-Service-Mesh', 'MedSpaSync-Pro-Mesh');
      res.setHeader('X-Trace-ID', this.generateTraceId());
      res.setHeader('X-Span-ID', this.generateSpanId());
      
      // Implement distributed tracing
      req.traceId = res.getHeader('X-Trace-ID');
      req.spanId = res.getHeader('X-Span-ID');
      
      next();
    };
  }

  /**
   * Check if operation is read-only
   */
  isReadOperation(req) {
    const readMethods = ['GET', 'HEAD', 'OPTIONS'];
    const readPaths = ['/api/performance/status', '/api/performance/logs', '/api/performance/reports'];
    
    return readMethods.includes(req.method) || readPaths.some(path => req.path.startsWith(path));
  }

  /**
   * Get Redis type based on request
   */
  getRedisType(req) {
    if (req.path.includes('/session') || req.path.includes('/auth')) {
      return 'session';
    } else if (req.path.includes('/cache') || req.path.includes('/performance')) {
      return 'cache';
    } else {
      return 'primary';
    }
  }

  /**
   * Track request for load balancing
   */
  trackRequest(req) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const currentCount = this.loadBalancerState.connectionCounts.get(clientIP) || 0;
    this.loadBalancerState.connectionCounts.set(clientIP, currentCount + 1);
    
    // Clean up old entries
    setTimeout(() => {
      const count = this.loadBalancerState.connectionCounts.get(clientIP);
      if (count > 1) {
        this.loadBalancerState.connectionCounts.set(clientIP, count - 1);
      } else {
        this.loadBalancerState.connectionCounts.delete(clientIP);
      }
    }, 60000);
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    const startTime = Date.now();
    
    try {
      await this.databasePools.primary.query('SELECT 1');
      
      this.healthStatus.database = {
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime
      };
      
      this.resetCircuitBreaker('database_primary');
    } catch (error) {
      this.healthStatus.database = {
        status: 'unhealthy',
        lastCheck: Date.now(),
        responseTime: null,
        error: error.message
      };
      
      this.triggerCircuitBreaker('database_primary', error);
    }
  }

  /**
   * Check Redis health
   */
  async checkRedisHealth() {
    const startTime = Date.now();
    
    try {
      await this.redisCluster.primary.ping();
      
      this.healthStatus.redis = {
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime
      };
      
      this.resetCircuitBreaker('redis_primary');
    } catch (error) {
      this.healthStatus.redis = {
        status: 'unhealthy',
        lastCheck: Date.now(),
        responseTime: null,
        error: error.message
      };
      
      this.triggerCircuitBreaker('redis_primary', error);
    }
  }

  /**
   * Check external services health
   */
  async checkExternalServicesHealth() {
    const services = [
      { name: 'azure_keyvault', url: process.env.AZURE_KEYVAULT_URL },
      { name: 'stripe_api', url: 'https://api.stripe.com' },
      { name: 'twilio_api', url: 'https://api.twilio.com' }
    ];

    for (const service of services) {
      if (!service.url) continue;
      
      const startTime = Date.now();
      
      try {
        await this.checkExternalService(service.url);
        
        this.resetCircuitBreaker(`external_${service.name}`);
      } catch (error) {
        this.triggerCircuitBreaker(`external_${service.name}`, error);
      }
    }
  }

  /**
   * Check external service health
   */
  async checkExternalService(url) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, 10000);

      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (res) => {
        clearTimeout(timeout);
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      }).on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Monitor worker health
   */
  monitorWorkerHealth() {
    const now = Date.now();
    
    for (const [workerId, health] of this.loadBalancerState.healthChecks) {
      const timeSinceLastHeartbeat = now - health.lastHeartbeat;
      
      if (timeSinceLastHeartbeat > this.loadBalancerConfig.healthCheckInterval * 2) {
        health.status = 'unhealthy';
        health.errorCount++;
        
        console.warn(`⚠️ Worker ${workerId} appears unhealthy (no heartbeat for ${timeSinceLastHeartbeat}ms)`);
      }
    }
  }

  /**
   * Update worker health
   */
  updateWorkerHealth(workerId, data) {
    const health = this.loadBalancerState.healthChecks.get(workerId);
    if (health) {
      health.status = data.status;
      health.lastHeartbeat = Date.now();
      health.uptime = data.uptime;
      health.memoryUsage = data.memoryUsage;
      health.cpuUsage = data.cpuUsage;
    }
  }

  /**
   * Update worker metrics
   */
  updateWorkerMetrics(workerId, data) {
    // Store worker metrics for load balancing decisions
    this.serviceRegistry.set(`worker_${workerId}`, {
      ...this.serviceRegistry.get(`worker_${workerId}`),
      metrics: data.metrics,
      lastUpdate: Date.now()
    });
  }

  /**
   * Register service
   */
  registerService(serviceInfo) {
    this.serviceRegistry.set(serviceInfo.id, {
      ...serviceInfo,
      registeredAt: Date.now()
    });
  }

  /**
   * Update service registration
   */
  updateServiceRegistration() {
    const serviceInfo = this.serviceRegistry.get(this.instanceId);
    if (serviceInfo) {
      serviceInfo.lastSeen = Date.now();
      serviceInfo.load = this.getCurrentLoad();
      serviceInfo.health = this.getCurrentHealth();
    }
  }

  /**
   * Get current system load
   */
  getSystemLoad() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      memory: (usage.heapUsed / usage.heapTotal) * 100,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }

  /**
   * Get current load for load balancing
   */
  getCurrentLoad() {
    const load = this.getSystemLoad();
    return {
      cpu: load.cpu,
      memory: load.memory,
      connections: this.loadBalancerState.connectionCounts.size,
      timestamp: Date.now()
    };
  }

  /**
   * Get current health status
   */
  getCurrentHealth() {
    return {
      database: this.healthStatus.database.status,
      redis: this.healthStatus.redis.status,
      external: this.healthStatus.external.status,
      timestamp: Date.now()
    };
  }

  /**
   * Trigger auto-scaling
   */
  triggerAutoScaling(systemLoad) {
    console.log('📈 Auto-scaling triggered:', systemLoad);
    
    // In a real implementation, this would trigger cloud provider auto-scaling
    // For now, we'll log the event and potentially restart workers
    if (this.isMaster && systemLoad.cpu > 90) {
      console.log('🔄 High CPU load detected, considering worker restart');
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen(service) {
    const circuitBreaker = this.loadBalancerState.circuitBreakers.get(service);
    if (!circuitBreaker) return false;
    
    if (circuitBreaker.status === 'open') {
      if (Date.now() > circuitBreaker.nextAttemptTime) {
        circuitBreaker.status = 'half-open';
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Trigger circuit breaker
   */
  triggerCircuitBreaker(service, error) {
    const circuitBreaker = this.loadBalancerState.circuitBreakers.get(service);
    if (!circuitBreaker) return;
    
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
      circuitBreaker.status = 'open';
      circuitBreaker.nextAttemptTime = Date.now() + circuitBreaker.timeout;
      
      console.warn(`🚨 Circuit breaker opened for ${service} after ${circuitBreaker.failureCount} failures`);
    }
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(service) {
    const circuitBreaker = this.loadBalancerState.circuitBreakers.get(service);
    if (!circuitBreaker) return;
    
    circuitBreaker.failureCount = 0;
    circuitBreaker.status = 'closed';
    circuitBreaker.lastFailureTime = null;
    circuitBreaker.nextAttemptTime = null;
  }

  /**
   * Get graceful degradation level
   */
  getGracefulDegradationLevel() {
    const load = this.getSystemLoad();
    
    if (load.cpu > 90 || load.memory > 95) {
      return 'critical';
    } else if (load.cpu > 80 || load.memory > 85) {
      return 'high';
    } else if (load.cpu > 60 || load.memory > 70) {
      return 'medium';
    } else {
      return 'normal';
    }
  }

  /**
   * Generate request ID
   */
  generateRequestId(req) {
    return `${this.instanceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  generateTraceId() {
    return crypto.randomUUID();
  }

  /**
   * Generate span ID
   */
  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Get retry strategy for Redis
   */
  getRetryStrategy() {
    return (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('The server refused the connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    };
  }

  /**
   * Collect worker metrics
   */
  async collectWorkerMetrics() {
    const load = this.getSystemLoad();
    const health = this.getCurrentHealth();
    
    return {
      load,
      health,
      uptime: Date.now() - this.startTime,
      workerId: this.workerId,
      instanceId: this.instanceId,
      timestamp: Date.now()
    };
  }

  /**
   * Get scalability statistics
   */
  getScalabilityStatistics() {
    return {
      instance: {
        id: this.instanceId,
        workerId: this.workerId,
        isMaster: this.isMaster,
        uptime: Date.now() - this.startTime
      },
      loadBalancer: {
        algorithm: this.loadBalancerConfig.algorithm,
        activeConnections: this.loadBalancerState.connectionCounts.size,
        workerCount: this.loadBalancerState.healthChecks.size
      },
      health: this.healthStatus,
      circuitBreakers: Array.from(this.loadBalancerState.circuitBreakers.entries()).map(([service, cb]) => ({
        service,
        status: cb.status,
        failureCount: cb.failureCount,
        lastFailureTime: cb.lastFailureTime
      })),
      services: Array.from(this.serviceRegistry.values()),
      systemLoad: this.getSystemLoad()
    };
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    console.log('🔄 Initiating graceful shutdown...');
    
    // Close database connections
    await Promise.all([
      this.databasePools.primary.end(),
      this.databasePools.readReplica.end()
    ]);
    
    // Close Redis connections
    await Promise.all([
      this.redisCluster.primary.quit(),
      this.redisCluster.cache.quit(),
      this.redisCluster.session.quit()
    ]);
    
    console.log('✅ Graceful shutdown completed');
  }
}

// Create singleton instance
const scalabilityManager = new ScalabilityManager();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  scalabilityManager.gracefulShutdown().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  scalabilityManager.gracefulShutdown().then(() => {
    process.exit(0);
  });
});

// Export middleware functions
module.exports = {
  loadBalancingMiddleware: scalabilityManager.loadBalancingMiddleware.bind(scalabilityManager),
  databaseLoadBalancingMiddleware: scalabilityManager.databaseLoadBalancingMiddleware.bind(scalabilityManager),
  redisLoadBalancingMiddleware: scalabilityManager.redisLoadBalancingMiddleware.bind(scalabilityManager),
  autoScalingMiddleware: scalabilityManager.autoScalingMiddleware.bind(scalabilityManager),
  highAvailabilityMiddleware: scalabilityManager.highAvailabilityMiddleware.bind(scalabilityManager),
  serviceMeshMiddleware: scalabilityManager.serviceMeshMiddleware.bind(scalabilityManager),
  getScalabilityStatistics: scalabilityManager.getScalabilityStatistics.bind(scalabilityManager),
  gracefulShutdown: scalabilityManager.gracefulShutdown.bind(scalabilityManager)
}; 