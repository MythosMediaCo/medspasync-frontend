/**
 * Scalability & Load Balancing API Routes
 * Service discovery, load balancing, auto-scaling, and high availability for MedSpaSync Pro
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const { rateLimiter } = require('../middleware/rateLimiter');

// Scalability middleware
const { 
  loadBalancingMiddleware,
  databaseLoadBalancingMiddleware,
  redisLoadBalancingMiddleware,
  autoScalingMiddleware,
  highAvailabilityMiddleware,
  serviceMeshMiddleware,
  getScalabilityStatistics
} = require('../middleware/scalability-load-balancing');

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis connection
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0
});

// Apply scalability middleware to all routes
router.use(loadBalancingMiddleware);
router.use(databaseLoadBalancingMiddleware);
router.use(redisLoadBalancingMiddleware);
router.use(autoScalingMiddleware);
router.use(highAvailabilityMiddleware);
router.use(serviceMeshMiddleware);

/**
 * @route   GET /api/scalability/status
 * @desc    Get overall scalability and load balancing status
 * @access  Private (Admin)
 */
router.get('/status', 
  authenticateToken, 
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const stats = getScalabilityStatistics();
      
      res.json({
        success: true,
        data: {
          overall_status: 'operational',
          statistics: stats,
          last_updated: new Date(),
          services: {
            load_balancer: {
              status: 'operational',
              algorithm: stats.loadBalancer.algorithm,
              active_connections: stats.loadBalancer.activeConnections,
              worker_count: stats.loadBalancer.workerCount
            },
            database: {
              status: stats.health.database,
              connection_pools: stats.instance.isMaster ? 'managed' : 'worker'
            },
            redis: {
              status: stats.health.redis,
              cluster_nodes: 3
            },
            auto_scaling: {
              status: 'enabled',
              triggers: ['cpu', 'memory', 'connections']
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Get scalability status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get scalability status'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/services
 * @desc    Get service registry and discovery information
 * @access  Private (Admin)
 */
router.get('/services',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 50 }),
  async (req, res) => {
    try {
      const { active_only, service_type, health_status } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (active_only === 'true') {
        whereClause += ` AND last_seen > NOW() - INTERVAL '5 minutes'`;
      }
      
      if (service_type) {
        paramCount++;
        whereClause += ` AND service_type = $${paramCount}`;
        params.push(service_type);
      }
      
      if (health_status) {
        paramCount++;
        whereClause += ` AND health_status = $${paramCount}`;
        params.push(health_status);
      }
      
      const result = await db.query(`
        SELECT 
          service_id, service_type, worker_id, instance_id, host, port,
          health_status, capabilities, load_metrics, metadata,
          registered_at, last_seen, is_active
        FROM service_registry 
        ${whereClause}
        ORDER BY last_seen DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get services error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get services'
      });
    }
  }
);

/**
 * @route   POST /api/scalability/services/register
 * @desc    Register a new service
 * @access  Private (Admin)
 */
router.post('/services/register',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { 
        service_id, service_type, worker_id, instance_id, host, port,
        capabilities, load_metrics, metadata 
      } = req.body;
      
      const result = await db.query(`
        SELECT register_service($1, $2, $3, $4, $5, $6, $7, $8, $9) as service_uuid
      `, [
        service_id, service_type, worker_id, instance_id, host, port,
        capabilities || '[]', load_metrics || '{}', metadata || '{}'
      ]);
      
      res.json({
        success: true,
        data: {
          service_uuid: result.rows[0].service_uuid,
          message: 'Service registered successfully'
        }
      });
    } catch (error) {
      console.error('❌ Register service error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register service'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/load-balancer
 * @desc    Get load balancer configuration and status
 * @access  Private (Admin)
 */
router.get('/load-balancer',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { config_name } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (config_name) {
        paramCount++;
        whereClause += ` AND config_name = $${paramCount}`;
        params.push(config_name);
      }
      
      const result = await db.query(`
        SELECT 
          id, config_name, algorithm, health_check_interval, max_connections,
          connection_timeout, retry_attempts, circuit_breaker_threshold,
          circuit_breaker_timeout, sticky_session_enabled, session_timeout,
          weight_distribution, is_active, created_at, updated_at
        FROM load_balancer_config 
        ${whereClause}
        ORDER BY config_name
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get load balancer config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get load balancer configuration'
      });
    }
  }
);

/**
 * @route   POST /api/scalability/load-balancer/config
 * @desc    Create or update load balancer configuration
 * @access  Private (Admin)
 */
router.post('/load-balancer/config',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { 
        config_name, algorithm, health_check_interval, max_connections,
        connection_timeout, retry_attempts, circuit_breaker_threshold,
        circuit_breaker_timeout, sticky_session_enabled, session_timeout,
        weight_distribution, is_active 
      } = req.body;
      
      const result = await db.query(`
        INSERT INTO load_balancer_config (
          config_name, algorithm, health_check_interval, max_connections,
          connection_timeout, retry_attempts, circuit_breaker_threshold,
          circuit_breaker_timeout, sticky_session_enabled, session_timeout,
          weight_distribution, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (config_name) DO UPDATE SET
          algorithm = EXCLUDED.algorithm,
          health_check_interval = EXCLUDED.health_check_interval,
          max_connections = EXCLUDED.max_connections,
          connection_timeout = EXCLUDED.connection_timeout,
          retry_attempts = EXCLUDED.retry_attempts,
          circuit_breaker_threshold = EXCLUDED.circuit_breaker_threshold,
          circuit_breaker_timeout = EXCLUDED.circuit_breaker_timeout,
          sticky_session_enabled = EXCLUDED.sticky_session_enabled,
          session_timeout = EXCLUDED.session_timeout,
          weight_distribution = EXCLUDED.weight_distribution,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *
      `, [
        config_name, algorithm, health_check_interval, max_connections,
        connection_timeout, retry_attempts, circuit_breaker_threshold,
        circuit_breaker_timeout, sticky_session_enabled, session_timeout,
        weight_distribution || '{}', is_active, req.user.id
      ]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Update load balancer config error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update load balancer configuration'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/health
 * @desc    Get health monitoring data
 * @access  Private (Admin)
 */
router.get('/health',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { service_id, service_type, health_status, hours_back } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (service_id) {
        paramCount++;
        whereClause += ` AND service_id = $${paramCount}`;
        params.push(service_id);
      }
      
      if (service_type) {
        paramCount++;
        whereClause += ` AND service_type = $${paramCount}`;
        params.push(service_type);
      }
      
      if (health_status) {
        paramCount++;
        whereClause += ` AND health_status = $${paramCount}`;
        params.push(health_status);
      }
      
      const timeFilter = hours_back ? `AND timestamp > NOW() - (${hours_back} || ' hours')::INTERVAL` : '';
      
      const result = await db.query(`
        SELECT 
          id, service_id, service_type, health_status, response_time,
          error_message, check_type, check_details, timestamp
        FROM health_monitoring 
        ${whereClause}
        ${timeFilter}
        ORDER BY timestamp DESC
        LIMIT 100
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get health monitoring error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get health monitoring data'
      });
    }
  }
);

/**
 * @route   POST /api/scalability/health/update
 * @desc    Update service health status
 * @access  Private (Admin)
 */
router.post('/health/update',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 20 }),
  async (req, res) => {
    try {
      const { service_id, health_status, response_time, error_message } = req.body;
      
      await db.query(`
        SELECT update_service_health($1, $2, $3, $4)
      `, [service_id, health_status, response_time, error_message]);
      
      res.json({
        success: true,
        message: 'Health status updated successfully'
      });
    } catch (error) {
      console.error('❌ Update health status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update health status'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/load-distribution
 * @desc    Get load distribution metrics
 * @access  Private (Admin)
 */
router.get('/load-distribution',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { service_id, hours_back } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (service_id) {
        paramCount++;
        whereClause += ` AND service_id = $${paramCount}`;
        params.push(service_id);
      }
      
      const timeFilter = hours_back ? `AND timestamp > NOW() - (${hours_back} || ' hours')::INTERVAL` : '';
      
      const result = await db.query(`
        SELECT 
          id, service_id, request_count, active_connections, response_time_avg,
          response_time_min, response_time_max, error_count, success_rate,
          cpu_usage, memory_usage, load_factor, collection_interval, timestamp
        FROM load_distribution 
        ${whereClause}
        ${timeFilter}
        ORDER BY timestamp DESC
        LIMIT 100
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get load distribution error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get load distribution data'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/circuit-breakers
 * @desc    Get circuit breaker status
 * @access  Private (Admin)
 */
router.get('/circuit-breakers',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { service_name, service_type, status } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (service_name) {
        paramCount++;
        whereClause += ` AND service_name = $${paramCount}`;
        params.push(service_name);
      }
      
      if (service_type) {
        paramCount++;
        whereClause += ` AND service_type = $${paramCount}`;
        params.push(service_type);
      }
      
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      const result = await db.query(`
        SELECT 
          id, service_name, service_type, status, failure_count, threshold,
          timeout, total_requests, failed_requests, success_rate,
          last_failure_time, next_attempt_time, created_at, updated_at
        FROM circuit_breaker 
        ${whereClause}
        ORDER BY last_failure_time DESC NULLS LAST
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get circuit breakers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get circuit breaker data'
      });
    }
  }
);

/**
 * @route   POST /api/scalability/circuit-breakers/reset
 * @desc    Reset circuit breaker for a service
 * @access  Private (Admin)
 */
router.post('/circuit-breakers/reset',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { service_name, service_type } = req.body;
      
      await db.query(`
        UPDATE circuit_breaker 
        SET 
          status = 'closed',
          failure_count = 0,
          last_failure_time = NULL,
          next_attempt_time = NULL,
          updated_at = NOW()
        WHERE service_name = $1 AND service_type = $2
      `, [service_name, service_type]);
      
      res.json({
        success: true,
        message: 'Circuit breaker reset successfully'
      });
    } catch (error) {
      console.error('❌ Reset circuit breaker error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset circuit breaker'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/auto-scaling
 * @desc    Get auto-scaling events
 * @access  Private (Admin)
 */
router.get('/auto-scaling',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { event_type, trigger_type, status, days_back } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (event_type) {
        paramCount++;
        whereClause += ` AND event_type = $${paramCount}`;
        params.push(event_type);
      }
      
      if (trigger_type) {
        paramCount++;
        whereClause += ` AND trigger_type = $${paramCount}`;
        params.push(trigger_type);
      }
      
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      const timeFilter = days_back ? `AND created_at > NOW() - (${days_back} || ' days')::INTERVAL` : '';
      
      const result = await db.query(`
        SELECT 
          id, event_type, trigger_type, trigger_value, threshold_value,
          action_taken, target_service, scaling_factor, current_instances,
          new_instances, event_details, status, executed_at, created_at
        FROM auto_scaling_events 
        ${whereClause}
        ${timeFilter}
        ORDER BY created_at DESC
        LIMIT 100
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get auto-scaling events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get auto-scaling events'
      });
    }
  }
);

/**
 * @route   POST /api/scalability/auto-scaling/trigger
 * @desc    Manually trigger auto-scaling event
 * @access  Private (Admin)
 */
router.post('/auto-scaling/trigger',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 5 }),
  async (req, res) => {
    try {
      const { 
        event_type, trigger_type, trigger_value, threshold_value,
        action_taken, target_service, scaling_factor, current_instances,
        new_instances, event_details 
      } = req.body;
      
      const result = await db.query(`
        SELECT record_auto_scaling_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) as event_id
      `, [
        event_type, trigger_type, trigger_value, threshold_value,
        action_taken, target_service, scaling_factor, current_instances,
        new_instances, event_details || '{}'
      ]);
      
      res.json({
        success: true,
        data: {
          event_id: result.rows[0].event_id,
          message: 'Auto-scaling event triggered successfully'
        }
      });
    } catch (error) {
      console.error('❌ Trigger auto-scaling error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger auto-scaling event'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/high-availability
 * @desc    Get high availability status
 * @access  Private (Admin)
 */
router.get('/high-availability',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { service_name, availability_status } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (service_name) {
        paramCount++;
        whereClause += ` AND service_name = $${paramCount}`;
        params.push(service_name);
      }
      
      if (availability_status) {
        paramCount++;
        whereClause += ` AND availability_status = $${paramCount}`;
        params.push(availability_status);
      }
      
      const result = await db.query(`
        SELECT 
          id, service_name, availability_status, uptime_percentage,
          last_downtime, downtime_duration, failover_count,
          last_failover_time, backup_service, health_check_url,
          monitoring_enabled, alert_threshold, created_at, updated_at
        FROM high_availability 
        ${whereClause}
        ORDER BY service_name
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get high availability error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get high availability data'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/service-mesh
 * @desc    Get service mesh traces
 * @access  Private (Admin)
 */
router.get('/service-mesh',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { trace_id, service_name, operation_name, hours_back } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (trace_id) {
        paramCount++;
        whereClause += ` AND trace_id = $${paramCount}`;
        params.push(trace_id);
      }
      
      if (service_name) {
        paramCount++;
        whereClause += ` AND service_name = $${paramCount}`;
        params.push(service_name);
      }
      
      if (operation_name) {
        paramCount++;
        whereClause += ` AND operation_name = $${paramCount}`;
        params.push(operation_name);
      }
      
      const timeFilter = hours_back ? `AND start_time > NOW() - (${hours_back} || ' hours')::INTERVAL` : '';
      
      const result = await db.query(`
        SELECT 
          id, trace_id, span_id, parent_span_id, service_name, operation_name,
          request_id, client_ip, user_agent, request_method, request_path,
          request_headers, request_body_size, response_status_code, response_headers,
          response_body_size, duration, error_message, tags, start_time, end_time
        FROM service_mesh 
        ${whereClause}
        ${timeFilter}
        ORDER BY start_time DESC
        LIMIT 100
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get service mesh error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service mesh data'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/statistics
 * @desc    Get comprehensive scalability statistics
 * @access  Private (Admin)
 */
router.get('/statistics',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { hours_back = 24 } = req.query;
      
      const result = await db.query(`
        SELECT * FROM get_service_statistics($1)
      `, [hours_back]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Get scalability statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get scalability statistics'
      });
    }
  }
);

/**
 * @route   GET /api/scalability/dashboard
 * @desc    Get scalability dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      // Get comprehensive dashboard data
      const [
        serviceStats,
        loadBalancerStats,
        healthStats,
        circuitBreakerStats,
        autoScalingStats,
        highAvailabilityStats
      ] = await Promise.all([
        // Service statistics
        db.query('SELECT * FROM get_service_statistics(24)'),
        
        // Load balancer statistics
        db.query(`
          SELECT * FROM load_balancer_stats
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY timestamp DESC
          LIMIT 1
        `),
        
        // Health monitoring summary
        db.query(`
          SELECT 
            health_status,
            COUNT(*) as count,
            AVG(response_time) as avg_response_time
          FROM health_monitoring
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          GROUP BY health_status
        `),
        
        // Circuit breaker summary
        db.query(`
          SELECT 
            status,
            COUNT(*) as count,
            AVG(success_rate) as avg_success_rate
          FROM circuit_breaker
          GROUP BY status
        `),
        
        // Auto-scaling events summary
        db.query(`
          SELECT 
            event_type,
            COUNT(*) as count,
            AVG(scaling_factor) as avg_scaling_factor
          FROM auto_scaling_events
          WHERE created_at > NOW() - INTERVAL '24 hours'
          GROUP BY event_type
        `),
        
        // High availability summary
        db.query(`
          SELECT 
            availability_status,
            COUNT(*) as count,
            AVG(uptime_percentage) as avg_uptime
          FROM high_availability
          GROUP BY availability_status
        `)
      ]);
      
      res.json({
        success: true,
        data: {
          service_statistics: serviceStats.rows[0],
          load_balancer_stats: loadBalancerStats.rows[0],
          health_summary: healthStats.rows,
          circuit_breaker_summary: circuitBreakerStats.rows,
          auto_scaling_summary: autoScalingStats.rows,
          high_availability_summary: highAvailabilityStats.rows,
          generated: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Get scalability dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get scalability dashboard'
      });
    }
  }
);

/**
 * @route   POST /api/scalability/cleanup
 * @desc    Clean up old scalability data
 * @access  Private (Admin)
 */
router.post('/cleanup',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 5 }),
  async (req, res) => {
    try {
      const { 
        service_registry_days = 7, 
        health_monitoring_days = 3, 
        load_distribution_days = 1, 
        service_mesh_days = 1, 
        auto_scaling_days = 30 
      } = req.body;
      
      const result = await db.query(`
        SELECT cleanup_scalability_data($1, $2, $3, $4, $5) as deleted_count
      `, [
        service_registry_days, health_monitoring_days, load_distribution_days,
        service_mesh_days, auto_scaling_days
      ]);
      
      res.json({
        success: true,
        data: {
          deleted_count: result.rows[0].deleted_count,
          message: 'Scalability data cleanup completed successfully'
        }
      });
    } catch (error) {
      console.error('❌ Scalability cleanup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup scalability data'
      });
    }
  }
);

module.exports = router; 