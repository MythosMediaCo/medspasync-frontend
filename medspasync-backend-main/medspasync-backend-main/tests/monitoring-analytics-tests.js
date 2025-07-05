/**
 * Monitoring & Analytics Tests
 * Comprehensive test suite for enhanced monitoring dashboards, predictive analysis, and business intelligence
 */

const request = require('supertest');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');

// Mock database and Redis for testing
jest.mock('pg');
jest.mock('redis');

const mockPool = {
  query: jest.fn()
};

const mockRedisClient = {
  get: jest.fn(),
  setex: jest.fn(),
  ping: jest.fn()
};

Pool.mockImplementation(() => mockPool);
redis.createClient.mockReturnValue(mockRedisClient);

// Import the app and middleware
const app = require('../app');
const { enhancedMonitoringMiddleware, businessIntelligenceMiddleware, predictiveAnalyticsMiddleware, getMonitoringStatistics } = require('../middleware/monitoring-analytics');

describe('Monitoring & Analytics System', () => {
  let adminToken;
  let userToken;

  beforeAll(() => {
    // Generate test tokens
    adminToken = jwt.sign(
      { id: 'admin-123', role: 'ADMIN', email: 'admin@test.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: 'user-123', role: 'USER', email: 'user@test.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockPool.query.mockResolvedValue({ rows: [] });
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.setex.mockResolvedValue('OK');
    mockRedisClient.ping.mockResolvedValue('PONG');
  });

  describe('Middleware Tests', () => {
    describe('Enhanced Monitoring Middleware', () => {
      it('should track request metrics', async () => {
        const req = {
          method: 'GET',
          url: '/api/test',
          path: '/api/test',
          query: { param: 'value' },
          headers: { 'user-agent': 'test-agent' },
          ip: '127.0.0.1',
          session: { id: 'session-123' },
          user: { id: 'user-123', role: 'USER' }
        };

        const res = {
          statusCode: 200,
          setHeader: jest.fn(),
          on: jest.fn()
        };

        const next = jest.fn();

        // Mock the middleware
        const middleware = enhancedMonitoringMiddleware();
        middleware(req, res, next);

        // Verify next was called
        expect(next).toHaveBeenCalled();

        // Verify headers were set
        expect(res.setHeader).toHaveBeenCalledWith('X-Monitoring-ID', expect.any(String));
        expect(res.setHeader).toHaveBeenCalledWith('X-Session-ID', 'session-123');
        expect(res.setHeader).toHaveBeenCalledWith('X-Request-Timestamp', expect.any(Number));
      });

      it('should track response metrics', async () => {
        const req = {
          method: 'POST',
          url: '/api/test',
          path: '/api/test',
          query: {},
          headers: {},
          ip: '127.0.0.1',
          session: { id: 'session-123' },
          user: { id: 'user-123', role: 'USER' }
        };

        const res = {
          statusCode: 201,
          setHeader: jest.fn(),
          on: jest.fn()
        };

        const next = jest.fn();

        const middleware = enhancedMonitoringMiddleware();
        middleware(req, res, next);

        // Simulate response finish
        const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
        finishCallback();

        expect(next).toHaveBeenCalled();
      });

      it('should handle missing user and session', async () => {
        const req = {
          method: 'GET',
          url: '/api/test',
          path: '/api/test',
          query: {},
          headers: {},
          ip: '127.0.0.1'
        };

        const res = {
          statusCode: 200,
          setHeader: jest.fn(),
          on: jest.fn()
        };

        const next = jest.fn();

        const middleware = enhancedMonitoringMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('X-Session-ID', 'anonymous');
      });
    });

    describe('Business Intelligence Middleware', () => {
      it('should track business events for POST requests', async () => {
        const req = {
          method: 'POST',
          path: '/api/transactions',
          body: { amount: 100, description: 'test' },
          user: { id: 'user-123', role: 'USER' },
          session: { id: 'session-123' }
        };

        const res = {};
        const next = jest.fn();

        const middleware = businessIntelligenceMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should track business events for PUT requests', async () => {
        const req = {
          method: 'PUT',
          path: '/api/transactions/123',
          body: { amount: 150 },
          user: { id: 'user-123', role: 'USER' },
          session: { id: 'session-123' }
        };

        const res = {};
        const next = jest.fn();

        const middleware = businessIntelligenceMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should track user behavior', async () => {
        const req = {
          method: 'GET',
          path: '/api/dashboard',
          user: { id: 'user-123', role: 'USER' },
          session: { id: 'session-123' }
        };

        const res = {};
        const next = jest.fn();

        const middleware = businessIntelligenceMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });

    describe('Predictive Analytics Middleware', () => {
      it('should generate user predictions', async () => {
        const req = {
          user: { id: 'user-123', role: 'USER' }
        };

        const res = {};
        const next = jest.fn();

        const middleware = predictiveAnalyticsMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.userPredictions).toBeDefined();
        expect(req.systemPredictions).toBeDefined();
      });

      it('should handle missing user', async () => {
        const req = {};

        const res = {};
        const next = jest.fn();

        const middleware = predictiveAnalyticsMiddleware();
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.systemPredictions).toBeDefined();
      });
    });
  });

  describe('API Routes Tests', () => {
    describe('GET /api/monitoring/overview', () => {
      it('should return monitoring overview for admin', async () => {
        mockPool.query.mockResolvedValueOnce({
          rows: [{
            total_alerts: 5,
            high_severity_alerts: 2,
            unacknowledged_alerts: 3
          }]
        });

        const response = await request(app)
          .get('/api/monitoring/overview')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('statistics');
        expect(response.body.data).toHaveProperty('real_time');
      });

      it('should deny access to non-admin users', async () => {
        await request(app)
          .get('/api/monitoring/overview')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });

      it('should handle database errors gracefully', async () => {
        mockPool.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app)
          .get('/api/monitoring/overview')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Failed to get monitoring overview');
      });
    });

    describe('GET /api/monitoring/dashboard/:type', () => {
      it('should return overview dashboard data', async () => {
        mockPool.query
          .mockResolvedValueOnce({ rows: [{ overall_status: 'healthy' }] })
          .mockResolvedValueOnce({ rows: [{ avg_response_time: 150 }] })
          .mockResolvedValueOnce({ rows: [{ active_users: 10 }] })
          .mockResolvedValueOnce({ rows: [{ total_alerts: 2 }] });

        const response = await request(app)
          .get('/api/monitoring/dashboard/overview')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('system_health');
        expect(response.body.data).toHaveProperty('performance');
      });

      it('should return performance dashboard data', async () => {
        mockPool.query
          .mockResolvedValueOnce({ rows: [{ hour: '2023-01-01 10:00:00', avg_duration: 200 }] })
          .mockResolvedValueOnce({ rows: [{ status_code: 500, count: 5 }] })
          .mockResolvedValueOnce({ rows: [{ path: '/api/test', avg_duration: 300 }] });

        const response = await request(app)
          .get('/api/monitoring/dashboard/performance')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response_times');
        expect(response.body.data).toHaveProperty('error_distribution');
      });

      it('should return business dashboard data', async () => {
        mockPool.query
          .mockResolvedValueOnce({ rows: [{ hour: '2023-01-01 10:00:00', active_users: 5 }] })
          .mockResolvedValueOnce({ rows: [{ total_transactions: 100, total_revenue: 10000 }] })
          .mockResolvedValueOnce({ rows: [{ action: 'view_dashboard', count: 50 }] });

        const response = await request(app)
          .get('/api/monitoring/dashboard/business')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user_activity');
        expect(response.body.data).toHaveProperty('transaction_metrics');
      });

      it('should return security dashboard data', async () => {
        mockPool.query
          .mockResolvedValueOnce({ rows: [{ event_type: 'auth_failure', severity: 'high', count: 3 }] })
          .mockResolvedValueOnce({ rows: [{ auth_failures: 5 }] })
          .mockResolvedValueOnce({ rows: [{ suspicious_activities: 2 }] });

        const response = await request(app)
          .get('/api/monitoring/dashboard/security')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('security_events');
        expect(response.body.data).toHaveProperty('auth_failures');
      });

      it('should reject invalid dashboard type', async () => {
        const response = await request(app)
          .get('/api/monitoring/dashboard/invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid dashboard type');
      });
    });

    describe('GET /api/monitoring/metrics/system', () => {
      it('should return system metrics', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              time_bucket: '2023-01-01 10:00:00',
              avg_cpu_usage: 25.5,
              avg_memory_usage: 60.2
            }]
          })
          .mockResolvedValueOnce({
            rows: [{ overall_status: 'healthy', database_status: 'healthy' }]
          });

        const response = await request(app)
          .get('/api/monitoring/metrics/system')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data).toHaveProperty('current_status');
      });

      it('should accept custom time parameters', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });

        await request(app)
          .get('/api/monitoring/metrics/system?hours=48&interval=30 minutes')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('INTERVAL \'48 hours\''),
          expect.any(Array)
        );
      });
    });

    describe('GET /api/monitoring/metrics/performance', () => {
      it('should return performance metrics', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              time_bucket: '2023-01-01 10:00:00',
              avg_response_time: 150,
              error_count: 2,
              total_requests: 100
            }]
          })
          .mockResolvedValueOnce({
            rows: [{ path: '/api/test', avg_duration: 200, request_count: 50 }]
          })
          .mockResolvedValueOnce({
            rows: [{ status_code: 500, count: 5, avg_duration: 1000 }]
          });

        const response = await request(app)
          .get('/api/monitoring/metrics/performance')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('metrics');
        expect(response.body.data).toHaveProperty('slow_endpoints');
        expect(response.body.data).toHaveProperty('error_distribution');
      });
    });

    describe('GET /api/monitoring/metrics/business', () => {
      it('should return business metrics', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              time_bucket: '2023-01-01 10:00:00',
              active_users: 25,
              total_transactions: 100,
              total_revenue: 10000
            }]
          })
          .mockResolvedValueOnce({
            rows: [{
              time_bucket: '2023-01-01 10:00:00',
              active_users: 20,
              total_actions: 150
            }]
          })
          .mockResolvedValueOnce({
            rows: [{ action: 'view_dashboard', count: 50, unique_users: 15 }]
          });

        const response = await request(app)
          .get('/api/monitoring/metrics/business')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('transactions');
        expect(response.body.data).toHaveProperty('user_activity');
        expect(response.body.data).toHaveProperty('top_actions');
      });
    });

    describe('GET /api/monitoring/alerts', () => {
      it('should return monitoring alerts', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              id: 'alert-123',
              alert_type: 'threshold_exceeded',
              metric_name: 'cpu_usage',
              severity: 'high',
              acknowledged: false
            }]
          })
          .mockResolvedValueOnce({
            rows: [{
              total_alerts: 10,
              high_severity: 3,
              unacknowledged: 5
            }]
          });

        const response = await request(app)
          .get('/api/monitoring/alerts')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('alerts');
        expect(response.body.data).toHaveProperty('statistics');
      });

      it('should filter alerts by severity', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });

        await request(app)
          .get('/api/monitoring/alerts?severity=high')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('severity = $1'),
          expect.any(Array)
        );
      });

      it('should filter alerts by acknowledgment status', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });

        await request(app)
          .get('/api/monitoring/alerts?acknowledged=false')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('acknowledged = $1'),
          expect.any(Array)
        );
      });
    });

    describe('POST /api/monitoring/alerts/:id/acknowledge', () => {
      it('should acknowledge an alert', async () => {
        mockPool.query.mockResolvedValueOnce({
          rows: [{
            id: 'alert-123',
            acknowledged: true,
            acknowledged_by: 'admin-123'
          }]
        });

        const response = await request(app)
          .post('/api/monitoring/alerts/alert-123/acknowledge')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ message: 'Alert acknowledged' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.acknowledged).toBe(true);
      });

      it('should return 404 for non-existent alert', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
          .post('/api/monitoring/alerts/non-existent/acknowledge')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ message: 'Alert acknowledged' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Alert not found');
      });
    });

    describe('POST /api/monitoring/alerts/:id/resolve', () => {
      it('should resolve an alert', async () => {
        mockPool.query.mockResolvedValueOnce({
          rows: [{
            id: 'alert-123',
            resolved: true,
            resolved_at: expect.any(Date)
          }]
        });

        const response = await request(app)
          .post('/api/monitoring/alerts/alert-123/resolve')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ resolution_notes: 'Issue resolved' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.resolved).toBe(true);
      });
    });

    describe('GET /api/analytics/predictions', () => {
      it('should return predictions data', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              prediction_data: {
                user_behavior: { next_actions: ['view_dashboard'] }
              }
            }]
          })
          .mockResolvedValueOnce({
            rows: [{
              prediction_data: {
                system_load: { expected_cpu_usage: 65 }
              }
            }]
          })
          .mockResolvedValueOnce({
            rows: [{
              prediction_data: {
                business_metrics: { expected_revenue: 50000 }
              }
            }]
          });

        const response = await request(app)
          .get('/api/analytics/predictions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user_behavior');
        expect(response.body.data).toHaveProperty('system_load');
        expect(response.body.data).toHaveProperty('business_metrics');
      });

      it('should filter predictions by type', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{
            prediction_data: { user_behavior: {} }
          }]
        });

        await request(app)
          .get('/api/analytics/predictions?type=user_behavior')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('prediction_type = \'user_behavior\''),
          expect.any(Array)
        );
      });
    });

    describe('GET /api/analytics/trends', () => {
      it('should return trend analysis data', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              date: '2023-01-01',
              active_users: 25,
              total_actions: 150
            }]
          })
          .mockResolvedValueOnce({
            rows: [{
              date: '2023-01-01',
              avg_response_time: 150,
              error_count: 2
            }]
          })
          .mockResolvedValueOnce({
            rows: [{
              date: '2023-01-01',
              active_users: 20,
              total_transactions: 100
            }]
          });

        const response = await request(app)
          .get('/api/analytics/trends')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user_activity');
        expect(response.body.data).toHaveProperty('performance');
        expect(response.body.data).toHaveProperty('business');
      });

      it('should filter trends by type', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{ date: '2023-01-01', active_users: 25 }]
        });

        await request(app)
          .get('/api/analytics/trends?type=user_activity')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('FROM user_behavior'),
          expect.any(Array)
        );
      });
    });

    describe('GET /api/analytics/reports', () => {
      it('should return BI reports', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{
            id: 'report-123',
            report_type: 'daily',
            report_data: { metrics: {} }
          }]
        });

        const response = await request(app)
          .get('/api/analytics/reports')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].report_type).toBe('daily');
      });

      it('should filter reports by type', async () => {
        mockPool.query.mockResolvedValue({ rows: [] });

        await request(app)
          .get('/api/analytics/reports?type=daily')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('report_type = $1'),
          expect.any(Array)
        );
      });
    });

    describe('GET /api/analytics/kpis', () => {
      it('should return KPI metrics', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              kpi_name: 'user_engagement',
              kpi_value: 0.75,
              kpi_target: 0.7
            }]
          })
          .mockResolvedValueOnce({
            rows: [
              { kpi_name: 'user_engagement', kpi_value: 0.75, kpi_target: 0.7 },
              { kpi_name: 'transaction_success_rate', kpi_value: 0.95, kpi_target: 0.95 },
              { kpi_name: 'avg_response_time', kpi_value: 150, kpi_target: 1000 }
            ]
          });

        const response = await request(app)
          .get('/api/analytics/kpis')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('historical');
        expect(response.body.data).toHaveProperty('current');
      });
    });

    describe('GET /api/analytics/dashboards', () => {
      it('should return analytics dashboards', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{
            id: 'dashboard-123',
            dashboard_name: 'System Overview',
            dashboard_type: 'overview',
            is_active: true
          }]
        });

        const response = await request(app)
          .get('/api/analytics/dashboards')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].dashboard_name).toBe('System Overview');
      });
    });

    describe('POST /api/analytics/dashboards', () => {
      it('should create analytics dashboard', async () => {
        const dashboardData = {
          dashboard_name: 'Custom Dashboard',
          dashboard_type: 'custom',
          widget_config: { widgets: ['metric1', 'chart1'] },
          refresh_interval: 300
        };

        mockPool.query.mockResolvedValue({
          rows: [{ id: 'dashboard-123', ...dashboardData }]
        });

        const response = await request(app)
          .post('/api/analytics/dashboards')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(dashboardData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.dashboard_name).toBe('Custom Dashboard');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/analytics/dashboards')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/analytics/widgets', () => {
      it('should return analytics widgets', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{
            id: 'widget-123',
            widget_name: 'System Health',
            widget_type: 'gauge',
            is_active: true
          }]
        });

        const response = await request(app)
          .get('/api/analytics/widgets')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].widget_name).toBe('System Health');
      });
    });

    describe('POST /api/analytics/widgets', () => {
      it('should create analytics widget', async () => {
        const widgetData = {
          widget_name: 'Custom Widget',
          widget_type: 'chart',
          data_source: 'performance_metrics',
          query_config: { query: 'SELECT * FROM metrics' },
          display_config: { title: 'Custom Widget', type: 'line' }
        };

        mockPool.query.mockResolvedValue({
          rows: [{ id: 'widget-123', ...widgetData }]
        });

        const response = await request(app)
          .post('/api/analytics/widgets')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(widgetData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.widget_name).toBe('Custom Widget');
      });
    });

    describe('GET /api/analytics/export', () => {
      it('should export system metrics as JSON', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{
            id: 'metric-123',
            cpu_usage: 25.5,
            memory_usage: 60.2,
            timestamp: '2023-01-01T10:00:00Z'
          }]
        });

        const response = await request(app)
          .get('/api/analytics/export?type=system_metrics&format=json')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].cpu_usage).toBe(25.5);
      });

      it('should export data as CSV', async () => {
        mockPool.query.mockResolvedValue({
          rows: [{
            id: 'metric-123',
            cpu_usage: 25.5,
            memory_usage: 60.2
          }]
        });

        const response = await request(app)
          .get('/api/analytics/export?type=system_metrics&format=csv')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.headers['content-type']).toBe('text/csv');
        expect(response.headers['content-disposition']).toContain('attachment');
      });

      it('should reject invalid export type', async () => {
        const response = await request(app)
          .get('/api/analytics/export?type=invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid export type');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete monitoring workflow', async () => {
      // Mock all necessary database calls
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ overall_status: 'healthy' }] })
        .mockResolvedValueOnce({ rows: [{ avg_response_time: 150 }] })
        .mockResolvedValueOnce({ rows: [{ active_users: 10 }] })
        .mockResolvedValueOnce({ rows: [{ total_alerts: 2 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'alert-123', acknowledged: true }] });

      // Test monitoring overview
      const overviewResponse = await request(app)
        .get('/api/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(overviewResponse.body.success).toBe(true);

      // Test dashboard
      const dashboardResponse = await request(app)
        .get('/api/monitoring/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);

      // Test alert acknowledgment
      const alertResponse = await request(app)
        .post('/api/monitoring/alerts/alert-123/acknowledge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Test acknowledgment' })
        .expect(200);

      expect(alertResponse.body.success).toBe(true);
    });

    it('should handle analytics workflow', async () => {
      // Mock analytics data
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ prediction_data: { user_behavior: {} } }] })
        .mockResolvedValueOnce({ rows: [{ date: '2023-01-01', active_users: 25 }] })
        .mockResolvedValueOnce({ rows: [{ kpi_name: 'user_engagement', kpi_value: 0.75 }] });

      // Test predictions
      const predictionsResponse = await request(app)
        .get('/api/analytics/predictions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(predictionsResponse.body.success).toBe(true);

      // Test trends
      const trendsResponse = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(trendsResponse.body.success).toBe(true);

      // Test KPIs
      const kpisResponse = await request(app)
        .get('/api/analytics/kpis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(kpisResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get monitoring overview');
    });

    it('should handle Redis connection errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));
      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/analytics/dashboards')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    it('should require authentication for all routes', async () => {
      const routes = [
        '/api/monitoring/overview',
        '/api/monitoring/dashboard/overview',
        '/api/monitoring/metrics/system',
        '/api/analytics/predictions',
        '/api/analytics/trends'
      ];

      for (const route of routes) {
        await request(app)
          .get(route)
          .expect(401);
      }
    });

    it('should require admin role for monitoring routes', async () => {
      const routes = [
        '/api/monitoring/overview',
        '/api/monitoring/dashboard/overview',
        '/api/monitoring/metrics/system',
        '/api/analytics/predictions'
      ];

      for (const route of routes) {
        await request(app)
          .get(route)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      }
    });

    it('should sanitize sensitive data in metrics', async () => {
      const req = {
        method: 'POST',
        url: '/api/test',
        path: '/api/test',
        query: {},
        headers: {
          'authorization': 'Bearer secret-token',
          'cookie': 'session=secret-session',
          'user-agent': 'test-agent'
        },
        ip: '127.0.0.1',
        session: { id: 'session-123' },
        user: { id: 'user-123', role: 'USER' }
      };

      const res = {
        statusCode: 200,
        setHeader: jest.fn(),
        on: jest.fn()
      };

      const next = jest.fn();

      const middleware = enhancedMonitoringMiddleware();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      // Verify that sensitive headers are not logged
      expect(req.headers.authorization).toBeUndefined();
      expect(req.headers.cookie).toBeUndefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle high volume of requests efficiently', async () => {
      const startTime = Date.now();
      const requests = [];

      // Simulate 100 concurrent requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/monitoring/overview')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      mockPool.query.mockResolvedValue({ rows: [] });

      await Promise.all(requests);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should cache frequently accessed data', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      // First request
      await request(app)
        .get('/api/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Second request should use cache
      await request(app)
        .get('/api/monitoring/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify Redis was used for caching
      expect(mockRedisClient.get).toHaveBeenCalled();
    });
  });
}); 