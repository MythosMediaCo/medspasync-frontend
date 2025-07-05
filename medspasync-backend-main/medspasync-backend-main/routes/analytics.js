/**
 * Analytics API Routes
 * Real-time dashboard and analytics endpoints for MedSpa Analytics Pro
 * Performance target: <200ms response time for all dashboard endpoints
 * Enhanced with real-time streaming, intelligent caching, and performance validation
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { Pool } = require('pg');
const Redis = require('ioredis');
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const { rateLimiter } = require('../middleware/rateLimiter');
const { DatabaseOptimizer } = require('../src/services/ai/optimization/DatabaseOptimizer');
const { PrismaClient } = require('@prisma/client');
const { EventEmitter } = require('events');

// Database connection with optimized pool for analytics
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  min: 5,
  idle: 10000,
  acquire: 30000
});

// Enhanced Redis connection for caching and real-time updates
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '6'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Real-time event emitter for live updates
const realTimeEvents = new EventEmitter();
realTimeEvents.setMaxListeners(1000);

// Input validation schemas
const AnalyticsQuerySchema = z.object({
  spa_id: z.string().uuid('Invalid spa ID format'),
  metric_type: z.enum(['revenue', 'appointments', 'providers', 'treatments', 'clients']),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  filters: z.record(z.any()).optional()
});

const DashboardQuerySchema = z.object({
  spa_id: z.string().uuid('Invalid spa ID format'),
  date_range: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  include_alerts: z.boolean().optional().default(true)
});

const performanceQuerySchema = z.object({
  spa_id: z.string().min(1, 'Spa ID is required')
});

const prisma = new PrismaClient();
const databaseOptimizer = new DatabaseOptimizer();

// Enhanced Analytics API Controller with Real-time Capabilities
class AnalyticsAPIController {
  constructor(db, redis, eventEmitter) {
    this.db = db;
    this.redis = redis;
    this.eventEmitter = eventEmitter;
    this.cacheTTL = 30; // 30 seconds cache for real-time data
    this.performanceTarget = 200; // <200ms target
    this.databaseOptimizer = new DatabaseOptimizer();
    this.activeSubscriptions = new Map();
    
    // Setup real-time data updates
    this.setupRealTimeUpdates();
  }

  /**
   * Setup real-time data updates from database changes
   */
  setupRealTimeUpdates() {
    // Listen for database changes and emit real-time updates
    setInterval(async () => {
      try {
        const updates = await this.getRealTimeUpdates();
        Object.entries(updates).forEach(([spaId, data]) => {
          this.eventEmitter.emit(`analytics:${spaId}`, data);
        });
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Get real-time updates for all active spas
   */
  async getRealTimeUpdates() {
    const updates = {};
    
    try {
      // Get recent appointments, revenue, and alerts
      const recentData = await this.db.query(`
        SELECT 
          p.id as practice_id,
          COUNT(a.id) as new_appointments,
          SUM(a.amount) as new_revenue,
          COUNT(DISTINCT a.client_id) as new_clients
        FROM practices p
        LEFT JOIN appointments a ON p.id = a.practice_id 
          AND a.created_at >= NOW() - INTERVAL '5 minutes'
          AND a.status = 'COMPLETED'
        GROUP BY p.id
      `);

      recentData.rows.forEach(row => {
        updates[row.practice_id] = {
          timestamp: new Date().toISOString(),
          new_appointments: parseInt(row.new_appointments) || 0,
          new_revenue: parseFloat(row.new_revenue) || 0,
          new_clients: parseInt(row.new_clients) || 0
        };
      });
    } catch (error) {
      console.error('Error getting real-time updates:', error);
    }

    return updates;
  }

  async getMetrics(req, res) {
    try {
      const startTime = performance.now();
      const query = AnalyticsQuerySchema.parse(req.query);
      const cacheKey = `metrics:${JSON.stringify(query)}`;

      // Check cache first
      let metrics = await getCachedData(cacheKey);

      if (!metrics) {
        // Generate metrics based on type
        metrics = await this.generateMetrics(query);
        
        const processingTime = performance.now() - startTime;
        metrics.processing_time_ms = processingTime;
        
        // Validate performance target
        if (processingTime > this.performanceTarget) {
          console.warn('Analytics API performance degraded', { 
            processing_time: processingTime,
            query 
          });
        }
        
        // Cache for future requests
        await setCachedData(cacheKey, metrics);
      }

      res.json({
        success: true,
        data: metrics,
        cached: metrics.processing_time_ms === undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors
        });
      }
      
      console.error('Analytics API error', { error, user: req.user.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRealtimeMetrics(req, res) {
    const { spa_id } = req.params;
    const startTime = performance.now();
    
    // Validate spa access
    if (!req.user.practiceId || req.user.practiceId !== spa_id) {
      return res.status(403).json({ error: 'Access denied to this spa' });
    }
    
    // Set up Server-Sent Events for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    // Send initial data with performance tracking
    try {
      const initialMetrics = await this.getCurrentMetrics(spa_id);
      const processingTime = performance.now() - startTime;
      
      initialMetrics.processing_time_ms = processingTime;
      initialMetrics.timestamp = new Date().toISOString();
      
      res.write(`data: ${JSON.stringify(initialMetrics)}\n\n`);
      
      // Validate performance target
      if (processingTime > this.performanceTarget) {
        console.warn('Real-time metrics performance degraded', { 
          processing_time: processingTime,
          spa_id 
        });
      }
    } catch (error) {
      console.error('Error getting initial metrics:', error);
      res.write(`data: ${JSON.stringify({ error: 'Failed to get initial metrics' })}\n\n`);
    }
    
    // Subscribe to real-time updates
    const updateHandler = (data) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error sending real-time update:', error);
      }
    };
    
    this.eventEmitter.on(`analytics:${spa_id}`, updateHandler);
    
    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
      } catch (error) {
        clearInterval(heartbeat);
      }
    }, 30000);
    
    // Cleanup on client disconnect
    req.on('close', () => {
      this.eventEmitter.off(`analytics:${spa_id}`, updateHandler);
      clearInterval(heartbeat);
      console.log(`Client disconnected from real-time metrics for spa: ${spa_id}`);
    });
    
    // Handle connection errors
    req.on('error', (error) => {
      console.error('Real-time connection error:', error);
      this.eventEmitter.off(`analytics:${spa_id}`, updateHandler);
      clearInterval(heartbeat);
    });
  }

  /**
   * Get current metrics for a spa
   */
  async getCurrentMetrics(spa_id) {
    const cacheKey = `current_metrics:${spa_id}`;
    
    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Get real-time metrics from database
    const metrics = await this.db.query(`
      SELECT 
        COUNT(a.id) as total_appointments_today,
        SUM(a.amount) as total_revenue_today,
        COUNT(DISTINCT a.client_id) as unique_clients_today,
        AVG(a.amount) as avg_appointment_value,
        COUNT(s.id) as active_staff
      FROM practices p
      LEFT JOIN appointments a ON p.id = a.practice_id 
        AND DATE(a.created_at) = CURRENT_DATE
        AND a.status = 'COMPLETED'
      LEFT JOIN staff s ON p.id = s.practice_id AND s.is_active = true
      WHERE p.id = $1
      GROUP BY p.id
    `, [spa_id]);
    
    const result = {
      spa_id,
      metrics: metrics.rows[0] || {
        total_appointments_today: 0,
        total_revenue_today: 0,
        unique_clients_today: 0,
        avg_appointment_value: 0,
        active_staff: 0
      },
      last_updated: new Date().toISOString()
    };
    
    // Cache for 30 seconds
    await this.redis.setex(cacheKey, 30, JSON.stringify(result));
    
    return result;
  }

  async getDashboardData(spaId, dateRange = 'month', includeAlerts = true) {
    const startTime = Date.now();
    const cacheKey = `dashboard:${spaId}:${dateRange}:${includeAlerts}`;

    try {
      // Check cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        data.loadTimeMs = Date.now() - startTime;
        data.cached = true;
        return data;
      }

      // Parallel data fetching for performance
      const [revenueData, appointmentData, providerData, alertData] = await Promise.all([
        this.getRevenueMetrics(spaId, dateRange),
        this.getAppointmentMetrics(spaId, dateRange),
        this.getProviderMetrics(spaId, dateRange),
        includeAlerts ? this.getActiveAlerts(spaId) : Promise.resolve([])
      ]);

      const dashboardData = {
        spa_id: spaId,
        date_range: dateRange,
        revenue: revenueData,
        appointments: appointmentData,
        providers: providerData,
        alerts: alertData,
        generated_at: new Date().toISOString(),
        loadTimeMs: Date.now() - startTime,
        cached: false
      };

      // Cache the result
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(dashboardData));

      return dashboardData;
    } catch (error) {
      console.error('Dashboard data aggregation error:', error);
      throw new Error('Failed to aggregate dashboard data');
    }
  }

  async getRevenueMetrics(spaId, dateRange) {
    const dateFilter = this.getDateFilter(dateRange);
    
    const result = await this.db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as transaction_count,
        COALESCE(AVG(amount), 0) as avg_transaction_value,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM transactions 
      WHERE spa_id = $1 AND created_at >= $2
    `, [spaId, dateFilter]);

    const row = result.rows[0];
    return {
      total_revenue: parseFloat(row.total_revenue),
      transaction_count: parseInt(row.transaction_count),
      avg_transaction_value: parseFloat(row.avg_transaction_value),
      active_days: parseInt(row.active_days),
      daily_average: row.active_days > 0 ? parseFloat(row.total_revenue) / row.active_days : 0
    };
  }

  async getAppointmentMetrics(spaId, dateRange) {
    const dateFilter = this.getDateFilter(dateRange);
    
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_appointments,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_appointments,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show_appointments,
        COALESCE(AVG(duration_minutes), 0) as avg_duration_minutes
      FROM appointments 
      WHERE spa_id = $1 AND scheduled_at >= $2
    `, [spaId, dateFilter]);

    const row = result.rows[0];
    const total = parseInt(row.total_appointments);
    return {
      total_appointments: total,
      completed_appointments: parseInt(row.completed_appointments),
      cancelled_appointments: parseInt(row.cancelled_appointments),
      no_show_appointments: parseInt(row.no_show_appointments),
      completion_rate: total > 0 ? (parseInt(row.completed_appointments) / total) * 100 : 0,
      avg_duration_minutes: parseFloat(row.avg_duration_minutes)
    };
  }

  async getProviderMetrics(spaId, dateRange) {
    const dateFilter = this.getDateFilter(dateRange);
    
    const result = await this.db.query(`
      SELECT 
        COUNT(DISTINCT provider_id) as active_providers,
        COALESCE(AVG(appointments_per_provider), 0) as avg_appointments_per_provider,
        COALESCE(MAX(appointments_per_provider), 0) as max_appointments_per_provider
      FROM (
        SELECT 
          provider_id,
          COUNT(*) as appointments_per_provider
        FROM appointments 
        WHERE spa_id = $1 AND scheduled_at >= $2
        GROUP BY provider_id
      ) provider_stats
    `, [spaId, dateFilter]);

    const row = result.rows[0];
    return {
      active_providers: parseInt(row.active_providers),
      avg_appointments_per_provider: parseFloat(row.avg_appointments_per_provider),
      max_appointments_per_provider: parseInt(row.max_appointments_per_provider)
    };
  }

  async getActiveAlerts(spaId) {
    // Get active alerts for the spa
    const alerts = await prisma.alert.findMany({
      where: {
        spa_id: spaId,
        status: 'ACTIVE',
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      created_at: alert.created_at
    }));
  }

  getDateFilter(dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  async generateMetrics(query) {
    const { spa_id, metric_type, date_range, granularity, filters } = query;
    
    switch (metric_type) {
      case 'revenue':
        return await this.generateRevenueMetrics(spa_id, date_range, granularity, filters);
      case 'appointments':
        return await this.generateAppointmentMetrics(spa_id, date_range, granularity, filters);
      case 'providers':
        return await this.generateProviderMetrics(spa_id, date_range, granularity, filters);
      case 'treatments':
        return await this.generateTreatmentMetrics(spa_id, date_range, granularity, filters);
      case 'clients':
        return await this.generateClientMetrics(spa_id, date_range, granularity, filters);
      default:
        throw new Error(`Unsupported metric type: ${metric_type}`);
    }
  }

  async generateRevenueMetrics(spa_id, date_range, granularity, filters) {
    const granularityClause = this.getGranularityClause(granularity);
    
    const result = await this.db.query(`
      SELECT 
        ${granularityClause} as period,
        SUM(amount) as revenue,
        COUNT(*) as transactions,
        AVG(amount) as avg_value
      FROM transactions 
      WHERE spa_id = $1 
      AND created_at BETWEEN $2 AND $3
      GROUP BY ${granularityClause}
      ORDER BY period
    `, [spa_id, date_range.start, date_range.end]);

    return {
      type: 'revenue',
      granularity,
      data: result.rows.map(row => ({
        period: row.period,
        revenue: parseFloat(row.revenue),
        transactions: parseInt(row.transactions),
        avg_value: parseFloat(row.avg_value)
      }))
    };
  }

  async generateAppointmentMetrics(spa_id, date_range, granularity, filters) {
    const granularityClause = this.getGranularityClause(granularity);
    
    const result = await this.db.query(`
      SELECT 
        ${granularityClause} as period,
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_shows
      FROM appointments 
      WHERE spa_id = $1 
      AND scheduled_at BETWEEN $2 AND $3
      GROUP BY ${granularityClause}
      ORDER BY period
    `, [spa_id, date_range.start, date_range.end]);

    return {
      type: 'appointments',
      granularity,
      data: result.rows.map(row => ({
        period: row.period,
        total: parseInt(row.total_appointments),
        completed: parseInt(row.completed),
        cancelled: parseInt(row.cancelled),
        no_shows: parseInt(row.no_shows),
        completion_rate: row.total_appointments > 0 ? (parseInt(row.completed) / parseInt(row.total_appointments)) * 100 : 0
      }))
    };
  }

  async generateProviderMetrics(spa_id, date_range, granularity, filters) {
    const granularityClause = this.getGranularityClause(granularity);
    
    const result = await this.db.query(`
      SELECT 
        ${granularityClause} as period,
        COUNT(DISTINCT provider_id) as active_providers,
        AVG(appointments_per_provider) as avg_appointments,
        MAX(appointments_per_provider) as max_appointments
      FROM (
        SELECT 
          provider_id,
          ${granularityClause} as period,
          COUNT(*) as appointments_per_provider
        FROM appointments 
        WHERE spa_id = $1 
        AND scheduled_at BETWEEN $2 AND $3
        GROUP BY provider_id, ${granularityClause}
      ) provider_stats
      GROUP BY ${granularityClause}
      ORDER BY period
    `, [spa_id, date_range.start, date_range.end]);

    return {
      type: 'providers',
      granularity,
      data: result.rows.map(row => ({
        period: row.period,
        active_providers: parseInt(row.active_providers),
        avg_appointments: parseFloat(row.avg_appointments),
        max_appointments: parseInt(row.max_appointments)
      }))
    };
  }

  async generateTreatmentMetrics(spa_id, date_range, granularity, filters) {
    const granularityClause = this.getGranularityClause(granularity);
    
    const result = await this.db.query(`
      SELECT 
        ${granularityClause} as period,
        treatment_category,
        COUNT(*) as treatments,
        SUM(amount) as revenue,
        AVG(amount) as avg_value
      FROM transactions 
      WHERE spa_id = $1 
      AND created_at BETWEEN $2 AND $3
      GROUP BY ${granularityClause}, treatment_category
      ORDER BY period, revenue DESC
    `, [spa_id, date_range.start, date_range.end]);

    return {
      type: 'treatments',
      granularity,
      data: result.rows.map(row => ({
        period: row.period,
        category: row.treatment_category,
        treatments: parseInt(row.treatments),
        revenue: parseFloat(row.revenue),
        avg_value: parseFloat(row.avg_value)
      }))
    };
  }

  async generateClientMetrics(spa_id, date_range, granularity, filters) {
    const granularityClause = this.getGranularityClause(granularity);
    
    const result = await this.db.query(`
      SELECT 
        ${granularityClause} as period,
        COUNT(DISTINCT client_id) as new_clients,
        COUNT(DISTINCT client_id) FILTER (WHERE is_returning = true) as returning_clients
      FROM appointments 
      WHERE spa_id = $1 
      AND scheduled_at BETWEEN $2 AND $3
      GROUP BY ${granularityClause}
      ORDER BY period
    `, [spa_id, date_range.start, date_range.end]);

    return {
      type: 'clients',
      granularity,
      data: result.rows.map(row => ({
        period: row.period,
        new_clients: parseInt(row.new_clients),
        returning_clients: parseInt(row.returning_clients),
        total_clients: parseInt(row.new_clients) + parseInt(row.returning_clients)
      }))
    };
  }

  getGranularityClause(granularity) {
    switch (granularity) {
      case 'hour':
        return "DATE_TRUNC('hour', created_at)";
      case 'day':
        return "DATE_TRUNC('day', created_at)";
      case 'week':
        return "DATE_TRUNC('week', created_at)";
      case 'month':
        return "DATE_TRUNC('month', created_at)";
      default:
        return "DATE_TRUNC('day', created_at)";
    }
  }
}

