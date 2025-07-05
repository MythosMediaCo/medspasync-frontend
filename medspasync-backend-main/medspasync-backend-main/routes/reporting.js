/**
 * Reporting API Routes
 * Exposes endpoints for file processing, report generation, POS integration,
 * scheduling, and analytics with authentication and subscription gating
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();

// Import services and middleware
const FileProcessingService = require('../services/FileProcessingService');
const ReportGenerationEngine = require('../services/ReportGenerationEngine');
const POSIntegrationService = require('../services/POSIntegrationService');
const ReportingController = require('../controllers/ReportingController');
const SubscriptionGateMiddleware = require('../middleware/SubscriptionGateMiddleware');
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');

// Initialize services
const fileProcessingService = new FileProcessingService();
const reportGenerationEngine = new ReportGenerationEngine();
const posIntegrationService = new POSIntegrationService();
const reportingController = new ReportingController();
const subscriptionGate = new SubscriptionGateMiddleware();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON files allowed.'));
    }
  }
});

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// FILE PROCESSING ROUTES
// ============================================================================

/**
 * @route   POST /api/reporting/files/upload
 * @desc    Upload and process files for reporting
 * @access  Authenticated users with file upload permission
 */
router.post('/files/upload',
  subscriptionGate.checkFileUploadLimits(),
  upload.array('files', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files provided',
          message: 'Please upload at least one file'
        });
      }

      const results = [];
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      for (const file of req.files) {
        try {
          const result = await fileProcessingService.processFileUpload(
            file,
            userId,
            tenantId,
            {
              source: req.body.source || 'manual',
              description: req.body.description
            }
          );
          results.push(result);
        } catch (error) {
          results.push({
            fileName: file.originalname,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        results,
        message: 'File processing initiated'
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        error: 'File upload failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/files/jobs
 * @desc    Get user's file processing jobs
 * @access  Authenticated users
 */
router.get('/files/jobs',
  async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const jobs = await fileProcessingService.listUserJobs(
        userId,
        tenantId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: jobs
      });

    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({
        error: 'Failed to retrieve jobs',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/files/jobs/:jobId
 * @desc    Get specific file processing job status
 * @access  Authenticated users
 */
router.get('/files/jobs/:jobId',
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const job = await fileProcessingService.getJobStatus(jobId, userId, tenantId);

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      console.error('Get job status error:', error);
      res.status(500).json({
        error: 'Failed to retrieve job status',
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/reporting/files/jobs/:jobId
 * @desc    Delete file processing job and associated files
 * @access  Authenticated users
 */
router.delete('/files/jobs/:jobId',
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const result = await fileProcessingService.deleteJob(jobId, userId, tenantId);

      res.json(result);

    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({
        error: 'Failed to delete job',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/files/stats
 * @desc    Get file processing statistics
 * @access  Authenticated users
 */
router.get('/files/stats',
  async (req, res) => {
    try {
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const stats = await fileProcessingService.getProcessingStats(userId, tenantId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: error.message
      });
    }
  }
);

// ============================================================================
// REPORT GENERATION ROUTES
// ============================================================================

/**
 * @route   GET /api/reporting/templates
 * @desc    Get available report templates
 * @access  Authenticated users
 */
router.get('/templates',
  async (req, res) => {
    try {
      const tenantId = req.user.practiceId;
      const templates = await reportGenerationEngine.getAvailableTemplates(tenantId);

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        error: 'Failed to retrieve templates',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/reporting/reports/generate
 * @desc    Generate a new report
 * @access  Authenticated users with report generation permission
 */
router.post('/reports/generate',
  subscriptionGate.checkReportTemplateAccess(),
  async (req, res) => {
    try {
      const { templateId, parameters, formats = ['PDF'] } = req.body;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      if (!templateId) {
        return res.status(400).json({
          error: 'Template ID required',
          message: 'Please specify a template ID'
        });
      }

      const result = await reportGenerationEngine.generateReport(
        templateId,
        userId,
        tenantId,
        { ...parameters, formats }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({
        error: 'Report generation failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/reports
 * @desc    Get user's generated reports
 * @access  Authenticated users
 */
router.get('/reports',
  async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const reports = await reportGenerationEngine.listUserReports(
        userId,
        tenantId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: reports
      });

    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({
        error: 'Failed to retrieve reports',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/reports/:reportId
 * @desc    Get specific report details
 * @access  Authenticated users
 */
router.get('/reports/:reportId',
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const report = await reportGenerationEngine.getReport(reportId, userId, tenantId);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json({
        error: 'Failed to retrieve report',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/reporting/templates
 * @desc    Create custom report template
 * @access  Authenticated users with admin role
 */
router.post('/templates',
  requireRole('admin'),
  async (req, res) => {
    try {
      const { name, description, templateData } = req.body;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      if (!name || !templateData) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name and template data are required'
        });
      }

      const template = await reportGenerationEngine.createCustomTemplate(
        tenantId,
        userId,
        { name, description, templateData }
      );

      res.status(201).json({
        success: true,
        data: template
      });

    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        error: 'Failed to create template',
        message: error.message
      });
    }
  }
);

// ============================================================================
// POS INTEGRATION ROUTES
// ============================================================================

/**
 * @route   POST /api/reporting/pos/integrations
 * @desc    Configure POS integration
 * @access  Authenticated users with POS integration permission
 */
router.post('/pos/integrations',
  subscriptionGate.checkPOSIntegrationLimits(),
  async (req, res) => {
    try {
      const { type, name, config } = req.body;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      if (!type || !name || !config) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Type, name, and configuration are required'
        });
      }

      const result = await posIntegrationService.configureIntegration(
        tenantId,
        userId,
        { type, name, config }
      );

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Configure POS integration error:', error);
      res.status(500).json({
        error: 'Failed to configure POS integration',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/pos/integrations
 * @desc    Get tenant's POS integrations
 * @access  Authenticated users
 */
router.get('/pos/integrations',
  async (req, res) => {
    try {
      const tenantId = req.user.practiceId;
      const integrations = await posIntegrationService.listIntegrations(tenantId);

      res.json({
        success: true,
        data: integrations
      });

    } catch (error) {
      console.error('Get POS integrations error:', error);
      res.status(500).json({
        error: 'Failed to retrieve POS integrations',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/pos/integrations/:integrationId
 * @desc    Get specific POS integration status
 * @access  Authenticated users
 */
router.get('/pos/integrations/:integrationId',
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const status = await posIntegrationService.getIntegrationStatus(integrationId);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Get POS integration status error:', error);
      res.status(500).json({
        error: 'Failed to retrieve integration status',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/reporting/pos/integrations/:integrationId/fetch
 * @desc    Fetch data from POS integration
 * @access  Authenticated users
 */
router.post('/pos/integrations/:integrationId/fetch',
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const { dataType, parameters = {} } = req.body;

      if (!dataType) {
        return res.status(400).json({
          error: 'Data type required',
          message: 'Please specify the type of data to fetch'
        });
      }

      const data = await posIntegrationService.fetchPOSData(
        integrationId,
        dataType,
        parameters
      );

      res.json({
        success: true,
        data
      });

    } catch (error) {
      console.error('Fetch POS data error:', error);
      res.status(500).json({
        error: 'Failed to fetch POS data',
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/reporting/pos/integrations/:integrationId
 * @desc    Delete POS integration
 * @access  Authenticated users
 */
router.delete('/pos/integrations/:integrationId',
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const tenantId = req.user.practiceId;

      const result = await posIntegrationService.deleteIntegration(integrationId, tenantId);

      res.json(result);

    } catch (error) {
      console.error('Delete POS integration error:', error);
      res.status(500).json({
        error: 'Failed to delete POS integration',
        message: error.message
      });
    }
  }
);

// ============================================================================
// SCHEDULING ROUTES
// ============================================================================

/**
 * @route   POST /api/reporting/schedules
 * @desc    Create scheduled report
 * @access  Authenticated users with scheduling permission
 */
router.post('/schedules',
  subscriptionGate.checkSubscriptionTier('advanced-reports', 'scheduling'),
  async (req, res) => {
    try {
      const { templateId, name, description, cronExpression, recipients, formats } = req.body;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      if (!templateId || !name || !cronExpression) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Template ID, name, and cron expression are required'
        });
      }

      const schedule = await reportingController.createScheduledReport({
        tenantId,
        userId,
        templateId,
        name,
        description,
        cronExpression,
        recipients,
        formats: formats || ['PDF']
      });

      res.status(201).json({
        success: true,
        data: schedule
      });

    } catch (error) {
      console.error('Create schedule error:', error);
      res.status(500).json({
        error: 'Failed to create scheduled report',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/schedules
 * @desc    Get user's scheduled reports
 * @access  Authenticated users
 */
router.get('/schedules',
  async (req, res) => {
    try {
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const schedules = await reportingController.getScheduledReports(userId, tenantId);

      res.json({
        success: true,
        data: schedules
      });

    } catch (error) {
      console.error('Get schedules error:', error);
      res.status(500).json({
        error: 'Failed to retrieve scheduled reports',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/reporting/schedules/:scheduleId
 * @desc    Update scheduled report
 * @access  Authenticated users
 */
router.put('/schedules/:scheduleId',
  async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const schedule = await reportingController.updateScheduledReport(
        scheduleId,
        userId,
        updateData
      );

      res.json({
        success: true,
        data: schedule
      });

    } catch (error) {
      console.error('Update schedule error:', error);
      res.status(500).json({
        error: 'Failed to update scheduled report',
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/reporting/schedules/:scheduleId
 * @desc    Delete scheduled report
 * @access  Authenticated users
 */
router.delete('/schedules/:scheduleId',
  async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const userId = req.user.id;

      const result = await reportingController.deleteScheduledReport(scheduleId, userId);

      res.json(result);

    } catch (error) {
      console.error('Delete schedule error:', error);
      res.status(500).json({
        error: 'Failed to delete scheduled report',
        message: error.message
      });
    }
  }
);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/reporting/analytics/overview
 * @desc    Get reporting analytics overview
 * @access  Authenticated users
 */
router.get('/analytics/overview',
  async (req, res) => {
    try {
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const analytics = await reportingController.getAnalyticsOverview(userId, tenantId);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve analytics',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/reporting/analytics/usage
 * @desc    Get usage analytics
 * @access  Authenticated users
 */
router.get('/analytics/usage',
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const userId = req.user.id;
      const tenantId = req.user.practiceId;

      const usage = await reportingController.getUsageAnalytics(userId, tenantId, period);

      res.json({
        success: true,
        data: usage
      });

    } catch (error) {
      console.error('Get usage analytics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve usage analytics',
        message: error.message
      });
    }
  }
);

// ============================================================================
// WEBHOOK ROUTES
// ============================================================================

/**
 * @route   POST /api/reporting/webhooks/pos/:type
 * @desc    Handle POS system webhooks
 * @access  Public (with signature verification)
 */
router.post('/webhooks/pos/:type',
  async (req, res) => {
    try {
      const { type } = req.params;
      const { body } = req;
      const signature = req.headers['x-webhook-signature'];

      const result = await posIntegrationService.handleWebhook(type, body, signature);

      res.json(result);

    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(400).json({
        error: 'Webhook processing failed',
        message: error.message
      });
    }
  }
);

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds the maximum limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Number of files exceeds the maximum limit'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }

  next(error);
});

// Global error handler
router.use((error, req, res, next) => {
  console.error('Reporting API error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 
      'An unexpected error occurred' : error.message
  });
});

module.exports = router; 