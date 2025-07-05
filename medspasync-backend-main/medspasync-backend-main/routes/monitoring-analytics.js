/**
 * Monitoring & Analytics Routes
 * Enhanced monitoring dashboards, predictive analysis, and business intelligence for MedSpaSync Pro
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { enhancedMonitoringMiddleware, businessIntelligenceMiddleware, predictiveAnalyticsMiddleware, getMonitoringStatistics } = require('../middleware/monitoring-analytics');

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
  db: process.env.REDIS_DB || 8
});

/**
 * @route   GET /api/monitoring/overview
 * @desc    Get monitoring overview statistics
 * @access  Admin only
 */
router.get('/overview', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    
    // Get monitoring statistics
    const statistics = await getMonitoringStatistics();
    
    // Get real-time metrics from cache
    const [systemMetrics, businessMetrics, performanceMetrics, alerts] = await Promise.all([
      redisClient.get('system_metrics'),
      redisClient.get('business_metrics'),
      redisClient.get('performance_metrics'),
      db.query(`
        SELECT COUNT(*) as total_alerts,
               COUNT(*) FILTER (WHERE severity = 'high') as high_severity_alerts,
               COUNT(*) FILTER (WHERE acknowledged = false) as unacknowledged_alerts
        FROM monitoring_alerts 
        WHERE created_at > NOW() - INTERVAL '${hours} hours'
      `)
    ]);

    const overview = {
      statistics,
      real_time: {
        system: systemMetrics ? JSON.parse(systemMetrics) : null,
        business: businessMetrics ? JSON.parse(businessMetrics) : null,
        performance: performanceMetrics ? JSON.parse(performanceMetrics) : null,
        alerts: alerts.rows[0]
      },
      generated: new Date()
    };

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('❌ Monitoring overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring overview'
    });
  }
});

/**
 * @route   GET /api/monitoring/dashboard/:type
 * @desc    Get analytics dashboard data
 * @access  Admin only
 */
router.get('/dashboard/:type', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    let dashboardData = {};

    switch (type) {
      case 'overview':
        dashboardData = await getOverviewDashboard(hours);
        break;
      case 'performance':
        dashboardData = await getPerformanceDashboard(hours);
        break;
      case 'business':
        dashboardData = await getBusinessDashboard(hours);
        break;
      case 'security':
        dashboardData = await getSecurityDashboard(hours);
        break;
      case 'custom':
        dashboardData = await getCustomDashboard(req.query.config);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid dashboard type'
        });
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data'
    });
  }
});

/**
 * @route   GET /api/monitoring/metrics/system
 * @desc    Get system metrics
 * @access  Admin only
 */
