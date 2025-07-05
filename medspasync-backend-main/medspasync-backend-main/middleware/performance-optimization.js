/**
 * Performance Optimization Middleware
 * Comprehensive performance optimization for MedSpaSync Pro
 * Database query optimization, caching, connection pooling, and monitoring
 */

const { Pool } = require('pg');
const redis = require('redis');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { RedisManager } = require('../config/redis-cluster');
const AdvancedCacheManager = require('../services/AdvancedCacheManager');
const DatabaseHealthMonitor = require('../services/DatabaseHealthMonitor');
const DatabaseShardManager = require('../services/DatabaseShardManager');
const { CDNManager } = require('../config/cdn-config');

class PerformanceOptimizer {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection pool optimization
      max: 20, // Maximum number of clients in the pool
      min: 5,  // Minimum number of clients in the pool
      idle: 10000, // How long a client is allowed to remain idle before being closed
      acquire: 30000, // Maximum time to acquire a client from the pool
      createTimeoutMillis: 30000, // Maximum time to create a client
      destroyTimeoutMillis: 5000, // Maximum time to destroy a client
      reapIntervalMillis: 1000, // How often to check for idle clients
      createRetryIntervalMillis: 200, // How long to wait before retrying to create a client
      propagateCreateError: false // Whether to propagate errors from client creation
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 6,
      // Redis optimization
      retry_strategy: (options) => {
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
      },
      max_attempts: 3,
      connect_timeout: 10000,
      command_timeout: 5000
    });

    this.queryCache = new Map();
    this.performanceMetrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.cacheTTL = 300; // 5 minutes default
    
    this.redisManager = new RedisManager();
    this.cacheManager = new AdvancedCacheManager(this.redisManager);
    this.databaseShardManager = new DatabaseShardManager();
    this.cdnManager = new CDNManager();
    
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor database pool events
    this.db.on('connect', (client) => {
      console.log('🔗 Database client connected');
    });

    this.db.on('error', (err, client) => {
      console.error('❌ Database pool error:', err);
    });

    this.db.on('remove', (client) => {
      console.log('🔌 Database client removed from pool');
    });

    // Monitor Redis events
    this.redisClient.on('connect', () => {
      console.log('🔗 Redis connected');
    });

    this.redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Monitor database performance every 5 minutes
    setInterval(() => {
      this.monitorDatabasePerformance();
    }, 5 * 60 * 1000);

    // Monitor cache performance every minute
    setInterval(() => {
      this.monitorCachePerformance();
    }, 60 * 1000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupPerformanceMetrics();
    }, 60 * 60 * 1000);

    // Generate performance reports every 15 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 15 * 60 * 1000);

    // Monitor performance every 30 seconds
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 30000);
    
    // Health checks every minute
    setInterval(() => {
      this.performHealthChecks();
    }, 60000);
  }

  /**
   * Database query optimization middleware
   */
  optimizeDatabaseQueries() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const queryId = crypto.randomUUID();

      // Store original query method
      const originalQuery = this.db.query.bind(this.db);

      // Override query method with optimization
      this.db.query = async (text, params) => {
        const queryStartTime = Date.now();
        
        try {
          // Check query cache first
          const cacheKey = this.generateCacheKey(text, params);
          const cachedResult = await this.getFromCache(cacheKey);
          
          if (cachedResult) {
            this.logQueryPerformance(queryId, text, Date.now() - queryStartTime, 'CACHED');
            return cachedResult;
          }

          // Execute query
          const result = await originalQuery(text, params);
          
          // Cache result if appropriate
          if (this.shouldCacheQuery(text, result)) {
            await this.setCache(cacheKey, result);
          }

          // Log performance
          const queryTime = Date.now() - queryStartTime;
          this.logQueryPerformance(queryId, text, queryTime, 'EXECUTED');

          // Alert on slow queries
          if (queryTime > this.slowQueryThreshold) {
            await this.alertSlowQuery(text, queryTime, params);
          }

          return result;
        } catch (error) {
          const queryTime = Date.now() - queryStartTime;
          this.logQueryPerformance(queryId, text, queryTime, 'ERROR', error);
          throw error;
        }
      };

      // Track overall request performance
      res.on('finish', () => {
        const totalTime = Date.now() - startTime;
        this.trackRequestPerformance(req, totalTime, res.statusCode);
      });

      next();
    };
  }

  /**
   * Generate cache key for query
   */
  generateCacheKey(text, params) {
    const queryHash = crypto.createHash('md5').update(text + JSON.stringify(params)).digest('hex');
    return `query:${queryHash}`;
  }

  /**
   * Get data from cache
   */
  async getFromCache(key) {
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async setCache(key, data, ttl = this.cacheTTL) {
    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Cache set error:', error);
    }
  }

  /**
   * Determine if query should be cached
   */
  shouldCacheQuery(text, result) {
    // Cache SELECT queries with reasonable result size
    const isSelect = text.trim().toLowerCase().startsWith('select');
    const hasReasonableSize = result.rows && result.rows.length <= 1000;
    const isNotSensitive = !text.toLowerCase().includes('password') && 
                          !text.toLowerCase().includes('token') &&
                          !text.toLowerCase().includes('secret');
    
    return isSelect && hasReasonableSize && isNotSensitive;
  }

  /**
   * Log query performance
   */
  logQueryPerformance(queryId, text, duration, status, error = null) {
    const performanceData = {
      queryId,
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      duration,
      status,
      timestamp: new Date(),
      error: error?.message
    };

    // Store in memory for quick access
    this.performanceMetrics.set(queryId, performanceData);

    // Log to database for persistence
    this.logToDatabase(performanceData);
  }

  /**
   * Log performance data to database
   */
  async logToDatabase(performanceData) {
    try {
      await this.db.query(`
        INSERT INTO performance_logs (
          query_id, query_text, duration, status, error_message, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        performanceData.queryId,
        performanceData.text,
        performanceData.duration,
        performanceData.status,
        performanceData.error,
        performanceData.timestamp
      ]);
    } catch (error) {
      console.error('❌ Performance log error:', error);
    }
  }

  /**
   * Alert on slow queries
   */
  async alertSlowQuery(text, duration, params) {
    const alert = {
      type: 'SLOW_QUERY',
      severity: duration > 5000 ? 'HIGH' : 'MEDIUM',
      message: `Slow query detected: ${duration}ms`,
      details: {
        query: text.substring(0, 500),
        duration,
        params: params ? JSON.stringify(params).substring(0, 200) : null
      },
      timestamp: new Date()
    };

    console.warn('⚠️ Slow query alert:', alert);
    
    // Store alert for monitoring
    await this.storePerformanceAlert(alert);
  }

  /**
   * Store performance alert
   */
  async storePerformanceAlert(alert) {
    try {
      await this.db.query(`
        INSERT INTO performance_alerts (
          alert_type, severity, message, details, timestamp
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        alert.type,
        alert.severity,
        alert.message,
        JSON.stringify(alert.details),
        alert.timestamp
      ]);
    } catch (error) {
      console.error('❌ Performance alert storage error:', error);
    }
  }

  /**
   * Track request performance
   */
  trackRequestPerformance(req, duration, statusCode) {
    const requestData = {
      method: req.method,
      url: req.url,
      duration,
      statusCode,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Store request metrics
    const minuteKey = Math.floor(Date.now() / 60000);
    const requestKey = `requests:${minuteKey}`;
    
    this.redisClient.lpush(requestKey, JSON.stringify(requestData));
    this.redisClient.ltrim(requestKey, 0, 999); // Keep last 1000 requests
    this.redisClient.expire(requestKey, 3600); // Expire after 1 hour
  }

  /**
   * Monitor database performance
   */
  async monitorDatabasePerformance() {
    try {
      // Get database pool stats
      const poolStats = {
        totalCount: this.db.totalCount,
        idleCount: this.db.idleCount,
        waitingCount: this.db.waitingCount
      };

      // Get slow query count
      const slowQueryResult = await this.db.query(`
        SELECT COUNT(*) as slow_queries
        FROM performance_logs
        WHERE duration > $1 AND timestamp > NOW() - INTERVAL '1 hour'
      `, [this.slowQueryThreshold]);

      // Get average query time
      const avgQueryResult = await this.db.query(`
        SELECT AVG(duration) as avg_duration
        FROM performance_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      const performanceStats = {
        pool: poolStats,
        slowQueries: parseInt(slowQueryResult.rows[0].slow_queries),
        avgQueryTime: parseFloat(avgQueryResult.rows[0].avg_duration || 0),
        timestamp: new Date()
      };

      // Store performance stats
      await this.redisClient.setex('db_performance_stats', 300, JSON.stringify(performanceStats));

      // Alert if performance is degrading
      if (performanceStats.slowQueries > 10 || performanceStats.avgQueryTime > 500) {
        await this.alertPerformanceDegradation(performanceStats);
      }

    } catch (error) {
      console.error('❌ Database performance monitoring error:', error);
    }
  }

  /**
   * Monitor cache performance
   */
  async monitorCachePerformance() {
    try {
      // Get cache stats
      const cacheStats = await this.redisClient.info('stats');
      
      // Parse cache stats
      const stats = {};
      cacheStats.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      // Calculate cache hit rate
      const hits = parseInt(stats.keyspace_hits || 0);
      const misses = parseInt(stats.keyspace_misses || 0);
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      const cachePerformance = {
        hitRate: hitRate.toFixed(2),
        totalCommands: parseInt(stats.total_commands_processed || 0),
        connectedClients: parseInt(stats.connected_clients || 0),
        usedMemory: parseInt(stats.used_memory || 0),
        timestamp: new Date()
      };

      // Store cache performance stats
      await this.redisClient.setex('cache_performance_stats', 300, JSON.stringify(cachePerformance));

      // Alert if cache hit rate is low
      if (hitRate < 50) {
        await this.alertLowCacheHitRate(cachePerformance);
      }

    } catch (error) {
      console.error('❌ Cache performance monitoring error:', error);
    }
  }

  /**
   * Alert performance degradation
   */
  async alertPerformanceDegradation(stats) {
    const alert = {
      type: 'PERFORMANCE_DEGRADATION',
      severity: 'HIGH',
      message: 'Database performance is degrading',
      details: stats,
      timestamp: new Date()
    };

    console.warn('⚠️ Performance degradation alert:', alert);
    await this.storePerformanceAlert(alert);
  }

  /**
   * Alert low cache hit rate
   */
  async alertLowCacheHitRate(stats) {
    const alert = {
      type: 'LOW_CACHE_HIT_RATE',
      severity: 'MEDIUM',
      message: `Cache hit rate is low: ${stats.hitRate}%`,
      details: stats,
      timestamp: new Date()
    };

    console.warn('⚠️ Low cache hit rate alert:', alert);
    await this.storePerformanceAlert(alert);
  }

  /**
   * Clean up performance metrics
   */
  async cleanupPerformanceMetrics() {
    try {
      // Clean up old performance logs (keep 7 days)
      await this.db.query(`
        DELETE FROM performance_logs 
        WHERE timestamp < NOW() - INTERVAL '7 days'
      `);

      // Clean up old performance alerts (keep 30 days)
      await this.db.query(`
        DELETE FROM performance_alerts 
        WHERE timestamp < NOW() - INTERVAL '30 days'
      `);

      // Clear old metrics from memory
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      for (const [key, value] of this.performanceMetrics.entries()) {
        if (value.timestamp.getTime() < cutoffTime) {
          this.performanceMetrics.delete(key);
        }
      }

      console.log('🧹 Performance metrics cleanup completed');
    } catch (error) {
      console.error('❌ Performance metrics cleanup error:', error);
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport() {
    try {
      const [dbStats, cacheStats, alerts] = await Promise.all([
        this.redisClient.get('db_performance_stats'),
        this.redisClient.get('cache_performance_stats'),
        this.db.query(`
          SELECT alert_type, severity, COUNT(*) as count
          FROM performance_alerts
          WHERE timestamp > NOW() - INTERVAL '1 hour'
          GROUP BY alert_type, severity
        `)
      ]);

      const report = {
        database: dbStats ? JSON.parse(dbStats) : null,
        cache: cacheStats ? JSON.parse(cacheStats) : null,
        alerts: alerts.rows,
        generated: new Date()
      };

      // Store performance report
      await this.redisClient.setex('performance_report', 600, JSON.stringify(report));

      // Log performance summary
      console.log('📊 Performance Report:', {
        avgQueryTime: report.database?.avgQueryTime?.toFixed(2) + 'ms',
        slowQueries: report.database?.slowQueries || 0,
        cacheHitRate: report.cache?.hitRate + '%',
        alerts: report.alerts.length
      });

    } catch (error) {
      console.error('❌ Performance report generation error:', error);
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStatistics() {
    try {
      const [dbStats, cacheStats, recentAlerts] = await Promise.all([
        this.redisClient.get('db_performance_stats'),
        this.redisClient.get('cache_performance_stats'),
        this.db.query(`
          SELECT * FROM performance_alerts
          WHERE timestamp > NOW() - INTERVAL '1 hour'
          ORDER BY timestamp DESC
          LIMIT 10
        `)
      ]);

      return {
        database: dbStats ? JSON.parse(dbStats) : null,
        cache: cacheStats ? JSON.parse(cacheStats) : null,
        recentAlerts: recentAlerts.rows,
        memoryMetrics: this.performanceMetrics.size,
        generated: new Date()
      };
    } catch (error) {
      console.error('❌ Get performance statistics error:', error);
      return {};
    }
  }

  /**
   * Optimize database indexes
   */
  async optimizeDatabaseIndexes() {
    try {
      // Analyze table statistics
      await this.db.query('ANALYZE');

      // Get index usage statistics
      const indexStats = await this.db.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `);

      // Identify unused indexes
      const unusedIndexes = indexStats.rows.filter(row => row.idx_scan === 0);

      if (unusedIndexes.length > 0) {
        console.log('🔍 Unused indexes found:', unusedIndexes.length);
        await this.alertUnusedIndexes(unusedIndexes);
      }

      return {
        totalIndexes: indexStats.rows.length,
        unusedIndexes: unusedIndexes.length,
        mostUsedIndexes: indexStats.rows.slice(0, 5)
      };
    } catch (error) {
      console.error('❌ Database index optimization error:', error);
      return {};
    }
  }

  /**
   * Alert unused indexes
   */
  async alertUnusedIndexes(unusedIndexes) {
    const alert = {
      type: 'UNUSED_INDEXES',
      severity: 'LOW',
      message: `${unusedIndexes.length} unused indexes detected`,
      details: {
        indexes: unusedIndexes.map(idx => `${idx.schemaname}.${idx.tablename}.${idx.indexname}`)
      },
      timestamp: new Date()
    };

    await this.storePerformanceAlert(alert);
  }

  /**
   * Connection pool health check
   */
  async checkConnectionPoolHealth() {
    try {
      const health = {
        totalConnections: this.db.totalCount,
        idleConnections: this.db.idleCount,
        activeConnections: this.db.totalCount - this.db.idleCount,
        waitingConnections: this.db.waitingCount,
        timestamp: new Date()
      };

      // Alert if pool is under pressure
      if (health.waitingConnections > 5 || health.activeConnections > 15) {
        await this.alertConnectionPoolPressure(health);
      }

      return health;
    } catch (error) {
      console.error('❌ Connection pool health check error:', error);
      return {};
    }
  }

  /**
   * Alert connection pool pressure
   */
  async alertConnectionPoolPressure(health) {
    const alert = {
      type: 'CONNECTION_POOL_PRESSURE',
      severity: 'HIGH',
      message: 'Database connection pool under pressure',
      details: health,
      timestamp: new Date()
    };

    await this.storePerformanceAlert(alert);
  }

  async logPerformanceMetrics() {
    try {
      const cacheStats = await this.cacheManager.getCacheStats();
      const dbHealth = await this.databaseShardManager.getHealthMetrics();
      const cdnStats = await this.cdnManager.getCacheAnalytics();
      
      console.log('Performance Metrics:', {
        timestamp: new Date(),
        cache: cacheStats,
        database: dbHealth,
        cdn: cdnStats
      });
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  }
  
  async performHealthChecks() {
    try {
      // Database health check
      const dbConnections = await this.databaseShardManager.testAllConnections();
      const unhealthyConnections = dbConnections.filter(conn => conn.status === 'error');
      
      if (unhealthyConnections.length > 0) {
        console.error('Unhealthy database connections:', unhealthyConnections);
      }
      
      // Redis health check
      await this.redisManager.monitorClusterHealth();
      
      // Cache health check
      const cacheSize = await this.cacheManager.getCacheSize();
      if (cacheSize > 1000000) { // More than 1M keys
        console.warn(`Large cache size detected: ${cacheSize} keys`);
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

// Export middleware functions
module.exports = {
  optimizeDatabaseQueries: performanceOptimizer.optimizeDatabaseQueries.bind(performanceOptimizer),
  getPerformanceStatistics: performanceOptimizer.getPerformanceStatistics.bind(performanceOptimizer),
  optimizeDatabaseIndexes: performanceOptimizer.optimizeDatabaseIndexes.bind(performanceOptimizer),
  checkConnectionPoolHealth: performanceOptimizer.checkConnectionPoolHealth.bind(performanceOptimizer)
}; 