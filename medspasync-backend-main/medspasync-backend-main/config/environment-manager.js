/**
 * MedSpaSync Pro - Centralized Environment Management System
 * 
 * This module provides a comprehensive environment management solution for the
 * multi-application MedSpaSync Pro ecosystem, including validation, health checks,
 * and environment-specific configurations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.configs = new Map();
    this.healthStatus = {
      database: false,
      ai: false,
      stripe: false,
      email: false,
      cors: false,
      overall: false
    };
    this.lastHealthCheck = null;
    this.encryptionKey = process.env.ENV_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    
    this.initializeEnvironmentConfigs();
  }

  /**
   * Initialize environment-specific configurations
   */
  initializeEnvironmentConfigs() {
    // Development Environment
    this.configs.set('development', {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/medspasync_dev',
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/medspasync_dev',
        poolSize: 5,
        timeout: 30000
      },
      ai: {
        serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
        apiKey: process.env.AI_API_KEY || 'dev_key',
        scriptPath: process.env.PYTHON_SCRIPT_PATH || './reconciliation/ai_service.py',
        timeout: 300000,
        maxConcurrentJobs: 3
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || null,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        enableTrial: true,
        trialDays: 14
      },
      email: {
        user: process.env.EMAIL_USER || 'dev@medspasyncpro.com',
        password: process.env.EMAIL_PASSWORD || null,
        from: process.env.EMAIL_FROM || 'dev@medspasyncpro.com',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587
      },
      cors: {
        origins: [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://localhost:5173',
          'http://localhost:4200'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || null,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || null,
        encryptionEnabled: false,
        auditLogging: true
      },
      upload: {
        maxSize: process.env.UPLOAD_MAX_MB || '10',
        tempDir: process.env.UPLOAD_TEMP_DIR || './uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      },
      processing: {
        confidenceThreshold: process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.95',
        batchSize: process.env.PROCESSING_BATCH_SIZE || '100',
        maxTransactions: process.env.MAX_TRANSACTIONS_PER_JOB || '10000'
      }
    });

    // Staging Environment
    this.configs.set('staging', {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://staging:5432/medspasync_staging',
        mongoUrl: process.env.MONGO_URI || 'mongodb://staging:27017/medspasync_staging',
        poolSize: 10,
        timeout: 60000
      },
      ai: {
        serviceUrl: process.env.ML_SERVICE_URL || 'https://staging-ai.medspasyncpro.com',
        apiKey: process.env.AI_API_KEY,
        scriptPath: process.env.PYTHON_SCRIPT_PATH || './reconciliation/ai_service.py',
        timeout: 600000,
        maxConcurrentJobs: 5
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || null,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        enableTrial: true,
        trialDays: 7
      },
      email: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || 'staging@medspasyncpro.com',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587
      },
      cors: {
        origins: [
          'https://staging.medspasyncpro.com',
          'https://staging-demo.medspasyncpro.com',
          'https://staging-marketing.medspasyncpro.com'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
      },
      security: {
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        encryptionEnabled: true,
        auditLogging: true
      },
      upload: {
        maxSize: process.env.UPLOAD_MAX_MB || '25',
        tempDir: process.env.UPLOAD_TEMP_DIR || './uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      },
      processing: {
        confidenceThreshold: process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.90',
        batchSize: process.env.PROCESSING_BATCH_SIZE || '200',
        maxTransactions: process.env.MAX_TRANSACTIONS_PER_JOB || '50000'
      }
    });

    // Production Environment
    this.configs.set('production', {
      database: {
        url: process.env.DATABASE_URL,
        mongoUrl: process.env.MONGO_URI,
        poolSize: 20,
        timeout: 120000
      },
      ai: {
        serviceUrl: process.env.ML_SERVICE_URL || 'https://ai.medspasyncpro.com',
        apiKey: process.env.AI_API_KEY,
        scriptPath: process.env.PYTHON_SCRIPT_PATH || './reconciliation/ai_service.py',
        timeout: 900000,
        maxConcurrentJobs: 10
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || null,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        enableTrial: process.env.ENABLE_TRIAL === 'true',
        trialDays: parseInt(process.env.TRIAL_DAYS) || 14
      },
      email: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || 'noreply@medspasyncpro.com',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587
      },
      cors: {
        origins: [
          'https://medspasyncpro.com',
          'https://www.medspasyncpro.com',
          'https://demo.medspasyncpro.com',
          'https://marketing.medspasyncpro.com',
          /^https:\/\/medspasync.*\.vercel\.app$/,
          /^https:\/\/medspasync.*\.netlify\.app$/
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
      },
      security: {
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        encryptionEnabled: true,
        auditLogging: true
      },
      upload: {
        maxSize: process.env.UPLOAD_MAX_MB || '50',
        tempDir: process.env.UPLOAD_TEMP_DIR || './uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      },
      processing: {
        confidenceThreshold: process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.85',
        batchSize: process.env.PROCESSING_BATCH_SIZE || '500',
        maxTransactions: process.env.MAX_TRANSACTIONS_PER_JOB || '100000'
      }
    });

    // Demo Environment
    this.configs.set('demo', {
      database: {
        url: null, // Demo mode - no persistent database
        mongoUrl: null,
        poolSize: 1,
        timeout: 10000
      },
      ai: {
        serviceUrl: process.env.ML_SERVICE_URL || 'https://demo-ai.medspasyncpro.com',
        apiKey: process.env.AI_API_KEY || 'demo_key',
        scriptPath: process.env.PYTHON_SCRIPT_PATH || './reconciliation/ai_service.py',
        timeout: 300000,
        maxConcurrentJobs: 2
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || null,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
        enableTrial: true,
        trialDays: 3
      },
      email: {
        user: process.env.EMAIL_USER || 'demo@medspasyncpro.com',
        password: process.env.EMAIL_PASSWORD || null,
        from: process.env.EMAIL_FROM || 'demo@medspasyncpro.com',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587
      },
      cors: {
        origins: [
          'https://demo.medspasyncpro.com',
          'http://localhost:3000',
          'http://localhost:5173'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || null,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || null,
        encryptionEnabled: false,
        auditLogging: false
      },
      upload: {
        maxSize: process.env.UPLOAD_MAX_MB || '5',
        tempDir: process.env.UPLOAD_TEMP_DIR || './uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      },
      processing: {
        confidenceThreshold: process.env.DEFAULT_CONFIDENCE_THRESHOLD || '0.80',
        batchSize: process.env.PROCESSING_BATCH_SIZE || '50',
        maxTransactions: process.env.MAX_TRANSACTIONS_PER_JOB || '1000'
      }
    });
  }

  /**
   * Get current environment configuration
   */
  getConfig() {
    return this.configs.get(this.environment) || this.configs.get('development');
  }

  /**
   * Get specific configuration section
   */
  getConfigSection(section) {
    const config = this.getConfig();
    return config[section];
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment() {
    const config = this.getConfig();
    const errors = [];
    const warnings = [];

    // Required validations
    if (this.environment === 'production') {
      if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required for production');
      }
      if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is required for production');
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        errors.push('STRIPE_SECRET_KEY is required for production');
      }
    }

    // Recommended validations
    if (!process.env.ML_SERVICE_URL && this.environment !== 'demo') {
      warnings.push('ML_SERVICE_URL not configured - AI features will be limited');
    }

    if (!process.env.EMAIL_USER) {
      warnings.push('EMAIL_USER not configured - email features will be disabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      environment: this.environment,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform health checks for all services
   */
  async performHealthChecks() {
    const healthChecks = {
      database: await this.checkDatabaseHealth(),
      ai: await this.checkAIHealth(),
      stripe: await this.checkStripeHealth(),
      email: await this.checkEmailHealth(),
      cors: this.checkCORSHealth(),
      overall: false
    };

    healthChecks.overall = Object.values(healthChecks).every(check => check === true);

    this.healthStatus = healthChecks;
    this.lastHealthCheck = new Date().toISOString();

    return healthChecks;
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const config = this.getConfigSection('database');
      
      if (!config.url && !config.mongoUrl) {
        return this.environment === 'demo'; // Demo mode is healthy without database
      }

      // Check PostgreSQL
      if (config.url) {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
      }

      // Check MongoDB
      if (config.mongoUrl) {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(config.mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check AI service health
   */
  async checkAIHealth() {
    try {
      const config = this.getConfigSection('ai');
      if (!config.serviceUrl) {
        return this.environment === 'demo';
      }

      const axios = require('axios');
      const response = await axios.get(`${config.serviceUrl}/health`, {
        timeout: 5000,
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      return response.status === 200;
    } catch (error) {
      console.error('AI health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check Stripe health
   */
  async checkStripeHealth() {
    try {
      const config = this.getConfigSection('stripe');
      if (!config.secretKey) {
        return false;
      }

      const stripe = require('stripe')(config.secretKey);
      await stripe.paymentMethods.list({ limit: 1 });
      return true;
    } catch (error) {
      console.error('Stripe health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check email service health
   */
  async checkEmailHealth() {
    try {
      const config = this.getConfigSection('email');
      if (!config.user || !config.password) {
        return false;
      }

      // Basic email configuration validation
      return config.host && config.port;
    } catch (error) {
      console.error('Email health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check CORS configuration health
   */
  checkCORSHealth() {
    try {
      const config = this.getConfigSection('cors');
      return config.origins && config.origins.length > 0;
    } catch (error) {
      console.error('CORS health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get environment status summary
   */
  getStatusSummary() {
    return {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      health: this.healthStatus,
      lastHealthCheck: this.lastHealthCheck,
      validation: this.validateEnvironment(),
      config: {
        database: !!this.getConfigSection('database').url,
        ai: !!this.getConfigSection('ai').serviceUrl,
        stripe: !!this.getConfigSection('stripe').secretKey,
        email: !!this.getConfigSection('email').user,
        cors: this.getConfigSection('cors').origins.length
      }
    };
  }

  /**
   * Encrypt sensitive environment variables
   */
  encryptValue(value) {
    if (!this.getConfigSection('security').encryptionEnabled) {
      return value;
    }

    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive environment variables
   */
  decryptValue(encryptedValue) {
    if (!this.getConfigSection('security').encryptionEnabled) {
      return encryptedValue;
    }

    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return encryptedValue;
    }
  }

  /**
   * Generate environment configuration report
   */
  generateReport() {
    const config = this.getConfig();
    const validation = this.validateEnvironment();
    const health = this.healthStatus;

    return {
      report: {
        generatedAt: new Date().toISOString(),
        environment: this.environment,
        validation,
        health,
        configuration: {
          database: {
            configured: !!config.database.url,
            type: config.database.url ? 'PostgreSQL' : config.database.mongoUrl ? 'MongoDB' : 'None'
          },
          ai: {
            configured: !!config.ai.serviceUrl,
            serviceUrl: config.ai.serviceUrl || 'Not configured'
          },
          stripe: {
            configured: !!config.stripe.secretKey,
            mode: config.stripe.secretKey?.includes('sk_live') ? 'LIVE' : 'TEST'
          },
          email: {
            configured: !!config.email.user,
            host: config.email.host || 'Not configured'
          },
          security: {
            encryption: config.security.encryptionEnabled ? 'Enabled' : 'Disabled',
            auditLogging: config.security.auditLogging ? 'Enabled' : 'Disabled'
          }
        }
      }
    };
  }
}

// Create singleton instance
const environmentManager = new EnvironmentManager();

module.exports = environmentManager;