router.get('/metrics/system', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const interval = req.query.interval || '1 hour';

    const systemMetrics = await db.query(`
      SELECT 
        DATE_TRUNC('${interval}', timestamp) as time_bucket,
        AVG((cpu_user + cpu_system) / 1000000) as avg_cpu_usage,
        AVG(memory_heap_used::DECIMAL / memory_heap_total * 100) as avg_memory_usage,
        AVG(memory_rss) as avg_memory_rss,
        AVG(uptime) as avg_uptime,
        COUNT(*) as data_points
      FROM system_metrics 
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
    `);

    // Get current system status
    const currentStatus = await db.query(`
      SELECT overall_status, database_status, redis_status, api_status
      FROM system_health 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

    res.json({
      success: true,
      data: {
        metrics: systemMetrics.rows,
        current_status: currentStatus.rows[0] || null,
        generated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ System metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics'
    });
  }
});

/**
 * @route   GET /api/monitoring/metrics/performance
 * @desc    Get performance metrics
 * @access  Admin only
 */
router.get('/metrics/performance', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const interval = req.query.interval || '1 hour';

    const performanceMetrics = await db.query(`
      SELECT 
        DATE_TRUNC('${interval}', rm.timestamp) as time_bucket,
        AVG(rm.duration) as avg_response_time,
        COUNT(*) FILTER (WHERE rm.status_code >= 400) as error_count,
        COUNT(*) as total_requests,
        (COUNT(*) FILTER (WHERE rm.status_code >= 400)::DECIMAL / COUNT(*) * 100) as error_rate,
        COUNT(DISTINCT req.user_id) as active_users
      FROM response_metrics rm
      LEFT JOIN request_metrics req ON rm.request_id = req.request_id
      WHERE rm.timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
    `);

    // Get top slow endpoints
    const slowEndpoints = await db.query(`
      SELECT 
        req.path,
        AVG(rm.duration) as avg_duration,
        COUNT(*) as request_count,
        COUNT(*) FILTER (WHERE rm.status_code >= 400) as error_count
      FROM response_metrics rm
      JOIN request_metrics req ON rm.request_id = req.request_id
      WHERE rm.timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY req.path
      ORDER BY AVG(rm.duration) DESC
      LIMIT 10
    `);

    // Get error distribution
    const errorDistribution = await db.query(`
      SELECT 
        status_code,
        COUNT(*) as count,
        AVG(duration) as avg_duration
      FROM response_metrics 
      WHERE timestamp > NOW() - INTERVAL '${hours} hours' 
      AND status_code >= 400
      GROUP BY status_code
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        metrics: performanceMetrics.rows,
        slow_endpoints: slowEndpoints.rows,
        error_distribution: errorDistribution.rows,
        generated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

/**
 * @route   GET /api/monitoring/metrics/business
 * @desc    Get business metrics
 * @access  Admin only
 */
router.get('/metrics/business', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const interval = req.query.interval || '1 hour';

    const businessMetrics = await db.query(`
      SELECT 
        DATE_TRUNC('${interval}', timestamp) as time_bucket,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction_value,
        COUNT(*) FILTER (WHERE status = 'success') as successful_transactions,
        (COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100) as success_rate
      FROM business_transactions 
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
    `);

    // Get user activity patterns
    const userActivity = await db.query(`
      SELECT 
        DATE_TRUNC('${interval}', timestamp) as time_bucket,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_actions,
        COUNT(DISTINCT session_id) as total_sessions
      FROM user_behavior 
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
    `);

    // Get top user actions
    const topActions = await db.query(`
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_behavior 
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        transactions: businessMetrics.rows,
        user_activity: userActivity.rows,
        top_actions: topActions.rows,
        generated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Business metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business metrics'
    });
  }
});

/**
 * @route   GET /api/monitoring/alerts
 * @desc    Get monitoring alerts
 * @access  Admin only
 */
router.get('/alerts', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { severity, acknowledged, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (severity) {
      params.push(severity);
      whereClause += ` AND severity = $${params.length}`;
    }

    if (acknowledged !== undefined) {
      params.push(acknowledged === 'true');
      whereClause += ` AND acknowledged = $${params.length}`;
    }

    const alerts = await db.query(`
      SELECT 
        id, alert_type, metric_name, current_value, threshold_value,
        severity, message, acknowledged, escalated, resolved,
        created_at, acknowledged_at, resolved_at
      FROM monitoring_alerts 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get alert statistics
    const alertStats = await db.query(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(*) FILTER (WHERE severity = 'high') as high_severity,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_severity,
        COUNT(*) FILTER (WHERE severity = 'low') as low_severity,
        COUNT(*) FILTER (WHERE acknowledged = false) as unacknowledged,
        COUNT(*) FILTER (WHERE escalated = true) as escalated
      FROM monitoring_alerts 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    res.json({
      success: true,
      data: {
        alerts: alerts.rows,
        statistics: alertStats.rows[0],
        generated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

/**
 * @route   POST /api/monitoring/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Admin only
 */
router.post('/alerts/:id/acknowledge', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const result = await db.query(`
      UPDATE monitoring_alerts 
      SET acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW(), message = COALESCE($2, message)
      WHERE id = $3
      RETURNING *
    `, [req.user.id, message, id]);

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
});

/**
 * @route   POST /api/monitoring/alerts/:id/resolve
 * @desc    Resolve an alert
 * @access  Admin only
 */
router.post('/alerts/:id/resolve', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const result = await db.query(`
      UPDATE monitoring_alerts 
      SET resolved = true, resolved_at = NOW(), message = COALESCE($1, message)
      WHERE id = $2
      RETURNING *
    `, [resolution_notes, id]);

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
    console.error('❌ Resolve alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

/**
 * @route   GET /api/analytics/predictions
 * @desc    Get predictive analytics data
 * @access  Admin only
 */
router.get('/predictions', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type, hours = 24 } = req.query;

    let predictions = {};

    if (type === 'user_behavior' || !type) {
      const userPredictions = await db.query(`
        SELECT prediction_data 
        FROM predictions 
        WHERE prediction_type = 'user_behavior' 
        AND generated_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY generated_at DESC 
        LIMIT 1
      `);

      if (userPredictions.rows.length > 0) {
        predictions.user_behavior = userPredictions.rows[0].prediction_data;
      }
    }

    if (type === 'system_load' || !type) {
      const systemPredictions = await db.query(`
        SELECT prediction_data 
        FROM predictions 
        WHERE prediction_type = 'system_load' 
        AND generated_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY generated_at DESC 
        LIMIT 1
      `);

      if (systemPredictions.rows.length > 0) {
        predictions.system_load = systemPredictions.rows[0].prediction_data;
      }
    }

    if (type === 'business_metrics' || !type) {
      const businessPredictions = await db.query(`
        SELECT prediction_data 
        FROM predictions 
        WHERE prediction_type = 'business_metrics' 
        AND generated_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY generated_at DESC 
        LIMIT 1
      `);

      if (businessPredictions.rows.length > 0) {
        predictions.business_metrics = businessPredictions.rows[0].prediction_data;
      }
    }

    res.json({
      success: true,
      data: predictions
    });

  } catch (error) {
    console.error('❌ Predictions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions'
    });
  }
});

/**
 * @route   GET /api/analytics/trends
 * @desc    Get trend analysis data
 * @access  Admin only
 */
router.get('/trends', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type, days = 30 } = req.query;

    let trends = {};

    if (type === 'user_activity' || !type) {
      const userTrends = await db.query(`
        SELECT 
          DATE_TRUNC('day', timestamp) as date,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_actions
        FROM user_behavior 
        WHERE timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date
      `);

      trends.user_activity = userTrends.rows;
    }

    if (type === 'performance' || !type) {
      const performanceTrends = await db.query(`
        SELECT 
          DATE_TRUNC('day', timestamp) as date,
          AVG(duration) as avg_response_time,
          COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
          COUNT(*) as total_requests
        FROM response_metrics 
        WHERE timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date
      `);

      trends.performance = performanceTrends.rows;
    }

    if (type === 'business' || !type) {
      const businessTrends = await db.query(`
        SELECT 
          DATE_TRUNC('day', timestamp) as date,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_transactions,
          SUM(amount) as total_revenue,
          AVG(amount) as avg_transaction_value
        FROM business_transactions 
        WHERE timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY date
      `);

      trends.business = businessTrends.rows;
    }

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('❌ Trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trends'
    });
  }
});

/**
 * @route   GET /api/analytics/reports
 * @desc    Get BI reports
 * @access  Admin only
 */
router.get('/reports', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;

    let whereClause = '';
    const params = [];

    if (type) {
      params.push(type);
      whereClause = `WHERE report_type = $1`;
    }

    const reports = await db.query(`
      SELECT id, report_type, report_data, generated_at
      FROM bi_reports 
      ${whereClause}
      ORDER BY generated_at DESC
      LIMIT $${params.length + 1}
    `, [...params, parseInt(limit)]);

    res.json({
      success: true,
      data: reports.rows
    });

  } catch (error) {
    console.error('❌ Reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

/**
 * @route   GET /api/analytics/kpis
 * @desc    Get KPI metrics
 * @access  Admin only
 */
router.get('/kpis', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { kpi_name, hours = 24 } = req.query;

    let whereClause = '';
    const params = [];

    if (kpi_name) {
      params.push(kpi_name);
      whereClause = `WHERE kpi_name = $1`;
    }

    const kpis = await db.query(`
      SELECT kpi_name, kpi_value, kpi_target, kpi_status, calculated_at
      FROM kpi_metrics 
      ${whereClause}
      AND calculated_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY calculated_at DESC
    `, params);

    // Get current KPI values
    const currentKpis = await db.query(`
      SELECT 
        'user_engagement' as kpi_name,
        COUNT(DISTINCT user_id) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours')::DECIMAL / 
        COUNT(DISTINCT user_id) as kpi_value,
        0.7 as kpi_target
      FROM user_behavior 
      WHERE timestamp > NOW() - INTERVAL '30 days'
      UNION ALL
      SELECT 
        'transaction_success_rate' as kpi_name,
        COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) as kpi_value,
        0.95 as kpi_target
      FROM business_transactions 
      WHERE timestamp > NOW() - INTERVAL '30 days'
      UNION ALL
      SELECT 
        'avg_response_time' as kpi_name,
        AVG(duration) as kpi_value,
        1000 as kpi_target
      FROM response_metrics 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);

    res.json({
      success: true,
      data: {
        historical: kpis.rows,
        current: currentKpis.rows,
        generated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ KPIs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get KPIs'
    });
  }
});

/**
 * @route   GET /api/analytics/dashboards
 * @desc    Get analytics dashboards
 * @access  Admin only
 */
router.get('/dashboards', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const dashboards = await db.query(`
      SELECT id, dashboard_name, dashboard_type, widget_config, refresh_interval, is_active, created_at
      FROM analytics_dashboard 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: dashboards.rows
    });

  } catch (error) {
    console.error('❌ Dashboards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboards'
    });
  }
});

