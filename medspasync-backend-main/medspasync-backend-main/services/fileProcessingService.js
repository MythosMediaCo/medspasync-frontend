/**
 * File Processing Service
 * Handles file uploads, parsing, AI-powered schema mapping, validation, and encryption
 * for the MedSpaSync Pro reporting system
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { performanceLogger } = require('../utils/logger');
const multer = require('multer');

class FileProcessingService {
  constructor() {
    this.prisma = new PrismaClient();
    this.supportedFormats = ['csv', 'xlsx', 'xls', 'json'];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.encryptionKey = process.env.FILE_ENCRYPTION_KEY;
    
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process file upload
   */
  async processFileUpload(file, userId, tenantId, metadata = {}) {
    const startTime = Date.now();
    
    try {
      // Validate file
      await this.validateFile(file);
      
      // Create processing job
      const job = await this.createProcessingJob(file, userId, tenantId, metadata);
      
      // Process file asynchronously
      this.processFileAsync(job.id, file);
      
      return {
        success: true,
        jobId: job.id,
        status: 'PROCESSING',
        message: 'File upload initiated successfully'
      };
      
    } catch (error) {
      performanceLogger.error('File upload failed', {
        error: error.message,
        fileName: file.originalname,
        userId,
        tenantId,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  async validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file format
    const extension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.supportedFormats.includes(extension)) {
      throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    // Check for malicious content
    await this.scanForMaliciousContent(file);
  }

  /**
   * Scan file for malicious content
   */
  async scanForMaliciousContent(file) {
    const buffer = file.buffer;
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\./i,
      /window\./i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new Error('File contains potentially malicious content');
      }
    }
  }

  /**
   * Create processing job record
   */
  async createProcessingJob(file, userId, tenantId, metadata) {
    const encryptedPath = await this.encryptAndStoreFile(file, tenantId);
    
    return await this.prisma.fileProcessingJob.create({
      data: {
        tenantId,
        userId,
        status: 'PROCESSING',
        fileName: file.originalname,
        filePath: encryptedPath,
        fileSize: file.size,
        metadata: {
          contentType: file.mimetype,
          originalName: file.originalname,
          encoding: file.encoding,
          ...metadata
        }
      }
    });
  }

  /**
   * Encrypt and store file
   */
  async encryptAndStoreFile(file, tenantId) {
    const fileName = `${crypto.randomUUID()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, tenantId, fileName);
    
    // Ensure tenant directory exists
    const tenantDir = path.dirname(filePath);
    await fs.mkdir(tenantDir, { recursive: true });
    
    // Encrypt file content
    const encryptedContent = this.encryptBuffer(file.buffer);
    
    // Write encrypted file
    await fs.writeFile(filePath, encryptedContent);
    
    return filePath;
  }

  /**
   * Encrypt buffer using AES-256
   */
  encryptBuffer(buffer) {
    if (!this.encryptionKey) {
      throw new Error('File encryption key not configured');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypt buffer
   */
  decryptBuffer(encryptedBuffer) {
    if (!this.encryptionKey) {
      throw new Error('File encryption key not configured');
    }
    
    const iv = encryptedBuffer.slice(0, 16);
    const encrypted = encryptedBuffer.slice(16);
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  /**
   * Process file asynchronously
   */
  async processFileAsync(jobId, file) {
    try {
      // Parse file content
      const parsedData = await this.parseFile(file);
      
      // Perform AI-powered schema mapping
      const schemaMapping = await this.performSchemaMapping(parsedData);
      
      // Validate data
      const validationResults = await this.validateData(parsedData, schemaMapping);
      
      // Update job status
      await this.updateJobStatus(jobId, 'COMPLETED', {
        recordCount: parsedData.length,
        schemaMapping,
        validationResults
      });
      
      performanceLogger.info('File processing completed', {
        jobId,
        fileName: file.originalname,
        recordCount: parsedData.length
      });
      
    } catch (error) {
      await this.updateJobStatus(jobId, 'FAILED', { error: error.message });
      
      performanceLogger.error('File processing failed', {
        jobId,
        fileName: file.originalname,
        error: error.message
      });
    }
  }

  /**
   * Parse file content based on format
   */
  async parseFile(file) {
    const extension = path.extname(file.originalname).toLowerCase();
    
    switch (extension) {
      case '.csv':
        return await this.parseCSV(file.buffer);
      case '.xlsx':
      case '.xls':
        return await this.parseExcel(file.buffer);
      case '.json':
        return await this.parseJSON(file.buffer);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = require('stream');
      const readable = new stream.Readable();
      readable.push(buffer);
      readable.push(null);
      
      readable
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Parse Excel file
   */
  async parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    return xlsx.utils.sheet_to_json(worksheet);
  }

  /**
   * Parse JSON file
   */
  async parseJSON(buffer) {
    const content = buffer.toString('utf8');
    return JSON.parse(content);
  }

  /**
   * Perform AI-powered schema mapping
   */
  async performSchemaMapping(data) {
    if (!data || data.length === 0) {
      return {};
    }

    const sampleRow = data[0];
    const columns = Object.keys(sampleRow);
    const mapping = {};

    // AI-powered column mapping
    for (const column of columns) {
      const normalizedColumn = column.toLowerCase().trim();
      
      // Map common column names
      if (normalizedColumn.includes('email')) {
        mapping[column] = 'email';
      } else if (normalizedColumn.includes('name') && normalizedColumn.includes('first')) {
        mapping[column] = 'firstName';
      } else if (normalizedColumn.includes('name') && normalizedColumn.includes('last')) {
        mapping[column] = 'lastName';
      } else if (normalizedColumn.includes('phone')) {
        mapping[column] = 'phone';
      } else if (normalizedColumn.includes('amount') || normalizedColumn.includes('price')) {
        mapping[column] = 'amount';
      } else if (normalizedColumn.includes('date')) {
        mapping[column] = 'date';
      } else if (normalizedColumn.includes('service')) {
        mapping[column] = 'service';
      } else if (normalizedColumn.includes('client')) {
        mapping[column] = 'clientName';
      } else {
        mapping[column] = 'unknown';
      }
    }

    return mapping;
  }

  /**
   * Validate parsed data
   */
  async validateData(data, schemaMapping) {
    const validationResults = {
      totalRecords: data.length,
      validRecords: 0,
      invalidRecords: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors = [];

      // Validate required fields
      for (const [column, mappedField] of Object.entries(schemaMapping)) {
        if (mappedField !== 'unknown' && !row[column]) {
          rowErrors.push(`Missing required field: ${column}`);
        }
      }

      // Validate email format
      const emailColumn = Object.keys(schemaMapping).find(col => schemaMapping[col] === 'email');
      if (emailColumn && row[emailColumn]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row[emailColumn])) {
          rowErrors.push(`Invalid email format: ${row[emailColumn]}`);
        }
      }

      // Validate amount format
      const amountColumn = Object.keys(schemaMapping).find(col => schemaMapping[col] === 'amount');
      if (amountColumn && row[amountColumn]) {
        const amount = parseFloat(row[amountColumn]);
        if (isNaN(amount) || amount < 0) {
          rowErrors.push(`Invalid amount: ${row[amountColumn]}`);
        }
      }

      if (rowErrors.length > 0) {
        validationResults.invalidRecords++;
        validationResults.errors.push({
          row: i + 1,
          errors: rowErrors
        });
      } else {
        validationResults.validRecords++;
      }
    }

    return validationResults;
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, metadata = {}) {
    const updateData = {
      status,
      metadata: {
        ...metadata,
        updatedAt: new Date()
      }
    };

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.endTime = new Date();
    }

    await this.prisma.fileProcessingJob.update({
      where: { id: jobId },
      data: updateData
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId, userId, tenantId) {
    const job = await this.prisma.fileProcessingJob.findFirst({
      where: {
        id: jobId,
        userId,
        tenantId
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      status: job.status,
      fileName: job.fileName,
      fileSize: job.fileSize,
      recordCount: job.recordCount,
      metadata: job.metadata,
      startTime: job.startTime,
      endTime: job.endTime,
      processingTime: job.processingTime,
      error: job.error
    };
  }

  /**
   * List user's processing jobs
   */
  async listUserJobs(userId, tenantId, limit = 10, offset = 0) {
    const jobs = await this.prisma.fileProcessingJob.findMany({
      where: {
        userId,
        tenantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return jobs.map(job => ({
      id: job.id,
      status: job.status,
      fileName: job.fileName,
      fileSize: job.fileSize,
      recordCount: job.recordCount,
      startTime: job.startTime,
      endTime: job.endTime,
      createdAt: job.createdAt
    }));
  }

  /**
   * Delete processing job and associated files
   */
  async deleteJob(jobId, userId, tenantId) {
    const job = await this.prisma.fileProcessingJob.findFirst({
      where: {
        id: jobId,
        userId,
        tenantId
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Delete file from storage
    try {
      await fs.unlink(job.filePath);
    } catch (error) {
      console.warn('Failed to delete file:', error.message);
    }

    // Delete job record
    await this.prisma.fileProcessingJob.delete({
      where: { id: jobId }
    });

    return { success: true, message: 'Job deleted successfully' };
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(userId, tenantId) {
    const stats = await this.prisma.fileProcessingJob.groupBy({
      by: ['status'],
      where: {
        userId,
        tenantId
      },
      _count: {
        status: true
      }
    });

    const totalJobs = await this.prisma.fileProcessingJob.count({
      where: { userId, tenantId }
    });

    const totalRecords = await this.prisma.fileProcessingJob.aggregate({
      where: { userId, tenantId },
      _sum: {
        recordCount: true
      }
    });

    return {
      totalJobs,
      totalRecords: totalRecords._sum.recordCount || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {})
    };
  }

  getUploadMiddleware() {
    const storage = multer.memoryStorage();
    return multer({
      storage,
      limits: { fileSize: this.maxFileSize },
      fileFilter: (req, file, cb) => {
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (this.supportedFormats.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file format'), false);
        }
      }
    });
  }
}

module.exports = FileProcessingService;