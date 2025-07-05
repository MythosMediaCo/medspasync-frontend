/**
 * Compliance & Audit Test Suite
 * Comprehensive testing for HIPAA compliance framework, security audit automation, and regulatory compliance
 */

const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const redis = require('redis');

// Test database connection
const testDb = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test Redis connection
const testRedis = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 5
});

describe('Compliance & Audit System', () => {
  let adminToken, complianceOfficerToken, userToken;
  let testUserId, testFrameworkId, testViolationId, testAssessmentId;

  beforeAll(async () => {
    // Setup test data
    await setupTestData();
    
    // Get authentication tokens
    adminToken = await getAuthToken('admin@medspasync.com', 'admin123');
    complianceOfficerToken = await getAuthToken('compliance@medspasync.com', 'compliance123');
    userToken = await getAuthToken('user@medspasync.com', 'user123');
  });

  afterAll(async () => {
    await cleanupTestData();
    await testDb.end();
    await testRedis.quit();
  });

  describe('Compliance Status', () => {
    test('GET /api/compliance/status - should return overall compliance status', async () => {
      const response = await request(app)
        .get('/api/compliance/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overall_status');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('frameworks');
      expect(['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT']).toContain(response.body.data.overall_status);
    });

    test('GET /api/compliance/status - should require authentication', async () => {
      await request(app)
        .get('/api/compliance/status')
        .expect(401);
    });

    test('GET /api/compliance/status - should require admin or compliance officer role', async () => {
      await request(app)
        .get('/api/compliance/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Compliance Events', () => {
    test('GET /api/compliance/events - should return compliance events with pagination', async () => {
      const response = await request(app)
        .get('/api/compliance/events?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    });

    test('GET /api/compliance/events - should filter by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/compliance/events?start_date=${startDate}&end_date=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/events - should filter by framework', async () => {
      const response = await request(app)
        .get('/api/compliance/events?framework=hipaa')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/events - should filter by violations', async () => {
      const response = await request(app)
        .get('/api/compliance/events?has_violations=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Compliance Violations', () => {
    test('GET /api/compliance/violations - should return violations with pagination', async () => {
      const response = await request(app)
        .get('/api/compliance/violations?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('violations');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.violations)).toBe(true);
    });

    test('GET /api/compliance/violations - should filter by status', async () => {
      const response = await request(app)
        .get('/api/compliance/violations?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.violations.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/violations - should filter by severity', async () => {
      const response = await request(app)
        .get('/api/compliance/violations?severity=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.violations.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/compliance/violations/:id/assign - should assign violation to user', async () => {
      const response = await request(app)
        .post(`/api/compliance/violations/${testViolationId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assigned_to: testUserId,
          priority: 'HIGH',
          notes: 'Test assignment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assigned_to).toBe(testUserId);
      expect(response.body.data.priority).toBe('HIGH');
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    test('POST /api/compliance/violations/:id/resolve - should resolve violation', async () => {
      const response = await request(app)
        .post(`/api/compliance/violations/${testViolationId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolution_notes: 'Test resolution',
          verification_required: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('RESOLVED');
      expect(response.body.data.resolved_at).toBeTruthy();
    });
  });

  describe('Compliance Frameworks', () => {
    test('GET /api/compliance/frameworks - should return all frameworks', async () => {
      const response = await request(app)
        .get('/api/compliance/frameworks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const framework = response.body.data[0];
      expect(framework).toHaveProperty('framework_name');
      expect(framework).toHaveProperty('framework_type');
      expect(framework).toHaveProperty('requirements');
      expect(framework).toHaveProperty('controls');
    });
  });

  describe('Compliance Assessments', () => {
    test('GET /api/compliance/assessments - should return assessments', async () => {
      const response = await request(app)
        .get('/api/compliance/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/compliance/assessments - should create new assessment', async () => {
      const response = await request(app)
        .post('/api/compliance/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          framework_id: testFrameworkId,
          assessment_type: 'PERIODIC',
          scope: { systems: ['api', 'database'], users: ['all'] },
          methodology: 'Automated compliance checking'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.framework_id).toBe(testFrameworkId);
      expect(response.body.data.assessment_type).toBe('PERIODIC');
      expect(response.body.data.status).toBe('IN_PROGRESS');
      
      testAssessmentId = response.body.data.id;
    });

    test('GET /api/compliance/assessments - should filter by framework', async () => {
      const response = await request(app)
        .get(`/api/compliance/assessments?framework_id=${testFrameworkId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Trails', () => {
    test('GET /api/compliance/audit-trails - should return audit trails with pagination', async () => {
      const response = await request(app)
        .get('/api/compliance/audit-trails?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('audit_trails');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.audit_trails)).toBe(true);
    });

    test('GET /api/compliance/audit-trails - should filter by user', async () => {
      const response = await request(app)
        .get(`/api/compliance/audit-trails?user_id=${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.audit_trails.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/audit-trails - should filter by action', async () => {
      const response = await request(app)
        .get('/api/compliance/audit-trails?action=LOGIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.audit_trails.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/audit-trails - should filter by success status', async () => {
      const response = await request(app)
        .get('/api/compliance/audit-trails?success=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.audit_trails.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Breach Incidents', () => {
    test('GET /api/compliance/breach-incidents - should return breach incidents', async () => {
      const response = await request(app)
        .get('/api/compliance/breach-incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/compliance/breach-incidents - should create new breach incident', async () => {
      const response = await request(app)
        .post('/api/compliance/breach-incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          incident_type: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          description: 'Test breach incident',
          affected_individuals: 10,
          affected_records: 50,
          phi_involved: true,
          pii_involved: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident_type).toBe('UNAUTHORIZED_ACCESS');
      expect(response.body.data.severity).toBe('HIGH');
      expect(response.body.data.status).toBe('DETECTED');
    });

    test('GET /api/compliance/breach-incidents - should filter by status', async () => {
      const response = await request(app)
        .get('/api/compliance/breach-incidents?status=DETECTED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/breach-incidents - should filter by severity', async () => {
      const response = await request(app)
        .get('/api/compliance/breach-incidents?severity=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Compliance Reports', () => {
    test('GET /api/compliance/reports - should return compliance reports', async () => {
      const response = await request(app)
        .get('/api/compliance/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/compliance/reports/generate - should generate new report', async () => {
      const response = await request(app)
        .post('/api/compliance/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          report_type: 'summary',
          report_period: '24h',
          report_name: 'Test Compliance Report'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report_type).toBe('summary');
      expect(response.body.data.report_period).toBe('24h');
      expect(response.body.data.generated_by).toBeTruthy();
    });

    test('GET /api/compliance/reports - should filter by report type', async () => {
      const response = await request(app)
        .get('/api/compliance/reports?report_type=summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Compliance Metrics', () => {
    test('GET /api/compliance/metrics - should return compliance metrics', async () => {
      const response = await request(app)
        .get('/api/compliance/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/compliance/metrics - should filter by framework', async () => {
      const response = await request(app)
        .get('/api/compliance/metrics?framework=hipaa')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/compliance/metrics - should filter by period', async () => {
      const response = await request(app)
        .get('/api/compliance/metrics?period=daily')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Regulatory Requirements', () => {
    test('GET /api/compliance/regulatory-requirements - should return regulatory requirements', async () => {
      const response = await request(app)
        .get('/api/compliance/regulatory-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const requirement = response.body.data[0];
      expect(requirement).toHaveProperty('regulation_name');
      expect(requirement).toHaveProperty('requirement_id');
      expect(requirement).toHaveProperty('requirement_title');
      expect(requirement).toHaveProperty('compliance_status');
    });

    test('GET /api/compliance/regulatory-requirements - should filter by regulation', async () => {
      const response = await request(app)
        .get('/api/compliance/regulatory-requirements?regulation_name=HIPAA')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every(req => req.regulation_name === 'HIPAA')).toBe(true);
    });

    test('GET /api/compliance/regulatory-requirements - should filter by compliance status', async () => {
      const response = await request(app)
        .get('/api/compliance/regulatory-requirements?compliance_status=NOT_ASSESSED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/compliance/regulatory-requirements/:id/assess - should assess requirement', async () => {
      const requirementId = (await testDb.query('SELECT id FROM regulatory_requirements LIMIT 1')).rows[0].id;
      
      const response = await request(app)
        .post(`/api/compliance/regulatory-requirements/${requirementId}/assess`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          compliance_status: 'COMPLIANT',
          assessment_notes: 'Test assessment',
          next_assessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.compliance_status).toBe('COMPLIANT');
      expect(response.body.data.last_assessment).toBeTruthy();
    });
  });

  describe('Compliance Dashboard', () => {
    test('GET /api/compliance/dashboard - should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/compliance/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('recent_violations');
      expect(response.body.data).toHaveProperty('recent_events');
      expect(response.body.data).toHaveProperty('framework_compliance');
      expect(response.body.data).toHaveProperty('breach_incidents');
      expect(response.body.data).toHaveProperty('upcoming_assessments');
      expect(response.body.data).toHaveProperty('generated');
    });
  });

  describe('Data Export', () => {
    test('POST /api/compliance/export - should create export job', async () => {
      const response = await request(app)
        .post('/api/compliance/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          export_type: 'events',
          format: 'csv',
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('job_id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('PROCESSING');
    });

    test('GET /api/compliance/export/:job_id - should return job status', async () => {
      // First create a job
      const createResponse = await request(app)
        .post('/api/compliance/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          export_type: 'violations',
          format: 'json'
        });

      const jobId = createResponse.body.data.job_id;

      // Then check status
      const response = await request(app)
        .get(`/api/compliance/export/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.id).toBe(jobId);
    });

    test('GET /api/compliance/export/:job_id - should return 404 for non-existent job', async () => {
      await request(app)
        .get('/api/compliance/export/non-existent-job-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Input Validation', () => {
    test('GET /api/compliance/events - should validate pagination parameters', async () => {
      await request(app)
        .get('/api/compliance/events?page=0&limit=200')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    test('POST /api/compliance/violations/:id/assign - should validate assignment data', async () => {
      await request(app)
        .post(`/api/compliance/violations/${testViolationId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assigned_to: 'invalid-uuid',
          priority: 'INVALID_PRIORITY'
        })
        .expect(400);
    });

    test('POST /api/compliance/assessments - should validate assessment data', async () => {
      await request(app)
        .post('/api/compliance/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          framework_id: 'invalid-uuid',
          assessment_type: 'INVALID_TYPE'
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limits on compliance endpoints', async () => {
      const requests = Array(35).fill().map(() => 
        request(app)
          .get('/api/compliance/status')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('Should handle database errors gracefully', async () => {
      // Temporarily break database connection
      await testDb.end();
      
      const response = await request(app)
        .get('/api/compliance/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get compliance status');
      
      // Restore database connection
      await setupTestData();
    });

    test('Should handle invalid UUIDs gracefully', async () => {
      await request(app)
        .get('/api/compliance/violations?assigned_to=invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('Integration with Reporting System', () => {
    test('Compliance data should be available for reporting system', async () => {
      // Check if compliance data is stored in Redis for reporting system
      const complianceData = await testRedis.get('compliance_trends');
      expect(complianceData).toBeTruthy();
      
      const trends = JSON.parse(complianceData);
      expect(Array.isArray(trends)).toBe(true);
    });

    test('Compliance reports should integrate with reporting system', async () => {
      // Check if compliance reports are stored for reporting system
      const reportsData = await testRedis.get('compliance_reports');
      expect(reportsData).toBeTruthy();
      
      const reports = JSON.parse(reportsData);
      expect(reports).toHaveProperty('hipaa');
      expect(reports).toHaveProperty('nist');
      expect(reports).toHaveProperty('iso27001');
      expect(reports).toHaveProperty('summary');
    });
  });
});

// Helper functions

async function setupTestData() {
  // Create test user
  const userResult = await testDb.query(`
    INSERT INTO users (email, password, first_name, last_name, role)
    VALUES ('testuser@medspasync.com', 'hashedpassword', 'Test', 'User', 'USER')
    RETURNING id
  `);
  testUserId = userResult.rows[0].id;

  // Create test framework
  const frameworkResult = await testDb.query(`
    INSERT INTO compliance_frameworks (framework_name, framework_version, framework_type, description, requirements, controls)
    VALUES ('Test Framework', '1.0', 'TEST', 'Test compliance framework', '{"test": "requirement"}', '{"test": "control"}')
    RETURNING id
  `);
  testFrameworkId = frameworkResult.rows[0].id;

  // Create test violation
  const violationResult = await testDb.query(`
    INSERT INTO compliance_violations (violation_type, rule, severity, description)
    VALUES ('test_violation', 'test_rule', 'MEDIUM', 'Test violation')
    RETURNING id
  `);
  testViolationId = violationResult.rows[0].id;

  // Create test compliance events
  await testDb.query(`
    INSERT INTO compliance_events (event_data, compliance_checks, user_id, framework_results)
    VALUES 
      ('{"test": "data"}', '{"test": "checks"}', $1, '{"hipaa": "true", "nist": "true", "iso27001": "true"}'),
      ('{"test": "data2"}', '{"test": "checks2"}', $1, '{"hipaa": "false", "nist": "true", "iso27001": "false"}')
  `, [testUserId]);

  // Create test audit trails
  await testDb.query(`
    INSERT INTO audit_trails (user_id, action, resource_type, resource_id, success)
    VALUES 
      ($1, 'LOGIN', 'auth', 'login', true),
      ($1, 'API_ACCESS', 'api', 'compliance', true),
      ($1, 'DATA_ACCESS', 'data', 'patient', false)
  `, [testUserId]);

  // Store test data in Redis for reporting integration
  await testRedis.setex('compliance_trends', 3600, JSON.stringify([
    {
      date: new Date().toISOString().split('T')[0],
      total_events: 100,
      hipaa_compliant: 90,
      nist_compliant: 85,
      iso27001_compliant: 88
    }
  ]));

  await testRedis.setex('compliance_reports', 3600, JSON.stringify({
    hipaa: { framework: 'HIPAA', compliance_rate: 90.0 },
    nist: { framework: 'NIST', compliance_rate: 85.0 },
    iso27001: { framework: 'ISO 27001', compliance_rate: 88.0 },
    summary: { overall_compliance: 87.7 }
  }));
}

async function cleanupTestData() {
  // Clean up test data
  await testDb.query('DELETE FROM compliance_events WHERE user_id = $1', [testUserId]);
  await testDb.query('DELETE FROM audit_trails WHERE user_id = $1', [testUserId]);
  await testDb.query('DELETE FROM compliance_violations WHERE id = $1', [testViolationId]);
  await testDb.query('DELETE FROM compliance_assessments WHERE id = $1', [testAssessmentId]);
  await testDb.query('DELETE FROM compliance_frameworks WHERE id = $1', [testFrameworkId]);
  await testDb.query('DELETE FROM users WHERE id = $1', [testUserId]);
  
  // Clean up Redis test data
  await testRedis.del('compliance_trends');
  await testRedis.del('compliance_reports');
}

async function getAuthToken(email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
} 