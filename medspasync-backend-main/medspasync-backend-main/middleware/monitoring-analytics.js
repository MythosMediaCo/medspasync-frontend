/**
 * Monitoring & Analytics Middleware
 * Enhanced monitoring dashboards, predictive analysis, and business intelligence for MedSpaSync Pro
 */

const { Pool } = require('pg');
const redis = require('redis');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MonitoringAnalytics {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 8
    });

    this.analyticsCache = new Map();
    this.metricsBuffer = [];
    this.alertThresholds = new Map();
    this.predictiveModels = new Map();
    
    this.initializeMonitoringAnalytics();
  }

  /**
   * Initialize monitoring and analytics
   */
  initializeMonitoringAnalytics() {
    this.setupMetricsCollection();
    this.setupPredictiveAnalytics();
    this.setupBusinessIntelligence();
    this.setupRealTimeMonitoring();
    this.setupAlertingSystem();
  }

  /**
   * Setup metrics collection
   */
  setupMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect business metrics every 5 minutes
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 5 * 60 * 1000);

    // Collect performance metrics every minute
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60 * 1000);

    // Buffer metrics for batch processing
    setInterval(() => {
      this.processMetricsBuffer();
    }, 10000);
  }

  /**
   * Setup predictive analytics
   */
  setupPredictiveAnalytics() {
    // Train predictive models daily
    setInterval(() => {
      this.trainPredictiveModels();
    }, 24 * 60 * 60 * 1000);

    // Generate predictions every hour
    setInterval(() => {
      this.generatePredictions();
    }, 60 * 60 * 1000);

    // Update anomaly detection models
    setInterval(() => {
      this.updateAnomalyDetection();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Setup business intelligence
   */
  setupBusinessIntelligence() {
    // Generate BI reports daily
    setInterval(() => {
      this.generateBIReports();
    }, 24 * 60 * 60 * 1000);

    // Update KPI calculations every hour
    setInterval(() => {
      this.updateKPIs();
    }, 60 * 60 * 1000);

    // Generate trend analysis every 6 hours
    setInterval(() => {
      this.generateTrendAnalysis();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Setup real-time monitoring
   */
  setupRealTimeMonitoring() {
    // Real-time health monitoring
    setInterval(() => {
      this.monitorSystemHealth();
    }, 15000);

    // Real-time performance monitoring
    setInterval(() => {
      this.monitorPerformance();
    }, 10000);

    // Real-time user activity monitoring
    setInterval(() => {
      this.monitorUserActivity();
    }, 30000);
  }

  /**
   * Setup alerting system
   */
  setupAlertingSystem() {
    // Check alert conditions every 30 seconds
    setInterval(() => {
      this.checkAlertConditions();
    }, 30000);

    // Process alert escalations every 5 minutes
    setInterval(() => {
      this.processAlertEscalations();
    }, 5 * 60 * 1000);
  }

  /**
   * Enhanced monitoring middleware
   */
  enhancedMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = crypto.randomUUID();
      const sessionId = req.session?.id || 'anonymous';

      // Add monitoring headers
      res.setHeader('X-Monitoring-ID', requestId);
      res.setHeader('X-Session-ID', sessionId);
      res.setHeader('X-Request-Timestamp', startTime);

      // Track request metrics
      const requestMetrics = {
        id: requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        headers: this.sanitizeHeaders(req.headers),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: sessionId,
        userId: req.user?.id,
        userRole: req.user?.role,
        startTime: startTime,
        timestamp: new Date()
      };

      // Add to metrics buffer
      this.metricsBuffer.push({
        type: 'request',
        data: requestMetrics
      });

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const responseMetrics = {
          ...requestMetrics,
          statusCode: res.statusCode,
          duration: duration,
          endTime: Date.now(),
          success: res.statusCode < 400
        };

        // Add to metrics buffer
        this.metricsBuffer.push({
          type: 'response',
          data: responseMetrics
        });

        // Check for performance anomalies
        if (duration > 1000) {
          this.detectPerformanceAnomaly(responseMetrics);
        }

        // Update real-time metrics
        this.updateRealTimeMetrics(responseMetrics);
      });

      next();
    };
  }

  /**
   * Business intelligence middleware
   */
  businessIntelligenceMiddleware() {
    return (req, res, next) => {
      // Track business events
      if (req.method === 'POST' || req.method === 'PUT') {
        const businessEvent = {
          type: 'business_event',
          action: req.method,
          resource: req.path,
          userId: req.user?.id,
          userRole: req.user?.role,
          timestamp: new Date(),
          data: this.sanitizeBusinessData(req.body)
        };

        this.metricsBuffer.push(businessEvent);
      }

      // Track user behavior
      const userBehavior = {
        type: 'user_behavior',
        userId: req.user?.id,
        userRole: req.user?.role,
        action: req.method,
        resource: req.path,
        sessionId: req.session?.id,
        timestamp: new Date()
      };

      this.metricsBuffer.push(userBehavior);

      next();
    };
  }

  /**
   * Predictive analytics middleware
   */
  predictiveAnalyticsMiddleware() {
    return (req, res, next) => {
      // Generate predictions for user behavior
      if (req.user?.id) {
        const predictions = this.generateUserPredictions(req.user.id);
        req.userPredictions = predictions;
      }

      // Generate system load predictions
      const systemPredictions = this.generateSystemPredictions();
      req.systemPredictions = systemPredictions;

      next();
    };
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      };

      // Store in database
      await this.db.query(`
        INSERT INTO system_metrics (
          cpu_user, cpu_system, memory_rss, memory_heap_used, memory_heap_total,
          memory_external, uptime, pid, platform, node_version, environment
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        metrics.cpu.user, metrics.cpu.system,
        metrics.memory.rss, metrics.memory.heapUsed, metrics.memory.heapTotal,
        metrics.memory.external, metrics.uptime, metrics.pid,
        metrics.platform, metrics.nodeVersion, metrics.environment
      ]);

      // Cache for real-time access
      await this.redisClient.setex('system_metrics', 300, JSON.stringify(metrics));

    } catch (error) {
      console.error('❌ System metrics collection error:', error);
    }
  }

  /**
   * Collect business metrics
   */
  async collectBusinessMetrics() {
    try {
      // Get user activity metrics
      const userMetrics = await this.db.query(`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_requests,
          AVG(duration) as avg_response_time
        FROM request_metrics 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      // Get business transaction metrics
      const transactionMetrics = await this.db.query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
          AVG(amount) as avg_transaction_amount
        FROM business_transactions 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      // Get reconciliation metrics
      const reconciliationMetrics = await this.db.query(`
        SELECT 
          COUNT(*) as total_reconciliations,
          AVG(confidence_score) as avg_confidence,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_reconciliations
        FROM reconciliation_logs 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      const businessMetrics = {
        timestamp: new Date(),
        user_activity: userMetrics.rows[0],
        transactions: transactionMetrics.rows[0],
        reconciliation: reconciliationMetrics.rows[0]
      };

      // Store in database
      await this.db.query(`
        INSERT INTO business_metrics (
          active_users, total_requests, avg_response_time,
          total_transactions, successful_transactions, avg_transaction_amount,
          total_reconciliations, avg_confidence, completed_reconciliations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        businessMetrics.user_activity.active_users,
        businessMetrics.user_activity.total_requests,
        businessMetrics.user_activity.avg_response_time,
        businessMetrics.transactions.total_transactions,
        businessMetrics.transactions.successful_transactions,
        businessMetrics.transactions.avg_transaction_amount,
        businessMetrics.reconciliation.total_reconciliations,
        businessMetrics.reconciliation.avg_confidence,
        businessMetrics.reconciliation.completed_reconciliations
      ]);

      // Cache for real-time access
      await this.redisClient.setex('business_metrics', 300, JSON.stringify(businessMetrics));

    } catch (error) {
      console.error('❌ Business metrics collection error:', error);
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      // Get database performance
      const dbPerformance = await this.db.query(`
        SELECT 
          AVG(duration) as avg_query_time,
          COUNT(*) FILTER (WHERE duration > 1000) as slow_queries,
          COUNT(*) as total_queries
        FROM performance_logs 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      // Get cache performance
      const cachePerformance = await this.db.query(`
        SELECT 
          AVG(hit_rate) as avg_hit_rate,
          AVG(used_memory) as avg_memory_usage
        FROM cache_performance 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      // Get API performance
      const apiPerformance = await this.db.query(`
        SELECT 
          AVG(duration) as avg_response_time,
          COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
          COUNT(*) as total_requests
        FROM request_metrics 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      const performanceMetrics = {
        timestamp: new Date(),
        database: dbPerformance.rows[0],
        cache: cachePerformance.rows[0],
        api: apiPerformance.rows[0]
      };

      // Store in database
      await this.db.query(`
        INSERT INTO performance_metrics (
          avg_query_time, slow_queries, total_queries,
          avg_hit_rate, avg_memory_usage,
          avg_response_time, error_count, total_requests
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        performanceMetrics.database.avg_query_time,
        performanceMetrics.database.slow_queries,
        performanceMetrics.database.total_queries,
        performanceMetrics.cache.avg_hit_rate,
        performanceMetrics.cache.avg_memory_usage,
        performanceMetrics.api.avg_response_time,
        performanceMetrics.api.error_count,
        performanceMetrics.api.total_requests
      ]);

      // Cache for real-time access
      await this.redisClient.setex('performance_metrics', 300, JSON.stringify(performanceMetrics));

    } catch (error) {
      console.error('❌ Performance metrics collection error:', error);
    }
  }

  /**
   * Process metrics buffer
   */
  async processMetricsBuffer() {
    if (this.metricsBuffer.length === 0) return;

    const batch = this.metricsBuffer.splice(0, 1000); // Process in batches

    try {
      for (const metric of batch) {
        switch (metric.type) {
          case 'request':
            await this.storeRequestMetric(metric.data);
            break;
          case 'response':
            await this.storeResponseMetric(metric.data);
            break;
          case 'business_event':
            await this.storeBusinessEvent(metric.data);
            break;
          case 'user_behavior':
            await this.storeUserBehavior(metric.data);
            break;
        }
      }
    } catch (error) {
      console.error('❌ Metrics buffer processing error:', error);
    }
  }

  /**
   * Store request metric
   */
  async storeRequestMetric(data) {
    await this.db.query(`
      INSERT INTO request_metrics (
        request_id, method, url, path, query_params, headers, ip_address,
        user_agent, session_id, user_id, user_role, start_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      data.id, data.method, data.url, data.path,
      JSON.stringify(data.query), JSON.stringify(data.headers),
      data.ip, data.userAgent, data.sessionId, data.userId,
      data.userRole, data.startTime
    ]);
  }

  /**
   * Store response metric
   */
  async storeResponseMetric(data) {
    await this.db.query(`
      INSERT INTO response_metrics (
        request_id, status_code, duration, success, end_time
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      data.id, data.statusCode, data.duration, data.success, data.endTime
    ]);
  }

  /**
   * Store business event
   */
  async storeBusinessEvent(data) {
    await this.db.query(`
      INSERT INTO business_events (
        event_type, action, resource, user_id, user_role, event_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      data.type, data.action, data.resource, data.userId,
      data.userRole, JSON.stringify(data.data)
    ]);
  }

  /**
   * Store user behavior
   */
  async storeUserBehavior(data) {
    await this.db.query(`
      INSERT INTO user_behavior (
        user_id, user_role, action, resource, session_id
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      data.userId, data.userRole, data.action, data.resource, data.sessionId
    ]);
  }

  /**
   * Train predictive models
   */
  async trainPredictiveModels() {
    try {
      // Train user behavior prediction model
      await this.trainUserBehaviorModel();
      
      // Train system load prediction model
      await this.trainSystemLoadModel();
      
      // Train business metrics prediction model
      await this.trainBusinessMetricsModel();
      
      console.log('✅ Predictive models trained successfully');
    } catch (error) {
      console.error('❌ Predictive model training error:', error);
    }
  }

  /**
   * Train user behavior prediction model
   */
  async trainUserBehaviorModel() {
    // Get historical user behavior data
    const userBehaviorData = await this.db.query(`
      SELECT 
        user_id, user_role, action, resource, 
        EXTRACT(HOUR FROM timestamp) as hour,
        EXTRACT(DOW FROM timestamp) as day_of_week,
        COUNT(*) as frequency
      FROM user_behavior 
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY user_id, user_role, action, resource, hour, day_of_week
    `);

    // Simple prediction model (in production, use ML libraries)
    const predictions = {};
    userBehaviorData.rows.forEach(row => {
      const key = `${row.user_role}_${row.action}_${row.resource}`;
      if (!predictions[key]) {
        predictions[key] = {
          frequency: row.frequency,
          peak_hours: [row.hour],
          peak_days: [row.day_of_week]
        };
      } else {
        predictions[key].frequency += row.frequency;
        predictions[key].peak_hours.push(row.hour);
        predictions[key].peak_days.push(row.day_of_week);
      }
    });

    // Store predictions
    await this.redisClient.setex('user_behavior_predictions', 86400, JSON.stringify(predictions));
  }

  /**
   * Train system load prediction model
   */
  async trainSystemLoadModel() {
    // Get historical system metrics
    const systemData = await this.db.query(`
      SELECT 
        cpu_user, cpu_system, memory_heap_used, memory_heap_total,
        EXTRACT(HOUR FROM timestamp) as hour,
        EXTRACT(DOW FROM timestamp) as day_of_week
      FROM system_metrics 
      WHERE timestamp > NOW() - INTERVAL '7 days'
      ORDER BY timestamp
    `);

    // Calculate average load patterns
    const loadPatterns = {};
    systemData.rows.forEach(row => {
      const key = `${row.hour}_${row.day_of_week}`;
      if (!loadPatterns[key]) {
        loadPatterns[key] = {
          cpu_usage: [],
          memory_usage: [],
          count: 0
        };
      }
      
      loadPatterns[key].cpu_usage.push((row.cpu_user + row.cpu_system) / 1000000);
      loadPatterns[key].memory_usage.push(row.memory_heap_used / row.memory_heap_total);
      loadPatterns[key].count++;
    });

    // Calculate averages
    Object.keys(loadPatterns).forEach(key => {
      const pattern = loadPatterns[key];
      pattern.avg_cpu = pattern.cpu_usage.reduce((a, b) => a + b, 0) / pattern.count;
      pattern.avg_memory = pattern.memory_usage.reduce((a, b) => a + b, 0) / pattern.count;
    });

    // Store patterns
    await this.redisClient.setex('system_load_patterns', 86400, JSON.stringify(loadPatterns));
  }

  /**
   * Train business metrics prediction model
   */
  async trainBusinessMetricsModel() {
    // Get historical business metrics
    const businessData = await this.db.query(`
      SELECT 
        active_users, total_requests, total_transactions,
        EXTRACT(HOUR FROM timestamp) as hour,
        EXTRACT(DOW FROM timestamp) as day_of_week
      FROM business_metrics 
      WHERE timestamp > NOW() - INTERVAL '30 days'
      ORDER BY timestamp
    `);

    // Calculate business patterns
    const businessPatterns = {};
    businessData.rows.forEach(row => {
      const key = `${row.hour}_${row.day_of_week}`;
      if (!businessPatterns[key]) {
        businessPatterns[key] = {
          active_users: [],
          total_requests: [],
          total_transactions: [],
          count: 0
        };
      }
      
      businessPatterns[key].active_users.push(row.active_users);
      businessPatterns[key].total_requests.push(row.total_requests);
      businessPatterns[key].total_transactions.push(row.total_transactions);
      businessPatterns[key].count++;
    });

    // Calculate averages
    Object.keys(businessPatterns).forEach(key => {
      const pattern = businessPatterns[key];
      pattern.avg_active_users = pattern.active_users.reduce((a, b) => a + b, 0) / pattern.count;
      pattern.avg_total_requests = pattern.total_requests.reduce((a, b) => a + b, 0) / pattern.count;
      pattern.avg_total_transactions = pattern.total_transactions.reduce((a, b) => a + b, 0) / pattern.count;
    });

    // Store patterns
    await this.redisClient.setex('business_patterns', 86400, JSON.stringify(businessPatterns));
  }

  /**
   * Generate predictions
   */
  async generatePredictions() {
    try {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      // Get stored patterns
      const [userPredictions, loadPatterns, businessPatterns] = await Promise.all([
        this.redisClient.get('user_behavior_predictions'),
        this.redisClient.get('system_load_patterns'),
        this.redisClient.get('business_patterns')
      ]);

      const predictions = {
        timestamp: now,
        user_behavior: userPredictions ? JSON.parse(userPredictions) : {},
        system_load: loadPatterns ? JSON.parse(loadPatterns) : {},
        business_metrics: businessPatterns ? JSON.parse(businessPatterns) : {}
      };

      // Store predictions
      await this.db.query(`
        INSERT INTO predictions (
          prediction_type, prediction_data, generated_at
        ) VALUES ($1, $2, $3)
      `, ['hourly', JSON.stringify(predictions), now]);

      // Cache for real-time access
      await this.redisClient.setex('current_predictions', 3600, JSON.stringify(predictions));

    } catch (error) {
      console.error('❌ Prediction generation error:', error);
    }
  }

  /**
   * Generate user predictions
   */
  generateUserPredictions(userId) {
    // This would use the trained model to generate user-specific predictions
    return {
      next_actions: ['view_dashboard', 'run_report', 'export_data'],
      peak_activity_hours: [9, 14, 16],
      likely_resources: ['/api/reports', '/api/analytics', '/api/dashboard']
    };
  }

  /**
   * Generate system predictions
   */
  generateSystemPredictions() {
    // This would use the trained model to generate system load predictions
    return {
      expected_cpu_usage: 65,
      expected_memory_usage: 70,
      expected_peak_hours: [10, 15],
      recommended_scaling: 'scale_up'
    };
  }

  /**
   * Update anomaly detection
   */
  async updateAnomalyDetection() {
    try {
      // Calculate baseline metrics
      const baselineMetrics = await this.calculateBaselineMetrics();
      
      // Update anomaly thresholds
      this.alertThresholds.set('cpu_usage', baselineMetrics.cpu_usage * 1.5);
      this.alertThresholds.set('memory_usage', baselineMetrics.memory_usage * 1.3);
      this.alertThresholds.set('response_time', baselineMetrics.response_time * 2);
      this.alertThresholds.set('error_rate', baselineMetrics.error_rate * 1.5);

      console.log('✅ Anomaly detection updated');
    } catch (error) {
      console.error('❌ Anomaly detection update error:', error);
    }
  }

  /**
   * Calculate baseline metrics
   */
  async calculateBaselineMetrics() {
    const result = await this.db.query(`
      SELECT 
        AVG(cpu_user + cpu_system) / 1000000 as cpu_usage,
        AVG(memory_heap_used::DECIMAL / memory_heap_total) * 100 as memory_usage,
        AVG(duration) as response_time,
        COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100 as error_rate
      FROM system_metrics sm
      LEFT JOIN response_metrics rm ON sm.timestamp::date = rm.end_time::date
      WHERE sm.timestamp > NOW() - INTERVAL '7 days'
    `);

    return result.rows[0];
  }

  /**
   * Generate BI reports
   */
  async generateBIReports() {
    try {
      // Generate daily business intelligence report
      const biReport = await this.generateDailyBIReport();
      
      // Store report
      await this.db.query(`
        INSERT INTO bi_reports (
          report_type, report_data, generated_at
        ) VALUES ($1, $2, $3)
      `, ['daily', JSON.stringify(biReport), new Date()]);

      console.log('✅ BI report generated successfully');
    } catch (error) {
      console.error('❌ BI report generation error:', error);
    }
  }

  /**
   * Generate daily BI report
   */
  async generateDailyBIReport() {
    const [
      userMetrics,
      businessMetrics,
      performanceMetrics,
      securityMetrics
    ] = await Promise.all([
      this.getUserMetrics(),
      this.getBusinessMetrics(),
      this.getPerformanceMetrics(),
      this.getSecurityMetrics()
    ]);

    return {
      date: new Date().toISOString().split('T')[0],
      user_metrics: userMetrics,
      business_metrics: businessMetrics,
      performance_metrics: performanceMetrics,
      security_metrics: securityMetrics,
      insights: this.generateInsights(userMetrics, businessMetrics, performanceMetrics, securityMetrics)
    };
  }

  /**
   * Get user metrics
   */
  async getUserMetrics() {
    const result = await this.db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT user_id) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as active_users,
        COUNT(DISTINCT session_id) as total_sessions,
        AVG(duration) as avg_session_duration
      FROM user_behavior 
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction_value,
        COUNT(*) FILTER (WHERE status = 'success') as successful_transactions
      FROM business_transactions 
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    const result = await this.db.query(`
      SELECT 
        AVG(duration) as avg_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400) as total_errors,
        COUNT(*) as total_requests,
        AVG(hit_rate) as avg_cache_hit_rate
      FROM response_metrics rm
      LEFT JOIN cache_performance cp ON rm.end_time::date = cp.timestamp::date
      WHERE rm.end_time > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_security_events,
        COUNT(*) FILTER (WHERE severity = 'high') as high_severity_events,
        COUNT(*) FILTER (WHERE event_type = 'authentication_failure') as auth_failures,
        COUNT(*) FILTER (WHERE event_type = 'suspicious_activity') as suspicious_activities
      FROM security_events 
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }

  /**
   * Generate insights
   */
  generateInsights(userMetrics, businessMetrics, performanceMetrics, securityMetrics) {
    const insights = [];

    // User insights
    if (userMetrics.active_users / userMetrics.total_users < 0.3) {
      insights.push('Low user engagement detected. Consider user experience improvements.');
    }

    // Business insights
    if (businessMetrics.successful_transactions / businessMetrics.total_transactions < 0.95) {
      insights.push('Transaction success rate below target. Review error handling.');
    }

    // Performance insights
    if (performanceMetrics.avg_response_time > 1000) {
      insights.push('Response times are high. Consider performance optimization.');
    }

    // Security insights
    if (securityMetrics.high_severity_events > 0) {
      insights.push('High severity security events detected. Review security measures.');
    }

    return insights;
  }

  /**
   * Update KPIs
   */
  async updateKPIs() {
    try {
      const kpis = await this.calculateKPIs();
      
      // Store KPIs
      await this.db.query(`
        INSERT INTO kpi_metrics (
          kpi_name, kpi_value, kpi_target, kpi_status, calculated_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'user_engagement', kpis.user_engagement, 0.7,
        kpis.user_engagement >= 0.7 ? 'on_target' : 'below_target', new Date()
      ]);

      // Cache KPIs
      await this.redisClient.setex('current_kpis', 3600, JSON.stringify(kpis));

    } catch (error) {
      console.error('❌ KPI update error:', error);
    }
  }

  /**
   * Calculate KPIs
   */
  async calculateKPIs() {
    const result = await this.db.query(`
      SELECT 
        COUNT(DISTINCT user_id) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours')::DECIMAL / 
        COUNT(DISTINCT user_id) as user_engagement,
        COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) as transaction_success_rate,
        AVG(duration) as avg_response_time,
        AVG(hit_rate) as cache_efficiency
      FROM user_behavior ub
      LEFT JOIN business_transactions bt ON ub.user_id = bt.user_id
      LEFT JOIN response_metrics rm ON ub.timestamp::date = rm.end_time::date
      LEFT JOIN cache_performance cp ON rm.end_time::date = cp.timestamp::date
      WHERE ub.timestamp > NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }

  /**
   * Generate trend analysis
   */
  async generateTrendAnalysis() {
    try {
      const trends = await this.analyzeTrends();
      
      // Store trends
      await this.db.query(`
        INSERT INTO trend_analysis (
          trend_type, trend_data, analyzed_at
        ) VALUES ($1, $2, $3)
      `, ['hourly', JSON.stringify(trends), new Date()]);

    } catch (error) {
      console.error('❌ Trend analysis error:', error);
    }
  }

  /**
   * Analyze trends
   */
  async analyzeTrends() {
    const result = await this.db.query(`
      SELECT 
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_requests,
        AVG(duration) as avg_response_time
      FROM user_behavior ub
      LEFT JOIN response_metrics rm ON ub.timestamp::date = rm.end_time::date
      WHERE ub.timestamp > NOW() - INTERVAL '7 days'
      GROUP BY hour
      ORDER BY hour
    `);

    return {
      user_activity_trend: result.rows.map(row => ({
        hour: row.hour,
        active_users: row.active_users
      })),
      performance_trend: result.rows.map(row => ({
        hour: row.hour,
        avg_response_time: row.avg_response_time
      }))
    };
  }

  /**
   * Monitor system health
   */
  async monitorSystemHealth() {
    try {
      const health = await this.checkSystemHealth();
      
      // Store health status
      await this.db.query(`
        INSERT INTO system_health (
          database_status, redis_status, api_status, overall_status
        ) VALUES ($1, $2, $3, $4)
      `, [
        health.database, health.redis, health.api, health.overall
      ]);

      // Alert if health is poor
      if (health.overall === 'unhealthy') {
        await this.triggerHealthAlert(health);
      }

    } catch (error) {
      console.error('❌ System health monitoring error:', error);
    }
  }

  /**
   * Check system health
   */
  async checkSystemHealth() {
    const health = {
      database: 'unknown',
      redis: 'unknown',
      api: 'unknown',
      overall: 'unknown'
    };

    try {
      // Check database
      await this.db.query('SELECT 1');
      health.database = 'healthy';
    } catch (error) {
      health.database = 'unhealthy';
    }

    try {
      // Check Redis
      await this.redisClient.ping();
      health.redis = 'healthy';
    } catch (error) {
      health.redis = 'unhealthy';
    }

    // Check API (simplified)
    health.api = 'healthy';

    // Determine overall health
    const healthyServices = [health.database, health.redis, health.api]
      .filter(status => status === 'healthy').length;
    
    health.overall = healthyServices >= 2 ? 'healthy' : 'unhealthy';

    return health;
  }

  /**
   * Monitor performance
   */
  async monitorPerformance() {
    try {
      const performance = await this.getCurrentPerformance();
      
      // Check for performance anomalies
      if (performance.avg_response_time > 1000) {
        await this.triggerPerformanceAlert(performance);
      }

      // Store performance metrics
      await this.db.query(`
        INSERT INTO real_time_performance (
          avg_response_time, error_rate, active_connections, cpu_usage
        ) VALUES ($1, $2, $3, $4)
      `, [
        performance.avg_response_time,
        performance.error_rate,
        performance.active_connections,
        performance.cpu_usage
      ]);

    } catch (error) {
      console.error('❌ Performance monitoring error:', error);
    }
  }

  /**
   * Get current performance
   */
  async getCurrentPerformance() {
    const result = await this.db.query(`
      SELECT 
        AVG(duration) as avg_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100 as error_rate,
        COUNT(DISTINCT session_id) as active_connections
      FROM response_metrics 
      WHERE end_time > NOW() - INTERVAL '5 minutes'
    `);

    const systemMetrics = JSON.parse(await this.redisClient.get('system_metrics') || '{}');
    
    return {
      ...result.rows[0],
      cpu_usage: systemMetrics.cpu ? (systemMetrics.cpu.user + systemMetrics.cpu.system) / 1000000 : 0
    };
  }

  /**
   * Monitor user activity
   */
  async monitorUserActivity() {
    try {
      const activity = await this.getUserActivity();
      
      // Store activity metrics
      await this.db.query(`
        INSERT INTO user_activity_monitoring (
          active_users, total_sessions, peak_concurrent_users
        ) VALUES ($1, $2, $3)
      `, [
        activity.active_users,
        activity.total_sessions,
        activity.peak_concurrent_users
      ]);

    } catch (error) {
      console.error('❌ User activity monitoring error:', error);
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity() {
    const result = await this.db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT user_id) FILTER (WHERE timestamp > NOW() - INTERVAL '5 minutes') as peak_concurrent_users
      FROM user_behavior 
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);

    return result.rows[0];
  }

  /**
   * Check alert conditions
   */
  async checkAlertConditions() {
    try {
      const currentMetrics = await this.getCurrentMetrics();
      
      // Check each threshold
      for (const [metric, threshold] of this.alertThresholds) {
        if (currentMetrics[metric] > threshold) {
          await this.triggerAlert(metric, currentMetrics[metric], threshold);
        }
      }

    } catch (error) {
      console.error('❌ Alert condition check error:', error);
    }
  }

  /**
   * Get current metrics
   */
  async getCurrentMetrics() {
    const systemMetrics = JSON.parse(await this.redisClient.get('system_metrics') || '{}');
    const performanceMetrics = JSON.parse(await this.redisClient.get('performance_metrics') || '{}');
    
    return {
      cpu_usage: systemMetrics.cpu ? (systemMetrics.cpu.user + systemMetrics.cpu.system) / 1000000 : 0,
      memory_usage: systemMetrics.memory ? (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100 : 0,
      response_time: performanceMetrics.api ? performanceMetrics.api.avg_response_time : 0,
      error_rate: performanceMetrics.api ? performanceMetrics.api.error_count / performanceMetrics.api.total_requests : 0
    };
  }

  /**
   * Trigger alert
   */
  async triggerAlert(metric, currentValue, threshold) {
    const alert = {
      type: 'threshold_exceeded',
      metric: metric,
      current_value: currentValue,
      threshold: threshold,
      severity: currentValue > threshold * 1.5 ? 'high' : 'medium',
      timestamp: new Date()
    };

    // Store alert
    await this.db.query(`
      INSERT INTO monitoring_alerts (
        alert_type, metric_name, current_value, threshold_value, severity
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      alert.type, alert.metric, alert.current_value,
      alert.threshold, alert.severity
    ]);

    console.warn(`⚠️ Alert: ${metric} exceeded threshold (${currentValue} > ${threshold})`);
  }

  /**
   * Trigger health alert
   */
  async triggerHealthAlert(health) {
    const alert = {
      type: 'system_health',
      health_status: health,
      severity: 'high',
      timestamp: new Date()
    };

    await this.db.query(`
      INSERT INTO monitoring_alerts (
        alert_type, metric_name, current_value, threshold_value, severity
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      alert.type, 'system_health', JSON.stringify(health), 'healthy', alert.severity
    ]);

    console.warn('🚨 System health alert triggered');
  }

  /**
   * Trigger performance alert
   */
  async triggerPerformanceAlert(performance) {
    const alert = {
      type: 'performance_degradation',
      performance_metrics: performance,
      severity: 'medium',
      timestamp: new Date()
    };

    await this.db.query(`
      INSERT INTO monitoring_alerts (
        alert_type, metric_name, current_value, threshold_value, severity
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      alert.type, 'response_time', performance.avg_response_time, 1000, alert.severity
    ]);

    console.warn('⚠️ Performance alert triggered');
  }

  /**
   * Process alert escalations
   */
  async processAlertEscalations() {
    try {
      // Get unacknowledged high severity alerts
      const alerts = await this.db.query(`
        SELECT * FROM monitoring_alerts 
        WHERE severity = 'high' AND acknowledged = false
        AND created_at < NOW() - INTERVAL '30 minutes'
      `);

      for (const alert of alerts.rows) {
        await this.escalateAlert(alert);
      }

    } catch (error) {
      console.error('❌ Alert escalation processing error:', error);
    }
  }

  /**
   * Escalate alert
   */
  async escalateAlert(alert) {
    // Update alert status
    await this.db.query(`
      UPDATE monitoring_alerts 
      SET escalated = true, escalated_at = NOW()
      WHERE id = $1
    `, [alert.id]);

    console.warn(`🚨 Alert escalated: ${alert.alert_type} - ${alert.metric_name}`);
  }

  /**
   * Detect performance anomaly
   */
  detectPerformanceAnomaly(metrics) {
    // Simple anomaly detection (in production, use ML algorithms)
    if (metrics.duration > 5000) {
      console.warn(`⚠️ Performance anomaly detected: ${metrics.duration}ms response time`);
    }
  }

  /**
   * Update real-time metrics
   */
  updateRealTimeMetrics(metrics) {
    // Update real-time dashboard metrics
    this.analyticsCache.set('recent_requests', 
      (this.analyticsCache.get('recent_requests') || 0) + 1);
    
    this.analyticsCache.set('avg_response_time', 
      (this.analyticsCache.get('avg_response_time') || 0) + metrics.duration);
  }

  /**
   * Sanitize headers
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  /**
   * Sanitize business data
   */
  sanitizeBusinessData(data) {
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStatistics() {
    try {
      const [systemMetrics, businessMetrics, performanceMetrics, alerts] = await Promise.all([
        this.redisClient.get('system_metrics'),
        this.redisClient.get('business_metrics'),
        this.redisClient.get('performance_metrics'),
        this.db.query(`
          SELECT COUNT(*) as total_alerts,
                 COUNT(*) FILTER (WHERE severity = 'high') as high_severity_alerts,
                 COUNT(*) FILTER (WHERE acknowledged = false) as unacknowledged_alerts
          FROM monitoring_alerts 
          WHERE created_at > NOW() - INTERVAL '24 hours'
        `)
      ]);

      return {
        system: systemMetrics ? JSON.parse(systemMetrics) : null,
        business: businessMetrics ? JSON.parse(businessMetrics) : null,
        performance: performanceMetrics ? JSON.parse(performanceMetrics) : null,
        alerts: alerts.rows[0],
        cache_size: this.analyticsCache.size,
        buffer_size: this.metricsBuffer.length,
        generated: new Date()
      };
    } catch (error) {
      console.error('❌ Get monitoring statistics error:', error);
      return {};
    }
  }
}

// Create singleton instance
const monitoringAnalytics = new MonitoringAnalytics();

// Export middleware functions
module.exports = {
  enhancedMonitoringMiddleware: monitoringAnalytics.enhancedMonitoringMiddleware.bind(monitoringAnalytics),
  businessIntelligenceMiddleware: monitoringAnalytics.businessIntelligenceMiddleware.bind(monitoringAnalytics),
  predictiveAnalyticsMiddleware: monitoringAnalytics.predictiveAnalyticsMiddleware.bind(monitoringAnalytics),
  getMonitoringStatistics: monitoringAnalytics.getMonitoringStatistics.bind(monitoringAnalytics)
}; 