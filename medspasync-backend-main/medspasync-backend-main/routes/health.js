/**
 * MedSpaSync Pro - Health Check Endpoint
 * 
 * Provides comprehensive health monitoring for all services in the ecosystem.
 */

const express = require('express');
const router = express.Router();
const environmentManager = require('../config/environment-manager');

/**
 * GET /api/health
 * Comprehensive health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get environment status
    const envStatus = environmentManager.getStatusSummary();
    
    // Perform health checks
    const healthChecks = await environmentManager.performHealthChecks();
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Build comprehensive health response
    const healthResponse = {
      status: healthChecks.overall ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: envStatus.environment,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      services: {
        database: {
          status: healthChecks.database ? 'healthy' : 'unhealthy',
          type: envStatus.config.database ? 'PostgreSQL/MongoDB' : 'None (Demo Mode)'
        },
        ai: {
          status: healthChecks.ai ? 'healthy' : 'unhealthy',
          configured: envStatus.config.ai
        },
        stripe: {
          status: healthChecks.stripe ? 'healthy' : 'unhealthy',
          configured: envStatus.config.stripe,
          mode: envStatus.config.stripe ? 'LIVE' : 'TEST'
        },
        email: {
          status: healthChecks.email ? 'healthy' : 'unhealthy',
          configured: envStatus.config.email
        },
        cors: {
          status: healthChecks.cors ? 'healthy' : 'unhealthy',
          origins: envStatus.config.cors
        }
      },
      validation: envStatus.validation,
      lastHealthCheck: envStatus.lastHealthCheck
    };

    // Set appropriate status code
    const statusCode = healthChecks.overall ? 200 : 503;
    
    res.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: environmentManager.environment
    });
  }
});

/**
 * GET /api/health/ready
 * Kubernetes readiness probe endpoint
 */
router.get('/ready', async (req, res) => {
  try {
    const healthChecks = await environmentManager.performHealthChecks();
    
    // For readiness, we check if the application can serve requests
    const isReady = healthChecks.database || environmentManager.environment === 'demo';
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        environment: environmentManager.environment
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        environment: environmentManager.environment,
        reason: 'Database not available'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/live
 * Kubernetes liveness probe endpoint
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: environmentManager.environment
  });
});

/**
 * GET /api/health/environment
 * Environment configuration status
 */
router.get('/environment', (req, res) => {
  try {
    const envStatus = environmentManager.getStatusSummary();
    const report = environmentManager.generateReport();
    
    res.json({
      environment: envStatus.environment,
      status: envStatus.validation.isValid ? 'valid' : 'invalid',
      timestamp: new Date().toISOString(),
      validation: envStatus.validation,
      configuration: report.report.configuration,
      health: envStatus.health
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/services
 * Detailed service health information
 */
router.get('/services', async (req, res) => {
  try {
    const healthChecks = await environmentManager.performHealthChecks();
    const envConfig = environmentManager.getConfig();
    
    const services = {
      database: {
        status: healthChecks.database ? 'healthy' : 'unhealthy',
        type: envConfig.database.url ? 'PostgreSQL' : envConfig.database.mongoUrl ? 'MongoDB' : 'None',
        configured: !!(envConfig.database.url || envConfig.database.mongoUrl),
        poolSize: envConfig.database.poolSize,
        timeout: envConfig.database.timeout
      },
      ai: {
        status: healthChecks.ai ? 'healthy' : 'unhealthy',
        serviceUrl: envConfig.ai.serviceUrl,
        configured: !!envConfig.ai.serviceUrl,
        timeout: envConfig.ai.timeout,
        maxConcurrentJobs: envConfig.ai.maxConcurrentJobs
      },
      stripe: {
        status: healthChecks.stripe ? 'healthy' : 'unhealthy',
        configured: !!envConfig.stripe.secretKey,
        mode: envConfig.stripe.secretKey?.includes('sk_live') ? 'LIVE' : 'TEST',
        trialEnabled: envConfig.stripe.enableTrial,
        trialDays: envConfig.stripe.trialDays
      },
      email: {
        status: healthChecks.email ? 'healthy' : 'unhealthy',
        configured: !!envConfig.email.user,
        host: envConfig.email.host,
        port: envConfig.email.port,
        from: envConfig.email.from
      },
      cors: {
        status: healthChecks.cors ? 'healthy' : 'unhealthy',
        origins: envConfig.cors.origins.length,
        credentials: envConfig.cors.credentials,
        methods: envConfig.cors.methods
      },
      security: {
        encryption: envConfig.security.encryptionEnabled,
        auditLogging: envConfig.security.auditLogging,
        jwtConfigured: !!envConfig.security.jwtSecret
      }
    };
    
    res.json({
      timestamp: new Date().toISOString(),
      environment: environmentManager.environment,
      services,
      overall: healthChecks.overall
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 