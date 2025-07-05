/**
 * Scalability & Load Balancing Test Suite
 * Comprehensive testing for horizontal scaling, load balancing, and high availability
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

describe('Scalability & Load Balancing System', () => {
  let adminToken, userToken;
  let testServiceId, testConfigId, testEventId;

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

  describe('Scalability Status', () => {
    test('GET /api/scalability/status - should return overall scalability status', async () => {
      const response = await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overall_status');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data.services).toHaveProperty('load_balancer');
      expect(response.body.data.services).toHaveProperty('database');
      expect(response.body.data.services).toHaveProperty('redis');
      expect(response.body.data.services).toHaveProperty('auto_scaling');
    });

    test('GET /api/scalability/status - should require authentication', async () => {
      await request(app)
        .get('/api/scalability/status')
        .expect(401);
    });

    test('GET /api/scalability/status - should require admin role', async () => {
      await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Service Registry', () => {
    test('GET /api/scalability/services - should return service registry', async () => {
      const response = await request(app)
        .get('/api/scalability/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/scalability/services - should filter by active services', async () => {
      const response = await request(app)
        .get('/api/scalability/services?active_only=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/services - should filter by service type', async () => {
      const response = await request(app)
        .get('/api/scalability/services?service_type=worker')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/scalability/services/register - should register new service', async () => {
      const serviceData = {
        service_id: 'test-service-1',
        service_type: 'worker',
        worker_id: 'worker-1',
        instance_id: 'instance-123',
        host: 'localhost',
        port: 3001,
        capabilities: ['api', 'database'],
        load_metrics: { cpu: 50, memory: 60 },
        metadata: { version: '1.0.0' }
      };

      const response = await request(app)
        .post('/api/scalability/services/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service_uuid');
      expect(response.body.data).toHaveProperty('message');
      
      testServiceId = serviceData.service_id;
    });
  });

  describe('Load Balancer Configuration', () => {
    test('GET /api/scalability/load-balancer - should return load balancer configs', async () => {
      const response = await request(app)
        .get('/api/scalability/load-balancer')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/scalability/load-balancer - should filter by config name', async () => {
      const response = await request(app)
        .get('/api/scalability/load-balancer?config_name=default')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].config_name).toBe('default');
    });

    test('POST /api/scalability/load-balancer/config - should create load balancer config', async () => {
      const configData = {
        config_name: 'test-config',
        algorithm: 'least_connections',
        health_check_interval: 30000,
        max_connections: 1000,
        connection_timeout: 30000,
        retry_attempts: 3,
        circuit_breaker_threshold: 5,
        circuit_breaker_timeout: 60000,
        sticky_session_enabled: false,
        session_timeout: 1800,
        weight_distribution: { 'service1': 60, 'service2': 40 },
        is_active: true
      };

      const response = await request(app)
        .post('/api/scalability/load-balancer/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config_name).toBe('test-config');
      expect(response.body.data.algorithm).toBe('least_connections');
      
      testConfigId = response.body.data.id;
    });
  });

  describe('Health Monitoring', () => {
    test('GET /api/scalability/health - should return health monitoring data', async () => {
      const response = await request(app)
        .get('/api/scalability/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/scalability/health - should filter by service ID', async () => {
      const response = await request(app)
        .get('/api/scalability/health?service_id=test-service-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/health - should filter by health status', async () => {
      const response = await request(app)
        .get('/api/scalability/health?health_status=healthy')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/scalability/health/update - should update service health', async () => {
      const healthData = {
        service_id: 'test-service-1',
        health_status: 'healthy',
        response_time: 150,
        error_message: null
      };

      const response = await request(app)
        .post('/api/scalability/health/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(healthData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Load Distribution', () => {
    test('GET /api/scalability/load-distribution - should return load distribution data', async () => {
      const response = await request(app)
        .get('/api/scalability/load-distribution')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/scalability/load-distribution - should filter by service ID', async () => {
      const response = await request(app)
        .get('/api/scalability/load-distribution?service_id=test-service-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/load-distribution - should filter by hours back', async () => {
      const response = await request(app)
        .get('/api/scalability/load-distribution?hours_back=24')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Circuit Breakers', () => {
    test('GET /api/scalability/circuit-breakers - should return circuit breaker status', async () => {
      const response = await request(app)
        .get('/api/scalability/circuit-breakers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/scalability/circuit-breakers - should filter by service name', async () => {
      const response = await request(app)
        .get('/api/scalability/circuit-breakers?service_name=database_primary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/circuit-breakers - should filter by status', async () => {
      const response = await request(app)
        .get('/api/scalability/circuit-breakers?status=closed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/scalability/circuit-breakers/reset - should reset circuit breaker', async () => {
      const resetData = {
        service_name: 'test_service',
        service_type: 'database'
      };

      const response = await request(app)
        .post('/api/scalability/circuit-breakers/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Auto Scaling', () => {
    test('GET /api/scalability/auto-scaling - should return auto-scaling events', async () => {
      const response = await request(app)
        .get('/api/scalability/auto-scaling')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/scalability/auto-scaling - should filter by event type', async () => {
      const response = await request(app)
        .get('/api/scalability/auto-scaling?event_type=scale_up')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/auto-scaling - should filter by trigger type', async () => {
      const response = await request(app)
        .get('/api/scalability/auto-scaling?trigger_type=cpu')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('POST /api/scalability/auto-scaling/trigger - should trigger auto-scaling event', async () => {
      const eventData = {
        event_type: 'scale_up',
        trigger_type: 'cpu',
        trigger_value: 85.5,
        threshold_value: 80.0,
        action_taken: 'add_worker',
        target_service: 'api_workers',
        scaling_factor: 1,
        current_instances: 3,
        new_instances: 4,
        event_details: { reason: 'High CPU usage detected' }
      };

      const response = await request(app)
        .post('/api/scalability/auto-scaling/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('event_id');
      expect(response.body.data).toHaveProperty('message');
      
      testEventId = response.body.data.event_id;
    });
  });

  describe('High Availability', () => {
    test('GET /api/scalability/high-availability - should return high availability status', async () => {
      const response = await request(app)
        .get('/api/scalability/high-availability')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/scalability/high-availability - should filter by service name', async () => {
      const response = await request(app)
        .get('/api/scalability/high-availability?service_name=api_gateway')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].service_name).toBe('api_gateway');
    });

    test('GET /api/scalability/high-availability - should filter by availability status', async () => {
      const response = await request(app)
        .get('/api/scalability/high-availability?availability_status=available')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Service Mesh', () => {
    test('GET /api/scalability/service-mesh - should return service mesh traces', async () => {
      const response = await request(app)
        .get('/api/scalability/service-mesh')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/scalability/service-mesh - should filter by trace ID', async () => {
      const response = await request(app)
        .get('/api/scalability/service-mesh?trace_id=test-trace-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/service-mesh - should filter by service name', async () => {
      const response = await request(app)
        .get('/api/scalability/service-mesh?service_name=api_service')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/scalability/service-mesh - should filter by hours back', async () => {
      const response = await request(app)
        .get('/api/scalability/service-mesh?hours_back=24')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Statistics', () => {
    test('GET /api/scalability/statistics - should return scalability statistics', async () => {
      const response = await request(app)
        .get('/api/scalability/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_services');
      expect(response.body.data).toHaveProperty('healthy_services');
      expect(response.body.data).toHaveProperty('unhealthy_services');
      expect(response.body.data).toHaveProperty('avg_response_time');
      expect(response.body.data).toHaveProperty('total_requests');
      expect(response.body.data).toHaveProperty('success_rate');
    });

    test('GET /api/scalability/statistics - should accept hours back parameter', async () => {
      const response = await request(app)
        .get('/api/scalability/statistics?hours_back=12')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_services');
    });
  });

  describe('Dashboard', () => {
    test('GET /api/scalability/dashboard - should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/scalability/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service_statistics');
      expect(response.body.data).toHaveProperty('load_balancer_stats');
      expect(response.body.data).toHaveProperty('health_summary');
      expect(response.body.data).toHaveProperty('circuit_breaker_summary');
      expect(response.body.data).toHaveProperty('auto_scaling_summary');
      expect(response.body.data).toHaveProperty('high_availability_summary');
      expect(response.body.data).toHaveProperty('generated');
    });
  });

  describe('Data Cleanup', () => {
    test('POST /api/scalability/cleanup - should cleanup old data', async () => {
      const cleanupData = {
        service_registry_days: 7,
        health_monitoring_days: 3,
        load_distribution_days: 1,
        service_mesh_days: 1,
        auto_scaling_days: 30
      };

      const response = await request(app)
        .post('/api/scalability/cleanup')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cleanupData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deleted_count');
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Load Balancing Headers', () => {
    test('Should include load balancer headers in responses', async () => {
      const response = await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-load-balancer');
      expect(response.headers).toHaveProperty('x-worker-id');
      expect(response.headers).toHaveProperty('x-instance-id');
      expect(response.headers['x-load-balancer']).toBe('MedSpaSync-Pro');
    });
  });

  describe('Service Mesh Headers', () => {
    test('Should include service mesh headers in responses', async () => {
      const response = await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-service-mesh');
      expect(response.headers).toHaveProperty('x-trace-id');
      expect(response.headers).toHaveProperty('x-span-id');
      expect(response.headers['x-service-mesh']).toBe('MedSpaSync-Pro-Mesh');
    });
  });

  describe('Error Handling', () => {
    test('Should handle database errors gracefully', async () => {
      // Temporarily break database connection
      await testDb.end();
      
      const response = await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get scalability status');
      
      // Restore database connection
      await setupTestData();
    });

    test('Should handle Redis errors gracefully', async () => {
      // Temporarily break Redis connection
      await testRedis.quit();
      
      const response = await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get scalability status');
      
      // Restore Redis connection
      await setupTestData();
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limits on scalability endpoints', async () => {
      const requests = Array(35).fill().map(() => 
        request(app)
          .get('/api/scalability/status')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Scalability Features', () => {
    test('Should track request distribution', async () => {
      // Make multiple requests to test load distribution
      const requests = Array(5).fill().map(() => 
        request(app)
          .get('/api/scalability/status')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('Should handle graceful degradation', async () => {
      const response = await request(app)
        .get('/api/scalability/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check if graceful degradation headers are present
      expect(response.headers).toHaveProperty('x-system-load');
      
      const systemLoad = JSON.parse(response.headers['x-system-load']);
      expect(systemLoad).toHaveProperty('cpu');
      expect(systemLoad).toHaveProperty('memory');
    });
  });
});

// Helper functions

async function setupTestData() {
  // Create test service registry entries
  await testDb.query(`
    INSERT INTO service_registry (service_id, service_type, worker_id, instance_id, host, port, capabilities)
    VALUES 
      ('test-service-1', 'worker', 'worker-1', 'instance-123', 'localhost', 3001, '["api", "database"]'),
      ('test-service-2', 'worker', 'worker-2', 'instance-456', 'localhost', 3002, '["api", "cache"]'),
      ('test-service-3', 'master', 'master-1', 'instance-789', 'localhost', 3000, '["load_balancer", "monitoring"]')
  `);

  // Create test health monitoring data
  await testDb.query(`
    INSERT INTO health_monitoring (service_id, service_type, health_status, response_time, check_type)
    VALUES 
      ('test-service-1', 'worker', 'healthy', 150, 'health_check'),
      ('test-service-2', 'worker', 'healthy', 200, 'health_check'),
      ('test-service-3', 'master', 'healthy', 100, 'health_check')
  `);

  // Create test load distribution data
  await testDb.query(`
    INSERT INTO load_distribution (service_id, request_count, active_connections, response_time_avg, cpu_usage, memory_usage)
    VALUES 
      ('test-service-1', 1000, 50, 150.5, 45.2, 60.8),
      ('test-service-2', 800, 40, 180.3, 52.1, 55.4),
      ('test-service-3', 1200, 60, 120.7, 38.9, 70.2)
  `);

  // Create test circuit breaker data
  await testDb.query(`
    INSERT INTO circuit_breaker (service_name, service_type, status, failure_count, total_requests, failed_requests)
    VALUES 
      ('database_primary', 'database', 'closed', 0, 1000, 5),
      ('redis_primary', 'cache', 'closed', 0, 800, 2),
      ('external_api', 'external', 'open', 10, 100, 15)
  `);

  // Create test auto scaling events
  await testDb.query(`
    INSERT INTO auto_scaling_events (event_type, trigger_type, trigger_value, threshold_value, action_taken, target_service, scaling_factor, current_instances, new_instances)
    VALUES 
      ('scale_up', 'cpu', 85.5, 80.0, 'add_worker', 'api_workers', 1, 3, 4),
      ('scale_down', 'memory', 30.2, 40.0, 'remove_worker', 'api_workers', -1, 4, 3)
  `);

  // Create test service mesh traces
  await testDb.query(`
    INSERT INTO service_mesh (trace_id, span_id, service_name, operation_name, request_method, request_path, duration, start_time, end_time)
    VALUES 
      ('trace-123', 'span-456', 'api_service', 'get_status', 'GET', '/api/status', 150, NOW() - INTERVAL '1 minute', NOW()),
      ('trace-789', 'span-012', 'database_service', 'query_data', 'POST', '/api/data', 200, NOW() - INTERVAL '2 minutes', NOW())
  `);
}

async function cleanupTestData() {
  // Clean up test data
  await testDb.query('DELETE FROM service_mesh WHERE trace_id IN (''trace-123'', ''trace-789'')');
  await testDb.query('DELETE FROM auto_scaling_events WHERE event_type IN (''scale_up'', ''scale_down'')');
  await testDb.query('DELETE FROM circuit_breaker WHERE service_name IN (''database_primary'', ''redis_primary'', ''external_api'')');
  await testDb.query('DELETE FROM load_distribution WHERE service_id IN (''test-service-1'', ''test-service-2'', ''test-service-3'')');
  await testDb.query('DELETE FROM health_monitoring WHERE service_id IN (''test-service-1'', ''test-service-2'', ''test-service-3'')');
  await testDb.query('DELETE FROM service_registry WHERE service_id IN (''test-service-1'', ''test-service-2'', ''test-service-3'')');
  await testDb.query('DELETE FROM load_balancer_config WHERE config_name = ''test-config''');
}

async function getAuthToken(email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
} 