/**
 * API Security Middleware
 * Comprehensive security measures for API endpoints
 */

const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

class APISecurityMiddleware {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.threatPatterns = this.loadThreatPatterns();
    this.suspiciousRequests = new Map();
  }

  /**
   * Load threat detection patterns
   */
  loadThreatPatterns() {
    return {
      sqlInjection: [
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(exec|execute|script|javascript|vbscript)\b)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(exec|execute|script|javascript|vbscript)\b)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i
      ],
      xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /onclick=/gi
      ],
      pathTraversal: [
        /\.\.\//,
        /\.\.\\/,
        /\/etc\/passwd/,
        /\/proc\/version/,
        /\/windows\/system32/
      ],
      commandInjection: [
        /(\b(cat|ls|dir|rm|del|mkdir|chmod|chown)\b)/i,
        /(\b(ping|nslookup|traceroute|netstat)\b)/i,
        /(\b(wget|curl|nc|telnet)\b)/i
      ]
    };
  }

  /**
   * Enhanced security headers middleware
   */
  securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      xssFilter: true,
      hidePoweredBy: true,
      ieNoOpen: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' }
    });
  }

  /**
   * CORS configuration
   */
  corsConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://medspasyncpro.com',
      'https://www.medspasyncpro.com'
    ];

    return cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
      maxAge: 86400 // 24 hours
    });
  }

  /**
   * Request validation middleware
   */
  validateRequest() {
    return (req, res, next) => {
      try {
        // Validate content type for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const contentType = req.get('Content-Type');
          if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
              error: 'Invalid content type',
              message: 'Content-Type must be application/json'
            });
          }
        }

        // Validate request size
        const contentLength = parseInt(req.get('Content-Length') || '0');
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (contentLength > maxSize) {
          return res.status(413).json({
            error: 'Request too large',
            message: 'Request body exceeds maximum size limit'
          });
        }

        // Validate request ID
        if (!req.headers['x-request-id']) {
          req.headers['x-request-id'] = crypto.randomUUID();
        }

        next();
      } catch (error) {
        console.error('❌ Request validation error:', error);
        res.status(400).json({
          error: 'Request validation failed',
          message: 'Invalid request format'
        });
      }
    };
  }

  /**
   * Threat detection middleware
   */
  detectThreats() {
    return (req, res, next) => {
      try {
        const threatScore = this.calculateThreatScore(req);
        
        if (threatScore > 0.7) {
          this.logThreat(req, threatScore);
          return res.status(403).json({
            error: 'Request blocked',
            message: 'Request contains suspicious patterns'
          });
        }

        if (threatScore > 0.3) {
          this.logSuspiciousActivity(req, threatScore);
        }

        next();
      } catch (error) {
        console.error('❌ Threat detection error:', error);
        next();
      }
    };
  }

  /**
   * Calculate threat score for a request
   */
  calculateThreatScore(req) {
    let score = 0;
    const requestData = {
      url: req.url,
      method: req.method,
      headers: JSON.stringify(req.headers),
      body: JSON.stringify(req.body || {}),
      query: JSON.stringify(req.query || {}),
      params: JSON.stringify(req.params || {})
    };

    // Check for SQL injection patterns
    for (const pattern of this.threatPatterns.sqlInjection) {
      if (pattern.test(requestData.url) || 
          pattern.test(requestData.body) || 
          pattern.test(requestData.query)) {
        score += 0.4;
      }
    }

    // Check for XSS patterns
    for (const pattern of this.threatPatterns.xss) {
      if (pattern.test(requestData.body) || 
          pattern.test(requestData.query) || 
          pattern.test(requestData.headers)) {
        score += 0.3;
      }
    }

    // Check for path traversal
    for (const pattern of this.threatPatterns.pathTraversal) {
      if (pattern.test(requestData.url)) {
        score += 0.5;
      }
    }

    // Check for command injection
    for (const pattern of this.threatPatterns.commandInjection) {
      if (pattern.test(requestData.body) || 
          pattern.test(requestData.query)) {
        score += 0.6;
      }
    }

    // Check for suspicious user agents
    const userAgent = req.get('User-Agent') || '';
    if (userAgent.includes('sqlmap') || 
        userAgent.includes('nikto') || 
        userAgent.includes('nmap')) {
      score += 0.8;
    }

    // Check for repeated suspicious requests
    const clientId = req.ip || req.connection.remoteAddress;
    const suspiciousCount = this.suspiciousRequests.get(clientId) || 0;
    if (suspiciousCount > 5) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Log threat detection
   */
  async logThreat(req, score) {
    try {
      const threat = {
        id: crypto.randomUUID(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        score: score,
        timestamp: new Date(),
        headers: req.headers,
        body: req.body,
        query: req.query
      };

      // Log to database
      await this.db.query(`
        INSERT INTO security_logs (id, event_type, event_data, ip_address, user_agent, timestamp, severity)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        threat.id,
        'THREAT_DETECTED',
        JSON.stringify(threat),
        threat.ip,
        threat.userAgent,
        threat.timestamp,
        'HIGH'
      ]);

      console.log(`🚨 Threat detected: ${threat.ip} (score: ${score})`);
    } catch (error) {
      console.error('❌ Failed to log threat:', error);
    }
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(req, score) {
    try {
      const clientId = req.ip || req.connection.remoteAddress;
      const count = this.suspiciousRequests.get(clientId) || 0;
      this.suspiciousRequests.set(clientId, count + 1);

      const suspicious = {
        id: crypto.randomUUID(),
        ip: clientId,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        score: score,
        count: count + 1,
        timestamp: new Date()
      };

      // Log to database
      await this.db.query(`
        INSERT INTO security_logs (id, event_type, event_data, ip_address, user_agent, timestamp, severity)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        suspicious.id,
        'SUSPICIOUS_ACTIVITY',
        JSON.stringify(suspicious),
        suspicious.ip,
        suspicious.userAgent,
        suspicious.timestamp,
        'MEDIUM'
      ]);

      console.log(`⚠️  Suspicious activity: ${suspicious.ip} (score: ${score})`);
    } catch (error) {
      console.error('❌ Failed to log suspicious activity:', error);
    }
  }

  /**
   * Input sanitization middleware
   */
  sanitizeInput() {
    return (req, res, next) => {
      try {
        // Sanitize request body
        if (req.body) {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
          req.params = this.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        console.error('❌ Input sanitization error:', error);
        res.status(400).json({
          error: 'Input validation failed',
          message: 'Invalid input data'
        });
      }
    };
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  /**
   * Sanitize individual value
   */
  sanitizeValue(value) {
    if (typeof value !== 'string') {
      return value;
    }

    // Remove null bytes
    value = value.replace(/\0/g, '');

    // Remove control characters
    value = value.replace(/[\x00-\x1F\x7F]/g, '');

    // Trim whitespace
    value = value.trim();

    // Limit length
    if (value.length > 10000) {
      value = value.substring(0, 10000);
    }

    return value;
  }

  /**
   * Response security middleware
   */
  secureResponse() {
    return (req, res, next) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      // Add request ID to response
      res.setHeader('X-Request-ID', req.headers['x-request-id'] || crypto.randomUUID());

      // Remove sensitive headers
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');

      next();
    };
  }

  /**
   * Error handling middleware
   */
  errorHandler() {
    return (err, req, res, next) => {
      console.error('❌ API Error:', err);

      // Don't expose internal errors in production
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: err.message
        });
      }

      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or missing authentication'
        });
      }

      if (err.name === 'ForbiddenError') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied'
        });
      }

      // Log security-related errors
      if (err.status >= 400) {
        this.logSecurityError(req, err);
      }

      res.status(err.status || 500).json({
        error: isProduction ? 'Internal Server Error' : err.message,
        message: isProduction ? 'An unexpected error occurred' : err.stack,
        requestId: req.headers['x-request-id']
      });
    };
  }

  /**
   * Log security errors
   */
  async logSecurityError(req, error) {
    try {
      const securityError = {
        id: crypto.randomUUID(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        error: error.message,
        status: error.status,
        timestamp: new Date(),
        user_id: req.user?.id || null
      };

      await this.db.query(`
        INSERT INTO security_logs (id, event_type, event_data, ip_address, user_agent, timestamp, severity)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        securityError.id,
        'SECURITY_ERROR',
        JSON.stringify(securityError),
        securityError.ip,
        securityError.userAgent,
        securityError.timestamp,
        'MEDIUM'
      ]);
    } catch (dbError) {
      console.error('❌ Failed to log security error:', dbError);
    }
  }

  /**
   * Health check middleware
   */
  healthCheck() {
    return (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      });
    };
  }

  /**
   * Get security statistics
   */
  async getSecurityStats() {
    try {
      const stats = await this.db.query(`
        SELECT 
          event_type,
          severity,
          COUNT(*) as count
        FROM security_logs 
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY event_type, severity
        ORDER BY count DESC
      `);

      return {
        threats: stats.rows.filter(row => row.event_type === 'THREAT_DETECTED'),
        suspicious: stats.rows.filter(row => row.event_type === 'SUSPICIOUS_ACTIVITY'),
        errors: stats.rows.filter(row => row.event_type === 'SECURITY_ERROR'),
        total: stats.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      };
    } catch (error) {
      console.error('❌ Failed to get security stats:', error);
      return {};
    }
  }
}

// Create singleton instance
const apiSecurity = new APISecurityMiddleware();

// Export middleware functions
module.exports = {
  securityHeaders: apiSecurity.securityHeaders(),
  corsConfig: apiSecurity.corsConfig(),
  validateRequest: apiSecurity.validateRequest.bind(apiSecurity),
  detectThreats: apiSecurity.detectThreats.bind(apiSecurity),
  sanitizeInput: apiSecurity.sanitizeInput.bind(apiSecurity),
  secureResponse: apiSecurity.secureResponse.bind(apiSecurity),
  errorHandler: apiSecurity.errorHandler.bind(apiSecurity),
  healthCheck: apiSecurity.healthCheck.bind(apiSecurity),
  getStats: apiSecurity.getSecurityStats.bind(apiSecurity)
}; 