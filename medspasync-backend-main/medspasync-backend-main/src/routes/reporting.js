const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { 
  checkSubscriptionTier, 
  checkFileUploadLimits, 
  checkReportTemplateAccess,
  checkPOSIntegrationLimits,
  checkAIInsightsAccess,
  checkRealTimeDataAccess
} = require('../middleware/subscription-gate.middleware');

// Import services
const FileProcessingService = require('../services/reporting/FileProcessingService');
const ReportGenerationEngine = require('../services/reporting/ReportGenerationEngine');
const POSIntegrationService = require('../services/reporting/POSIntegrationService');

// Initialize services
const fileProcessor = new FileProcessingService();
const reportEngine = new ReportGenerationEngine();
const posIntegration = new POSIntegrationService();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// FILE PROCESSING ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/reports/uploads/process
 * @desc    Process uploaded files with AI-powered data synthesis
 * @access  Authenticated users with file upload permissions
 */
router.post('/uploads/process', 
  checkFileUploadLimits(),
  async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please upload at least one file for processing'
        });
      }

      const results = [];
      const tenantId = req.user.practiceId || req.user.tenantId;
      const userId = req.user.id;

      // Process each uploaded file
      for (const [fieldName, files] of Object.entries(req.files)) {
        const fileArray = Array.isArray(files) ? files : [files];
        
        for (const file of fileArray) {
          try {
            const result = await fileProcessor.processFile(
              file.path,
              tenantId,
              userId
            );
            
            results.push({
              fieldName,
              originalName: file.originalname,
              ...result
            });
          } catch (error) {
            results.push({
              fieldName,
              originalName: file.originalname,
              error: error.message,
              status: 'FAILED'
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'File processing completed',
        results,
        limits: req.fileUploadLimits
      });

    } catch (error) {
      console.error('File processing error:', error);
      res.status(500).json({
        error: 'File processing failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/reports/uploads/status/:jobId
 * @desc    Get processing job status
 * @access  Authenticated users
 */
router.get('/uploads/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = fileProcessor.getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'Processing job not found or expired'
      });
    }

    // Ensure user can only access their own jobs
    if (status.tenantId !== (req.user.practiceId || req.user.tenantId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own processing jobs'
      });
    }

    res.json({
      success: true,
      jobId,
      status: status.status,
      progress: status.progress,
      recordCount: status.recordCount,
      processingTime: status.endTime ? status.endTime - status.startTime : null,
      error: status.error
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/v1/reports/uploads/preview/:jobId
 * @desc    Get data preview for processed job
 * @access  Authenticated users
 */
router.get('/uploads/preview/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const preview = fileProcessor.getDataPreview(jobId, limit);

    res.json({
      success: true,
      ...preview
    });

  } catch (error) {
    console.error('Data preview error:', error);
    res.status(500).json({
      error: 'Failed to get data preview',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/v1/reports/uploads/confirm/:jobId
 * @desc    Confirm and import processed data
 * @access  Authenticated users
 */
router.post('/uploads/confirm/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { schemaMapping, validationRules } = req.body;

    // Get job status
    const status = fileProcessor.getJobStatus(jobId);
    if (!status || status.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Job not ready',
        message: 'Job must be completed before confirmation'
      });
    }

    // Apply custom schema mapping if provided
    if (schemaMapping) {
      // Update schema mapping logic here
    }

    // Import data to database
    // This would integrate with existing reconciliation system
    const importResult = await importProcessedData(status.encryptedData, req.user);

    res.json({
      success: true,
      message: 'Data imported successfully',
      importedRecords: importResult.importedCount,
      jobId
    });

  } catch (error) {
    console.error('Data import error:', error);
    res.status(500).json({
      error: 'Failed to import data',
      message: error.message
    });
  }
});

// ============================================================================
// REPORT GENERATION ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/reports/templates
 * @desc    Get available report templates for current tier
 * @access  Authenticated users
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = reportEngine.getAvailableTemplates();
    const tier = req.user.planType || 'core';
    
    // Filter templates based on subscription tier
    const availableTemplates = templates.filter(template => {
      // This would check against subscription tier limits
      return true; // Simplified for now
    });

    res.json({
      success: true,
      templates: availableTemplates,
      currentTier: tier
    });

  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/v1/reports/generate
 * @desc    Generate new report
 * @access  Authenticated users with report generation permissions
 */
router.post('/generate',
  checkReportTemplateAccess(),
  checkAIInsightsAccess(),
  async (req, res) => {
    try {
      const { 
        templateId, 
        data, 
        options = {},
        formats = ['PDF', 'Excel']
      } = req.body;

      // Validate template
      if (!templateId) {
        return res.status(400).json({
          error: 'Template required',
          message: 'Please specify a report template'
        });
      }

      // Validate data
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          error: 'Data required',
          message: 'Please provide data for report generation'
        });
      }

      // Add user context to options
      options.userId = req.user.id;
      options.tenantId = req.user.practiceId || req.user.tenantId;
      options.formats = formats;

      // Generate report
      const result = await reportEngine.generateReport(templateId, data, options);

      res.json({
        success: true,
        message: 'Report generated successfully',
        reportId: result.reportId,
        outputs: Object.keys(result.outputs),
        processingTime: result.processingTime
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
 * @route   GET /api/v1/reports/download/:reportId
 * @desc    Download generated report
 * @access  Authenticated users
 */
router.get('/download/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const format = req.query.format || 'PDF';

    // This would retrieve the report from storage
    const reportPath = `/reports/generated/report-${reportId}.${format.toLowerCase()}`;
    
    res.download(reportPath, `report-${reportId}.${format.toLowerCase()}`);

  } catch (error) {
    console.error('Report download error:', error);
    res.status(500).json({
      error: 'Failed to download report',
      message: error.message
    });
  }
});

// ============================================================================
// POS INTEGRATION ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/reports/integrations
 * @desc    Get available POS integrations
 * @access  Authenticated users
 */
router.get('/integrations', async (req, res) => {
  try {
    const integrations = posIntegration.getAvailableIntegrations();
    const tier = req.user.planType || 'core';

    res.json({
      success: true,
      integrations,
      currentTier: tier
    });

  } catch (error) {
    console.error('Integration fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch integrations',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/v1/reports/integrations/configure
 * @desc    Configure POS integration
 * @access  Authenticated users with integration permissions
 */
router.post('/integrations/configure',
  checkPOSIntegrationLimits(),
  async (req, res) => {
    try {
      const { integrationId, config } = req.body;
      const tenantId = req.user.practiceId || req.user.tenantId;

      if (!integrationId || !config) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Integration ID and configuration are required'
        });
      }

      const result = await posIntegration.configureIntegration(
        tenantId,
        integrationId,
        config
      );

      res.json({
        success: true,
        message: 'Integration configured successfully',
        ...result
      });

    } catch (error) {
      console.error('Integration configuration error:', error);
      res.status(500).json({
        error: 'Integration configuration failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/reports/integrations/fetch
 * @desc    Fetch data from POS integration
 * @access  Authenticated users with integration permissions
 */
router.post('/integrations/fetch',
  checkRealTimeDataAccess(),
  async (req, res) => {
    try {
      const { integrationId, dataType, options = {} } = req.body;
      const tenantId = req.user.practiceId || req.user.tenantId;

      if (!integrationId || !dataType) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Integration ID and data type are required'
        });
      }

      options.tenantId = tenantId;

      const result = await posIntegration.fetchData(integrationId, dataType, options);

      res.json({
        success: true,
        message: 'Data fetched successfully',
        ...result
      });

    } catch (error) {
      console.error('Data fetch error:', error);
      res.status(500).json({
        error: 'Data fetch failed',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/reports/integrations/webhook
 * @desc    Setup webhook for real-time data
 * @access  Authenticated users with integration permissions
 */
router.post('/integrations/webhook',
  checkRealTimeDataAccess(),
  async (req, res) => {
    try {
      const { integrationId, webhookUrl, events } = req.body;
      const tenantId = req.user.practiceId || req.user.tenantId;

      if (!integrationId || !webhookUrl) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Integration ID and webhook URL are required'
        });
      }

      const result = await posIntegration.setupWebhook(
        integrationId,
        webhookUrl,
        events
      );

      res.json({
        success: true,
        message: 'Webhook configured successfully',
        ...result
      });

    } catch (error) {
      console.error('Webhook setup error:', error);
      res.status(500).json({
        error: 'Webhook setup failed',
        message: error.message
      });
    }
  }
);

// ============================================================================
// SCHEDULING ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/reports/schedules
 * @desc    Schedule recurring report generation
 * @access  Authenticated users with scheduling permissions
 */
router.post('/schedules',
  checkSubscriptionTier('advanced-reports', 'scheduling'),
  async (req, res) => {
    try {
      const { 
        templateId, 
        schedule, 
        recipients, 
        formats = ['PDF'] 
      } = req.body;

      if (!templateId || !schedule) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Template ID and schedule are required'
        });
      }

      // Validate schedule format (cron expression)
      if (!isValidCronExpression(schedule)) {
        return res.status(400).json({
          error: 'Invalid schedule',
          message: 'Please provide a valid cron expression'
        });
      }

      // Create scheduled job
      const scheduleId = await createScheduledReport({
        templateId,
        schedule,
        recipients,
        formats,
        userId: req.user.id,
        tenantId: req.user.practiceId || req.user.tenantId
      });

      res.json({
        success: true,
        message: 'Report scheduled successfully',
        scheduleId
      });

    } catch (error) {
      console.error('Schedule creation error:', error);
      res.status(500).json({
        error: 'Failed to create schedule',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/reports/schedules
 * @desc    Get scheduled reports
 * @access  Authenticated users
 */
router.get('/schedules', async (req, res) => {
  try {
    const tenantId = req.user.practiceId || req.user.tenantId;
    
    // This would fetch from database
    const schedules = await getScheduledReports(tenantId);

    res.json({
      success: true,
      schedules
    });

  } catch (error) {
    console.error('Schedule fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch schedules',
      message: error.message
    });
  }
});

// ============================================================================
// ANALYTICS & INSIGHTS ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/reports/analytics/dashboard
 * @desc    Get real-time dashboard metrics
 * @access  Authenticated users with real-time data access
 */
router.get('/analytics/dashboard',
  checkRealTimeDataAccess(),
  async (req, res) => {
    try {
      const tenantId = req.user.practiceId || req.user.tenantId;
      const period = req.query.period || '30d';

      // Get dashboard metrics
      const metrics = await getDashboardMetrics(tenantId, period);

      res.json({
        success: true,
        metrics,
        period
      });

    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard metrics',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/reports/analytics/insights
 * @desc    Generate AI-powered insights
 * @access  Authenticated users with AI insights access
 */
router.post('/analytics/insights',
  checkAIInsightsAccess(),
  async (req, res) => {
    try {
      const { data, insightTypes } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          error: 'Data required',
          message: 'Please provide data for insight generation'
        });
      }

      // Generate insights using AI service
      const insights = await reportEngine.generateAIInsights(
        data,
        insightTypes || ['revenue_trends', 'service_performance'],
        { userId: req.user.id, tenantId: req.user.practiceId || req.user.tenantId }
      );

      res.json({
        success: true,
        insights
      });

    } catch (error) {
      console.error('Insight generation error:', error);
      res.status(500).json({
        error: 'Failed to generate insights',
        message: error.message
      });
    }
  }
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Import processed data to database
 */
async function importProcessedData(encryptedData, user) {
  // This would integrate with existing reconciliation system
  // For now, return mock result
  return {
    importedCount: encryptedData.length,
    success: true
  };
}

/**
 * Validate cron expression
 */
function isValidCronExpression(expression) {
  // Basic cron validation - in production, use a proper library
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(expression);
}

/**
 * Create scheduled report
 */
async function createScheduledReport(config) {
  // This would create a scheduled job in the database
  // For now, return mock ID
  return `schedule_${Date.now()}`;
}

/**
 * Get scheduled reports
 */
async function getScheduledReports(tenantId) {
  // This would fetch from database
  // For now, return mock data
  return [];
}

/**
 * Get dashboard metrics
 */
async function getDashboardMetrics(tenantId, period) {
  // This would fetch real metrics from database
  // For now, return mock data
  return {
    totalRevenue: 125000,
    totalTransactions: 1250,
    averageTicket: 100,
    topServices: [
      { name: 'Botox', revenue: 45000, count: 300 },
      { name: 'Fillers', revenue: 35000, count: 200 },
      { name: 'Chemical Peels', revenue: 25000, count: 250 }
    ],
    trends: {
      revenue: '+12%',
      transactions: '+8%',
      averageTicket: '+4%'
    }
  };
}

module.exports = router; 