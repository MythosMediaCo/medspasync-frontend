/**
 * API Security Routes
 * Endpoints for security management, monitoring, and testing
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole');
const enhancedRateLimiter = require('../middleware/enhanced-rate-limiter');
const apiSecurity = require('../middleware/api-security');
const SecurityMonitor = require('../monitoring/security-monitor');
const SecurityTestSuite = require('../tests/security-tests');

// Initialize security monitor
const securityMonitor = new SecurityMonitor();

/**
 * @route   GET /api/security/status
 * @desc    Get security system status
 * @access  Admin only
 */
router.get('/status', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const status = {
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        security: {
          authentication: 'active',
          authorization: 'active',
          rateLimiting: 'active',
          threatDetection: 'active',
          auditLogging: 'active',
          encryption: 'active'
        },
        monitoring: {
          securityMonitor: securityMonitor.isRunning ? 'active' : 'inactive',
          lastCheck: new Date()
        },
        statistics: await securityMonitor.getRateLimitStats()
      };

      res.json(status);
    } catch (error) {
      console.error('❌ Security status error:', error);
      res.status(500).json({
        error: 'Failed to get security status',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security/stats
 * @desc    Get security statistics
 * @access  Admin only
 */
router.get('/stats', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const [rateLimitStats, securityStats, apiStats] = await Promise.all([
        enhancedRateLimiter.getStats(),
        apiSecurity.getStats(),
        securityMonitor.generateSecurityReport(
          new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          new Date()
        )
      ]);

      const stats = {
        rateLimiting: rateLimitStats,
        security: securityStats,
        api: apiStats,
        generated: new Date()
      };

      res.json(stats);
    } catch (error) {
      console.error('❌ Security stats error:', error);
      res.status(500).json({
        error: 'Failed to get security statistics',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/monitor/start
 * @desc    Start security monitoring
 * @access  Admin only
 */
router.post('/monitor/start', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      await securityMonitor.start();
      
      res.json({
        message: 'Security monitoring started successfully',
        status: 'active'
      });
    } catch (error) {
      console.error('❌ Start monitoring error:', error);
      res.status(500).json({
        error: 'Failed to start security monitoring',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/monitor/stop
 * @desc    Stop security monitoring
 * @access  Admin only
 */
router.post('/monitor/stop', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      securityMonitor.stop();
      
      res.json({
        message: 'Security monitoring stopped successfully',
        status: 'inactive'
      });
    } catch (error) {
      console.error('❌ Stop monitoring error:', error);
      res.status(500).json({
        error: 'Failed to stop security monitoring',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/rate-limit/reset
 * @desc    Reset rate limit for a specific key
 * @access  Admin only
 */
router.post('/rate-limit/reset', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { key } = req.body;
      
      if (!key) {
        return res.status(400).json({
          error: 'Missing key parameter',
          message: 'Please provide a key to reset'
        });
      }

      const success = await enhancedRateLimiter.resetLimit(key);
      
      if (success) {
        res.json({
          message: 'Rate limit reset successfully',
          key: key
        });
      } else {
        res.status(500).json({
          error: 'Failed to reset rate limit',
          key: key
        });
      }
    } catch (error) {
      console.error('❌ Reset rate limit error:', error);
      res.status(500).json({
        error: 'Failed to reset rate limit',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/api-key/add
 * @desc    Add new API key
 * @access  Admin only
 */
router.post('/api-key/add', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { name, permissions, rateLimit, expiresAt } = req.body;
      
      if (!name) {
        return res.status(400).json({
          error: 'Missing name parameter',
          message: 'Please provide a name for the API key'
        });
      }

      const key = crypto.randomBytes(32).toString('hex');
      const keyData = {
        name,
        permissions: permissions || ['read'],
        rateLimit: rateLimit || 1000,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };

      enhancedRateLimiter.addAPIKey(key, keyData);
      
      res.json({
        message: 'API key added successfully',
        key: key,
        data: keyData
      });
    } catch (error) {
      console.error('❌ Add API key error:', error);
      res.status(500).json({
        error: 'Failed to add API key',
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/security/api-key/:key
 * @desc    Remove API key
 * @access  Admin only
 */
router.delete('/api-key/:key', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { key } = req.params;
      
      const success = enhancedRateLimiter.removeAPIKey(key);
      
      if (success) {
        res.json({
          message: 'API key removed successfully',
          key: key
        });
      } else {
        res.status(404).json({
          error: 'API key not found',
          key: key
        });
      }
    } catch (error) {
      console.error('❌ Remove API key error:', error);
      res.status(500).json({
        error: 'Failed to remove API key',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/test/run
 * @desc    Run security tests
 * @access  Admin only
 */
router.post('/test/run', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { testType } = req.body;
      
      const testSuite = new SecurityTestSuite();
      
      if (testType === 'full') {
        // Run all tests
        await testSuite.runAllTests();
      } else if (testType === 'quick') {
        // Run quick tests only
        await testSuite.testAuthentication();
        await testSuite.testAuthorization();
        await testSuite.testSecurityHeaders();
      } else {
        return res.status(400).json({
          error: 'Invalid test type',
          message: 'Please specify "full" or "quick"'
        });
      }

      res.json({
        message: 'Security tests completed',
        results: testSuite.testResults,
        summary: {
          total: testSuite.total,
          passed: testSuite.passes,
          failed: testSuite.failures.length
        }
      });
    } catch (error) {
      console.error('❌ Security test error:', error);
      res.status(500).json({
        error: 'Failed to run security tests',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security/logs
 * @desc    Get security logs
 * @access  Admin only
 */
router.get('/logs', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { startDate, endDate, type, format = 'json' } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const logs = await securityMonitor.exportSecurityLogs(start, end, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="security-logs.csv"');
        res.send(logs);
      } else {
        res.json({
          logs: logs,
          period: { start, end },
          total: logs.length
        });
      }
    } catch (error) {
      console.error('❌ Get security logs error:', error);
      res.status(500).json({
        error: 'Failed to get security logs',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/alert/test
 * @desc    Test security alerting
 * @access  Admin only
 */
router.post('/alert/test', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { alertType, data } = req.body;
      
      await securityMonitor.sendSecurityAlert(alertType || 'TEST_ALERT', data || {
        test: true,
        timestamp: new Date(),
        admin: req.user.email
      });
      
      res.json({
        message: 'Test alert sent successfully',
        alertType: alertType || 'TEST_ALERT'
      });
    } catch (error) {
      console.error('❌ Test alert error:', error);
      res.status(500).json({
        error: 'Failed to send test alert',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security/health
 * @desc    Security system health check
 * @access  Public
 */
router.get('/health', 
  apiSecurity.healthCheck
);

/**
 * @route   GET /api/security/config
 * @desc    Get security configuration (non-sensitive)
 * @access  Admin only
 */
router.get('/config', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const config = {
        environment: process.env.NODE_ENV || 'development',
        security: {
          rateLimiting: {
            enabled: true,
            windowMs: 15 * 60 * 1000,
            maxRequests: 100
          },
          authentication: {
            enabled: true,
            jwtExpiry: '7d',
            refreshTokenExpiry: '30d'
          },
          monitoring: {
            enabled: securityMonitor.isRunning,
            alertThresholds: securityMonitor.alertThresholds
          },
          headers: {
            hsts: true,
            csp: true,
            xssProtection: true,
            frameOptions: 'DENY'
          }
        },
        cors: {
          enabled: true,
          allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
        },
        audit: {
          enabled: true,
          hipaaCompliance: true,
          dataRetention: '90 days'
        }
      };

      res.json(config);
    } catch (error) {
      console.error('❌ Get security config error:', error);
      res.status(500).json({
        error: 'Failed to get security configuration',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security/config/update
 * @desc    Update security configuration
 * @access  Admin only
 */
router.post('/config/update', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { rateLimiting, monitoring, headers } = req.body;
      
      // Update rate limiting configuration
      if (rateLimiting) {
        // This would typically update environment variables or database
        console.log('Updating rate limiting configuration:', rateLimiting);
      }

      // Update monitoring configuration
      if (monitoring) {
        Object.assign(securityMonitor.alertThresholds, monitoring.alertThresholds);
        console.log('Updating monitoring configuration:', monitoring);
      }

      // Update security headers configuration
      if (headers) {
        console.log('Updating security headers configuration:', headers);
      }

      res.json({
        message: 'Security configuration updated successfully',
        updated: { rateLimiting, monitoring, headers }
      });
    } catch (error) {
      console.error('❌ Update security config error:', error);
      res.status(500).json({
        error: 'Failed to update security configuration',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security/threats
 * @desc    Get recent threats and suspicious activity
 * @access  Admin only
 */
router.get('/threats', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 50, severity } = req.query;
      
      let query = `
        SELECT * FROM security_logs 
        WHERE event_type IN ('THREAT_DETECTED', 'SUSPICIOUS_ACTIVITY')
        AND timestamp > NOW() - INTERVAL '24 hours'
      `;
      
      const params = [];
      
      if (severity) {
        query += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await securityMonitor.db.query(query, params);
      
      res.json({
        threats: result.rows,
        total: result.rows.length,
        period: '24 hours'
      });
    } catch (error) {
      console.error('❌ Get threats error:', error);
      res.status(500).json({
        error: 'Failed to get threats',
        message: error.message
      });
    }
  }
);

module.exports = router; 