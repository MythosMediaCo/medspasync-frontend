/**
 * Enhanced Authentication Service for MedSpaSync Pro
 * Provides multi-modal authentication with quality-of-life features
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');
const { promisify } = require('util');
const logger = require('../../utils/logger');
const { eventBus } = require('../microservices/event-bus');

class EnhancedAuthService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });
    
    // Promisify Redis methods
    this.redisGet = promisify(this.redis.get).bind(this.redis);
    this.redisSetex = promisify(this.redis.setex).bind(this.redis);
    this.redisDel = promisify(this.redis.del).bind(this.redis);
    
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || this.jwtSecret;
    this.magicLinkExpiry = 900; // 15 minutes
    this.sessionExpiry = 3600; // 1 hour
    this.refreshTokenExpiry = 30 * 24 * 60 * 60; // 30 days
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    this.magicLinkExpiresIn = process.env.MAGIC_LINK_EXPIRES_IN || '15m';
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    this.lockoutDuration = parseInt(process.env.LOCKOUT_DURATION) || 900000; // 15 minutes
    
    this.loginAttempts = new Map();
    this.lockouts = new Map();
  }

  /**
   * Multi-modal authentication with quality-of-life features
   */
  async authenticateUser(credentials) {
    const { identifier, method, deviceInfo, geoLocation } = credentials;
    
    try {
      let user;
      let authResult;

      switch (method) {
        case 'password':
          authResult = await this.authenticateWithPassword(identifier, credentials.password);
          break;
        case 'magic-link':
          authResult = await this.authenticateWithMagicLink(identifier, credentials.token);
          break;
        case 'biometric':
          authResult = await this.authenticateWithBiometric(identifier, credentials.biometricData);
          break;
        case 'sso':
          authResult = await this.authenticateWithSSO(identifier, credentials.ssoData);
          break;
        default:
          throw new Error('Unsupported authentication method');
      }

      if (!authResult.success) {
        return authResult;
      }

      user = authResult.user;

      // Quality of life: Remember authentication method preference
      await this.updateUserAuthPreference(user.id, method);

      // Intelligent session management
      const sessionConfig = await this.calculateOptimalSession(user, deviceInfo, geoLocation);

      // Generate tokens
      const accessToken = await this.generateJWT(user, sessionConfig);
      const refreshToken = await this.generateRefreshToken(user);

      // Store session in Redis
      await this.storeSession(user.id, accessToken, sessionConfig);

      // HIPAA compliant audit logging
      await this.auditAuthAttempt({
        userId: user.id,
        method,
        deviceFingerprint: deviceInfo,
        location: geoLocation,
        success: true,
        sessionId: accessToken
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        sessionDuration: sessionConfig.duration,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          practiceId: user.practiceId,
          preferences: await this.getUserPreferences(user.id)
        },
        qualityOfLife: {
          preferredAuthMethod: method,
          sessionOptimizations: sessionConfig.optimizations,
          nextLoginSuggestion: await this.getNextLoginSuggestion(user.id, method)
        }
      };

    } catch (error) {
      console.error('Authentication error:', error);
      
      // Audit failed attempt
      await this.auditAuthAttempt({
        userId: identifier,
        method,
        deviceFingerprint: deviceInfo,
        location: geoLocation,
        success: false,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        suggestions: await this.getAuthSuggestions(identifier, method)
      };
    }
  }

  /**
   * Traditional password authentication with enhanced UX
   */
  async authenticateWithPassword(email, password) {
    try {
      // Check for account lockout
      if (this.isAccountLocked(email)) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { practice: true }
      });

      if (!user) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.staff?.active && user.role !== 'ADMIN') {
        throw new Error('Account is deactivated');
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(email);

      // Quality of life: Check if user should be prompted for MFA
      const mfaRequired = await this.isMFARequired(user.id);
      if (mfaRequired) {
        return { 
          success: false, 
          error: 'MFA required',
          mfaRequired: true,
          methods: await this.getUserMFAMethods(user.id)
        };
      }

      return { success: true, user };
    } catch (error) {
      logger.error('Password authentication failed', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Magic link authentication for passwordless login
   */
  async authenticateWithMagicLink(email, token) {
    const magicLinkKey = `magic:${token}`;
    const magicLinkData = await this.redisGet(magicLinkKey);

    if (!magicLinkData) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    const { email: storedEmail, purpose, created } = JSON.parse(magicLinkData);
    
    if (storedEmail !== email.toLowerCase()) {
      return { success: false, error: 'Invalid magic link' };
    }

    if (Date.now() - created > this.magicLinkExpiry * 1000) {
      await this.redisDel(magicLinkKey);
      return { success: false, error: 'Magic link expired' };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { practice: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Clean up magic link
    await this.redisDel(magicLinkKey);

    return { success: true, user };
  }

  /**
   * Generate magic link for passwordless authentication
   */
  async generateMagicLink(email, purpose = 'login') {
    const token = crypto.randomBytes(32).toString('hex');
    const deepLink = `${process.env.FRONTEND_URL}/auth/magic/${token}`;
    
    const magicLinkData = {
      email: email.toLowerCase(),
      purpose,
      created: Date.now()
    };

    await this.redisSetex(`magic:${token}`, this.magicLinkExpiry, JSON.stringify(magicLinkData));
    
    // Quality of life: Send branded email with clear CTA
    await this.sendMagicLinkEmail(email, deepLink, purpose);
    
    return {
      token,
      expiresIn: this.magicLinkExpiry,
      deepLink
    };
  }

  /**
   * Intelligent session management
   */
  async calculateOptimalSession(user, deviceInfo, geoLocation) {
    const userPatterns = await this.getUserActivityPatterns(user.id);
    const riskAssessment = await this.assessSessionRisk(user.id, deviceInfo, geoLocation);
    
    let sessionDuration = this.sessionExpiry;
    let optimizations = [];

    // Extend session for trusted devices/locations
    if (riskAssessment.isLowRisk) {
      sessionDuration = this.sessionExpiry * 2; // 2 hours
      optimizations.push('extended-session');
    }

    // Adjust based on user activity patterns
    if (userPatterns.isActiveUser) {
      sessionDuration = Math.min(sessionDuration * 1.5, this.sessionExpiry * 3); // Max 3 hours
      optimizations.push('activity-based-extension');
    }

    // Mobile optimization
    if (deviceInfo?.isMobile) {
      optimizations.push('mobile-optimized');
    }

    return {
      duration: sessionDuration,
      optimizations,
      riskLevel: riskAssessment.level
    };
  }

  /**
   * Smart session extension
   */
  async extendSessionIntelligently(userId, activity) {
    const userPatterns = await this.getUserActivityPatterns(userId);
    const riskAssessment = await this.assessSessionRisk(userId, activity);
    
    if (riskAssessment.isLowRisk && userPatterns.suggestExtension) {
      const extensionMinutes = this.calculateExtensionDuration(userPatterns);
      
      return {
        extended: true,
        newExpiration: Date.now() + (extensionMinutes * 60 * 1000),
        reason: 'Low risk activity pattern detected',
        extensionMinutes
      };
    }
    
    return { extended: false, promptUser: true };
  }

  /**
   * Update user authentication preferences
   */
  async updateUserAuthPreference(userId, method) {
    const preferences = await this.getUserPreferences(userId);
    preferences.auth = {
      ...preferences.auth,
      preferredMethod: method,
      lastUsed: new Date().toISOString(),
      methodUsage: {
        ...preferences.auth?.methodUsage,
        [method]: (preferences.auth?.methodUsage?.[method] || 0) + 1
      }
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: preferences }
    });
  }

  /**
   * Get user preferences with intelligent defaults
   */
  async getUserPreferences(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true, role: true }
    });

    const defaultPreferences = {
      auth: {
        preferredMethod: 'password',
        mfaEnabled: false,
        sessionDuration: this.sessionExpiry
      },
      dashboard: {
        layout: this.getDefaultDashboardLayout(user.role),
        quickActions: this.getDefaultQuickActions(user.role)
      },
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      mobile: {
        biometricEnabled: false,
        quickActions: this.getDefaultMobileQuickActions(user.role)
      }
    };

    return { ...defaultPreferences, ...user.preferences };
  }

  /**
   * Get authentication suggestions for failed attempts
   */
  async getAuthSuggestions(identifier, method) {
    const suggestions = [];

    if (method === 'password') {
      suggestions.push('Try magic link authentication');
      suggestions.push('Use biometric authentication if available');
    } else if (method === 'magic-link') {
      suggestions.push('Check your email for the magic link');
      suggestions.push('Try password authentication');
    }

    // Check if user has other auth methods available
    const user = await this.prisma.user.findUnique({
      where: { email: identifier.toLowerCase() }
    });

    if (user) {
      const preferences = await this.getUserPreferences(user.id);
      if (preferences.auth.methodUsage?.biometric > 0) {
        suggestions.push('Try biometric authentication');
      }
    }

    return suggestions;
  }

  /**
   * Get next login suggestion based on user patterns
   */
  async getNextLoginSuggestion(userId, currentMethod) {
    const preferences = await this.getUserPreferences(userId);
    const methodUsage = preferences.auth?.methodUsage || {};
    
    // Find most used method that's not current
    const sortedMethods = Object.entries(methodUsage)
      .sort(([,a], [,b]) => b - a)
      .map(([method]) => method);

    const suggestedMethod = sortedMethods.find(method => method !== currentMethod);
    
    if (suggestedMethod) {
      return {
        method: suggestedMethod,
        reason: 'Based on your usage patterns',
        confidence: methodUsage[suggestedMethod] / Math.max(...Object.values(methodUsage))
      };
    }

    return null;
  }

  /**
   * Generate JWT token with enhanced payload
   */
  async generateJWT(user, sessionConfig) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      practiceId: user.practiceId,
      sessionId: crypto.randomBytes(16).toString('hex'),
      deviceInfo: sessionConfig.deviceInfo,
      exp: Math.floor(Date.now() / 1000) + sessionConfig.duration,
      iat: Math.floor(Date.now() / 1000),
      iss: 'medspasync-pro',
      aud: 'medspasync-users'
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + this.refreshTokenExpiry,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtRefreshSecret, { algorithm: 'HS256' });
  }

  /**
   * Store session in Redis
   */
  async storeSession(userId, token, sessionConfig) {
    const sessionData = {
      userId,
      token,
      deviceInfo: sessionConfig.deviceInfo,
      createdAt: Date.now(),
      expiresAt: Date.now() + (sessionConfig.duration * 1000)
    };

    await this.redisSetex(`session:${token}`, sessionConfig.duration, JSON.stringify(sessionData));
  }

  /**
   * Audit authentication attempts for HIPAA compliance
   */
  async auditAuthAttempt(auditData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: auditData.userId,
          action: 'AUTH_ATTEMPT',
          details: {
            method: auditData.method,
            success: auditData.success,
            deviceInfo: auditData.deviceFingerprint,
            location: auditData.location,
            error: auditData.error,
            sessionId: auditData.sessionId
          },
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  // Helper methods
  getDefaultDashboardLayout(role) {
    const layouts = {
      'SPA_OWNER': 'executive',
      'SPA_MANAGER': 'management',
      'FRONT_DESK_STAFF': 'operational',
      'MEDICAL_PROVIDER': 'clinical',
      'AESTHETICIAN': 'clinical'
    };
    return layouts[role] || 'operational';
  }

  getDefaultQuickActions(role) {
    const actions = {
      'SPA_OWNER': ['financial-reports', 'user-management', 'system-settings'],
      'SPA_MANAGER': ['staff-schedule', 'performance-reports', 'inventory'],
      'FRONT_DESK_STAFF': ['check-in-patient', 'book-appointment', 'process-payment'],
      'MEDICAL_PROVIDER': ['patient-notes', 'take-photo', 'treatment-plan'],
      'AESTHETICIAN': ['treatment-notes', 'before-after-photos', 'product-recommendations']
    };
    return actions[role] || [];
  }

  getDefaultMobileQuickActions(role) {
    const actions = {
      'FRONT_DESK_STAFF': ['quick-checkin', 'payment-shortcuts', 'common-services'],
      'MEDICAL_PROVIDER': ['voice-notes', 'photo-capture', 'quick-templates'],
      'AESTHETICIAN': ['treatment-notes', 'before-after-photos', 'product-recommendations']
    };
    return actions[role] || [];
  }

  async getUserActivityPatterns(userId) {
    // In a real implementation, this would analyze user behavior patterns
    return {
      isActiveUser: true,
      suggestExtension: true,
      typicalSessionDuration: 45 // minutes
    };
  }

  async assessSessionRisk(userId, deviceInfo, geoLocation) {
    // In a real implementation, this would assess risk based on various factors
    return {
      isLowRisk: true,
      level: 'low',
      factors: ['trusted-device', 'known-location']
    };
  }

  async sendMagicLinkEmail(email, deepLink, purpose) {
    // In a real implementation, this would send an email
    console.log(`Magic link email sent to ${email}: ${deepLink}`);
  }

  async isMFARequired(userId) {
    // In a real implementation, this would check MFA requirements
    return false;
  }

  async getUserMFAMethods(userId) {
    // In a real implementation, this would return user's MFA methods
    return ['authenticator', 'sms'];
  }

  calculateExtensionDuration(userPatterns) {
    return Math.min(userPatterns.typicalSessionDuration, 60); // Max 60 minutes
  }

  // Placeholder methods for other authentication types
  async authenticateWithBiometric(userId, biometricData) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { practice: true }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Validate biometric data (simplified)
    const isValidBiometric = await this.validateBiometricCredential(userId, biometricData);
    if (!isValidBiometric) {
      return { success: false, error: 'Biometric authentication failed' };
    }

    return { success: true, user };
  }

  async authenticateWithSSO(email, ssoData) {
    // Validate SSO response
    const ssoValidation = await this.validateSSOResponse(ssoData);
    if (!ssoValidation.valid) {
      return { success: false, error: 'Invalid SSO response' };
    }

    let user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { practice: true }
    });

    // Just-in-time user provisioning
    if (!user) {
      user = await this.provisionUserFromSSO(ssoValidation.userInfo);
    }

    return { success: true, user };
  }

  async validateBiometricCredential(userId, biometricData) {
    // In a real implementation, this would validate biometric data
    return true;
  }

  async validateSSOResponse(ssoData) {
    // In a real implementation, this would validate SSO response
    return { valid: true, userInfo: ssoData.userInfo };
  }

  async provisionUserFromSSO(userInfo) {
    // In a real implementation, this would create a user from SSO data
    return await this.prisma.user.create({
      data: {
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        role: 'FRONT_DESK_STAFF'
      },
      include: { practice: true }
    });
  }

  /**
   * Account lockout management
   */
  isAccountLocked(email) {
    const lockout = this.lockouts.get(email);
    if (!lockout) {
      return false;
    }

    if (Date.now() - lockout.timestamp > this.lockoutDuration) {
      this.lockouts.delete(email);
      this.loginAttempts.delete(email);
      return false;
    }

    return true;
  }

  recordFailedAttempt(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, attempts + 1);

    if (attempts + 1 >= this.maxLoginAttempts) {
      this.lockouts.set(email, { timestamp: Date.now() });
    }
  }

  clearFailedAttempts(email) {
    this.loginAttempts.delete(email);
    this.lockouts.delete(email);
  }
}

module.exports = EnhancedAuthService;
