const Redis = require('ioredis');

const redisClusterConfig = {
  // Primary Redis Cluster (12 nodes)
  cluster: {
    enableOfflineQueue: false,
    retryDelayOnFailover: 100,
    retryDelayOnClusterDown: 300,
    retryDelayOnRandom: 500,
    scaleReads: 'slave',
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    
    // Cluster nodes
    nodes: [
      { host: process.env.REDIS_CLUSTER_1_HOST || 'localhost', port: 7000 },
      { host: process.env.REDIS_CLUSTER_2_HOST || 'localhost', port: 7001 },
      { host: process.env.REDIS_CLUSTER_3_HOST || 'localhost', port: 7002 },
      { host: process.env.REDIS_CLUSTER_4_HOST || 'localhost', port: 7003 },
      { host: process.env.REDIS_CLUSTER_5_HOST || 'localhost', port: 7004 },
      { host: process.env.REDIS_CLUSTER_6_HOST || 'localhost', port: 7005 },
      { host: process.env.REDIS_CLUSTER_7_HOST || 'localhost', port: 7006 },
      { host: process.env.REDIS_CLUSTER_8_HOST || 'localhost', port: 7007 },
      { host: process.env.REDIS_CLUSTER_9_HOST || 'localhost', port: 7008 },
      { host: process.env.REDIS_CLUSTER_10_HOST || 'localhost', port: 7009 },
      { host: process.env.REDIS_CLUSTER_11_HOST || 'localhost', port: 7010 },
      { host: process.env.REDIS_CLUSTER_12_HOST || 'localhost', port: 7011 }
    ],
    
    // High-performance options
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      
      // Connection pool settings
      enableAutoPipelining: true,
      maxConcurrentRequestsInBatch: 1000,
      
      // Memory optimization
      keyPrefix: 'medspasync:',
      compression: 'gzip'
    }
  },
  
  // Dedicated instances for specific use cases
  instances: {
    // Session store
    session: {
      host: process.env.REDIS_SESSION_HOST || 'localhost',
      port: process.env.REDIS_SESSION_PORT || 6379,
      password: process.env.REDIS_SESSION_PASSWORD,
      db: 0,
      keyPrefix: 'sess:',
      ttl: 86400 // 24 hours
    },
    
    // Cache store
    cache: {
      host: process.env.REDIS_CACHE_HOST || 'localhost',
      port: process.env.REDIS_CACHE_PORT || 6379,
      password: process.env.REDIS_CACHE_PASSWORD,
      db: 1,
      keyPrefix: 'cache:',
      ttl: 3600 // 1 hour default
    },
    
    // Queue store
    queue: {
      host: process.env.REDIS_QUEUE_HOST || 'localhost',
      port: process.env.REDIS_QUEUE_PORT || 6379,
      password: process.env.REDIS_QUEUE_PASSWORD,
      db: 2,
      keyPrefix: 'queue:'
    }
  }
};

class RedisManager {
  constructor() {
    this.cluster = new Redis.Cluster(
      redisClusterConfig.cluster.nodes,
      redisClusterConfig.cluster
    );
    
    this.sessions = new Redis(redisClusterConfig.instances.session);
    this.cache = new Redis(redisClusterConfig.instances.cache);
    this.queue = new Redis(redisClusterConfig.instances.queue);
    
    this.setupEventHandlers();
    this.setupMonitoring();
  }
  
  setupEventHandlers() {
    this.cluster.on('connect', () => {
      console.log('Redis cluster connected');
    });
    
    this.cluster.on('error', (error) => {
      console.error('Redis cluster error:', error);
      this.alertRedisError(error);
    });
    
    this.cluster.on('node error', (error, address) => {
      console.error(`Redis node error at ${address}:`, error);
    });
  }
  
  setupMonitoring() {
    setInterval(async () => {
      await this.monitorClusterHealth();
    }, 30000); // Every 30 seconds
  }
  
  async monitorClusterHealth() {
    try {
      const clusterInfo = await this.cluster.cluster('info');
      const nodes = await this.cluster.cluster('nodes');
      
      const metrics = {
        clusterState: clusterInfo.includes('cluster_state:ok'),
        nodeCount: nodes.split('\n').length - 1,
        timestamp: new Date()
      };
      
      // Check individual node health
      for (const node of this.cluster.nodes('all')) {
        try {
          await node.ping();
        } catch (error) {
          console.error(`Node ${node.options.host}:${node.options.port} unhealthy:`, error);
        }
      }
      
      console.log('Redis cluster health:', metrics);
    } catch (error) {
      console.error('Redis cluster health check failed:', error);
    }
  }
  
  async alertRedisError(error) {
    // Implement alerting logic
    console.log('ALERT: Redis cluster error:', error.message);
    
    // Send to monitoring service
    if (process.env.MONITORING_WEBHOOK) {
      try {
        await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: 'redis_cluster_error',
            error: error.message,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('Failed to send Redis alert:', err);
      }
    }
  }
  
  // High-performance methods
  async set(key, value, ttl = null) {
    try {
      if (ttl) {
        return await this.cluster.setex(key, ttl, JSON.stringify(value));
      } else {
        return await this.cluster.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }
  
  async get(key) {
    try {
      const value = await this.cluster.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  async mget(keys) {
    try {
      const values = await this.cluster.mget(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  }
  
  async mset(keyValuePairs) {
    try {
      const serializedPairs = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = JSON.stringify(value);
      }
      return await this.cluster.mset(serializedPairs);
    } catch (error) {
      console.error('Redis mset error:', error);
      throw error;
    }
  }
  
  async del(key) {
    try {
      return await this.cluster.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      return 0;
    }
  }
  
  async exists(key) {
    try {
      return await this.cluster.exists(key);
    } catch (error) {
      console.error('Redis exists error:', error);
      return 0;
    }
  }
  
  async expire(key, seconds) {
    try {
      return await this.cluster.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
      return 0;
    }
  }
  
  // Session management
  async setSession(sessionId, data, ttl = 86400) {
    return await this.sessions.setex(sessionId, ttl, JSON.stringify(data));
  }
  
  async getSession(sessionId) {
    const data = await this.sessions.get(sessionId);
    return data ? JSON.parse(data) : null;
  }
  
  async deleteSession(sessionId) {
    return await this.sessions.del(sessionId);
  }
  
  // Cache management
  async setCache(key, value, ttl = 3600) {
    return await this.cache.setex(key, ttl, JSON.stringify(value));
  }
  
  async getCache(key) {
    const data = await this.cache.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async deleteCache(key) {
    return await this.cache.del(key);
  }
  
  // Queue management
  async pushToQueue(queueName, data) {
    return await this.queue.lpush(queueName, JSON.stringify(data));
  }
  
  async popFromQueue(queueName) {
    const data = await this.queue.rpop(queueName);
    return data ? JSON.parse(data) : null;
  }
  
  async getQueueLength(queueName) {
    return await this.queue.llen(queueName);
  }
}

module.exports = { RedisManager, redisClusterConfig }; 