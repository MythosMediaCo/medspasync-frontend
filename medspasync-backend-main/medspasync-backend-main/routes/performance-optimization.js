/**
 * Performance Optimization API Routes
 * Database query optimization, caching, connection pooling, and monitoring for MedSpaSync Pro
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const { rateLimiter } = require('../middleware/rateLimiter');

// Performance optimization middleware
const { 
  optimizeDatabaseQueries, 
  getPerformanceStatistics, 
  optimizeDatabaseIndexes, 
  checkConnectionPoolHealth 
} = require('../middleware/performance-optimization');

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
  db: process.env.REDIS_DB || 6
});

// Apply performance optimization to all routes
router.use(optimizeDatabaseQueries);

/**
 * @route   GET /api/performance/status
 * @desc    Get overall performance status
 * @access  Private (Admin)
 */
router.get('/status', 
  authenticateToken, 
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const stats = await getPerformanceStatistics();
      
      res.json({
        success: true,
        data: {
          overall_status: stats.avg_duration < 100 ? 'EXCELLENT' : 
                         stats.avg_duration < 500 ? 'GOOD' : 
                         stats.avg_duration < 1000 ? 'FAIR' : 'POOR',
          statistics: stats,
          last_updated: new Date(),
          metrics: {
            query_performance: {
              status: stats.avg_duration < 500 ? 'GOOD' : 'NEEDS_ATTENTION',
              avg_duration: stats.avg_duration || 0,
              slow_queries: stats.slow_queries || 0
            },
            cache_performance: {
              status: (stats.cache_hit_rate || 0) > 70 ? 'GOOD' : 'NEEDS_ATTENTION',
              hit_rate: stats.cache_hit_rate || 0
            },
            connection_pool: {
              status: (stats.active_connections || 0) < 15 ? 'GOOD' : 'NEEDS_ATTENTION',
              active_connections: stats.active_connections || 0,
              idle_connections: stats.idle_connections || 0
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Get performance status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance status'
      });
    }
  }
);

/**
 * @route   GET /api/performance/logs
 * @desc    Get performance logs with filtering
 * @access  Private (Admin)
 */
router.get('/logs',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 50 }),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, start_date, end_date, status, min_duration, max_duration } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (start_date) {
        paramCount++;
        whereClause += ` AND timestamp >= $${paramCount}`;
        params.push(start_date);
      }
      
      if (end_date) {
        paramCount++;
        whereClause += ` AND timestamp <= $${paramCount}`;
        params.push(end_date + ' 23:59:59');
      }
      
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      if (min_duration) {
        paramCount++;
        whereClause += ` AND duration >= $${paramCount}`;
        params.push(parseInt(min_duration));
      }
      
      if (max_duration) {
        paramCount++;
        whereClause += ` AND duration <= $${paramCount}`;
        params.push(parseInt(max_duration));
      }
      
      const logsQuery = `
        SELECT 
          id, query_id, query_text, duration, status, error_message,
          timestamp, user_id, ip_address, user_agent, execution_plan,
          rows_affected, created_at
        FROM performance_logs 
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM performance_logs 
        ${whereClause}
      `;
      
      params.push(limit, offset);
      
      const [logsResult, countResult] = await Promise.all([
        db.query(logsQuery, params),
        db.query(countQuery, params.slice(0, -2))
      ]);
      
      res.json({
        success: true,
        data: {
          logs: logsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get performance logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance logs'
      });
    }
  }
);

/**
 * @route   GET /api/performance/alerts
 * @desc    Get performance alerts
 * @access  Private (Admin)
 */
router.get('/alerts',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { status, severity, acknowledged } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      if (severity) {
        paramCount++;
        whereClause += ` AND severity = $${paramCount}`;
        params.push(severity);
      }
      
      if (acknowledged !== undefined) {
        paramCount++;
        whereClause += ` AND acknowledged = $${paramCount}`;
        params.push(acknowledged === 'true');
      }
      
      const result = await db.query(`
        SELECT 
          pa.*,
          u.email as acknowledged_by_email,
          u.first_name as acknowledged_by_first_name,
          u.last_name as acknowledged_by_last_name
        FROM performance_alerts pa
        LEFT JOIN users u ON pa.acknowledged_by = u.id
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 100
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get performance alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance alerts'
      });
    }
  }
);

/**
 * @route   POST /api/performance/alerts/:id/acknowledge
 * @desc    Acknowledge performance alert
 * @access  Private (Admin)
 */
router.post('/alerts/:id/acknowledge',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 20 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.query(`
        UPDATE performance_alerts 
        SET 
          acknowledged = true,
          acknowledged_by = $1,
          acknowledged_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [req.user.id, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Acknowledge alert error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert'
      });
    }
  }
);

/**
 * @route   GET /api/performance/query-patterns
 * @desc    Get query patterns analysis
 * @access  Private (Admin)
 */
