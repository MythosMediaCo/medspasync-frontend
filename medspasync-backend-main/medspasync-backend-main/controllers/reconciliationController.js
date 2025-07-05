// controllers/reconciliationController.js (enhanced)
const FileProcessingService = require('../services/fileProcessingService.js');
const AIReconciliationService = require('../services/aiReconciliationService.js');
const { PrismaClient } = require('@prisma/client');

class ReconciliationController {
  constructor() {
    this.fileProcessor = new FileProcessingService();
    this.aiService = new AIReconciliationService();
    this.prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
    this.isDemoMode = !process.env.DATABASE_URL;
    
    if (this.isDemoMode) {
      console.log('🔧 Running in demo mode - no database persistence');
      this.jobStorage = new Map(); // In-memory storage for demo
    }
  }

  async uploadFiles(req, res) {
    try {
      const files = req.files;
      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const processedFiles = {};
      const errors = [];

      for (const [fileType, fileArray] of Object.entries(files)) {
        try {
          if (!['alle', 'aspire', 'pos'].includes(fileType)) {
            errors.push(`Invalid file type: ${fileType}`);
            continue;
          }

          const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
          const processed = await this.fileProcessor.processFile(file, fileType);
          processedFiles[fileType] = processed;

        } catch (error) {
          errors.push(`Error processing ${fileType} file: ${error.message}`);
        }
      }

      // Validation
      if (!processedFiles.pos) {
        errors.push('POS transaction file is required');
      }

      if (!processedFiles.alle && !processedFiles.aspire) {
        errors.push('At least one rewards file (Alle or Aspire) is required');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors,
          processedFiles
        });
      }

      res.json({
        success: true,
        message: 'Files processed successfully',
        processedFiles,
        summary: {
          totalFiles: Object.keys(processedFiles).length,
          totalTransactions: Object.values(processedFiles).reduce((sum, file) => sum + file.validRows, 0)
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        error: 'File processing failed'
      });
    }
  }

  async startReconciliation(req, res) {
    try {
      const { alleTransactions, aspireTransactions, posTransactions, confidenceThreshold = 0.95 } = req.body;

      // Validate input
      if (!posTransactions || posTransactions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'POS transactions are required'
        });
      }

      const totalRewards = (alleTransactions?.length || 0) + (aspireTransactions?.length || 0);
      if (totalRewards === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one reward transaction file is required'
        });
      }

      // Create job record
      const jobData = {
        userId: req.user?.id || 'demo_user',
        status: 'processing',
        input: {
          alleCount: alleTransactions?.length || 0,
          aspireCount: aspireTransactions?.length || 0,
          posCount: posTransactions.length,
          confidenceThreshold
        },
        createdAt: new Date()
      };

      let jobId;
      if (this.isDemoMode) {
        jobId = `demo_${Date.now()}`;
        this.jobStorage.set(jobId, jobData);
      } else {
        const job = await this.prisma.reconciliationJob.create({ data: jobData });
        jobId = job.id;
      }

      // Process reconciliation (async in real mode, sync in demo)
      if (this.isDemoMode) {
        const result = await this.aiService.processReconciliation({
          alleTransactions,
          aspireTransactions,
          posTransactions,
          confidenceThreshold
        });

        // Store result
        const completedJob = {
          ...jobData,
          status: 'completed',
          results: result.results,
          processingTime: result.processingTime,
          completedAt: new Date()
        };
        this.jobStorage.set(jobId, completedJob);

        res.json({
          success: true,
          jobId,
          status: 'completed',
          results: result.results,
          message: 'Reconciliation completed (demo mode)'
        });
      } else {
        // Async processing for production
        this.processReconciliationAsync(jobId, {
          alleTransactions,
          aspireTransactions,
          posTransactions,
          confidenceThreshold
        });

        res.json({
          success: true,
          jobId,
          status: 'processing',
          message: 'Reconciliation started',
          estimatedTime: this.estimateProcessingTime(jobData.input)
        });
      }

    } catch (error) {
      console.error('Reconciliation start error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start reconciliation'
      });
    }
  }

  async getReconciliationResults(req, res) {
    try {
      const { jobId } = req.params;

      let job;
      if (this.isDemoMode) {
        job = this.jobStorage.get(jobId);
      } else {
        job = await this.prisma.reconciliationJob.findUnique({
          where: { id: jobId }
        });
      }

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        jobId,
        status: job.status,
        createdAt: job.createdAt,
        input: job.input,
        ...(job.results && { results: job.results }),
        ...(job.error && { error: job.error }),
        ...(job.processingTime && { processingTime: job.processingTime })
      });

    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get reconciliation results'
      });
    }
  }

  async processReconciliationAsync(jobId, request) {
    try {
      if (!this.isDemoMode) {
        await this.prisma.reconciliationJob.update({
          where: { id: jobId },
          data: { status: 'processing', startedAt: new Date() }
        });
      }

      const result = await this.aiService.processReconciliation(request);

      if (!this.isDemoMode) {
        await this.prisma.reconciliationJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            results: result.results,
            processingTime: result.processingTime,
            completedAt: new Date()
          }
        });
      }

      console.log(`✅ Reconciliation job ${jobId} completed`);

    } catch (error) {
      console.error(`❌ Reconciliation job ${jobId} failed:`, error);

      if (!this.isDemoMode) {
        await this.prisma.reconciliationJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: error.message,
            failedAt: new Date()
          }
        });
      }
    }
  }

  estimateProcessingTime(input) {
    const total = input.alleCount + input.aspireCount + input.posCount;
    return Math.max(30, Math.floor(total * 0.1)); // 30s minimum, 0.1s per transaction
  }
}

module.exports = ReconciliationController;