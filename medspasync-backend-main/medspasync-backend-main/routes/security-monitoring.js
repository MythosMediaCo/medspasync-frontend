/**
 * Security Monitoring & Alerting Routes
 * Real-time monitoring, alerting, and dashboard management for MedSpaSync Pro
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole');
const enhancedRateLimiter = require('../middleware/enhanced-rate-limiter');
const securityMonitoring = require('../middleware/security-monitoring');
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * @route   GET /api/security-monitoring/status
 * @desc    Get security monitoring system status
 * @access  Admin only
 */
router.get('/status', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const status = {
        timestamp: new Date(),
        system: 'Security Monitoring & Alerting',
        version: '1.0.0',
        status: 'active',
        components: {
          realTimeMonitoring: 'active',
          alertingSystem: 'active',
          incidentResponse: 'active',
          dashboard: 'active',
          webSocket: process.env.WEBSOCKET_ENABLED === 'true' ? 'active' : 'disabled'
        },
        channels: {
          email: process.env.EMAIL_ALERTS_ENABLED === 'true',
          webhook: process.env.WEBHOOK_ALERTS_ENABLED === 'true',
          slack: process.env.SLACK_ALERTS_ENABLED === 'true',
          sms: process.env.SMS_ALERTS_ENABLED === 'true'
        },
        statistics: await securityMonitoring.getStatistics()
      };

      res.json(status);
    } catch (error) {
      console.error('❌ Security monitoring status error:', error);
      res.status(500).json({
        error: 'Failed to get security monitoring status',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/statistics
 * @desc    Get comprehensive security monitoring statistics
 * @access  Admin only
 */
router.get('/statistics', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      
      const [monitoringStats, incidentStats, alertStats, performanceStats] = await Promise.all([
        db.query('SELECT * FROM get_security_monitoring_stats($1)', [parseInt(hours)]),
        db.query(`
          SELECT 
            COUNT(*) as total_incidents,
            COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_incidents,
            COUNT(*) FILTER (WHERE severity = 'HIGH') as high_incidents,
            COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_incidents,
            AVG(threat_score) as avg_threat_score
          FROM security_incidents
          WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
        `, [parseInt(hours)]),
        db.query(`
          SELECT 
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE channel = 'email') as email_alerts,
            COUNT(*) FILTER (WHERE channel = 'webhook') as webhook_alerts,
            COUNT(*) FILTER (WHERE channel = 'slack') as slack_alerts,
            COUNT(*) FILTER (WHERE channel = 'sms') as sms_alerts,
            COUNT(*) FILTER (WHERE status = 'SENT') as sent_alerts,
            COUNT(*) FILTER (WHERE status = 'FAILED') as failed_alerts
          FROM security_alerts
          WHERE sent_at > NOW() - ($1 || ' hours')::INTERVAL
        `, [parseInt(hours)]),
        db.query(`
          SELECT 
            metric_name,
            AVG(metric_value) as avg_value,
            MAX(metric_value) as max_value,
            MIN(metric_value) as min_value
          FROM security_performance
          WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
          GROUP BY metric_name
        `, [parseInt(hours)])
      ]);

      const statistics = {
        monitoring: monitoringStats.rows[0],
        incidents: incidentStats.rows[0],
        alerts: alertStats.rows[0],
        performance: performanceStats.rows,
        period: `${hours} hours`,
        generated: new Date()
      };

      res.json(statistics);
    } catch (error) {
      console.error('❌ Security monitoring statistics error:', error);
      res.status(500).json({
        error: 'Failed to get security monitoring statistics',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/incidents
 * @desc    Get security incidents
 * @access  Admin only
 */
router.get('/incidents', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 50, severity, status, hours = 24 } = req.query;
      
      let query = `
        SELECT 
          si.*,
          u.email as user_email,
          u.role as user_role,
          COUNT(ia.id) as action_count
        FROM security_incidents si
        LEFT JOIN users u ON si.user_id = u.id
        LEFT JOIN incident_actions ia ON si.id = ia.incident_id
        WHERE si.timestamp > NOW() - ($1 || ' hours')::INTERVAL
      `;
      
      const params = [parseInt(hours)];
      
      if (severity) {
        query += ` AND si.severity = $${params.length + 1}`;
        params.push(severity);
      }
      
      if (status) {
        query += ` AND si.status = $${params.length + 1}`;
        params.push(status);
      }
      
      query += ` GROUP BY si.id, u.email, u.role
                 ORDER BY si.timestamp DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        incidents: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get incidents error:', error);
      res.status(500).json({
        error: 'Failed to get incidents',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/incidents/:id
 * @desc    Get specific security incident details
 * @access  Admin only
 */
router.get('/incidents/:id', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const [incident, actions, alerts] = await Promise.all([
        db.query(`
          SELECT 
            si.*,
            u.email as user_email,
            u.role as user_role
          FROM security_incidents si
          LEFT JOIN users u ON si.user_id = u.id
          WHERE si.id = $1
        `, [id]),
        
        db.query(`
          SELECT 
            ia.*,
            u.email as executed_by_email
          FROM incident_actions ia
          LEFT JOIN users u ON ia.executed_by = u.id
          WHERE ia.incident_id = $1
          ORDER BY ia.timestamp DESC
        `, [id]),
        
        db.query(`
          SELECT * FROM security_alerts
          WHERE incident_id = $1
          ORDER BY sent_at DESC
        `, [id])
      ]);
      
      if (incident.rows.length === 0) {
        return res.status(404).json({
          error: 'Incident not found',
          message: 'The specified security incident was not found'
        });
      }
      
      res.json({
        incident: incident.rows[0],
        actions: actions.rows,
        alerts: alerts.rows
      });
    } catch (error) {
      console.error('❌ Get incident details error:', error);
      res.status(500).json({
        error: 'Failed to get incident details',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/security-monitoring/incidents/:id/resolve
 * @desc    Resolve security incident
 * @access  Admin only
 */
router.put('/incidents/:id/resolve', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;
      
      const result = await db.query(`
        UPDATE security_incidents 
        SET status = 'RESOLVED', resolved_at = NOW(), resolved_by = $2, resolution_notes = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, req.user.id, resolutionNotes]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Incident not found',
          message: 'The specified security incident was not found'
        });
      }
      
      res.json({
        message: 'Incident resolved successfully',
        incident: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Resolve incident error:', error);
      res.status(500).json({
        error: 'Failed to resolve incident',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/alerts
 * @desc    Get security alerts
 * @access  Admin only
 */
router.get('/alerts', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 50, channel, status, hours = 24 } = req.query;
      
      let query = `
        SELECT 
          sa.*,
          si.incident_type,
          si.severity as incident_severity
        FROM security_alerts sa
        LEFT JOIN security_incidents si ON sa.incident_id = si.id
        WHERE sa.sent_at > NOW() - ($1 || ' hours')::INTERVAL
      `;
      
      const params = [parseInt(hours)];
      
      if (channel) {
        query += ` AND sa.channel = $${params.length + 1}`;
        params.push(channel);
      }
      
      if (status) {
        query += ` AND sa.status = $${params.length + 1}`;
        params.push(status);
      }
      
      query += ` ORDER BY sa.sent_at DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        alerts: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get alerts error:', error);
      res.status(500).json({
        error: 'Failed to get alerts',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/alerts/retry
 * @desc    Retry failed alert delivery
 * @access  Admin only
 */
router.post('/alerts/retry', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { alertIds } = req.body;
      
      if (!alertIds || !Array.isArray(alertIds)) {
        return res.status(400).json({
          error: 'Invalid alert IDs',
          message: 'Please provide an array of alert IDs'
        });
      }
      
      const result = await db.query(`
        UPDATE security_alerts 
        SET status = 'PENDING', retry_count = retry_count + 1, updated_at = NOW()
        WHERE id = ANY($1) AND status = 'FAILED'
        RETURNING *
      `, [alertIds]);
      
      res.json({
        message: 'Alerts queued for retry',
        retriedCount: result.rows.length,
        alerts: result.rows
      });
    } catch (error) {
      console.error('❌ Retry alerts error:', error);
      res.status(500).json({
        error: 'Failed to retry alerts',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/realtime
 * @desc    Get real-time monitoring data
 * @access  Admin only
 */
router.get('/realtime', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { metrics } = req.query;
      
      let query = 'SELECT * FROM realtime_monitoring';
      const params = [];
      
      if (metrics) {
        const metricList = metrics.split(',');
        query += ` WHERE metric_key = ANY($1)`;
        params.push(metricList);
      }
      
      query += ' ORDER BY timestamp DESC LIMIT 100';
      
      const result = await db.query(query, params);
      
      res.json({
        metrics: result.rows,
        total: result.rows.length,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Get real-time data error:', error);
      res.status(500).json({
        error: 'Failed to get real-time data',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/realtime
 * @desc    Update real-time monitoring data
 * @access  Admin only
 */
router.post('/realtime', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { metricKey, metricValue, ttl = 3600 } = req.body;
      
      if (!metricKey || !metricValue) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide metricKey and metricValue'
        });
      }
      
      await db.query('SELECT update_realtime_monitoring($1, $2, $3)', [
        metricKey,
        metricValue,
        parseInt(ttl)
      ]);
      
      res.json({
        message: 'Real-time monitoring data updated successfully',
        metricKey,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Update real-time data error:', error);
      res.status(500).json({
        error: 'Failed to update real-time data',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/dashboard
 * @desc    Get dashboard configuration and data
 * @access  Admin only
 */
router.get('/dashboard', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const [widgets, metrics] = await Promise.all([
        db.query(`
          SELECT * FROM dashboard_widgets
          WHERE is_active = true
          ORDER BY position_y, position_x
        `),
        
        db.query(`
          SELECT 
            metric_name,
            metric_value,
            metric_unit,
            timestamp
          FROM security_metrics
          WHERE timestamp > NOW() - INTERVAL '1 hour'
          ORDER BY timestamp DESC
        `)
      ]);
      
      res.json({
        widgets: widgets.rows,
        metrics: metrics.rows,
        total: widgets.rows.length,
        generated: new Date()
      });
    } catch (error) {
      console.error('❌ Get dashboard error:', error);
      res.status(500).json({
        error: 'Failed to get dashboard',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/dashboard/widgets
 * @desc    Create dashboard widget
 * @access  Admin only
 */
router.post('/dashboard/widgets', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { 
        widgetName, widgetType, widgetConfig, 
        positionX, positionY, width, height, refreshInterval 
      } = req.body;
      
      if (!widgetName || !widgetType || !widgetConfig) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide widgetName, widgetType, and widgetConfig'
        });
      }

      const result = await db.query(`
        INSERT INTO dashboard_widgets (
          widget_name, widget_type, widget_config, position_x, position_y, 
          width, height, refresh_interval, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        widgetName, widgetType, widgetConfig, 
        positionX || 0, positionY || 0, 
        width || 300, height || 200, 
        refreshInterval || 30, req.user.id
      ]);
      
      res.json({
        message: 'Dashboard widget created successfully',
        widget: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Create dashboard widget error:', error);
      res.status(500).json({
        error: 'Failed to create dashboard widget',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/security-monitoring/dashboard/widgets/:id
 * @desc    Update dashboard widget
 * @access  Admin only
 */
router.put('/dashboard/widgets/:id', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        widgetConfig, positionX, positionY, width, height, 
        refreshInterval, isActive 
      } = req.body;
      
      const result = await db.query(`
        UPDATE dashboard_widgets 
        SET 
          widget_config = $2, position_x = $3, position_y = $4,
          width = $5, height = $6, refresh_interval = $7, 
          is_active = $8, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        id, widgetConfig, positionX, positionY, width, height, 
        refreshInterval, isActive
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Widget not found',
          message: 'The specified dashboard widget was not found'
        });
      }
      
      res.json({
        message: 'Dashboard widget updated successfully',
        widget: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Update dashboard widget error:', error);
      res.status(500).json({
        error: 'Failed to update dashboard widget',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/alert-rules
 * @desc    Get alert rules
 * @access  Admin only
 */
router.get('/alert-rules', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          ar.*,
          u.email as created_by_email
        FROM alert_rules ar
        LEFT JOIN users u ON ar.created_by = u.id
        ORDER BY ar.priority, ar.rule_name
      `);
      
      res.json({
        rules: result.rows,
        total: result.rows.length,
        activeRules: result.rows.filter(r => r.is_active).length
      });
    } catch (error) {
      console.error('❌ Get alert rules error:', error);
      res.status(500).json({
        error: 'Failed to get alert rules',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/alert-rules
 * @desc    Create alert rule
 * @access  Admin only
 */
router.post('/alert-rules', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { 
        ruleName, ruleType, conditions, actions, channels, priority 
      } = req.body;
      
      if (!ruleName || !ruleType || !conditions || !actions || !channels) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide ruleName, ruleType, conditions, actions, and channels'
        });
      }

      const result = await db.query(`
        INSERT INTO alert_rules (
          rule_name, rule_type, conditions, actions, channels, priority, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        ruleName, ruleType, conditions, actions, channels, priority || 5, req.user.id
      ]);
      
      res.json({
        message: 'Alert rule created successfully',
        rule: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Create alert rule error:', error);
      res.status(500).json({
        error: 'Failed to create alert rule',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/security-monitoring/alert-rules/:id
 * @desc    Update alert rule
 * @access  Admin only
 */
router.put('/alert-rules/:id', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { conditions, actions, channels, priority, isActive } = req.body;
      
      const result = await db.query(`
        UPDATE alert_rules 
        SET conditions = $2, actions = $3, channels = $4, priority = $5, is_active = $6, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, conditions, actions, channels, priority, isActive]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Rule not found',
          message: 'The specified alert rule was not found'
        });
      }
      
      res.json({
        message: 'Alert rule updated successfully',
        rule: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Update alert rule error:', error);
      res.status(500).json({
        error: 'Failed to update alert rule',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/notifications
 * @desc    Get security notifications for current user
 * @access  Authenticated users
 */
router.get('/notifications', 
  authMiddleware,
  async (req, res) => {
    try {
      const { limit = 50, unread = false } = req.query;
      
      let query = `
        SELECT * FROM security_notifications
        WHERE user_id = $1
      `;
      
      const params = [req.user.id];
      
      if (unread === 'true') {
        query += ` AND is_read = false`;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        notifications: result.rows,
        total: result.rows.length,
        unreadCount: result.rows.filter(n => !n.is_read).length
      });
    } catch (error) {
      console.error('❌ Get notifications error:', error);
      res.status(500).json({
        error: 'Failed to get notifications',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/security-monitoring/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Authenticated users
 */
router.put('/notifications/:id/read', 
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.query(`
        UPDATE security_notifications 
        SET is_read = true, read_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [id, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Notification not found',
          message: 'The specified notification was not found'
        });
      }
      
      res.json({
        message: 'Notification marked as read',
        notification: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Mark notification read error:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/audit-log
 * @desc    Get security audit log
 * @access  Admin only
 */
router.get('/audit-log', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 100, action, userId, hours = 24 } = req.query;
      
      let query = `
        SELECT 
          sal.*,
          u.email as user_email,
          u.role as user_role
        FROM security_audit_log sal
        LEFT JOIN users u ON sal.user_id = u.id
        WHERE sal.timestamp > NOW() - ($1 || ' hours')::INTERVAL
      `;
      
      const params = [parseInt(hours)];
      
      if (action) {
        query += ` AND sal.action = $${params.length + 1}`;
        params.push(action);
      }
      
      if (userId) {
        query += ` AND sal.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      query += ` ORDER BY sal.timestamp DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        auditLog: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get audit log error:', error);
      res.status(500).json({
        error: 'Failed to get audit log',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/security-monitoring/performance
 * @desc    Get security performance metrics
 * @access  Admin only
 */
router.get('/performance', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { component, hours = 24 } = req.query;
      
      let query = `
        SELECT 
          metric_name,
          metric_value,
          metric_unit,
          component,
          timestamp
        FROM security_performance
        WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
      `;
      
      const params = [parseInt(hours)];
      
      if (component) {
        query += ` AND component = $${params.length + 1}`;
        params.push(component);
      }
      
      query += ` ORDER BY timestamp DESC`;
      
      const result = await db.query(query, params);
      
      res.json({
        performance: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get performance metrics error:', error);
      res.status(500).json({
        error: 'Failed to get performance metrics',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/performance
 * @desc    Add security performance metric
 * @access  Admin only
 */
router.post('/performance', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { metricName, metricValue, metricUnit, component, tags } = req.body;
      
      if (!metricName || metricValue === undefined) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide metricName and metricValue'
        });
      }

      const result = await db.query(`
        INSERT INTO security_performance (
          metric_name, metric_value, metric_unit, component, tags
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        metricName, metricValue, metricUnit, component, tags || {}
      ]);
      
      res.json({
        message: 'Performance metric added successfully',
        metric: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Add performance metric error:', error);
      res.status(500).json({
        error: 'Failed to add performance metric',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/test-alert
 * @desc    Send test alert
 * @access  Admin only
 */
router.post('/test-alert', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { channel, message } = req.body;
      
      if (!channel || !message) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide channel and message'
        });
      }
      
      // Create test incident
      const incidentResult = await db.query(`
        INSERT INTO security_incidents (
          incident_type, severity, threat_score, details
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        'TEST_ALERT',
        'LOW',
        0.1,
        JSON.stringify({ test: true, message })
      ]);
      
      const incidentId = incidentResult.rows[0].id;
      
      // Send test alert
      const alertResult = await db.query(`
        INSERT INTO security_alerts (
          incident_id, alert_type, severity, channel, recipient, message, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        incidentId,
        'TEST_ALERT',
        'LOW',
        channel,
        req.user.email,
        message,
        JSON.stringify({ test: true })
      ]);
      
      res.json({
        message: 'Test alert sent successfully',
        alert: alertResult.rows[0],
        incidentId
      });
    } catch (error) {
      console.error('❌ Send test alert error:', error);
      res.status(500).json({
        error: 'Failed to send test alert',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/security-monitoring/cleanup
 * @desc    Clean up old monitoring data
 * @access  Admin only
 */
router.post('/cleanup', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const result = await db.query('SELECT cleanup_expired_monitoring_data()');
      const deletedCount = result.rows[0].cleanup_expired_monitoring_data;
      
      res.json({
        message: 'Data cleanup completed successfully',
        deletedRecords: deletedCount
      });
    } catch (error) {
      console.error('❌ Data cleanup error:', error);
      res.status(500).json({
        error: 'Failed to cleanup data',
        message: error.message
      });
    }
  }
);

module.exports = router; 