router.get('/query-patterns',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { days_back = 7, optimization_needed } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (optimization_needed === 'true') {
        whereClause += ` AND (avg_duration > 500 OR execution_count > 1000)`;
      }
      
      const result = await db.query(`
        SELECT 
          pattern_hash, query_pattern, execution_count, avg_duration,
          total_duration, min_duration, max_duration, last_executed,
          first_seen, optimization_suggestions, is_optimized
        FROM query_patterns 
        ${whereClause}
        AND last_executed > NOW() - ($${paramCount + 1} || ' days')::INTERVAL
        ORDER BY total_duration DESC
        LIMIT 50
      `, [days_back]);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get query patterns error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get query patterns'
      });
    }
  }
);

/**
 * @route   GET /api/performance/slow-queries
 * @desc    Get slow queries analysis
 * @access  Private (Admin)
 */
router.get('/slow-queries',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { threshold = 1000, limit = 50 } = req.query;
      
      const result = await db.query(`
        SELECT 
          query_text, duration, timestamp, execution_count
        FROM get_slow_queries($1, $2)
      `, [parseInt(threshold), parseInt(limit)]);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get slow queries error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get slow queries'
      });
    }
  }
);

/**
 * @route   GET /api/performance/index-usage
 * @desc    Get index usage statistics
 * @access  Private (Admin)
 */
router.get('/index-usage',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { unused_only, usage_threshold } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (unused_only === 'true') {
        whereClause += ` AND is_used = false`;
      }
      
      if (usage_threshold) {
        paramCount++;
        whereClause += ` AND usage_percentage < $${paramCount}`;
        params.push(parseFloat(usage_threshold));
      }
      
      const result = await db.query(`
        SELECT 
          schema_name, table_name, index_name, scans_count,
          tuples_read, tuples_fetched, last_used, is_used,
          usage_percentage, collection_date
        FROM index_usage_stats 
        ${whereClause}
        ORDER BY scans_count DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get index usage error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get index usage'
      });
    }
  }
);

/**
 * @route   GET /api/performance/connection-pool
 * @desc    Get connection pool statistics
 * @access  Private (Admin)
 */
router.get('/connection-pool',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const poolHealth = await checkConnectionPoolHealth();
      
      const result = await db.query(`
        SELECT 
          total_connections, active_connections, idle_connections,
          waiting_connections, max_connections, connection_wait_time,
          connection_errors, timestamp
        FROM connection_pool_stats
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC
        LIMIT 100
      `);
      
      res.json({
        success: true,
        data: {
          current_health: poolHealth,
          historical_data: result.rows
        }
      });
    } catch (error) {
      console.error('❌ Get connection pool stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get connection pool stats'
      });
    }
  }
);

/**
 * @route   GET /api/performance/cache-stats
 * @desc    Get cache performance statistics
 * @access  Private (Admin)
 */
router.get('/cache-stats',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          hit_rate, total_commands, connected_clients, used_memory,
          cache_evictions, cache_misses, cache_hits, timestamp
        FROM cache_performance
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC
        LIMIT 100
      `);
      
      // Get current cache stats from Redis
      const redisInfo = await redisClient.info('stats');
      const stats = {};
      redisInfo.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });
      
      res.json({
        success: true,
        data: {
          historical_data: result.rows,
          current_stats: stats
        }
      });
    } catch (error) {
      console.error('❌ Get cache stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cache stats'
      });
    }
  }
);

/**
 * @route   GET /api/performance/reports
 * @desc    Get performance reports
 * @access  Private (Admin)
 */
router.get('/reports',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { report_type, is_archived } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (report_type) {
        paramCount++;
        whereClause += ` AND report_type = $${paramCount}`;
        params.push(report_type);
      }
      
      if (is_archived !== undefined) {
        paramCount++;
        whereClause += ` AND is_archived = $${paramCount}`;
        params.push(is_archived === 'true');
      }
      
      const result = await db.query(`
        SELECT 
          id, report_type, report_period, report_data, summary,
          generated_at, is_archived, archived_at
        FROM performance_reports 
        ${whereClause}
        ORDER BY generated_at DESC
        LIMIT 50
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get performance reports error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance reports'
      });
    }
  }
);

/**
 * @route   POST /api/performance/reports/generate
 * @desc    Generate new performance report
 * @access  Private (Admin)
 */
router.post('/reports/generate',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { report_type, report_period } = req.body;
      
      // Generate report using database function
      const result = await db.query(`
        SELECT generate_performance_report($1, $2) as report_id
      `, [report_type, report_period]);
      
      const reportId = result.rows[0].report_id;
      
      // Get the generated report
      const reportResult = await db.query(`
        SELECT * FROM performance_reports WHERE id = $1
      `, [reportId]);
      
      res.json({
        success: true,
        data: reportResult.rows[0]
      });
    } catch (error) {
      console.error('❌ Generate performance report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate performance report'
      });
    }
  }
);

/**
 * @route   GET /api/performance/recommendations
 * @desc    Get optimization recommendations
 * @access  Private (Admin)
 */
router.get('/recommendations',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { status, priority } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      if (priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        params.push(priority);
      }
      
      const result = await db.query(`
        SELECT 
          id, recommendation_type, priority, title, description,
          impact_score, implementation_effort, estimated_improvement,
          affected_components, sql_script, status, implemented_at,
          implemented_by, created_at, updated_at
        FROM optimization_recommendations 
        ${whereClause}
        ORDER BY priority DESC, impact_score DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get optimization recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get optimization recommendations'
      });
    }
  }
);

