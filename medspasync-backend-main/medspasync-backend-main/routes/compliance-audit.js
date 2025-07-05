/**
 * Compliance & Audit API Routes
 * HIPAA compliance framework, security audit automation, and regulatory compliance for MedSpaSync Pro
 * Designed to integrate seamlessly with reporting infrastructure
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const { rateLimiter } = require('../middleware/rateLimiter');
const IntegrationAuditService = require('../services/integration-audit-service');

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
  db: process.env.REDIS_DB || 4
});

// Compliance monitoring middleware
const { monitorCompliance, getStatistics, generateReports } = require('../middleware/compliance-audit');

// Apply compliance monitoring to all routes
router.use(monitorCompliance);

const integrationAuditService = new IntegrationAuditService();

/**
 * @route   GET /api/compliance/status
 * @desc    Get overall compliance status
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/status', 
  authenticateToken, 
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const stats = await getStatistics();
      
      res.json({
        success: true,
        data: {
          overall_status: stats.frameworks?.overall_compliance_rate > 90 ? 'COMPLIANT' : 
                         stats.frameworks?.overall_compliance_rate > 75 ? 'PARTIALLY_COMPLIANT' : 'NON_COMPLIANT',
          statistics: stats,
          last_updated: new Date(),
          frameworks: {
            hipaa: {
              status: stats.frameworks?.hipaa_compliance_rate > 90 ? 'COMPLIANT' : 'NON_COMPLIANT',
              score: stats.frameworks?.hipaa_compliance_rate || 0
            },
            nist: {
              status: stats.frameworks?.nist_compliance_rate > 90 ? 'COMPLIANT' : 'NON_COMPLIANT',
              score: stats.frameworks?.nist_compliance_rate || 0
            },
            iso27001: {
              status: stats.frameworks?.iso27001_compliance_rate > 90 ? 'COMPLIANT' : 'NON_COMPLIANT',
              score: stats.frameworks?.iso27001_compliance_rate || 0
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Get compliance status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance status'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/events
 * @desc    Get compliance events with filtering
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/events',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 50 }),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, start_date, end_date, framework, has_violations, user_id } = req.query;
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
      
      if (framework) {
        paramCount++;
        whereClause += ` AND framework_results->>'${framework}' = 'true'`;
      }
      
      if (has_violations === 'true') {
        whereClause += ` AND violations != '[]'`;
      } else if (has_violations === 'false') {
        whereClause += ` AND violations = '[]'`;
      }
      
      if (user_id) {
        paramCount++;
        whereClause += ` AND user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      const eventsQuery = `
        SELECT 
          id, event_data, compliance_checks, violations, user_id, 
          ip_address, timestamp, framework_results, remediation_required,
          remediation_status, created_at
        FROM compliance_events 
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM compliance_events 
        ${whereClause}
      `;
      
      params.push(limit, offset);
      
      const [eventsResult, countResult] = await Promise.all([
        db.query(eventsQuery, params),
        db.query(countQuery, params.slice(0, -2))
      ]);
      
      res.json({
        success: true,
        data: {
          events: eventsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get compliance events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance events'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/violations
 * @desc    Get compliance violations with filtering
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/violations',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 50 }),
  async (req, res) => {
    try {
      const { page, limit, status, severity, violation_type, assigned_to } = req.query;
      const offset = (page - 1) * limit;
      
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
      
      if (violation_type) {
        paramCount++;
        whereClause += ` AND violation_type ILIKE $${paramCount}`;
        params.push(`%${violation_type}%`);
      }
      
      if (assigned_to) {
        paramCount++;
        whereClause += ` AND assigned_to = $${paramCount}`;
        params.push(assigned_to);
      }
      
      const violationsQuery = `
        SELECT 
          cv.*,
          u.email as assigned_user_email,
          u.first_name as assigned_user_first_name,
          u.last_name as assigned_user_last_name
        FROM compliance_violations cv
        LEFT JOIN users u ON cv.assigned_to = u.id
        ${whereClause}
        ORDER BY detected_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM compliance_violations 
        ${whereClause}
      `;
      
      params.push(limit, offset);
      
      const [violationsResult, countResult] = await Promise.all([
        db.query(violationsQuery, params),
        db.query(countQuery, params.slice(0, -2))
      ]);
      
      res.json({
        success: true,
        data: {
          violations: violationsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get compliance violations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance violations'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/violations/:id/assign
 * @desc    Assign violation to user
 * @access  Private (Admin, Compliance Officer)
 */
