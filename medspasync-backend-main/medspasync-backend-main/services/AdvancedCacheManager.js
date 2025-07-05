const zlib = require('zlib');
const { promisify } = require('util');

class AdvancedCacheManager {
  constructor(redisManager) {
    this.redis = redisManager;
    this.cacheStrategies = {
      reconciliation: { ttl: 3600, warmOnMiss: true, compress: true },
      userSessions: { ttl: 86400, warmOnMiss: false, compress: false },
      apiResponses: { ttl: 300, warmOnMiss: true, compress: true },
      analytics: { ttl: 1800, warmOnMiss: true, compress: true },
      staticData: { ttl: 86400, warmOnMiss: false, compress: true }
    };
    
    this.warmingSchedule = {};
    this.startCacheWarming();
    
    // Promisify compression functions
    this.compress = promisify(zlib.gzip);
    this.decompress = promisify(zlib.gunzip);
  }
  
  async set(key, value, strategy = 'default', customTTL = null) {
    const config = this.cacheStrategies[strategy] || { ttl: 3600, compress: false };
    const ttl = customTTL || config.ttl;
    
    try {
      // Serialize value
      let serializedValue = JSON.stringify(value);
      
      // Compress if configured and value is large
      if (config.compress && serializedValue.length > 1024) {
        const compressed = await this.compress(serializedValue);
        serializedValue = 'compressed:' + compressed.toString('base64');
      }
      
      await this.redis.cluster.setex(key, ttl, serializedValue);
      
      // Track cache operations for analytics
      await this.trackCacheOperation('set', key, strategy);
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  async get(key, strategy = 'default') {
    try {
      const value = await this.redis.cluster.get(key);
      
      if (value === null) {
        // Cache miss
        await this.trackCacheOperation('miss', key, strategy);
        
        // Trigger warming if configured
        const config = this.cacheStrategies[strategy];
        if (config && config.warmOnMiss) {
          this.scheduleWarming(key, strategy);
        }
        
        return null;
      }
      
      // Cache hit
      await this.trackCacheOperation('hit', key, strategy);
      
      // Decompress if needed
      let parsedValue = value;
      if (value.startsWith('compressed:')) {
        const compressed = Buffer.from(value.substring(11), 'base64');
        parsedValue = (await this.decompress(compressed)).toString();
      }
      
      return JSON.parse(parsedValue);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async warmCache(pattern, dataLoader) {
    console.log(`Warming cache for pattern: ${pattern}`);
    
    try {
      const data = await dataLoader();
      const promises = [];
      
      for (const [key, value] of Object.entries(data)) {
        promises.push(this.set(key, value, 'reconciliation'));
      }
      
      await Promise.all(promises);
      console.log(`Cache warming completed for ${promises.length} keys`);
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
  
  startCacheWarming() {
    // Warm reconciliation data every hour
    setInterval(async () => {
      await this.warmReconciliationCache();
    }, 3600000);
    
    // Warm analytics data every 30 minutes
    setInterval(async () => {
      await this.warmAnalyticsCache();
    }, 1800000);
    
    // Warm user session data every 6 hours
    setInterval(async () => {
      await this.warmUserSessionCache();
    }, 21600000);
  }
  
  async warmReconciliationCache() {
    await this.warmCache('reconciliation:*', async () => {
      // Load frequently accessed reconciliation data
      const reconciliationService = require('./ReconciliationService');
      return await reconciliationService.getFrequentlyAccessedData();
    });
  }
  
  async warmAnalyticsCache() {
    await this.warmCache('analytics:*', async () => {
      // Load analytics dashboard data
      const analyticsService = require('./AnalyticsService');
      return await analyticsService.getDashboardData();
    });
  }
  
  async warmUserSessionCache() {
    await this.warmCache('user:*', async () => {
      // Load active user session data
      const userService = require('./UserService');
      return await userService.getActiveUserData();
    });
  }
  
  async trackCacheOperation(operation, key, strategy) {
    // Track cache metrics for monitoring
    const metric = {
      operation,
      key: key.substring(0, 50), // Truncate for privacy
      strategy,
      timestamp: new Date()
    };
    
    // Store metrics in separate Redis instance
    await this.redis.cache.lpush('cache_metrics', JSON.stringify(metric));
    await this.redis.cache.ltrim('cache_metrics', 0, 10000); // Keep last 10k metrics
  }
  
  scheduleWarming(key, strategy) {
    // Debounce warming requests
    const warmingKey = `${key}:${strategy}`;
    if (this.warmingSchedule[warmingKey]) return;
    
    this.warmingSchedule[warmingKey] = setTimeout(async () => {
      // Implement specific warming logic based on key pattern
      await this.executeWarming(key, strategy);
      delete this.warmingSchedule[warmingKey];
    }, 5000); // Warm after 5 seconds
  }
  
  async executeWarming(key, strategy) {
    console.log(`Executing cache warming for ${key} with strategy ${strategy}`);
    
    // Implement key-specific warming logic
    if (key.startsWith('reconciliation:')) {
      await this.warmReconciliationData(key);
    } else if (key.startsWith('analytics:')) {
      await this.warmAnalyticsData(key);
    } else if (key.startsWith('user:')) {
      await this.warmUserData(key);
    }
  }
  
  async warmReconciliationData(key) {
    try {
      const reconciliationService = require('./ReconciliationService');
      const data = await reconciliationService.getDataForKey(key);
      if (data) {
        await this.set(key, data, 'reconciliation');
      }
    } catch (error) {
      console.error(`Failed to warm reconciliation data for ${key}:`, error);
    }
  }
  
  async warmAnalyticsData(key) {
    try {
      const analyticsService = require('./AnalyticsService');
      const data = await analyticsService.getDataForKey(key);
      if (data) {
        await this.set(key, data, 'analytics');
      }
    } catch (error) {
      console.error(`Failed to warm analytics data for ${key}:`, error);
    }
  }
  
  async warmUserData(key) {
    try {
      const userService = require('./UserService');
      const data = await userService.getDataForKey(key);
      if (data) {
        await this.set(key, data, 'userSessions');
      }
    } catch (error) {
      console.error(`Failed to warm user data for ${key}:`, error);
    }
  }
  
  async getCacheStats() {
    try {
      const metrics = await this.redis.cache.lrange('cache_metrics', 0, -1);
      const parsedMetrics = metrics.map(m => JSON.parse(m));
      
      const stats = {
        total: parsedMetrics.length,
        hits: parsedMetrics.filter(m => m.operation === 'hit').length,
        misses: parsedMetrics.filter(m => m.operation === 'miss').length,
        sets: parsedMetrics.filter(m => m.operation === 'set').length,
        strategies: {}
      };
      
      // Group by strategy
      parsedMetrics.forEach(metric => {
        if (!stats.strategies[metric.strategy]) {
          stats.strategies[metric.strategy] = { hits: 0, misses: 0, sets: 0 };
        }
        stats.strategies[metric.strategy][metric.operation + 's']++;
      });
      
      // Calculate hit rates
      stats.hitRate = stats.hits / (stats.hits + stats.misses);
      Object.keys(stats.strategies).forEach(strategy => {
        const s = stats.strategies[strategy];
        s.hitRate = s.hits / (s.hits + s.misses);
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }
  
  async clearCache(pattern = '*') {
    try {
      const keys = await this.redis.cluster.keys(pattern);
      if (keys.length > 0) {
        await this.redis.cluster.del(...keys);
        console.log(`Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
  
  async getCacheSize() {
    try {
      const keys = await this.redis.cluster.keys('*');
      return keys.length;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }
}

module.exports = AdvancedCacheManager; 