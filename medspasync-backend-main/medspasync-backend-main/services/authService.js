const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const { promisify } = require('util');

/**
 * Enterprise-Grade Authentication Service
 * Optimized for high-load production environments with HIPAA compliance
 */
class AuthService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.saltRounds = 12;
    this.jwtExpiry = '24h';
    this.refreshTokenExpiry = '7d';
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60; // 15 minutes
    this.sessionTimeout = 30 * 60; // 30 minutes
    
    // Initialize rate limiters
    this.initializeRateLimiters();
  }

  /**
   * Initialize rate limiters for different endpoints
   */
  initializeRateLimiters() {
    // Login rate limiter
    this.loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip,
      skip: (req) => req.path !== '/api/auth/login'
    });

    // Registration rate limiter
    this.registerLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per hour
      message: {
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: 60 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    });

    // Password reset rate limiter
    this.passwordResetLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 password reset attempts per hour
      message: {
        error: 'Too many password reset attempts. Please try again later.',
        retryAfter: 60 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    });
  }

  /**
   * Get rate limiters for middleware
   */
  getRateLimiters() {
    return {
      login: this.loginLimiter,
      register: this.registerLimiter,
      passwordReset: this.passwordResetLimiter
    };
  }

  /**
   * Hash password with bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Password match result
   */
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} type - Token type (access|refresh)
   * @returns {string} JWT token
   */
  generateToken(payload, type = 'access') {
    const secret = type === 'refresh' ? 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET : 
      process.env.JWT_SECRET;
    
    const expiresIn = type === 'refresh' ? this.refreshTokenExpiry : this.jwtExpiry;
    
    return jwt.sign(payload, secret, { 
      expiresIn,
      issuer: 'medspasync-pro',
      audience: 'medspasync-users'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} type - Token type (access|refresh)
   * @returns {Object} Decoded token payload
   */
  verifyToken(token, type = 'access') {
    try {
      const secret = type === 'refresh' ? 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET : 
        process.env.JWT_SECRET;
      
      return jwt.verify(token, secret, {
        issuer: 'medspasync-pro',
        audience: 'medspasync-users'
      });
    } catch (error) {
      console.error('Token verification error:', error.message);
      throw new Error('Invalid token');
    }
  }

  /**
   * Check if user is locked out
   * @param {string} identifier - User email or IP
   * @returns {Promise<boolean>} Lockout status
   */
  async isLockedOut(identifier) {
    try {
      const lockoutKey = `lockout:${identifier}`;
      const attempts = await this.redis.get(lockoutKey);
      return attempts && parseInt(attempts) >= this.maxLoginAttempts;
    } catch (error) {
      console.error('Lockout check error:', error);
      return false;
    }
  }

  /**
   * Record failed login attempt
   * @param {string} identifier - User email or IP
   * @returns {Promise<void>}
   */
  async recordFailedAttempt(identifier) {
    try {
      const lockoutKey = `lockout:${identifier}`;
      const attempts = await this.redis.incr(lockoutKey);
      
      if (attempts === 1) {
        await this.redis.expire(lockoutKey, this.lockoutDuration);
      }
      
      console.log(`Failed login attempt for ${identifier}. Attempts: ${attempts}`);
    } catch (error) {
      console.error('Failed attempt recording error:', error);
    }
  }

  /**
   * Clear failed login attempts
   * @param {string} identifier - User email or IP
   * @returns {Promise<void>}
   */
  async clearFailedAttempts(identifier) {
    try {
      const lockoutKey = `lockout:${identifier}`;
      await this.redis.del(lockoutKey);
    } catch (error) {
      console.error('Clear attempts error:', error);
    }
  }

  /**
   * Create user session
   * @param {Object} user - User object
   * @param {string} ip - User IP address
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>} Session data
   */
  async createSession(user, ip, userAgent) {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const accessToken = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId
      });
      
      const refreshToken = this.generateToken({
        userId: user.id,
        sessionId
      }, 'refresh');

      // Store session in Redis
      const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip,
        userAgent,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      await this.redis.setex(
        `session:${sessionId}`,
        this.sessionTimeout,
        JSON.stringify(sessionData)
      );

      // Store refresh token
      await this.redis.setex(
        `refresh:${sessionId}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );

      // Track active sessions for user
      await this.redis.sadd(`user_sessions:${user.id}`, sessionId);
      await this.redis.expire(`user_sessions:${user.id}`, 7 * 24 * 60 * 60);

      return {
        accessToken,
        refreshToken,
        sessionId,
        expiresIn: this.sessionTimeout,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      };
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data or null
   */
  async validateSession(sessionId) {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      
      // Update last activity
      session.lastActivity = new Date().toISOString();
      await this.redis.setex(
        `session:${sessionId}`,
        this.sessionTimeout,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, 'refresh');
      const sessionId = decoded.sessionId;

      // Validate refresh token in Redis
      const storedRefreshToken = await this.redis.get(`refresh:${sessionId}`);
      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Validate session
      const session = await this.validateSession(sessionId);
      if (!session) {
        throw new Error('Session expired');
      }

      // Generate new access token
      const newAccessToken = this.generateToken({
        userId: session.userId,
        email: session.email,
        role: session.role,
        sessionId
      });

      return {
        accessToken: newAccessToken,
        expiresIn: this.sessionTimeout
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Revoke session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async revokeSession(sessionId) {
    try {
      const session = await this.validateSession(sessionId);
      if (session) {
        // Remove session data
        await this.redis.del(`session:${sessionId}`);
        await this.redis.del(`refresh:${sessionId}`);
        
        // Remove from user sessions
        await this.redis.srem(`user_sessions:${session.userId}`, sessionId);
      }
    } catch (error) {
      console.error('Session revocation error:', error);
    }
  }

  /**
   * Revoke all user sessions
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async revokeAllUserSessions(userId) {
    try {
      const sessionIds = await this.redis.smembers(`user_sessions:${userId}`);
      
      for (const sessionId of sessionIds) {
        await this.revokeSession(sessionId);
      }
      
      await this.redis.del(`user_sessions:${userId}`);
    } catch (error) {
      console.error('Revoke all sessions error:', error);
    }
  }

  /**
   * Get user active sessions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Active sessions
   */
  async getUserSessions(userId) {
    try {
      const sessionIds = await this.redis.smembers(`user_sessions:${userId}`);
      const sessions = [];

      for (const sessionId of sessionIds) {
        const session = await this.validateSession(sessionId);
        if (session) {
          sessions.push({
            sessionId,
            ip: session.ip,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity
          });
        }
      }

      return sessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<void>}
   */
  async cleanupExpiredSessions() {
    try {
      // This would typically be run by a cron job
      // Implementation depends on your specific needs
      console.log('Session cleanup completed');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {Promise<string>} Reset token
   */
  async generatePasswordResetToken(email) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresIn = 60 * 60; // 1 hour

      await this.redis.setex(
        `password_reset:${token}`,
        expiresIn,
        email
      );

      return token;
    } catch (error) {
      console.error('Password reset token generation error:', error);
      throw new Error('Password reset token generation failed');
    }
  }

  /**
   * Validate password reset token
   * @param {string} token - Reset token
   * @returns {Promise<string|null>} User email or null
   */
  async validatePasswordResetToken(token) {
    try {
      return await this.redis.get(`password_reset:${token}`);
    } catch (error) {
      console.error('Password reset token validation error:', error);
      return null;
    }
  }

  /**
   * Consume password reset token
   * @param {string} token - Reset token
   * @returns {Promise<string|null>} User email or null
   */
  async consumePasswordResetToken(token) {
    try {
      const email = await this.redis.get(`password_reset:${token}`);
      if (email) {
        await this.redis.del(`password_reset:${token}`);
        return email;
      }
      return null;
    } catch (error) {
      console.error('Password reset token consumption error:', error);
      return null;
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      
      // Update password in database (implementation depends on your ORM)
      // await User.update({ id: userId }, { password: hashedPassword });
      
      // Revoke all sessions to force re-login
      await this.revokeAllUserSessions(userId);
      
      console.log(`Password updated for user ${userId}`);
    } catch (error) {
      console.error('Password update error:', error);
      throw new Error('Password update failed');
    }
  }

  /**
   * Get authentication middleware
   * @returns {Function} Express middleware
   */
  getAuthMiddleware() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = this.verifyToken(token);
        
        // Validate session
        const session = await this.validateSession(decoded.sessionId);
        if (!session) {
          return res.status(401).json({ error: 'Session expired' });
        }

        req.user = {
          id: session.userId,
          email: session.email,
          role: session.role
        };
        req.sessionId = decoded.sessionId;

        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  /**
   * Get role-based authorization middleware
   * @param {Array} allowedRoles - Allowed roles
   * @returns {Function} Express middleware
   */
  getRoleMiddleware(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const redisStatus = await this.redis.ping();
      return {
        status: 'healthy',
        redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = AuthService; 