/**
 * @route   POST /api/analytics/dashboards
 * @desc    Create analytics dashboard
 * @access  Admin only
 */
router.post('/dashboards', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { dashboard_name, dashboard_type, widget_config, refresh_interval = 300 } = req.body;

    const result = await db.query(`
      INSERT INTO analytics_dashboard (dashboard_name, dashboard_type, widget_config, refresh_interval, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [dashboard_name, dashboard_type, JSON.stringify(widget_config), refresh_interval, req.user.id]);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Create dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dashboard'
    });
  }
});

/**
 * @route   GET /api/analytics/widgets
 * @desc    Get analytics widgets
 * @access  Admin only
 */
router.get('/widgets', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const widgets = await db.query(`
      SELECT id, widget_name, widget_type, data_source, query_config, display_config, refresh_interval, is_active
      FROM analytics_widgets 
      WHERE is_active = true
      ORDER BY widget_name
    `);

    res.json({
      success: true,
      data: widgets.rows
    });

  } catch (error) {
    console.error('❌ Widgets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get widgets'
    });
  }
});

/**
 * @route   POST /api/analytics/widgets
 * @desc    Create analytics widget
 * @access  Admin only
 */
router.post('/widgets', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { widget_name, widget_type, data_source, query_config, display_config, refresh_interval = 60 } = req.body;

    const result = await db.query(`
      INSERT INTO analytics_widgets (widget_name, widget_type, data_source, query_config, display_config, refresh_interval)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [widget_name, widget_type, data_source, JSON.stringify(query_config), JSON.stringify(display_config), refresh_interval]);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Create widget error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create widget'
    });
  }
});

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Admin only
 */