/**
 * @route   POST /api/performance/recommendations/:id/implement
 * @desc    Implement optimization recommendation
 * @access  Private (Admin)
 */
router.post('/recommendations/:id/implement',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.query(`
        UPDATE optimization_recommendations 
        SET 
          status = 'IMPLEMENTED',
          implemented_at = NOW(),
          implemented_by = $1
        WHERE id = $2
        RETURNING *
      `, [req.user.id, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Recommendation not found'
        });
      }
      
      // Execute SQL script if provided
      const recommendation = result.rows[0];
      if (recommendation.sql_script) {
        try {
          await db.query(recommendation.sql_script);
          console.log('✅ Optimization SQL executed successfully');
        } catch (sqlError) {
          console.error('❌ Optimization SQL execution failed:', sqlError);
          return res.status(500).json({
            success: false,
            error: 'Failed to execute optimization SQL'
          });
        }
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Implement recommendation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to implement recommendation'
      });
    }
  }
);

/**
 * @route   GET /api/performance/baselines
 * @desc    Get performance baselines
 * @access  Private (Admin)
 */
router.get('/baselines',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          id, baseline_name, baseline_type, metric_name, baseline_value,
          acceptable_range, is_active, created_by, created_at, updated_at
        FROM performance_baselines
        ORDER BY baseline_type, baseline_name
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get performance baselines error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance baselines'
      });
    }
  }
);

/**
 * @route   POST /api/performance/baselines
 * @desc    Create new performance baseline
 * @access  Private (Admin)
 */
router.post('/baselines',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { 
        baseline_name, baseline_type, metric_name, baseline_value, 
        acceptable_range, is_active = true 
      } = req.body;
      
      const result = await db.query(`
        INSERT INTO performance_baselines (
          baseline_name, baseline_type, metric_name, baseline_value,
          acceptable_range, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        baseline_name, baseline_type, metric_name, baseline_value,
        acceptable_range, is_active, req.user.id
      ]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Create performance baseline error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create performance baseline'
      });
    }
  }
);

/**
 * @route   GET /api/performance/dashboard
 * @desc    Get performance dashboard data
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
        statsResult,
        recentAlertsResult,
        slowQueriesResult,
        queryPatternsResult,
        cacheStatsResult,
        connectionPoolResult
      ] = await Promise.all([
        // Performance statistics
        db.query('SELECT * FROM get_performance_statistics(24)'),
        
        // Recent alerts
        db.query(`
          SELECT * FROM performance_alerts
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY timestamp DESC
          LIMIT 10
        `),
        
        // Slow queries
        db.query('SELECT * FROM get_slow_queries(1000, 10)'),
        
        // Query patterns
        db.query('SELECT * FROM analyze_query_patterns(1) LIMIT 10'),
        
        // Cache statistics
        db.query(`
          SELECT * FROM cache_performance
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY timestamp DESC
          LIMIT 1
        `),
        
        // Connection pool health
        checkConnectionPoolHealth()
      ]);
      
      res.json({
        success: true,
        data: {
          statistics: statsResult.rows[0],
          recent_alerts: recentAlertsResult.rows,
          slow_queries: slowQueriesResult.rows,
          query_patterns: queryPatternsResult.rows,
          cache_stats: cacheStatsResult.rows[0],
          connection_pool: connectionPoolResult,
          generated: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Get performance dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance dashboard'
      });
    }
  }
);

/**
 * @route   POST /api/performance/optimize-indexes
 * @desc    Optimize database indexes
 * @access  Private (Admin)
 */
router.post('/optimize-indexes',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 5 }),
  async (req, res) => {
    try {
      const indexOptimization = await optimizeDatabaseIndexes();
      
      res.json({
        success: true,
        data: indexOptimization
      });
    } catch (error) {
      console.error('❌ Optimize indexes error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize indexes'
      });
    }
  }
);

/**
 * @route   POST /api/performance/cleanup
 * @desc    Clean up old performance data
 * @access  Private (Admin)
 */
router.post('/cleanup',
  authenticateToken,
  requireRole('ADMIN'),
  rateLimiter({ windowMs: 60000, max: 5 }),
  async (req, res) => {
    try {
      const { logs_days = 30, alerts_days = 90, stats_days = 7 } = req.body;
      
      const deletedCount = await db.query(`
        SELECT cleanup_performance_data($1, $2, $3) as deleted_count
      `, [logs_days, alerts_days, stats_days]);
      
      res.json({
        success: true,
        data: {
          deleted_count: deletedCount.rows[0].deleted_count,
          message: 'Performance data cleanup completed successfully'
        }
      });
    } catch (error) {
      console.error('❌ Performance cleanup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup performance data'
      });
    }
  }
);

module.exports = router; 