const request = require('supertest');
const app = require('../app');

// Mock authentication token (replace with real token in integration)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'Bearer test-token';

describe('Real-Time Dashboard API', () => {
  it('should return dashboard data for a spa in under 200ms', async () => {
    const spaId = 'test-spa-001';
    const start = Date.now();
    const res = await request(app)
      .get(`/api/analytics/dashboard?spa_id=${spaId}`)
      .set('Authorization', AUTH_TOKEN)
      .expect(200);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('revenue');
    expect(res.body.data).toHaveProperty('appointments');
    expect(res.body.data).toHaveProperty('providers');
    expect(res.body.data).toHaveProperty('alerts');
  });

  it('should require authentication', async () => {
    const spaId = 'test-spa-001';
    const res = await request(app)
      .get(`/api/analytics/dashboard?spa_id=${spaId}`)
      .expect(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should enforce role-based access', async () => {
    // Simulate a user with insufficient role
    const spaId = 'test-spa-001';
    const res = await request(app)
      .get(`/api/analytics/dashboard?spa_id=${spaId}`)
      .set('Authorization', 'Bearer insufficient-role-token')
      .expect(403);
    expect(res.body).toHaveProperty('message');
  });
}); 