router.get('/export', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type, format = 'json', start_date, end_date } = req.query;

    let data = {};

    switch (type) {
      case 'system_metrics':
        data = await exportSystemMetrics(start_date, end_date);
        break;
      case 'performance_metrics':
        data = await exportPerformanceMetrics(start_date, end_date);
        break;
      case 'business_metrics':
        data = await exportBusinessMetrics(start_date, end_date);
        break;
      case 'user_behavior':
        data = await exportUserBehavior(start_date, end_date);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: data
      });
    }

  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// Helper functions

async function getOverviewDashboard(hours) {
  const [systemHealth, performanceMetrics, userActivity, alerts] = await Promise.all([
    db.query(`SELECT overall_status, database_status, redis_status, api_status FROM system_health ORDER BY timestamp DESC LIMIT 1`),
    db.query(`SELECT AVG(duration) as avg_response_time, COUNT(*) FILTER (WHERE status_code >= 400) as error_count FROM response_metrics WHERE timestamp > NOW() - INTERVAL '${hours} hours'`),
    db.query(`SELECT COUNT(DISTINCT user_id) as active_users, COUNT(DISTINCT session_id) as total_sessions FROM user_behavior WHERE timestamp > NOW() - INTERVAL '${hours} hours'`),
    db.query(`SELECT COUNT(*) as total_alerts, COUNT(*) FILTER (WHERE severity = 'high') as high_severity FROM monitoring_alerts WHERE created_at > NOW() - INTERVAL '${hours} hours'`)
  ]);

  return {
    system_health: systemHealth.rows[0] || null,
    performance: performanceMetrics.rows[0] || null,
    user_activity: userActivity.rows[0] || null,
    alerts: alerts.rows[0] || null
  };
}

async function getPerformanceDashboard(hours) {
  const [responseTimes, errorDistribution, topEndpoints] = await Promise.all([
    db.query(`SELECT DATE_TRUNC('hour', timestamp) as hour, AVG(duration) as avg_duration FROM response_metrics WHERE timestamp > NOW() - INTERVAL '${hours} hours' GROUP BY hour ORDER BY hour`),
    db.query(`SELECT status_code, COUNT(*) as count FROM response_metrics WHERE timestamp > NOW() - INTERVAL '${hours} hours' AND status_code >= 400 GROUP BY status_code ORDER BY count DESC`),
    db.query(`SELECT req.path, AVG(rm.duration) as avg_duration, COUNT(*) as request_count FROM response_metrics rm JOIN request_metrics req ON rm.request_id = req.request_id WHERE rm.timestamp > NOW() - INTERVAL '${hours} hours' GROUP BY req.path ORDER BY AVG(rm.duration) DESC LIMIT 10`)
  ]);

  return {
    response_times: responseTimes.rows,
    error_distribution: errorDistribution.rows,
    top_endpoints: topEndpoints.rows
  };
}

