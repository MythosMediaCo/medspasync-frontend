const request = require('supertest');
const app = require('../app');

describe('Real-Time Analytics API', () => {
  let authToken;

  beforeAll(async () => {
    // Mock authentication token for testing
    authToken = 'mock-jwt-token-for-testing';
  });

  describe('GET /api/analytics/dashboard', () => {
    test('should return real-time analytics data with <200ms response time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: '30d',
          metrics: 'revenue,appointments,clients'
        });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // <200ms target
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('generated_at');
      expect(response.body.metadata).toHaveProperty('cache_status');
    });

    test('should include HIPAA-compliant audit logging', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: '30d'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('audit_log');
      expect(response.body.audit_log).toHaveProperty('user_id');
      expect(response.body.audit_log).toHaveProperty('access_timestamp');
      expect(response.body.audit_log).toHaveProperty('data_accessed');
      expect(response.body.audit_log).toHaveProperty('purpose');
    });

    test('should require valid authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          spa_id: 'spa_001',
          date_range: '30d'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate required query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('spa_id');
    });

    test('should return comprehensive analytics data structure', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: '30d',
          metrics: 'revenue,appointments,clients,services'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('appointments');
      expect(response.body.data).toHaveProperty('clients');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data.revenue).toHaveProperty('current_period');
      expect(response.body.data.revenue).toHaveProperty('previous_period');
      expect(response.body.data.revenue).toHaveProperty('growth_percentage');
    });

    test('should handle caching and return cache status', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: '30d'
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata).toHaveProperty('cache_status');
      expect(['hit', 'miss', 'stale']).toContain(response.body.metadata.cache_status);
      expect(response.body.metadata).toHaveProperty('cache_ttl');
    });
  });

  describe('GET /api/analytics/performance', () => {
    test('should return performance metrics with optimization status', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('performance_metrics');
      expect(response.body.performance_metrics).toHaveProperty('query_time_avg');
      expect(response.body.performance_metrics).toHaveProperty('optimization_status');
      expect(response.body.performance_metrics.query_time_avg).toBeLessThan(50);
    });
  });
}); 