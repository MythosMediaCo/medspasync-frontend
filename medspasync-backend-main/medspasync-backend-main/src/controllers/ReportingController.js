const FileProcessingService = require('../services/reporting/FileProcessingService');
const ReportGenerationEngine = require('../services/reporting/ReportGenerationEngine');
const POSIntegrationService = require('../services/reporting/POSIntegrationService');
const { prisma } = require('../../prisma/client');
const { auditLogger } = require('../auditService');
const { encryptionService } = require('../encryptionService');

class ReportingController {
  constructor() {
    this.fileProcessor = new FileProcessingService();
    this.reportEngine = new ReportGenerationEngine();
    this.posIntegration = new POSIntegrationService();
  }

  /**
   * Process file upload with comprehensive validation
   */
  async processFileUpload(req, res) {
    try {
      const { files } = req;
      const tenantId = req.user.practiceId || req.user.tenantId;
      const userId = req.user.id;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please upload at least one file for processing'
        });
      }

      const results = [];
      const createdJobs = [];

      // Process each uploaded file
      for (const [fieldName, fileArray] of Object.entries(files)) {
        const files = Array.isArray(fileArray) ? fileArray : [fileArray];
        
        for (const file of files) {
          try {
            // Create database record for job tracking
            const jobRecord = await prisma.fileProcessingJob.create({
              data: {
                tenantId,
                userId,
                fileName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                status: 'PROCESSING'
              }
            });

            // Process file asynchronously
            this.processFileAsync(jobRecord.id, file.path, tenantId, userId);

            results.push({
              jobId: jobRecord.id,
              fieldName,
              originalName: file.originalname,
              status: 'PROCESSING',
              message: 'File uploaded and processing started'
            });

            createdJobs.push(jobRecord);

          } catch (error) {
            console.error('File processing error:', error);
            results.push({
              fieldName,
              originalName: file.originalname,
              error: error.message,
              status: 'FAILED'
            });
          }
        }
      }

      // Log audit trail
      await auditLogger.log({
        action: 'FILES_UPLOADED',
        userId,
        tenantId,
        details: {
          fileCount: createdJobs.length,
          totalSize: createdJobs.reduce((sum, job) => sum + job.fileSize, 0),
          jobIds: createdJobs.map(job => job.id)
        }
      });

      res.json({
        success: true,
        message: 'Files uploaded and processing started',
        results,
        limits: req.fileUploadLimits
      });

    } catch (error) {
      console.error('File upload controller error:', error);
      res.status(500).json({
        error: 'File upload failed',
        message: error.message
      });
    }
  }

  /**
   * Process file asynchronously
   */
  async processFileAsync(jobId, filePath, tenantId, userId) {
    try {
      // Process file using service
      const result = await this.fileProcessor.processFile(filePath, tenantId, userId);

      // Update job record
      await prisma.fileProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          recordCount: result.recordCount,
          metadata: result.schemaMapping,
          endTime: new Date(),
          processingTime: result.processingTime
        }
      });

      // Log success
      await auditLogger.log({
        action: 'FILE_PROCESSED_SUCCESS',
        userId,
        tenantId,
        details: {
          jobId,
          recordCount: result.recordCount,
          processingTime: result.processingTime
        }
      });

    } catch (error) {
      console.error('Async file processing error:', error);
      
      // Update job record with error
      await prisma.fileProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error.message,
          endTime: new Date()
        }
      });

      // Log error
      await auditLogger.log({
        action: 'FILE_PROCESSED_FAILED',
        userId,
        tenantId,
        details: {
          jobId,
          error: error.message
        }
      });
    }
  }

  /**
   * Get job status from database
   */
  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const tenantId = req.user.practiceId || req.user.tenantId;

      const job = await prisma.fileProcessingJob.findFirst({
        where: {
          id: jobId,
          tenantId
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'Processing job not found or access denied'
        });
      }

      res.json({
        success: true,
        jobId: job.id,
        status: job.status,
        fileName: job.fileName,
        fileSize: job.fileSize,
        recordCount: job.recordCount,
        processingTime: job.processingTime,
        startTime: job.startTime,
        endTime: job.endTime,
        error: job.error,
        user: job.user
      });

    } catch (error) {
      console.error('Job status error:', error);
      res.status(500).json({
        error: 'Failed to get job status',
        message: error.message
      });
    }
  }

  /**
   * Get data preview for processed job
   */
  async getDataPreview(req, res) {
    try {
      const { jobId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const tenantId = req.user.practiceId || req.user.tenantId;

      // Verify job exists and user has access
      const job = await prisma.fileProcessingJob.findFirst({
        where: {
          id: jobId,
          tenantId,
          status: 'COMPLETED'
        }
      });

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'Job not found or not completed'
        });
      }

      // Get preview from service
      const preview = this.fileProcessor.getDataPreview(jobId, limit);

      res.json({
        success: true,
        jobId,
        ...preview
      });

    } catch (error) {
      console.error('Data preview error:', error);
      res.status(500).json({
        error: 'Failed to get data preview',
        message: error.message
      });
    }
  }

  /**
   * Generate report with database integration
   */
  async generateReport(req, res) {
    try {
      const { 
        templateId, 
        data, 
        options = {},
        formats = ['PDF', 'EXCEL']
      } = req.body;

      const tenantId = req.user.practiceId || req.user.tenantId;
      const userId = req.user.id;

      // Validate template access
      const template = await prisma.reportTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { tenantId: null, isSystem: true }, // System templates
            { tenantId, isActive: true }        // User templates
          ]
        }
      });

      if (!template) {
        return res.status(404).json({
          error: 'Template not found',
          message: 'Report template not found or access denied'
        });
      }

      // Create report record
      const reportRecord = await prisma.generatedReport.create({
        data: {
          tenantId,
          userId,
          templateId,
          status: 'GENERATING',
          formats: formats.map(f => f.toUpperCase())
        }
      });

      // Generate report asynchronously
      this.generateReportAsync(reportRecord.id, templateId, data, options, formats, tenantId, userId);

      res.json({
        success: true,
        message: 'Report generation started',
        reportId: reportRecord.id,
        status: 'GENERATING'
      });

    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({
        error: 'Report generation failed',
        message: error.message
      });
    }
  }

  /**
   * Generate report asynchronously
   */
  async generateReportAsync(reportId, templateId, data, options, formats, tenantId, userId) {
    try {
      // Add user context to options
      options.userId = userId;
      options.tenantId = tenantId;
      options.formats = formats;

      // Generate report using service
      const result = await this.reportEngine.generateReport(templateId, data, options);

      // Update report record
      await prisma.generatedReport.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          reportData: result.reportData,
          filePaths: result.outputs,
          metadata: {
            processingTime: result.processingTime,
            recordCount: result.reportData?.dataSummary?.totalRecords,
            generatedAt: new Date().toISOString()
          }
        }
      });

      // Log success
      await auditLogger.log({
        action: 'REPORT_GENERATED_SUCCESS',
        userId,
        tenantId,
        details: {
          reportId,
          templateId,
          formats,
          processingTime: result.processingTime
        }
      });

    } catch (error) {
      console.error('Async report generation error:', error);
      
      // Update report record with error
      await prisma.generatedReport.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString()
          }
        }
      });

      // Log error
      await auditLogger.log({
        action: 'REPORT_GENERATED_FAILED',
        userId,
        tenantId,
        details: {
          reportId,
          templateId,
          error: error.message
        }
      });
    }
  }

  /**
   * Get available templates with tier filtering
   */
  async getTemplates(req, res) {
    try {
      const tenantId = req.user.practiceId || req.user.tenantId;
      const tier = req.user.planType || 'core';

      // Get system templates
      const systemTemplates = await prisma.reportTemplate.findMany({
        where: {
          isSystem: true,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          templateData: true
        }
      });

      // Get user templates
      const userTemplates = await prisma.reportTemplate.findMany({
        where: {
          tenantId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          templateData: true
        }
      });

      // Filter templates based on subscription tier
      const availableTemplates = [...systemTemplates, ...userTemplates].filter(template => {
        const templateTier = template.templateData?.requiredTier || 'core';
        return this.isTemplateAvailableForTier(templateTier, tier);
      });

      res.json({
        success: true,
        templates: availableTemplates,
        currentTier: tier,
        systemTemplates: systemTemplates.length,
        userTemplates: userTemplates.length
      });

    } catch (error) {
      console.error('Template fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch templates',
        message: error.message
      });
    }
  }

  /**
   * Configure POS integration
   */
  async configurePOSIntegration(req, res) {
    try {
      const { integrationId, config } = req.body;
      const tenantId = req.user.practiceId || req.user.tenantId;
      const userId = req.user.id;

      // Validate integration exists
      const integration = this.posIntegration.integrations[integrationId];
      if (!integration) {
        return res.status(404).json({
          error: 'Integration not found',
          message: 'Specified POS integration not found'
        });
      }

      // Encrypt sensitive configuration
      const encryptedConfig = await this.encryptIntegrationConfig(config);

      // Create or update integration record
      const integrationRecord = await prisma.pOSIntegration.upsert({
        where: {
          tenantId_type: {
            tenantId,
            type: integrationId.toUpperCase()
          }
        },
        update: {
          config: encryptedConfig,
          status: 'CONFIGURED',
          updatedAt: new Date()
        },
        create: {
          tenantId,
          userId,
          type: integrationId.toUpperCase(),
          name: integration.name,
          config: encryptedConfig,
          status: 'CONFIGURED'
        }
      });

      // Test connection
      const testResult = await this.posIntegration.testConnection(integrationId, config);

      // Update status based on test result
      await prisma.pOSIntegration.update({
        where: { id: integrationRecord.id },
        data: {
          status: testResult.success ? 'ACTIVE' : 'ERROR',
          syncStatus: testResult.success ? 'READY' : 'FAILED',
          error: testResult.success ? null : testResult.error
        }
      });

      res.json({
        success: true,
        message: 'Integration configured successfully',
        integrationId: integrationRecord.id,
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        testResult
      });

    } catch (error) {
      console.error('POS integration configuration error:', error);
      res.status(500).json({
        error: 'Integration configuration failed',
        message: error.message
      });
    }
  }

  /**
   * Fetch data from POS integration
   */
  async fetchPOSData(req, res) {
    try {
      const { integrationId, dataType, options = {} } = req.body;
      const tenantId = req.user.practiceId || req.user.tenantId;

      // Verify integration exists and is active
      const integration = await prisma.pOSIntegration.findFirst({
        where: {
          tenantId,
          type: integrationId.toUpperCase(),
          status: 'ACTIVE'
        }
      });

      if (!integration) {
        return res.status(404).json({
          error: 'Integration not found',
          message: 'POS integration not found or not active'
        });
      }

      // Decrypt configuration
      const decryptedConfig = await this.decryptIntegrationConfig(integration.config);

      // Fetch data
      const result = await this.posIntegration.fetchData(integrationId, dataType, {
        ...options,
        tenantId,
        ...decryptedConfig
      });

      // Update last sync time
      await prisma.pOSIntegration.update({
        where: { id: integration.id },
        data: {
          lastSync: new Date(),
          syncStatus: 'SUCCESS'
        }
      });

      res.json({
        success: true,
        message: 'Data fetched successfully',
        ...result
      });

    } catch (error) {
      console.error('POS data fetch error:', error);
      res.status(500).json({
        error: 'Data fetch failed',
        message: error.message
      });
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(req, res) {
    try {
      const tenantId = req.user.practiceId || req.user.tenantId;
      const period = req.query.period || '30d';

      // Get analytics data from multiple sources
      const [
        fileProcessingStats,
        reportGenerationStats,
        posIntegrationStats,
        recentActivity
      ] = await Promise.all([
        this.getFileProcessingStats(tenantId, period),
        this.getReportGenerationStats(tenantId, period),
        this.getPOSIntegrationStats(tenantId),
        this.getRecentActivity(tenantId)
      ]);

      const analytics = {
        fileProcessing: fileProcessingStats,
        reportGeneration: reportGenerationStats,
        posIntegrations: posIntegrationStats,
        recentActivity,
        period
      };

      res.json({
        success: true,
        analytics
      });

    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message
      });
    }
  }

  /**
   * Get file processing statistics
   */
  async getFileProcessingStats(tenantId, period) {
    const startDate = this.getStartDate(period);

    const stats = await prisma.fileProcessingJob.groupBy({
      by: ['status'],
      where: {
        tenantId,
        startTime: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        fileSize: true,
        recordCount: true,
        processingTime: true
      }
    });

    return {
      totalJobs: stats.reduce((sum, stat) => sum + stat._count.id, 0),
      completedJobs: stats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      failedJobs: stats.find(s => s.status === 'FAILED')?._count.id || 0,
      totalSize: stats.reduce((sum, stat) => sum + (stat._sum.fileSize || 0), 0),
      totalRecords: stats.reduce((sum, stat) => sum + (stat._sum.recordCount || 0), 0),
      avgProcessingTime: stats.reduce((sum, stat) => sum + (stat._sum.processingTime || 0), 0) / 
                        stats.reduce((sum, stat) => sum + stat._count.id, 0) || 0
    };
  }

  /**
   * Get report generation statistics
   */
  async getReportGenerationStats(tenantId, period) {
    const startDate = this.getStartDate(period);

    const stats = await prisma.generatedReport.groupBy({
      by: ['status'],
      where: {
        tenantId,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    return {
      totalReports: stats.reduce((sum, stat) => sum + stat._count.id, 0),
      completedReports: stats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      failedReports: stats.find(s => s.status === 'FAILED')?._count.id || 0,
      pendingReports: stats.find(s => s.status === 'PENDING')?._count.id || 0
    };
  }

  /**
   * Get POS integration statistics
   */
  async getPOSIntegrationStats(tenantId) {
    const integrations = await prisma.pOSIntegration.findMany({
      where: { tenantId },
      select: {
        type: true,
        status: true,
        lastSync: true
      }
    });

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.status === 'ACTIVE').length,
      lastSync: integrations
        .filter(i => i.lastSync)
        .sort((a, b) => new Date(b.lastSync) - new Date(a.lastSync))[0]?.lastSync
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(tenantId) {
    const recentJobs = await prisma.fileProcessingJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fileName: true,
        status: true,
        createdAt: true,
        recordCount: true
      }
    });

    const recentReports = await prisma.generatedReport.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        template: {
          select: { name: true }
        }
      }
    });

    return {
      recentJobs,
      recentReports
    };
  }

  /**
   * Utility methods
   */
  isTemplateAvailableForTier(templateTier, userTier) {
    const tierOrder = ['core', 'professional', 'enterprise'];
    const templateIndex = tierOrder.indexOf(templateTier);
    const userIndex = tierOrder.indexOf(userTier);
    return userIndex >= templateIndex;
  }

  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  async encryptIntegrationConfig(config) {
    const encrypted = { ...config };
    
    if (config.apiKey) {
      encrypted.apiKey = await encryptionService.encrypt(config.apiKey);
    }
    
    if (config.clientSecret) {
      encrypted.clientSecret = await encryptionService.encrypt(config.clientSecret);
    }

    return encrypted;
  }

  async decryptIntegrationConfig(encryptedConfig) {
    const decrypted = { ...encryptedConfig };
    
    if (encryptedConfig.apiKey) {
      decrypted.apiKey = await encryptionService.decrypt(encryptedConfig.apiKey);
    }
    
    if (encryptedConfig.clientSecret) {
      decrypted.clientSecret = await encryptionService.decrypt(encryptedConfig.clientSecret);
    }

    return decrypted;
  }
}

module.exports = ReportingController; 