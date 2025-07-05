/**
 * Security Monitoring & Alerting Tests
 * Comprehensive test suite for real-time monitoring, alerting, and dashboard
 */

const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const crypto = require('crypto');

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/medspasync_test',
  ssl: false
});

describe('Security Monitoring & Alerting', () => {
  let adminToken;
  let userToken;
  let testUserId;
  let testIncidentId;
  let testAlertId;

  beforeAll(async () => {
    // Setup test data
    try {
      // Create test user
      const userResult = await db.query(`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['testuser@example.com', 'hashedpassword', 'USER', true]);
      testUserId = userResult.rows[0].id;

      // Create admin user
      await db.query(`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, ['admin@example.com', 'hashedpassword', 'ADMIN', true]);

      // Get admin token
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        });
      adminToken = adminLogin.body.token;

      // Get user token
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });
      userToken = userLogin.body.token;
    } catch (error) {
      console.error('❌ Test setup error:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.query('DELETE FROM security_alerts WHERE incident_id IN (SELECT id FROM security_incidents WHERE user_id = $1)', [testUserId]);
      await db.query('DELETE FROM incident_actions WHERE incident_id IN (SELECT id FROM security_incidents WHERE user_id = $1)', [testUserId]);
      await db.query('DELETE FROM security_incidents WHERE user_id = $1', [testUserId]);
      await db.query('DELETE FROM security_notifications WHERE user_id = $1', [testUserId]);
      await db.query('DELETE FROM users WHERE email IN ($1, $2)', ['testuser@example.com', 'admin@example.com']);
      await db.end();
    } catch (error) {
      console.error('❌ Test cleanup error:', error);
    }
  });

  describe('GET /api/security-monitoring/status', () => {
    it('should return security monitoring system status for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('system', 'Security Monitoring & Alerting');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('components');
      expect(response.body.components).toHaveProperty('realTimeMonitoring');
      expect(response.body.components).toHaveProperty('alertingSystem');
      expect(response.body.components).toHaveProperty('incidentResponse');
      expect(response.body.components).toHaveProperty('dashboard');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/status');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/security-monitoring/statistics', () => {
    it('should return comprehensive security monitoring statistics for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/statistics?hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('monitoring');
      expect(response.body).toHaveProperty('incidents');
      expect(response.body).toHaveProperty('alerts');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('period', '24 hours');
    });

    it('should handle different time periods', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/statistics?hours=48')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.period).toBe('48 hours');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/security-monitoring/incidents', () => {
    beforeEach(async () => {
      // Create test incident
      const incidentResult = await db.query(`
        INSERT INTO security_incidents (
          incident_type, severity, threat_score, ip_address, user_id, details
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        'TEST_INCIDENT',
        'HIGH',
        0.75,
        '192.168.1.1',
        testUserId,
        JSON.stringify({ test: 'incident' })
      ]);
      testIncidentId = incidentResult.rows[0].id;
    });

    it('should return security incidents for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/incidents?limit=10&hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidents');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
      expect(Array.isArray(response.body.incidents)).toBe(true);
    });

    it('should filter incidents by severity', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/incidents?severity=HIGH')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.incidents.every(i => i.severity === 'HIGH')).toBe(true);
    });

    it('should filter incidents by status', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/incidents?status=DETECTED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.incidents.every(i => i.status === 'DETECTED')).toBe(true);
    });

    it('should limit results correctly', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/incidents?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.incidents.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/security-monitoring/incidents/:id', () => {
    it('should return specific incident details for admin', async () => {
      const response = await request(app)
        .get(`/api/security-monitoring/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incident');
      expect(response.body).toHaveProperty('actions');
      expect(response.body).toHaveProperty('alerts');
      expect(response.body.incident.id).toBe(testIncidentId);
    });

    it('should handle non-existent incident', async () => {
      const fakeId = crypto.randomUUID();
      const response = await request(app)
        .get(`/api/security-monitoring/incidents/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Incident not found');
    });
  });

  describe('PUT /api/security-monitoring/incidents/:id/resolve', () => {
    it('should resolve incident for admin', async () => {
      const response = await request(app)
        .put(`/api/security-monitoring/incidents/${testIncidentId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolutionNotes: 'Test resolution'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Incident resolved successfully');
      expect(response.body).toHaveProperty('incident');
      expect(response.body.incident.status).toBe('RESOLVED');
    });

    it('should handle non-existent incident', async () => {
      const fakeId = crypto.randomUUID();
      const response = await request(app)
        .put(`/api/security-monitoring/incidents/${fakeId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolutionNotes: 'Test resolution'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Incident not found');
    });
  });

  describe('GET /api/security-monitoring/alerts', () => {
    beforeEach(async () => {
      // Create test alert
      const alertResult = await db.query(`
        INSERT INTO security_alerts (
          incident_id, alert_type, severity, channel, recipient, message, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        testIncidentId,
        'TEST_ALERT',
        'HIGH',
        'email',
        'test@example.com',
        'Test alert message',
        JSON.stringify({ test: 'alert' })
      ]);
      testAlertId = alertResult.rows[0].id;
    });

    it('should return security alerts for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/alerts?limit=10&hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('alerts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should filter alerts by channel', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/alerts?channel=email')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.alerts.every(a => a.channel === 'email')).toBe(true);
    });

    it('should filter alerts by status', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/alerts?status=SENT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.alerts.every(a => a.status === 'SENT')).toBe(true);
    });
  });

  describe('POST /api/security-monitoring/alerts/retry', () => {
    beforeEach(async () => {
      // Create failed alert
      await db.query(`
        INSERT INTO security_alerts (
          incident_id, alert_type, severity, channel, recipient, message, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        testIncidentId,
        'TEST_ALERT',
        'HIGH',
        'email',
        'test@example.com',
        'Test failed alert',
        'FAILED'
      ]);
    });

    it('should retry failed alerts for admin', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/alerts/retry')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          alertIds: [testAlertId]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Alerts queued for retry');
      expect(response.body).toHaveProperty('retriedCount');
      expect(response.body).toHaveProperty('alerts');
    });

    it('should validate alert IDs', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/alerts/retry')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          alertIds: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid alert IDs');
    });
  });

  describe('GET /api/security-monitoring/realtime', () => {
    it('should return real-time monitoring data for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/realtime')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });

    it('should filter metrics by specific keys', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/realtime?metrics=system_health,active_incidents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metrics.every(m => 
        m.metric_key === 'system_health' || m.metric_key === 'active_incidents'
      )).toBe(true);
    });
  });

  describe('POST /api/security-monitoring/realtime', () => {
    it('should update real-time monitoring data for admin', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/realtime')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metricKey: 'test_metric',
          metricValue: { value: 100, unit: 'count' },
          ttl: 3600
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Real-time monitoring data updated successfully');
      expect(response.body).toHaveProperty('metricKey', 'test_metric');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/realtime')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metricKey: 'test_metric'
          // Missing metricValue
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('GET /api/security-monitoring/dashboard', () => {
    it('should return dashboard configuration for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('widgets');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('generated');
      expect(Array.isArray(response.body.widgets)).toBe(true);
    });
  });

  describe('POST /api/security-monitoring/dashboard/widgets', () => {
    it('should create dashboard widget for admin', async () => {
      const widgetData = {
        widgetName: 'Test Widget',
        widgetType: 'chart',
        widgetConfig: { type: 'line', metric: 'test_metric' },
        positionX: 0,
        positionY: 0,
        width: 300,
        height: 200,
        refreshInterval: 30
      };

      const response = await request(app)
        .post('/api/security-monitoring/dashboard/widgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(widgetData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Dashboard widget created successfully');
      expect(response.body).toHaveProperty('widget');
      expect(response.body.widget.widget_name).toBe(widgetData.widgetName);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/dashboard/widgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          widgetName: 'Test Widget'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('PUT /api/security-monitoring/dashboard/widgets/:id', () => {
    let widgetId;

    beforeEach(async () => {
      // Create test widget
      const widgetResult = await db.query(`
        INSERT INTO dashboard_widgets (
          widget_name, widget_type, widget_config, created_by
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        'Test Update Widget',
        'chart',
        JSON.stringify({ type: 'line' }),
        testUserId
      ]);
      widgetId = widgetResult.rows[0].id;
    });

    it('should update dashboard widget for admin', async () => {
      const updateData = {
        widgetConfig: { type: 'bar', metric: 'updated_metric' },
        positionX: 100,
        positionY: 100,
        width: 400,
        height: 300,
        refreshInterval: 60,
        isActive: true
      };

      const response = await request(app)
        .put(`/api/security-monitoring/dashboard/widgets/${widgetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Dashboard widget updated successfully');
      expect(response.body).toHaveProperty('widget');
      expect(response.body.widget.width).toBe(updateData.width);
    });

    it('should handle non-existent widget', async () => {
      const fakeId = crypto.randomUUID();
      const response = await request(app)
        .put(`/api/security-monitoring/dashboard/widgets/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          widgetConfig: { test: 'config' },
          isActive: true
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Widget not found');
    });
  });

  describe('GET /api/security-monitoring/alert-rules', () => {
    it('should return alert rules for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/alert-rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rules');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('activeRules');
      expect(Array.isArray(response.body.rules)).toBe(true);
    });
  });

  describe('POST /api/security-monitoring/alert-rules', () => {
    it('should create alert rule for admin', async () => {
      const ruleData = {
        ruleName: 'Test Alert Rule',
        ruleType: 'INCIDENT',
        conditions: { severity: 'HIGH' },
        actions: ['NOTIFY_ADMIN'],
        channels: ['email', 'slack'],
        priority: 1
      };

      const response = await request(app)
        .post('/api/security-monitoring/alert-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ruleData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Alert rule created successfully');
      expect(response.body).toHaveProperty('rule');
      expect(response.body.rule.rule_name).toBe(ruleData.ruleName);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/alert-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ruleName: 'Test Rule'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('PUT /api/security-monitoring/alert-rules/:id', () => {
    let ruleId;

    beforeEach(async () => {
      // Create test rule
      const ruleResult = await db.query(`
        INSERT INTO alert_rules (
          rule_name, rule_type, conditions, actions, channels, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        'Test Update Rule',
        'INCIDENT',
        JSON.stringify({ severity: 'MEDIUM' }),
        JSON.stringify(['NOTIFY_ADMIN']),
        JSON.stringify(['email']),
        testUserId
      ]);
      ruleId = ruleResult.rows[0].id;
    });

    it('should update alert rule for admin', async () => {
      const updateData = {
        conditions: { severity: 'HIGH' },
        actions: ['NOTIFY_ADMIN', 'BLOCK_IP'],
        channels: ['email', 'slack'],
        priority: 1,
        isActive: true
      };

      const response = await request(app)
        .put(`/api/security-monitoring/alert-rules/${ruleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Alert rule updated successfully');
      expect(response.body).toHaveProperty('rule');
      expect(response.body.rule.priority).toBe(updateData.priority);
    });

    it('should handle non-existent rule', async () => {
      const fakeId = crypto.randomUUID();
      const response = await request(app)
        .put(`/api/security-monitoring/alert-rules/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          conditions: { test: 'condition' },
          actions: ['NOTIFY_ADMIN'],
          channels: ['email'],
          isActive: true
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Rule not found');
    });
  });

  describe('GET /api/security-monitoring/notifications', () => {
    beforeEach(async () => {
      // Create test notification
      await db.query(`
        INSERT INTO security_notifications (
          user_id, notification_type, title, message, priority
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        testUserId,
        'TEST_NOTIFICATION',
        'Test Notification',
        'This is a test notification',
        'NORMAL'
      ]);
    });

    it('should return notifications for authenticated user', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('unreadCount');
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/notifications?unread=true')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.notifications.every(n => !n.is_read)).toBe(true);
    });

    it('should limit results correctly', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/notifications?limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.notifications.length).toBeLessThanOrEqual(5);
    });
  });

  describe('PUT /api/security-monitoring/notifications/:id/read', () => {
    let notificationId;

    beforeEach(async () => {
      // Create test notification
      const notificationResult = await db.query(`
        INSERT INTO security_notifications (
          user_id, notification_type, title, message
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        testUserId,
        'TEST_NOTIFICATION',
        'Test Notification',
        'This is a test notification'
      ]);
      notificationId = notificationResult.rows[0].id;
    });

    it('should mark notification as read for user', async () => {
      const response = await request(app)
        .put(`/api/security-monitoring/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Notification marked as read');
      expect(response.body).toHaveProperty('notification');
      expect(response.body.notification.is_read).toBe(true);
    });

    it('should handle non-existent notification', async () => {
      const fakeId = crypto.randomUUID();
      const response = await request(app)
        .put(`/api/security-monitoring/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Notification not found');
    });
  });

  describe('GET /api/security-monitoring/audit-log', () => {
    it('should return security audit log for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/audit-log?limit=50&hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('auditLog');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
      expect(Array.isArray(response.body.auditLog)).toBe(true);
    });

    it('should filter by action', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/audit-log?action=LOGIN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.auditLog.every(log => log.action === 'LOGIN')).toBe(true);
    });

    it('should filter by user ID', async () => {
      const response = await request(app)
        .get(`/api/security-monitoring/audit-log?userId=${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.auditLog.every(log => log.user_id === testUserId)).toBe(true);
    });
  });

  describe('GET /api/security-monitoring/performance', () => {
    it('should return security performance metrics for admin', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/performance?hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
      expect(Array.isArray(response.body.performance)).toBe(true);
    });

    it('should filter by component', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/performance?component=threat_detection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.performance.every(p => p.component === 'threat_detection')).toBe(true);
    });
  });

  describe('POST /api/security-monitoring/performance', () => {
    it('should add security performance metric for admin', async () => {
      const metricData = {
        metricName: 'test_performance',
        metricValue: 95.5,
        metricUnit: 'percentage',
        component: 'test_component',
        tags: { test: 'tag' }
      };

      const response = await request(app)
        .post('/api/security-monitoring/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(metricData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Performance metric added successfully');
      expect(response.body).toHaveProperty('metric');
      expect(response.body.metric.metric_name).toBe(metricData.metricName);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metricName: 'test_metric'
          // Missing metricValue
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('POST /api/security-monitoring/test-alert', () => {
    it('should send test alert for admin', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/test-alert')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'email',
          message: 'This is a test alert'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Test alert sent successfully');
      expect(response.body).toHaveProperty('alert');
      expect(response.body).toHaveProperty('incidentId');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/test-alert')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'email'
          // Missing message
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('POST /api/security-monitoring/cleanup', () => {
    it('should cleanup old monitoring data for admin', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/cleanup')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Data cleanup completed successfully');
      expect(response.body).toHaveProperty('deletedRecords');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on statistics endpoint', async () => {
      const requests = Array(11).fill().map(() =>
        request(app)
          .get('/api/security-monitoring/statistics')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        '/api/security-monitoring/status',
        '/api/security-monitoring/statistics',
        '/api/security-monitoring/incidents',
        '/api/security-monitoring/alerts',
        '/api/security-monitoring/realtime',
        '/api/security-monitoring/dashboard',
        '/api/security-monitoring/alert-rules',
        '/api/security-monitoring/notifications',
        '/api/security-monitoring/audit-log',
        '/api/security-monitoring/performance'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(401);
      }
    });

    it('should require admin role for most endpoints', async () => {
      const adminEndpoints = [
        '/api/security-monitoring/status',
        '/api/security-monitoring/statistics',
        '/api/security-monitoring/incidents',
        '/api/security-monitoring/alerts',
        '/api/security-monitoring/realtime',
        '/api/security-monitoring/dashboard',
        '/api/security-monitoring/alert-rules',
        '/api/security-monitoring/audit-log',
        '/api/security-monitoring/performance'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(403);
      }
    });

    it('should allow users to access their own notifications', async () => {
      const response = await request(app)
        .get('/api/security-monitoring/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simulate database error by using invalid connection
      const originalQuery = db.query;
      db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/security-monitoring/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // Restore original query function
      db.query = originalQuery;
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/realtime')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Data Validation', () => {
    it('should validate metric value range', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          metricName: 'test_metric',
          metricValue: -1, // Invalid negative value
          metricUnit: 'percentage'
        });

      expect(response.status).toBe(400);
    });

    it('should validate alert channel', async () => {
      const response = await request(app)
        .post('/api/security-monitoring/test-alert')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channel: 'invalid_channel',
          message: 'Test message'
        });

      expect(response.status).toBe(400);
    });
  });
}); 