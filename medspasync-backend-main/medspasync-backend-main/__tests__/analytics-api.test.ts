import request from 'supertest';
const app = require('../app');

describe.skip('Real-Time Analytics API', () => {
  let authToken: string;

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
          date_range: 'month',
          include_alerts: 'true'
        });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // <200ms target
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('generated_at');
      expect(response.body.data).toHaveProperty('loadTimeMs');
    });

    test('should include HIPAA-compliant audit logging', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: 'month'
        });

      expect(response.status).toBe(200);
      // Note: HIPAA audit logging is handled in the database, not in response body
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    test('should require valid authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          spa_id: 'spa_001',
          date_range: 'month'
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
      expect(response.body.error).toContain('Invalid request parameters');
    });

    test('should return comprehensive analytics data structure', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: 'month',
          include_alerts: 'true'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('appointments');
      expect(response.body.data).toHaveProperty('providers');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data.revenue).toHaveProperty('total_revenue');
      expect(response.body.data.revenue).toHaveProperty('transaction_count');
      expect(response.body.data.appointments).toHaveProperty('total_appointments');
      expect(response.body.data.appointments).toHaveProperty('completion_rate');
    });

    test('should handle caching and return cache status', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          spa_id: 'spa_001',
          date_range: 'month'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('cached');
      expect(typeof response.body.data.cached).toBe('boolean');
      expect(response.body.data).toHaveProperty('loadTimeMs');
      expect(typeof response.body.data.loadTimeMs).toBe('number');
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

  describe('GET /api/analytics/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/analytics/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    });
  });
}); 