async function getBusinessDashboard(hours) {
  const [userActivity, transactionMetrics, userBehavior] = await Promise.all([
    db.query(`SELECT DATE_TRUNC('hour', timestamp) as hour, COUNT(DISTINCT user_id) as active_users FROM user_behavior WHERE timestamp > NOW() - INTERVAL '${hours} hours' GROUP BY hour ORDER BY hour`),
    db.query(`SELECT COUNT(*) as total_transactions, SUM(amount) as total_revenue, AVG(amount) as avg_amount FROM business_transactions WHERE timestamp > NOW() - INTERVAL '${hours} hours'`),
    db.query(`SELECT action, COUNT(*) as count FROM user_behavior WHERE timestamp > NOW() - INTERVAL '${hours} hours' GROUP BY action ORDER BY count DESC LIMIT 10`)
  ]);

  return {
    user_activity: userActivity.rows,
    transaction_metrics: transactionMetrics.rows[0] || null,
    user_behavior: userBehavior.rows
  };
}

async function getSecurityDashboard(hours) {
  const [securityEvents, authFailures, suspiciousActivity] = await Promise.all([
    db.query(`SELECT event_type, severity, COUNT(*) as count FROM security_events WHERE timestamp > NOW() - INTERVAL '${hours} hours' GROUP BY event_type, severity ORDER BY count DESC`),
    db.query(`SELECT COUNT(*) as auth_failures FROM security_events WHERE timestamp > NOW() - INTERVAL '${hours} hours' AND event_type = 'authentication_failure'`),
    db.query(`SELECT COUNT(*) as suspicious_activities FROM security_events WHERE timestamp > NOW() - INTERVAL '${hours} hours' AND event_type = 'suspicious_activity'`)
  ]);

  return {
    security_events: securityEvents.rows,
    auth_failures: authFailures.rows[0] || null,
    suspicious_activities: suspiciousActivity.rows[0] || null
  };
}

async function getCustomDashboard(config) {
  // Parse custom dashboard configuration and generate data
  const dashboardConfig = JSON.parse(config);
  const data = {};

  for (const widget of dashboardConfig.widgets) {
    switch (widget.type) {
      case 'metric':
        data[widget.name] = await executeMetricQuery(widget.query);
        break;
      case 'chart':
        data[widget.name] = await executeChartQuery(widget.query);
        break;
      case 'table':
        data[widget.name] = await executeTableQuery(widget.query);
        break;
    }
  }

  return data;
}

async function executeMetricQuery(query) {
  const result = await db.query(query);
  return result.rows[0];
}

async function executeChartQuery(query) {
  const result = await db.query(query);
  return result.rows;
}

async function executeTableQuery(query) {
  const result = await db.query(query);
  return result.rows;
}

async function exportSystemMetrics(startDate, endDate) {
  const whereClause = buildDateWhereClause(startDate, endDate);
  const result = await db.query(`SELECT * FROM system_metrics ${whereClause} ORDER BY timestamp`);
  return result.rows;
}

async function exportPerformanceMetrics(startDate, endDate) {
  const whereClause = buildDateWhereClause(startDate, endDate);
  const result = await db.query(`SELECT * FROM response_metrics ${whereClause} ORDER BY timestamp`);
  return result.rows;
}

async function exportBusinessMetrics(startDate, endDate) {
  const whereClause = buildDateWhereClause(startDate, endDate);
  const result = await db.query(`SELECT * FROM business_transactions ${whereClause} ORDER BY timestamp`);
  return result.rows;
}

async function exportUserBehavior(startDate, endDate) {
  const whereClause = buildDateWhereClause(startDate, endDate);
  const result = await db.query(`SELECT * FROM user_behavior ${whereClause} ORDER BY timestamp`);
  return result.rows;
}

function buildDateWhereClause(startDate, endDate) {
  if (startDate && endDate) {
    return `WHERE timestamp BETWEEN '${startDate}' AND '${endDate}'`;
  } else if (startDate) {
    return `WHERE timestamp >= '${startDate}'`;
  } else if (endDate) {
    return `WHERE timestamp <= '${endDate}'`;
  }
  return '';
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router; 