/**
 * Performance Optimization Test Suite
 * Comprehensive testing for database query optimization, caching, connection pooling, and monitoring
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
  db: process.env.REDIS_DB || 7
});

describe('Performance Optimization System', () => {
  let adminToken, userToken;
  let testUserId, testAlertId, testReportId;

  beforeAll(async () => {
    // Setup test data
    await setupTestData();
    
    // Get authentication tokens
    adminToken = await getAuthToken('admin@medspasync.com', 'admin123');
    userToken = await getAuthToken('user@medspasync.com', 'user123');
  });

  afterAll(async () => {
    await cleanupTestData();
    await testDb.end();
    await testRedis.quit();
  });

  describe('Performance Status', () => {
    test('GET /api/performance/status - should return overall performance status', async () => {
      const response = await request(app)
        .get('/api/performance/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overall_status');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('metrics');
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).toContain(response.body.data.overall_status);
    });

    test('GET /api/performance/status - should require authentication', async () => {
      await request(app)
        .get('/api/performance/status')
        .expect(401);
    });

    test('GET /api/performance/status - should require admin role', async () => {
      await request(app)
        .get('/api/performance/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Performance Logs', () => {
    test('GET /api/performance/logs - should return performance logs with pagination', async () => {
      const response = await request(app)
        .get('/api/performance/logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    test('GET /api/performance/logs - should filter by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/performance/logs?start_date=${startDate}&end_date=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/logs - should filter by status', async () => {
      const response = await request(app)
        .get('/api/performance/logs?status=EXECUTED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/logs - should filter by duration', async () => {
      const response = await request(app)
        .get('/api/performance/logs?min_duration=100&max_duration=5000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Alerts', () => {
    test('GET /api/performance/alerts - should return performance alerts', async () => {
      const response = await request(app)
        .get('/api/performance/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/performance/alerts - should filter by severity', async () => {
      const response = await request(app)
        .get('/api/performance/alerts?severity=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/alerts - should filter by acknowledged status', async () => {
      const response = await request(app)
        .get('/api/performance/alerts?acknowledged=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/performance/alerts/:id/acknowledge - should acknowledge alert', async () => {
      const response = await request(app)
        .post(`/api/performance/alerts/${testAlertId}/acknowledge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.acknowledged).toBe(true);
      expect(response.body.data.acknowledged_by).toBeTruthy();
    });
  });

  describe('Query Patterns', () => {
    test('GET /api/performance/query-patterns - should return query patterns analysis', async () => {
      const response = await request(app)
        .get('/api/performance/query-patterns')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/performance/query-patterns - should filter by optimization needed', async () => {
      const response = await request(app)
        .get('/api/performance/query-patterns?optimization_needed=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/query-patterns - should filter by days back', async () => {
      const response = await request(app)
        .get('/api/performance/query-patterns?days_back=3')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Slow Queries', () => {
    test('GET /api/performance/slow-queries - should return slow queries analysis', async () => {
      const response = await request(app)
        .get('/api/performance/slow-queries')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/performance/slow-queries - should filter by threshold', async () => {
      const response = await request(app)
        .get('/api/performance/slow-queries?threshold=500')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/slow-queries - should limit results', async () => {
      const response = await request(app)
        .get('/api/performance/slow-queries?limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Index Usage', () => {
    test('GET /api/performance/index-usage - should return index usage statistics', async () => {
      const response = await request(app)
        .get('/api/performance/index-usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/performance/index-usage - should filter unused indexes', async () => {
      const response = await request(app)
        .get('/api/performance/index-usage?unused_only=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/index-usage - should filter by usage threshold', async () => {
      const response = await request(app)
        .get('/api/performance/index-usage?usage_threshold=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Connection Pool', () => {
    test('GET /api/performance/connection-pool - should return connection pool statistics', async () => {
      const response = await request(app)
        .get('/api/performance/connection-pool')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('current_health');
      expect(response.body.data).toHaveProperty('historical_data');
    });
  });

  describe('Cache Statistics', () => {
    test('GET /api/performance/cache-stats - should return cache performance statistics', async () => {
      const response = await request(app)
        .get('/api/performance/cache-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('historical_data');
      expect(response.body.data).toHaveProperty('current_stats');
    });
  });

  describe('Performance Reports', () => {
    test('GET /api/performance/reports - should return performance reports', async () => {
      const response = await request(app)
        .get('/api/performance/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/performance/reports - should filter by report type', async () => {
      const response = await request(app)
        .get('/api/performance/reports?report_type=summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/performance/reports/generate - should generate new report', async () => {
      const response = await request(app)
        .post('/api/performance/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          report_type: 'summary',
          report_period: '24h'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report_type).toBe('summary');
      expect(response.body.data.report_period).toBe('24h');
      
      testReportId = response.body.data.id;
    });
  });

  describe('Optimization Recommendations', () => {
    test('GET /api/performance/recommendations - should return optimization recommendations', async () => {
      const response = await request(app)
        .get('/api/performance/recommendations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/performance/recommendations - should filter by status', async () => {
      const response = await request(app)
        .get('/api/performance/recommendations?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/performance/recommendations - should filter by priority', async () => {
      const response = await request(app)
        .get('/api/performance/recommendations?priority=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/performance/recommendations/:id/implement - should implement recommendation', async () => {
      const recommendationId = (await testDb.query('SELECT id FROM optimization_recommendations LIMIT 1')).rows[0].id;
      
      const response = await request(app)
        .post(`/api/performance/recommendations/${recommendationId}/implement`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IMPLEMENTED');
      expect(response.body.data.implemented_by).toBeTruthy();
    });
  });

  describe('Performance Baselines', () => {
    test('GET /api/performance/baselines - should return performance baselines', async () => {
      const response = await request(app)
        .get('/api/performance/baselines')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const baseline = response.body.data[0];
      expect(baseline).toHaveProperty('baseline_name');
      expect(baseline).toHaveProperty('baseline_type');
      expect(baseline).toHaveProperty('metric_name');
      expect(baseline).toHaveProperty('baseline_value');
    });

    test('POST /api/performance/baselines - should create new baseline', async () => {
      const response = await request(app)
        .post('/api/performance/baselines')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          baseline_name: 'Test Baseline',
          baseline_type: 'TEST',
          metric_name: 'test_metric',
          baseline_value: 100.0,
          acceptable_range: { min: 0, max: 200 },
          is_active: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.baseline_name).toBe('Test Baseline');
      expect(response.body.data.baseline_type).toBe('TEST');
      expect(response.body.data.created_by).toBeTruthy();
    });
  });

  describe('Performance Dashboard', () => {
    test('GET /api/performance/dashboard - should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/performance/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('recent_alerts');
      expect(response.body.data).toHaveProperty('slow_queries');
      expect(response.body.data).toHaveProperty('query_patterns');
      expect(response.body.data).toHaveProperty('cache_stats');
      expect(response.body.data).toHaveProperty('connection_pool');
      expect(response.body.data).toHaveProperty('generated');
    });
  });

  describe('Database Optimization', () => {
    test('POST /api/performance/optimize-indexes - should optimize database indexes', async () => {
      const response = await request(app)
        .post('/api/performance/optimize-indexes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalIndexes');
      expect(response.body.data).toHaveProperty('unusedIndexes');
      expect(response.body.data).toHaveProperty('mostUsedIndexes');
    });
  });

  describe('Data Cleanup', () => {
    test('POST /api/performance/cleanup - should cleanup old performance data', async () => {
      const response = await request(app)
        .post('/api/performance/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          logs_days: 7,
          alerts_days: 30,
          stats_days: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deleted_count');
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Performance Monitoring', () => {
    test('Should track query performance', async () => {
      // Make a request that triggers database queries
      const response = await request(app)
        .get('/api/performance/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check if performance logs were created
      const logsResult = await testDb.query(`
        SELECT COUNT(*) as count FROM performance_logs 
        WHERE timestamp > NOW() - INTERVAL '1 minute'
      `);

      expect(parseInt(logsResult.rows[0].count)).toBeGreaterThan(0);
    });

    test('Should cache query results', async () => {
      // Make multiple requests to the same endpoint
      const requests = Array(3).fill().map(() => 
        request(app)
          .get('/api/performance/status')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    test('Should handle database errors gracefully', async () => {
      // Temporarily break database connection
      await testDb.end();
      
      const response = await request(app)
        .get('/api/performance/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get performance status');
      
      // Restore database connection
      await setupTestData();
    });

    test('Should handle Redis errors gracefully', async () => {
      // Temporarily break Redis connection
      await testRedis.quit();
      
      const response = await request(app)
        .get('/api/performance/cache-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get cache stats');
      
      // Restore Redis connection
      await setupTestData();
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limits on performance endpoints', async () => {
      const requests = Array(35).fill().map(() => 
        request(app)
          .get('/api/performance/status')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
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

  // Create test performance alert
  const alertResult = await testDb.query(`
    INSERT INTO performance_alerts (alert_type, severity, message, details)
    VALUES ('TEST_ALERT', 'MEDIUM', 'Test performance alert', '{"test": "data"}')
    RETURNING id
  `);
  testAlertId = alertResult.rows[0].id;

  // Create test performance logs
  await testDb.query(`
    INSERT INTO performance_logs (query_id, query_text, duration, status, user_id)
    VALUES 
      ('test-query-1', 'SELECT * FROM users', 150, 'EXECUTED', $1),
      ('test-query-2', 'SELECT * FROM performance_logs', 2500, 'EXECUTED', $1),
      ('test-query-3', 'SELECT * FROM performance_alerts', 75, 'EXECUTED', $1)
  `, [testUserId]);

  // Create test query patterns
  await testDb.query(`
    INSERT INTO query_patterns (pattern_hash, query_pattern, execution_count, avg_duration, total_duration)
    VALUES 
      ('hash1', 'SELECT * FROM users WHERE id = ?', 100, 50, 5000),
      ('hash2', 'SELECT * FROM performance_logs ORDER BY timestamp', 25, 1200, 30000)
  `);

  // Create test optimization recommendations
  await testDb.query(`
    INSERT INTO optimization_recommendations (recommendation_type, priority, title, description, impact_score)
    VALUES 
      ('INDEX_OPTIMIZATION', 'HIGH', 'Add index on users table', 'Add index on email column', 0.8),
      ('QUERY_OPTIMIZATION', 'MEDIUM', 'Optimize slow query', 'Rewrite complex query', 0.6)
  `);

  // Create test cache performance data
  await testDb.query(`
    INSERT INTO cache_performance (hit_rate, total_commands, connected_clients, used_memory)
    VALUES (85.5, 10000, 5, 1048576)
  `);

  // Create test connection pool stats
  await testDb.query(`
    INSERT INTO connection_pool_stats (total_connections, active_connections, idle_connections, max_connections)
    VALUES (20, 8, 12, 20)
  `);
}

async function cleanupTestData() {
  // Clean up test data
  await testDb.query('DELETE FROM performance_logs WHERE user_id = $1', [testUserId]);
  await testDb.query('DELETE FROM performance_alerts WHERE id = $1', [testAlertId]);
  await testDb.query('DELETE FROM query_patterns WHERE pattern_hash IN (''hash1'', ''hash2'')');
  await testDb.query('DELETE FROM optimization_recommendations WHERE title LIKE ''%Test%''');
  await testDb.query('DELETE FROM cache_performance WHERE hit_rate = 85.5');
  await testDb.query('DELETE FROM connection_pool_stats WHERE total_connections = 20');
  await testDb.query('DELETE FROM performance_baselines WHERE baseline_name = ''Test Baseline''');
  await testDb.query('DELETE FROM users WHERE id = $1', [testUserId]);
}

async function getAuthToken(email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
} 