// Initialize enhanced analytics controller
const analyticsController = new AnalyticsAPIController(db, redisClient, realTimeEvents);

// HIPAA audit logging middleware
const createAuditLog = (req, dataAccessed, purpose) => {
  return {
    user_id: req.user?.id || 'unknown',
    access_timestamp: new Date().toISOString(),
    data_accessed: dataAccessed,
    purpose: purpose,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  };
};

// Cache middleware
const getCachedData = async (key) => {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const setCachedData = async (key, data, ttl = 300) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Enhanced Analytics Routes with Performance Validation

/**
 * GET /api/analytics/metrics
 * Get analytics metrics with caching and performance validation
 * Performance target: <200ms response time
 */
router.get('/metrics', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER', 'STAFF']),
  rateLimiter({ windowMs: 60000, max: 100 }), // 100 requests per minute
  async (req, res) => {
    try {
      await analyticsController.getMetrics(req, res);
    } catch (error) {
      console.error('Analytics metrics error:', error);
      res.status(500).json({ error: 'Analytics metrics failed' });
    }
  }
);

/**
 * GET /api/analytics/realtime/:spa_id
 * Real-time metrics streaming endpoint
 * Performance target: <100ms initial response, <50ms updates
 */
router.get('/realtime/:spa_id', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER', 'STAFF']),
  rateLimiter({ windowMs: 60000, max: 30 }), // 30 requests per minute
  async (req, res) => {
    try {
      await analyticsController.getRealtimeMetrics(req, res);
    } catch (error) {
      console.error('Real-time metrics error:', error);
      res.status(500).json({ error: 'Real-time metrics failed' });
    }
  }
);

/**
 * GET /api/analytics/dashboard/:spa_id
 * Dashboard data endpoint with caching
 * Performance target: <200ms response time
 */
router.get('/dashboard/:spa_id', 
  authenticateToken, 
  requireRole(['ADMIN', 'MANAGER', 'STAFF']),
  async (req, res) => {
    try {
      const { spa_id } = req.params;
      const { date_range = 'month', include_alerts = true } = req.query;
      
      const startTime = performance.now();
      const dashboardData = await analyticsController.getDashboardData(spa_id, date_range, include_alerts === 'true');
      const processingTime = performance.now() - startTime;
      
      res.json({
        success: true,
        data: {
          ...dashboardData,
          processing_time_ms: processingTime,
          performance_target_met: processingTime < 200
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  }
);

/**
 * GET /api/analytics/performance
 * Database performance metrics
 * Performance target: <50ms response time
 */
router.get('/performance',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const startTime = performance.now();
      const metrics = await databaseOptimizer.getPerformanceMetrics();
      const processingTime = performance.now() - startTime;
      
      res.json({
        success: true,
        data: {
          ...metrics,
          processing_time_ms: processingTime,
          performance_target_met: processingTime < 50
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({ error: 'Performance metrics failed' });
    }
  }
);

/**
 * POST /api/analytics/optimize
 * Trigger database optimization
 * Performance target: <5000ms for optimization process
 */
router.post('/optimize',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const startTime = performance.now();
      
      // Run database optimization
      await databaseOptimizer.optimizeAnalyticsQueries();
      
      const processingTime = performance.now() - startTime;
      
      res.json({
        success: true,
        message: 'Database optimization completed',
        processing_time_ms: processingTime,
        performance_target_met: processingTime < 5000
      });
    } catch (error) {
      console.error('Database optimization error:', error);
      res.status(500).json({ error: 'Database optimization failed' });
    }
  }
);

/**
 * GET /api/analytics/health
 * Analytics system health check
 * Performance target: <100ms response time
 */
router.get('/health',
  async (req, res) => {
    try {
      const startTime = performance.now();
      const health = await databaseOptimizer.healthCheck();
      const processingTime = performance.now() - startTime;
      
      res.json({
        success: true,
        status: health.status,
        metrics: {
          ...health.metrics,
          processing_time_ms: processingTime,
          performance_target_met: processingTime < 100
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ 
        success: false,
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  }
);

// Export router
module.exports = router; 