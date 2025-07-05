/**
 * Advanced Threat Detection Routes
 * Management and monitoring endpoints for ML-based security
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/requireRole');
const enhancedRateLimiter = require('../middleware/enhanced-rate-limiter');
const advancedThreatDetection = require('../middleware/advanced-threat-detection');
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * @route   GET /api/threat-detection/status
 * @desc    Get threat detection system status
 * @access  Admin only
 */
router.get('/status', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const status = {
        timestamp: new Date(),
        system: 'Advanced Threat Detection',
        version: '1.0.0',
        status: 'active',
        components: {
          behavioralAnalysis: 'active',
          anomalyDetection: 'active',
          machineLearning: 'active',
          threatIntelligence: 'active',
          geographicAnalysis: 'active'
        },
        statistics: await advancedThreatDetection.getStatistics()
      };

      res.json(status);
    } catch (error) {
      console.error('❌ Threat detection status error:', error);
      res.status(500).json({
        error: 'Failed to get threat detection status',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/statistics
 * @desc    Get comprehensive threat detection statistics
 * @access  Admin only
 */
router.get('/statistics', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      
      const [threatStats, behavioralStats, networkStats, geographicStats] = await Promise.all([
        db.query('SELECT * FROM get_threat_statistics($1)', [parseInt(hours)]),
        db.query(`
          SELECT 
            COUNT(*) as total_profiles,
            COUNT(*) FILTER (WHERE anomaly_count > 0) as anomalous_profiles,
            AVG(anomaly_count) as avg_anomalies_per_profile
          FROM behavioral_profiles
        `),
        db.query(`
          SELECT 
            COUNT(*) as total_requests,
            COUNT(*) FILTER (WHERE is_anomalous = true) as anomalous_requests,
            AVG(response_time) as avg_response_time,
            AVG(anomaly_score) as avg_anomaly_score
          FROM network_traffic
          WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
        `, [parseInt(hours)]),
        db.query(`
          SELECT 
            COUNT(*) as total_anomalies,
            COUNT(DISTINCT user_id) as affected_users,
            AVG(distance_km) as avg_distance
          FROM geographic_anomalies
          WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
          AND is_anomalous = true
        `, [parseInt(hours)])
      ]);

      const statistics = {
        threatDetection: threatStats.rows[0],
        behavioralAnalysis: behavioralStats.rows[0],
        networkTraffic: networkStats.rows[0],
        geographicAnalysis: geographicStats.rows[0],
        period: `${hours} hours`,
        generated: new Date()
      };

      res.json(statistics);
    } catch (error) {
      console.error('❌ Threat detection statistics error:', error);
      res.status(500).json({
        error: 'Failed to get threat detection statistics',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/threats
 * @desc    Get recent threats and alerts
 * @access  Admin only
 */
router.get('/threats', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 50, severity, hours = 24 } = req.query;
      
      let query = `
        SELECT * FROM threat_detection_logs 
        WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
      `;
      
      const params = [parseInt(hours)];
      
      if (severity) {
        query += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        threats: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get threats error:', error);
      res.status(500).json({
        error: 'Failed to get threats',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/behavioral-profiles
 * @desc    Get user behavioral profiles
 * @access  Admin only
 */
router.get('/behavioral-profiles', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, anomalous = false } = req.query;
      
      let query = `
        SELECT 
          bp.*,
          u.email,
          u.role,
          COUNT(tdl.id) as threat_count,
          AVG(tdl.threat_score) as avg_threat_score
        FROM behavioral_profiles bp
        LEFT JOIN users u ON bp.user_id = u.id
        LEFT JOIN threat_detection_logs tdl ON bp.user_id = tdl.user_id
      `;
      
      const params = [];
      
      if (anomalous === 'true') {
        query += ` WHERE bp.anomaly_count > 0`;
      }
      
      query += ` GROUP BY bp.id, u.email, u.role
                 ORDER BY bp.anomaly_count DESC, bp.updated_at DESC
                 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      
      params.push(parseInt(limit), parseInt(offset));

      const result = await db.query(query, params);
      
      res.json({
        profiles: result.rows,
        total: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('❌ Get behavioral profiles error:', error);
      res.status(500).json({
        error: 'Failed to get behavioral profiles',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/network-traffic
 * @desc    Get network traffic analysis
 * @access  Admin only
 */
router.get('/network-traffic', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 100, hours = 24, anomalous = false } = req.query;
      
      let query = `
        SELECT * FROM network_traffic 
        WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
      `;
      
      const params = [parseInt(hours)];
      
      if (anomalous === 'true') {
        query += ` AND is_anomalous = true`;
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        traffic: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get network traffic error:', error);
      res.status(500).json({
        error: 'Failed to get network traffic',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/geographic-anomalies
 * @desc    Get geographic anomalies
 * @access  Admin only
 */
router.get('/geographic-anomalies', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 100, hours = 24 } = req.query;
      
      const result = await db.query(`
        SELECT 
          ga.*,
          u.email,
          u.role
        FROM geographic_anomalies ga
        LEFT JOIN users u ON ga.user_id = u.id
        WHERE ga.timestamp > NOW() - ($1 || ' hours')::INTERVAL
        AND ga.is_anomalous = true
        ORDER BY ga.timestamp DESC
        LIMIT $2
      `, [parseInt(hours), parseInt(limit)]);
      
      res.json({
        anomalies: result.rows,
        total: result.rows.length,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get geographic anomalies error:', error);
      res.status(500).json({
        error: 'Failed to get geographic anomalies',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/predictive-threats
 * @desc    Get predictive threat modeling results
 * @access  Admin only
 */
router.get('/predictive-threats', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 100, probability = 0.5 } = req.query;
      
      const result = await db.query(`
        SELECT 
          pt.*,
          u.email,
          u.role
        FROM predictive_threats pt
        LEFT JOIN users u ON pt.user_id = u.id
        WHERE pt.probability >= $1
        AND pt.is_active = true
        ORDER BY pt.probability DESC, pt.created_at DESC
        LIMIT $2
      `, [parseFloat(probability), parseInt(limit)]);
      
      res.json({
        predictions: result.rows,
        total: result.rows.length,
        minProbability: parseFloat(probability)
      });
    } catch (error) {
      console.error('❌ Get predictive threats error:', error);
      res.status(500).json({
        error: 'Failed to get predictive threats',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/ml-models
 * @desc    Get machine learning models status
 * @access  Admin only
 */
router.get('/ml-models', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          model_name,
          model_type,
          model_version,
          accuracy_score,
          training_data_size,
          last_trained,
          is_active
        FROM ml_models
        ORDER BY last_trained DESC
      `);
      
      res.json({
        models: result.rows,
        total: result.rows.length,
        activeModels: result.rows.filter(m => m.is_active).length
      });
    } catch (error) {
      console.error('❌ Get ML models error:', error);
      res.status(500).json({
        error: 'Failed to get ML models',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/threat-detection/ml-models/train
 * @desc    Train machine learning models
 * @access  Admin only
 */
router.post('/ml-models/train', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { modelType, trainingData } = req.body;
      
      // This would trigger actual ML model training
      // For now, simulate training process
      const trainingResult = {
        modelType: modelType,
        status: 'training',
        progress: 0,
        estimatedTime: '5 minutes'
      };
      
      // Simulate training completion
      setTimeout(async () => {
        try {
          await db.query(`
            INSERT INTO ml_models (model_name, model_type, model_version, model_data, accuracy_score, training_data_size)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (model_name, model_version) 
            DO UPDATE SET 
              model_data = $4,
              accuracy_score = $5,
              training_data_size = $6,
              last_trained = NOW()
          `, [
            `${modelType}_model`,
            modelType,
            '1.0.0',
            JSON.stringify({ trained: true, timestamp: new Date() }),
            0.85,
            trainingData?.length || 1000
          ]);
        } catch (dbError) {
          console.error('❌ ML model training database error:', dbError);
        }
      }, 5000);
      
      res.json({
        message: 'ML model training started',
        result: trainingResult
      });
    } catch (error) {
      console.error('❌ Train ML models error:', error);
      res.status(500).json({
        error: 'Failed to train ML models',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/anomaly-rules
 * @desc    Get anomaly detection rules
 * @access  Admin only
 */
router.get('/anomaly-rules', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT * FROM anomaly_rules
        ORDER BY rule_type, rule_name
      `);
      
      res.json({
        rules: result.rows,
        total: result.rows.length,
        activeRules: result.rows.filter(r => r.is_active).length
      });
    } catch (error) {
      console.error('❌ Get anomaly rules error:', error);
      res.status(500).json({
        error: 'Failed to get anomaly rules',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/threat-detection/anomaly-rules
 * @desc    Create new anomaly detection rule
 * @access  Admin only
 */
router.post('/anomaly-rules', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { ruleName, ruleType, ruleConfig, thresholdValue, severity } = req.body;
      
      if (!ruleName || !ruleType || !ruleConfig) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide ruleName, ruleType, and ruleConfig'
        });
      }

      const result = await db.query(`
        INSERT INTO anomaly_rules (rule_name, rule_type, rule_config, threshold_value, severity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [ruleName, ruleType, ruleConfig, thresholdValue, severity]);
      
      res.json({
        message: 'Anomaly rule created successfully',
        rule: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Create anomaly rule error:', error);
      res.status(500).json({
        error: 'Failed to create anomaly rule',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/threat-detection/anomaly-rules/:id
 * @desc    Update anomaly detection rule
 * @access  Admin only
 */
router.put('/anomaly-rules/:id', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { ruleConfig, thresholdValue, severity, isActive } = req.body;
      
      const result = await db.query(`
        UPDATE anomaly_rules 
        SET rule_config = $2, threshold_value = $3, severity = $4, is_active = $5, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, ruleConfig, thresholdValue, severity, isActive]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Rule not found',
          message: 'The specified anomaly rule was not found'
        });
      }
      
      res.json({
        message: 'Anomaly rule updated successfully',
        rule: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Update anomaly rule error:', error);
      res.status(500).json({
        error: 'Failed to update anomaly rule',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/threat-intelligence
 * @desc    Get threat intelligence data
 * @access  Admin only
 */
router.get('/threat-intelligence', 
  authMiddleware, 
  requireRole('ADMIN'),
  enhancedRateLimiter.strict,
  async (req, res) => {
    try {
      const { limit = 100, threatType } = req.query;
      
      let query = `
        SELECT * FROM threat_intelligence 
        WHERE is_active = true
      `;
      
      const params = [];
      
      if (threatType) {
        query += ` AND threat_type = $${params.length + 1}`;
        params.push(threatType);
      }
      
      query += ` ORDER BY last_seen DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));

      const result = await db.query(query, params);
      
      res.json({
        intelligence: result.rows,
        total: result.rows.length,
        activeThreats: result.rows.filter(t => t.is_active).length
      });
    } catch (error) {
      console.error('❌ Get threat intelligence error:', error);
      res.status(500).json({
        error: 'Failed to get threat intelligence',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/threat-detection/threat-intelligence
 * @desc    Add threat intelligence data
 * @access  Admin only
 */
router.post('/threat-intelligence', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { threatType, threatSource, threatData, confidenceScore } = req.body;
      
      if (!threatType || !threatData) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide threatType and threatData'
        });
      }

      const result = await db.query(`
        INSERT INTO threat_intelligence (threat_type, threat_source, threat_data, confidence_score)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [threatType, threatSource, threatData, confidenceScore]);
      
      res.json({
        message: 'Threat intelligence added successfully',
        intelligence: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Add threat intelligence error:', error);
      res.status(500).json({
        error: 'Failed to add threat intelligence',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/security-metrics
 * @desc    Get security performance metrics
 * @access  Admin only
 */
router.get('/security-metrics', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { period = 'hourly', hours = 24 } = req.query;
      
      const result = await db.query(`
        SELECT 
          metric_name,
          metric_value,
          metric_unit,
          timestamp,
          period
        FROM security_metrics
        WHERE period = $1
        AND timestamp > NOW() - ($2 || ' hours')::INTERVAL
        ORDER BY timestamp DESC
      `, [period, parseInt(hours)]);
      
      res.json({
        metrics: result.rows,
        total: result.rows.length,
        period: period,
        timeRange: `${hours} hours`
      });
    } catch (error) {
      console.error('❌ Get security metrics error:', error);
      res.status(500).json({
        error: 'Failed to get security metrics',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/threat-detection/cleanup
 * @desc    Clean up old threat detection data
 * @access  Admin only
 */
router.post('/cleanup', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { daysToKeep = 90 } = req.body;
      
      const result = await db.query('SELECT cleanup_old_threat_data($1)', [parseInt(daysToKeep)]);
      const deletedCount = result.rows[0].cleanup_old_threat_data;
      
      res.json({
        message: 'Data cleanup completed successfully',
        deletedRecords: deletedCount,
        daysKept: parseInt(daysToKeep)
      });
    } catch (error) {
      console.error('❌ Data cleanup error:', error);
      res.status(500).json({
        error: 'Failed to cleanup data',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/threat-detection/reports
 * @desc    Get threat detection reports
 * @access  Admin only
 */
router.get('/reports', 
  authMiddleware, 
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { reportType = 'summary', days = 7 } = req.query;
      
      let reportData = {};
      
      switch (reportType) {
        case 'summary':
          const [threatSummary, behavioralSummary, networkSummary] = await Promise.all([
            db.query('SELECT * FROM threat_detection_summary WHERE date >= NOW() - ($1 || \' days\')::INTERVAL', [parseInt(days)]),
            db.query('SELECT * FROM behavioral_anomalies_summary'),
            db.query('SELECT * FROM network_traffic_anomalies WHERE date >= NOW() - ($1 || \' days\')::INTERVAL', [parseInt(days)])
          ]);
          
          reportData = {
            threatSummary: threatSummary.rows,
            behavioralSummary: behavioralSummary.rows,
            networkSummary: networkSummary.rows
          };
          break;
          
        case 'detailed':
          const [threats, profiles, traffic] = await Promise.all([
            db.query('SELECT * FROM threat_detection_logs WHERE timestamp >= NOW() - ($1 || \' days\')::INTERVAL ORDER BY timestamp DESC LIMIT 1000', [parseInt(days)]),
            db.query('SELECT * FROM behavioral_profiles ORDER BY updated_at DESC LIMIT 100'),
            db.query('SELECT * FROM network_traffic WHERE timestamp >= NOW() - ($1 || \' days\')::INTERVAL ORDER BY timestamp DESC LIMIT 1000', [parseInt(days)])
          ]);
          
          reportData = {
            threats: threats.rows,
            profiles: profiles.rows,
            traffic: traffic.rows
          };
          break;
          
        default:
          return res.status(400).json({
            error: 'Invalid report type',
            message: 'Please specify "summary" or "detailed"'
          });
      }
      
      res.json({
        reportType: reportType,
        period: `${days} days`,
        data: reportData,
        generated: new Date()
      });
    } catch (error) {
      console.error('❌ Get reports error:', error);
      res.status(500).json({
        error: 'Failed to get reports',
        message: error.message
      });
    }
  }
);

module.exports = router; 