/**
 * Enhanced Rate Limiting Middleware
 * Implements per-user rate limiting, API key management, and DDoS protection
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const crypto = require('crypto');

class EnhancedRateLimiter {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    });

    this.apiKeys = new Map();
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();
    
    this.loadAPIKeys();
    this.startCleanupInterval();
  }

  /**
   * Load API keys from environment or database
   */
  async loadAPIKeys() {
    try {
      // Load from environment variables
      const envApiKeys = process.env.API_KEYS;
      if (envApiKeys) {
        const keys = JSON.parse(envApiKeys);
        keys.forEach(key => {
          this.apiKeys.set(key.value, {
            name: key.name,
            permissions: key.permissions || ['read'],
            rateLimit: key.rateLimit || 1000,
            expiresAt: key.expiresAt ? new Date(key.expiresAt) : null
          });
        });
      }

      console.log(`✅ Loaded ${this.apiKeys.size} API keys`);
    } catch (error) {
      console.error('❌ Failed to load API keys:', error);
    }
  }

  /**
   * Create rate limiter for different scenarios
   */
  createRateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests from this IP, please try again later.',
      standardHeaders = true,
      legacyHeaders = false,
      keyGenerator = this.generateKey,
      skip = this.shouldSkip,
      handler = this.handleRateLimitExceeded
    } = options;

    return rateLimit({
      windowMs,
      max,
      message,
      standardHeaders,
      legacyHeaders,
      keyGenerator,
      skip,
      handler,
      store: new RedisStore({
        sendCommand: (...args) => this.redisClient.sendCommand(args)
      })
    });
  }

  /**
   * Generate rate limit key based on user/IP
   */
  generateKey(req) {
    // Use API key if available
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Use user ID if authenticated
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }

    // Use IP address as fallback
    return `ip:${req.ip || req.connection.remoteAddress}`;
  }

  /**
   * Determine if rate limiting should be skipped
   */
  shouldSkip(req) {
    // Skip for health checks
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }

    // Skip for internal services
    if (req.headers['x-internal-service'] === process.env.INTERNAL_SERVICE_TOKEN) {
      return true;
    }

    // Skip for whitelisted IPs
    const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
    if (whitelistedIPs.includes(req.ip)) {
      return true;
    }

    return false;
  }

  /**
   * Handle rate limit exceeded
   */
  handleRateLimitExceeded(req, res) {
    const key = this.generateKey(req);
    const ip = req.ip || req.connection.remoteAddress;

    // Log the violation
    this.logRateLimitViolation(key, ip, req);

    // Add to suspicious IPs if repeated violations
    this.checkSuspiciousActivity(key, ip);

    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }

  /**
   * Log rate limit violation
   */
  async logRateLimitViolation(key, ip, req) {
    try {
      const violation = {
        id: crypto.randomUUID(),
        key: key,
        ip: ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        timestamp: new Date(),
        user_id: req.user?.id || null,
        api_key: req.headers['x-api-key'] || null
      };

      // Log to database if available
      if (global.db) {
        await global.db.query(`
          INSERT INTO security_logs (id, event_type, event_data, ip_address, user_agent, timestamp, severity)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          violation.id,
          'RATE_LIMIT_EXCEEDED',
          JSON.stringify(violation),
          violation.ip,
          violation.userAgent,
          violation.timestamp,
          'MEDIUM'
        ]);
      }

      console.log(`🚨 Rate limit violation: ${key} from ${ip}`);
    } catch (error) {
      console.error('❌ Failed to log rate limit violation:', error);
    }
  }

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity(key, ip) {
    const violations = this.getViolationCount(key);
    
    if (violations > 5) {
      this.suspiciousIPs.add(ip);
      console.log(`⚠️  Suspicious activity detected: ${ip} (${violations} violations)`);
      
      if (violations > 20) {
        this.blockedIPs.add(ip);
        console.log(`🚫 IP blocked due to excessive violations: ${ip}`);
      }
    }
  }

  /**
   * Get violation count for a key
   */
  getViolationCount(key) {
    // This would typically query Redis or database
    // For now, return a placeholder
    return 0;
  }

  /**
   * API key validation middleware
   */
  validateAPIKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide a valid API key'
      });
    }

    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    // Check if key is expired
    if (keyData.expiresAt && new Date() > keyData.expiresAt) {
      return res.status(401).json({
        error: 'API key expired',
        message: 'The provided API key has expired'
      });
    }

    // Attach key data to request
    req.apiKey = keyData;
    next();
  }

  /**
   * Permission-based rate limiting
   */
  createPermissionBasedLimiter(permission) {
    return this.createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: (req) => {
        // Use API key rate limit if available
        if (req.apiKey) {
          return req.apiKey.rateLimit;
        }
        
        // Use user role-based limits
        if (req.user) {
          switch (req.user.role) {
            case 'ADMIN': return 1000;
            case 'MANAGER': return 500;
            case 'STAFF': return 200;
            default: return 100;
          }
        }
        
        return 100; // Default limit
      },
      keyGenerator: this.generateKey,
      handler: this.handleRateLimitExceeded
    });
  }

  /**
   * DDoS protection middleware
   */
  createDDoSProtection() {
    return this.createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      message: 'DDoS protection: Too many requests',
      keyGenerator: (req) => `ddos:${req.ip}`,
      handler: (req, res) => {
        const ip = req.ip;
        this.blockedIPs.add(ip);
        
        res.status(429).json({
          error: 'DDoS protection triggered',
          message: 'Too many requests from this IP',
          blocked: true
        });
      }
    });
  }

  /**
   * IP blocking middleware
   */
  blockSuspiciousIPs(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (this.blockedIPs.has(ip)) {
      return res.status(403).json({
        error: 'IP blocked',
        message: 'This IP address has been blocked due to suspicious activity'
      });
    }
    
    next();
  }

  /**
   * Burst protection for sensitive endpoints
   */
  createBurstProtection() {
    return this.createRateLimiter({
      windowMs: 10 * 1000, // 10 seconds
      max: 10, // 10 requests per 10 seconds
      message: 'Burst protection: Too many rapid requests',
      keyGenerator: this.generateKey,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Burst protection triggered',
          message: 'Too many rapid requests, please slow down'
        });
      }
    });
  }

  /**
   * Cleanup expired data
   */
  startCleanupInterval() {
    setInterval(() => {
      // Clean up expired API keys
      const now = new Date();
      for (const [key, data] of this.apiKeys.entries()) {
        if (data.expiresAt && now > data.expiresAt) {
          this.apiKeys.delete(key);
          console.log(`🗑️  Removed expired API key: ${data.name}`);
        }
      }

      // Clean up old suspicious IPs (after 24 hours)
      // This would typically be done in Redis with TTL
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats() {
    try {
      const stats = {
        totalRequests: 0,
        blockedRequests: 0,
        suspiciousIPs: this.suspiciousIPs.size,
        blockedIPs: this.blockedIPs.size,
        activeAPIKeys: this.apiKeys.size
      };

      // Get Redis statistics
      const info = await this.redisClient.info('stats');
      const lines = info.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('total_commands_processed:')) {
          stats.totalRequests = parseInt(line.split(':')[1]) || 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get rate limit stats:', error);
      return {};
    }
  }

  /**
   * Reset rate limits for a specific key
   */
  async resetRateLimit(key) {
    try {
      await this.redisClient.del(`rl:${key}`);
      console.log(`🔄 Reset rate limit for: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to reset rate limit:', error);
      return false;
    }
  }

  /**
   * Add API key
   */
  addAPIKey(key, data) {
    this.apiKeys.set(key, {
      name: data.name,
      permissions: data.permissions || ['read'],
      rateLimit: data.rateLimit || 1000,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    });
    
    console.log(`✅ Added API key: ${data.name}`);
  }

  /**
   * Remove API key
   */
  removeAPIKey(key) {
    const keyData = this.apiKeys.get(key);
    if (keyData) {
      this.apiKeys.delete(key);
      console.log(`🗑️  Removed API key: ${keyData.name}`);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const enhancedRateLimiter = new EnhancedRateLimiter();

// Export middleware functions
module.exports = {
  // Basic rate limiting
  basic: enhancedRateLimiter.createRateLimiter(),
  
  // Strict rate limiting
  strict: enhancedRateLimiter.createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50
  }),
  
  // DDoS protection
  ddos: enhancedRateLimiter.createDDoSProtection(),
  
  // Burst protection
  burst: enhancedRateLimiter.createBurstProtection(),
  
  // Permission-based limiting
  permission: enhancedRateLimiter.createPermissionBasedLimiter.bind(enhancedRateLimiter),
  
  // API key validation
  validateAPIKey: enhancedRateLimiter.validateAPIKey.bind(enhancedRateLimiter),
  
  // IP blocking
  blockSuspiciousIPs: enhancedRateLimiter.blockSuspiciousIPs.bind(enhancedRateLimiter),
  
  // Utility functions
  getStats: enhancedRateLimiter.getRateLimitStats.bind(enhancedRateLimiter),
  resetLimit: enhancedRateLimiter.resetRateLimit.bind(enhancedRateLimiter),
  addAPIKey: enhancedRateLimiter.addAPIKey.bind(enhancedRateLimiter),
  removeAPIKey: enhancedRateLimiter.removeAPIKey.bind(enhancedRateLimiter)
}; 