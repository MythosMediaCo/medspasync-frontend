/**
 * Advanced Threat Detection Tests
 * Comprehensive test suite for ML-based security features
 */

const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const crypto = require('crypto');

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/medspasync_test',
  ssl: false
});

describe('Advanced Threat Detection', () => {
  let adminToken;
  let userToken;
  let testUserId;
  let testThreatId;

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
      await db.query('DELETE FROM threat_detection_logs WHERE user_id = $1', [testUserId]);
      await db.query('DELETE FROM behavioral_profiles WHERE user_id = $1', [testUserId]);
      await db.query('DELETE FROM users WHERE email IN ($1, $2)', ['testuser@example.com', 'admin@example.com']);
      await db.end();
    } catch (error) {
      console.error('❌ Test cleanup error:', error);
    }
  });

  describe('GET /api/threat-detection/status', () => {
    it('should return threat detection system status for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('system', 'Advanced Threat Detection');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('components');
      expect(response.body.components).toHaveProperty('behavioralAnalysis');
      expect(response.body.components).toHaveProperty('anomalyDetection');
      expect(response.body.components).toHaveProperty('machineLearning');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/threat-detection/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/threat-detection/status');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/threat-detection/statistics', () => {
    it('should return comprehensive threat statistics for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/statistics?hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('threatDetection');
      expect(response.body).toHaveProperty('behavioralAnalysis');
      expect(response.body).toHaveProperty('networkTraffic');
      expect(response.body).toHaveProperty('geographicAnalysis');
      expect(response.body).toHaveProperty('period', '24 hours');
    });

    it('should handle different time periods', async () => {
      const response = await request(app)
        .get('/api/threat-detection/statistics?hours=48')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.period).toBe('48 hours');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/threat-detection/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/threat-detection/threats', () => {
    beforeEach(async () => {
      // Create test threat log
      const threatResult = await db.query(`
        INSERT INTO threat_detection_logs (
          event_data, ip_address, user_agent, user_id, threat_score, severity
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        JSON.stringify({ test: 'data' }),
        '192.168.1.1',
        'Test User Agent',
        testUserId,
        0.75,
        'HIGH'
      ]);
      testThreatId = threatResult.rows[0].id;
    });

    it('should return recent threats for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/threats?limit=10&hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('threats');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
      expect(Array.isArray(response.body.threats)).toBe(true);
    });

    it('should filter threats by severity', async () => {
      const response = await request(app)
        .get('/api/threat-detection/threats?severity=HIGH')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.threats.every(t => t.severity === 'HIGH')).toBe(true);
    });

    it('should limit results correctly', async () => {
      const response = await request(app)
        .get('/api/threat-detection/threats?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.threats.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/threat-detection/behavioral-profiles', () => {
    beforeEach(async () => {
      // Create test behavioral profile
      await db.query(`
        INSERT INTO behavioral_profiles (
          user_id, profile_data, anomaly_count
        ) VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET
          profile_data = $2,
          anomaly_count = $3,
          updated_at = NOW()
      `, [
        testUserId,
        JSON.stringify({ test: 'profile' }),
        2
      ]);
    });

    it('should return behavioral profiles for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/behavioral-profiles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profiles');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.profiles)).toBe(true);
    });

    it('should filter anomalous profiles', async () => {
      const response = await request(app)
        .get('/api/threat-detection/behavioral-profiles?anomalous=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profiles.every(p => p.anomaly_count > 0)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/threat-detection/behavioral-profiles?limit=5&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
      expect(response.body.offset).toBe(0);
    });
  });

  describe('GET /api/threat-detection/network-traffic', () => {
    beforeEach(async () => {
      // Create test network traffic data
      await db.query(`
        INSERT INTO network_traffic (
          ip_address, user_id, request_method, request_path, 
          response_status, response_time, is_anomalous, anomaly_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        '192.168.1.1',
        testUserId,
        'GET',
        '/api/test',
        200,
        150,
        true,
        0.8
      ]);
    });

    it('should return network traffic data for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/network-traffic?hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('traffic');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
    });

    it('should filter anomalous traffic', async () => {
      const response = await request(app)
        .get('/api/threat-detection/network-traffic?anomalous=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.traffic.every(t => t.is_anomalous === true)).toBe(true);
    });
  });

  describe('GET /api/threat-detection/geographic-anomalies', () => {
    beforeEach(async () => {
      // Create test geographic anomaly
      await db.query(`
        INSERT INTO geographic_anomalies (
          user_id, ip_address, country, region, city,
          latitude, longitude, distance_km, is_anomalous
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        testUserId,
        '192.168.1.1',
        'US',
        'CA',
        'San Francisco',
        37.7749,
        -122.4194,
        1500,
        true
      ]);
    });

    it('should return geographic anomalies for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/geographic-anomalies?hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('anomalies');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', '24 hours');
    });
  });

  describe('GET /api/threat-detection/predictive-threats', () => {
    beforeEach(async () => {
      // Create test predictive threat
      await db.query(`
        INSERT INTO predictive_threats (
          user_id, ip_address, threat_type, probability, confidence_level
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        testUserId,
        '192.168.1.1',
        'SQL_INJECTION',
        0.85,
        0.9
      ]);
    });

    it('should return predictive threats for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/predictive-threats?probability=0.5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('predictions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('minProbability', 0.5);
    });
  });

  describe('GET /api/threat-detection/ml-models', () => {
    beforeEach(async () => {
      // Create test ML model
      await db.query(`
        INSERT INTO ml_models (
          model_name, model_type, model_version, model_data, accuracy_score
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (model_name, model_version) DO NOTHING
      `, [
        'test_model',
        'BEHAVIORAL',
        '1.0.0',
        JSON.stringify({ test: 'model' }),
        0.85
      ]);
    });

    it('should return ML models status for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/ml-models')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('activeModels');
    });
  });

  describe('POST /api/threat-detection/ml-models/train', () => {
    it('should start ML model training for admin', async () => {
      const response = await request(app)
        .post('/api/threat-detection/ml-models/train')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          modelType: 'BEHAVIORAL',
          trainingData: [{ test: 'data' }]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'ML model training started');
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('status', 'training');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/threat-detection/ml-models/train')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          modelType: 'BEHAVIORAL'
          // Missing trainingData
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/threat-detection/anomaly-rules', () => {
    it('should return anomaly detection rules for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/anomaly-rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rules');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('activeRules');
    });
  });

  describe('POST /api/threat-detection/anomaly-rules', () => {
    it('should create new anomaly rule for admin', async () => {
      const newRule = {
        ruleName: 'Test Rule',
        ruleType: 'FREQUENCY',
        ruleConfig: { window_minutes: 60, max_requests: 100 },
        thresholdValue: 100,
        severity: 'MEDIUM'
      };

      const response = await request(app)
        .post('/api/threat-detection/anomaly-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRule);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Anomaly rule created successfully');
      expect(response.body).toHaveProperty('rule');
      expect(response.body.rule.rule_name).toBe(newRule.ruleName);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/threat-detection/anomaly-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ruleName: 'Test Rule'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('PUT /api/threat-detection/anomaly-rules/:id', () => {
    let ruleId;

    beforeEach(async () => {
      // Create test rule
      const result = await db.query(`
        INSERT INTO anomaly_rules (rule_name, rule_type, rule_config, threshold_value, severity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        'Test Update Rule',
        'FREQUENCY',
        JSON.stringify({ window_minutes: 60 }),
        100,
        'MEDIUM'
      ]);
      ruleId = result.rows[0].id;
    });

    it('should update anomaly rule for admin', async () => {
      const updateData = {
        ruleConfig: { window_minutes: 120, max_requests: 200 },
        thresholdValue: 200,
        severity: 'HIGH',
        isActive: true
      };

      const response = await request(app)
        .put(`/api/threat-detection/anomaly-rules/${ruleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Anomaly rule updated successfully');
      expect(response.body).toHaveProperty('rule');
      expect(response.body.rule.threshold_value).toBe(updateData.thresholdValue);
    });

    it('should handle non-existent rule', async () => {
      const fakeId = crypto.randomUUID();
      const response = await request(app)
        .put(`/api/threat-detection/anomaly-rules/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ruleConfig: { test: 'config' },
          thresholdValue: 100,
          severity: 'MEDIUM',
          isActive: true
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Rule not found');
    });
  });

  describe('GET /api/threat-detection/threat-intelligence', () => {
    beforeEach(async () => {
      // Create test threat intelligence
      await db.query(`
        INSERT INTO threat_intelligence (
          threat_type, threat_source, threat_data, confidence_score
        ) VALUES ($1, $2, $3, $4)
      `, [
        'MALWARE',
        'Test Source',
        JSON.stringify({ indicators: ['test'] }),
        0.9
      ]);
    });

    it('should return threat intelligence for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/threat-intelligence?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('intelligence');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('activeThreats');
    });

    it('should filter by threat type', async () => {
      const response = await request(app)
        .get('/api/threat-detection/threat-intelligence?threatType=MALWARE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.intelligence.every(t => t.threat_type === 'MALWARE')).toBe(true);
    });
  });

  describe('POST /api/threat-detection/threat-intelligence', () => {
    it('should add threat intelligence for admin', async () => {
      const threatData = {
        threatType: 'PHISHING',
        threatSource: 'Test Source',
        threatData: { indicators: ['test.com'] },
        confidenceScore: 0.85
      };

      const response = await request(app)
        .post('/api/threat-detection/threat-intelligence')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(threatData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Threat intelligence added successfully');
      expect(response.body).toHaveProperty('intelligence');
      expect(response.body.intelligence.threat_type).toBe(threatData.threatType);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/threat-detection/threat-intelligence')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          threatSource: 'Test Source'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('GET /api/threat-detection/security-metrics', () => {
    beforeEach(async () => {
      // Create test security metrics
      await db.query(`
        INSERT INTO security_metrics (metric_name, metric_value, metric_unit, period)
        VALUES ($1, $2, $3, $4)
      `, [
        'active_threats_per_hour',
        15.5,
        'count',
        'hourly'
      ]);
    });

    it('should return security metrics for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/security-metrics?period=hourly&hours=24')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('period', 'hourly');
      expect(response.body).toHaveProperty('timeRange', '24 hours');
    });
  });

  describe('POST /api/threat-detection/cleanup', () => {
    it('should cleanup old data for admin', async () => {
      const response = await request(app)
        .post('/api/threat-detection/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          daysToKeep: 30
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Data cleanup completed successfully');
      expect(response.body).toHaveProperty('deletedRecords');
      expect(response.body).toHaveProperty('daysKept', 30);
    });
  });

  describe('GET /api/threat-detection/reports', () => {
    it('should return summary report for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/reports?reportType=summary&days=7')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reportType', 'summary');
      expect(response.body).toHaveProperty('period', '7 days');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('threatSummary');
      expect(response.body.data).toHaveProperty('behavioralSummary');
      expect(response.body.data).toHaveProperty('networkSummary');
    });

    it('should return detailed report for admin', async () => {
      const response = await request(app)
        .get('/api/threat-detection/reports?reportType=detailed&days=7')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reportType', 'detailed');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('threats');
      expect(response.body.data).toHaveProperty('profiles');
      expect(response.body.data).toHaveProperty('traffic');
    });

    it('should handle invalid report type', async () => {
      const response = await request(app)
        .get('/api/threat-detection/reports?reportType=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid report type');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on statistics endpoint', async () => {
      const requests = Array(11).fill().map(() =>
        request(app)
          .get('/api/threat-detection/statistics')
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
        '/api/threat-detection/status',
        '/api/threat-detection/statistics',
        '/api/threat-detection/threats',
        '/api/threat-detection/behavioral-profiles',
        '/api/threat-detection/network-traffic',
        '/api/threat-detection/geographic-anomalies',
        '/api/threat-detection/predictive-threats',
        '/api/threat-detection/ml-models',
        '/api/threat-detection/anomaly-rules',
        '/api/threat-detection/threat-intelligence',
        '/api/threat-detection/security-metrics',
        '/api/threat-detection/reports'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(401);
      }
    });

    it('should require admin role for all endpoints', async () => {
      const endpoints = [
        '/api/threat-detection/status',
        '/api/threat-detection/statistics',
        '/api/threat-detection/threats',
        '/api/threat-detection/behavioral-profiles',
        '/api/threat-detection/network-traffic',
        '/api/threat-detection/geographic-anomalies',
        '/api/threat-detection/predictive-threats',
        '/api/threat-detection/ml-models',
        '/api/threat-detection/anomaly-rules',
        '/api/threat-detection/threat-intelligence',
        '/api/threat-detection/security-metrics',
        '/api/threat-detection/reports'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(403);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simulate database error by using invalid connection
      const originalQuery = db.query;
      db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/threat-detection/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // Restore original query function
      db.query = originalQuery;
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/threat-detection/anomaly-rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Data Validation', () => {
    it('should validate threat score range', async () => {
      const response = await request(app)
        .post('/api/threat-detection/threat-intelligence')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          threatType: 'TEST',
          threatData: { test: 'data' },
          confidenceScore: 1.5 // Invalid: should be 0-1
        });

      expect(response.status).toBe(400);
    });

    it('should validate probability range for predictive threats', async () => {
      const response = await request(app)
        .get('/api/threat-detection/predictive-threats?probability=1.5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
}); 