router.post('/violations/:id/assign',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 20 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { assigned_to, priority, notes } = req.body;
      
      const result = await db.query(`
        UPDATE compliance_violations 
        SET 
          assigned_to = $1,
          priority = $2,
          status = 'IN_PROGRESS',
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [assigned_to, priority, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Violation not found'
        });
      }
      
      // Log assignment action
      await db.query(`
        INSERT INTO remediation_actions (
          violation_id, action_type, action_description, assigned_to, action_status
        ) VALUES ($1, $2, $3, $4, $5)
      `, [id, 'ASSIGNMENT', `Assigned to user with priority: ${priority}. ${notes || ''}`, assigned_to, 'PENDING']);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Assign violation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign violation'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/violations/:id/resolve
 * @desc    Resolve violation
 * @access  Private (Admin, Compliance Officer, Assigned User)
 */
router.post('/violations/:id/resolve',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 20 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution_notes, verification_required } = req.body;
      
      const result = await db.query(`
        UPDATE compliance_violations 
        SET 
          status = $1,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [verification_required ? 'PENDING_VERIFICATION' : 'RESOLVED', id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Violation not found'
        });
      }
      
      // Log resolution action
      await db.query(`
        INSERT INTO remediation_actions (
          violation_id, action_type, action_description, assigned_to, action_status, completion_notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, 'RESOLUTION', 'Violation resolved', req.user.id, 'COMPLETED', resolution_notes]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Resolve violation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve violation'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/frameworks
 * @desc    Get compliance frameworks
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/frameworks',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          id, framework_name, framework_version, framework_type, 
          description, requirements, controls, is_active,
          last_assessment, next_assessment, compliance_score,
          created_at, updated_at
        FROM compliance_frameworks
        ORDER BY framework_name, framework_version
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get compliance frameworks error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance frameworks'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/assessments
 * @desc    Get compliance assessments
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/assessments',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { framework_id, status } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (framework_id) {
        paramCount++;
        whereClause += ` AND ca.framework_id = $${paramCount}`;
        params.push(framework_id);
      }
      
      if (status) {
        paramCount++;
        whereClause += ` AND ca.status = $${paramCount}`;
        params.push(status);
      }
      
      const result = await db.query(`
        SELECT 
          ca.*,
          cf.framework_name,
          cf.framework_type,
          u.email as assessor_email,
          u.first_name as assessor_first_name,
          u.last_name as assessor_last_name
        FROM compliance_assessments ca
        LEFT JOIN compliance_frameworks cf ON ca.framework_id = cf.id
        LEFT JOIN users u ON ca.assessor_id = u.id
        ${whereClause}
        ORDER BY ca.assessment_date DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get compliance assessments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance assessments'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/assessments
 * @desc    Create new compliance assessment
 * @access  Private (Admin, Compliance Officer)
 */
router.post('/assessments',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { framework_id, assessment_type, scope, methodology } = req.body;
      
      const result = await db.query(`
        INSERT INTO compliance_assessments (
          framework_id, assessment_type, assessor_id, scope, methodology, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [framework_id, assessment_type, req.user.id, scope, methodology, 'IN_PROGRESS']);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Create compliance assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create compliance assessment'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/audit-trails
 * @desc    Get audit trails with filtering
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/audit-trails',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 50 }),
  async (req, res) => {
    try {
      const { page, limit, user_id, action, resource_type, success, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (user_id) {
        paramCount++;
        whereClause += ` AND user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      if (action) {
        paramCount++;
        whereClause += ` AND action ILIKE $${paramCount}`;
        params.push(`%${action}%`);
      }
      
      if (resource_type) {
        paramCount++;
        whereClause += ` AND resource_type = $${paramCount}`;
        params.push(resource_type);
      }
      
      if (success !== undefined) {
        paramCount++;
        whereClause += ` AND success = $${paramCount}`;
        params.push(success);
      }
      
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
      
      const auditQuery = `
        SELECT 
          id, user_id, session_id, action, resource_type, resource_id,
          resource_name, ip_address, user_agent, request_method,
          request_url, execution_time, success, error_message,
          metadata, timestamp, created_at
        FROM audit_trails 
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_trails 
        ${whereClause}
      `;
      
      params.push(limit, offset);
      
      const [auditResult, countResult] = await Promise.all([
        db.query(auditQuery, params),
        db.query(countQuery, params.slice(0, -2))
      ]);
      
      res.json({
        success: true,
        data: {
          audit_trails: auditResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get audit trails error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit trails'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/breach-incidents
 * @desc    Get breach incidents
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/breach-incidents',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { status, severity } = req.query;
      
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
      
      const result = await db.query(`
        SELECT 
          bi.*,
          u1.email as created_by_email,
          u1.first_name as created_by_first_name,
          u1.last_name as created_by_last_name,
          u2.email as assigned_to_email,
          u2.first_name as assigned_to_first_name,
          u2.last_name as assigned_to_last_name
        FROM breach_incidents bi
        LEFT JOIN users u1 ON bi.created_by = u1.id
        LEFT JOIN users u2 ON bi.assigned_to = u2.id
        ${whereClause}
        ORDER BY detected_at DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get breach incidents error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get breach incidents'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/breach-incidents
 * @desc    Create new breach incident
 * @access  Private (Admin, Compliance Officer)
 */
router.post('/breach-incidents',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const {
        incident_type, severity, description, affected_individuals,
        affected_records, phi_involved, pii_involved, assigned_to
      } = req.body;
      
      const result = await db.query(`
        INSERT INTO breach_incidents (
          incident_type, severity, description, affected_individuals,
          affected_records, phi_involved, pii_involved, created_by, assigned_to
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        incident_type, severity, description, affected_individuals,
        affected_records, phi_involved, pii_involved, req.user.id, assigned_to
      ]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Create breach incident error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create breach incident'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/reports
 * @desc    Get compliance reports
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/reports',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { report_type, framework_id, is_archived } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (report_type) {
        paramCount++;
        whereClause += ` AND report_type = $${paramCount}`;
        params.push(report_type);
      }
      
      if (framework_id) {
        paramCount++;
        whereClause += ` AND framework_id = $${paramCount}`;
        params.push(framework_id);
      }
      
      if (is_archived !== undefined) {
        paramCount++;
        whereClause += ` AND is_archived = $${paramCount}`;
        params.push(is_archived);
      }
      
      const result = await db.query(`
        SELECT 
          cr.*,
          cf.framework_name,
          u.email as generated_by_email,
          u.first_name as generated_by_first_name,
          u.last_name as generated_by_last_name
        FROM compliance_reports cr
        LEFT JOIN compliance_frameworks cf ON cr.framework_id = cf.id
        LEFT JOIN users u ON cr.generated_by = u.id
        ${whereClause}
        ORDER BY generated_at DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get compliance reports error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance reports'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/reports/generate
 * @desc    Generate new compliance report
 * @access  Private (Admin, Compliance Officer)
 */
router.post('/reports/generate',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    try {
      const { report_type, framework_id, report_period, report_name } = req.body;
      
      // Generate report using database function
      const result = await db.query(`
        SELECT generate_compliance_report($1, $2, $3, $4) as report_id
      `, [report_type, framework_id, report_period, report_name]);
      
      const reportId = result.rows[0].report_id;
      
      // Get the generated report
      const reportResult = await db.query(`
        SELECT * FROM compliance_reports WHERE id = $1
      `, [reportId]);
      
      res.json({
        success: true,
        data: reportResult.rows[0]
      });
    } catch (error) {
      console.error('❌ Generate compliance report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/metrics
 * @desc    Get compliance metrics
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/metrics',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { metric_name, framework, period, hours_back } = req.query;
      
      let whereClause = 'WHERE timestamp > NOW() - ($1 || \' hours\')::INTERVAL';
      const params = [hours_back];
      let paramCount = 1;
      
      if (metric_name) {
        paramCount++;
        whereClause += ` AND metric_name = $${paramCount}`;
        params.push(metric_name);
      }
      
      if (framework) {
        paramCount++;
        whereClause += ` AND framework = $${paramCount}`;
        params.push(framework);
      }
      
      if (period) {
        paramCount++;
        whereClause += ` AND period = $${paramCount}`;
        params.push(period);
      }
      
      const result = await db.query(`
        SELECT 
          metric_name, metric_value, metric_unit, framework, period,
          timestamp, tags, source
        FROM compliance_metrics 
        ${whereClause}
        ORDER BY timestamp DESC
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get compliance metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance metrics'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/regulatory-requirements
 * @desc    Get regulatory requirements
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/regulatory-requirements',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { regulation_name, compliance_status, requirement_type } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (regulation_name) {
        paramCount++;
        whereClause += ` AND regulation_name = $${paramCount}`;
        params.push(regulation_name);
      }
      
      if (compliance_status) {
        paramCount++;
        whereClause += ` AND compliance_status = $${paramCount}`;
        params.push(compliance_status);
      }
      
      if (requirement_type) {
        paramCount++;
        whereClause += ` AND requirement_type = $${paramCount}`;
        params.push(requirement_type);
      }
      
      const result = await db.query(`
        SELECT 
          rr.*,
          u.email as responsible_party_email,
          u.first_name as responsible_party_first_name,
          u.last_name as responsible_party_last_name
        FROM regulatory_requirements rr
        LEFT JOIN users u ON rr.responsible_party = u.id
        ${whereClause}
        ORDER BY regulation_name, requirement_id
      `, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('❌ Get regulatory requirements error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get regulatory requirements'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/regulatory-requirements/:id/assess
 * @desc    Assess regulatory requirement compliance
 * @access  Private (Admin, Compliance Officer)
 */
router.post('/regulatory-requirements/:id/assess',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 20 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { compliance_status, assessment_notes, next_assessment } = req.body;
      
      const result = await db.query(`
        UPDATE regulatory_requirements 
        SET 
          compliance_status = $1,
          last_assessment = NOW(),
          next_assessment = $2,
          notes = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [compliance_status, next_assessment, assessment_notes, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Regulatory requirement not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Assess regulatory requirement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assess regulatory requirement'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/dashboard
 * @desc    Get compliance dashboard data
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/dashboard',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      // Get comprehensive dashboard data
      const [
        statsResult,
        recentViolationsResult,
        recentEventsResult,
        frameworkComplianceResult,
        breachIncidentsResult,
        upcomingAssessmentsResult
      ] = await Promise.all([
        // Overall statistics
        db.query('SELECT * FROM get_compliance_statistics(24)'),
        
        // Recent violations
        db.query(`
          SELECT cv.*, u.email as assigned_user_email
          FROM compliance_violations cv
          LEFT JOIN users u ON cv.assigned_to = u.id
          WHERE cv.detected_at > NOW() - INTERVAL '24 hours'
          ORDER BY cv.detected_at DESC
          LIMIT 10
        `),
        
        // Recent compliance events
        db.query(`
          SELECT id, user_id, ip_address, timestamp, framework_results, violations
          FROM compliance_events
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          ORDER BY timestamp DESC
          LIMIT 10
        `),
        
        // Framework compliance rates
        db.query(`
          SELECT 
            framework_name,
            AVG(CASE WHEN framework_results->>'hipaa' = 'true' THEN 100 ELSE 0 END) as hipaa_rate,
            AVG(CASE WHEN framework_results->>'nist' = 'true' THEN 100 ELSE 0 END) as nist_rate,
            AVG(CASE WHEN framework_results->>'iso27001' = 'true' THEN 100 ELSE 0 END) as iso27001_rate
          FROM compliance_events ce
          CROSS JOIN compliance_frameworks cf
          WHERE ce.timestamp > NOW() - INTERVAL '24 hours'
          GROUP BY cf.framework_name
        `),
        
        // Recent breach incidents
        db.query(`
          SELECT * FROM breach_incidents
          WHERE detected_at > NOW() - INTERVAL '7 days'
          ORDER BY detected_at DESC
          LIMIT 5
        `),
        
        // Upcoming assessments
        db.query(`
          SELECT ca.*, cf.framework_name
          FROM compliance_assessments ca
          LEFT JOIN compliance_frameworks cf ON ca.framework_id = cf.id
          WHERE ca.next_assessment BETWEEN NOW() AND NOW() + INTERVAL '30 days'
          ORDER BY ca.next_assessment ASC
          LIMIT 10
        `)
      ]);
      
      res.json({
        success: true,
        data: {
          statistics: statsResult.rows[0],
          recent_violations: recentViolationsResult.rows,
          recent_events: recentEventsResult.rows,
          framework_compliance: frameworkComplianceResult.rows,
          breach_incidents: breachIncidentsResult.rows,
          upcoming_assessments: upcomingAssessmentsResult.rows,
          generated: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Get compliance dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance dashboard'
      });
    }
  }
);

/**
 * @route   POST /api/compliance/export
 * @desc    Export compliance data
 * @access  Private (Admin, Compliance Officer)
 */
router.post('/export',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 5 }),
  async (req, res) => {
    try {
      const { export_type, format, start_date, end_date, filters } = req.body;
      
      // This would integrate with the reporting system for actual export generation
      // For now, we'll return a placeholder response
      
      const exportJob = {
        id: crypto.randomUUID(),
        type: export_type,
        format: format,
        status: 'PROCESSING',
        created_by: req.user.id,
        created_at: new Date(),
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      };
      
      // Store export job in Redis for tracking
      await redisClient.setex(`export_job:${exportJob.id}`, 3600, JSON.stringify(exportJob));
      
      res.json({
        success: true,
        data: {
          job_id: exportJob.id,
          status: 'PROCESSING',
          message: 'Export job created successfully. Check status with GET /api/compliance/export/:job_id'
        }
      });
    } catch (error) {
      console.error('❌ Export compliance data error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export compliance data'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/export/:job_id
 * @desc    Get export job status
 * @access  Private (Admin, Compliance Officer)
 */
router.get('/export/:job_id',
  authenticateToken,
  requireRole('ADMIN', 'COMPLIANCE_OFFICER'),
  rateLimiter({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const { job_id } = req.params;
      
      const jobData = await redisClient.get(`export_job:${job_id}`);
      
      if (!jobData) {
        return res.status(404).json({
          success: false,
          error: 'Export job not found'
        });
      }
      
      const job = JSON.parse(jobData);
      
      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('❌ Get export job status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get export job status'
      });
    }
  }
);

/**
 * @route   GET /api/compliance/integration-audits
 * @desc    List all integration audit results
 * @access  Private (Admin)
 */
router.get('/integration-audits',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const audits = await integrationAuditService.prisma.integrationAudit.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100
      });
      res.json({ success: true, data: audits });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   GET /api/compliance/integration-audits/:id
 * @desc    Get details for a specific integration audit
 * @access  Private (Admin)
 */
router.get('/integration-audits/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const audit = await integrationAuditService.prisma.integrationAudit.findUnique({
        where: { auditId: req.params.id }
      });
      if (!audit) return res.status(404).json({ success: false, error: 'Audit not found' });
      res.json({ success: true, data: audit });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   POST /api/compliance/integration-audits/run
 * @desc    Trigger a new integration audit
 * @access  Private (Admin)
 * @body    { tenantId, integrationType, integrationId }
 */
router.post('/integration-audits/run',
  authenticateToken,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { tenantId, integrationType, integrationId } = req.body;
      if (!tenantId || !integrationType || !integrationId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const result = await integrationAuditService.runComprehensiveAudit(tenantId, integrationType, integrationId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router; 