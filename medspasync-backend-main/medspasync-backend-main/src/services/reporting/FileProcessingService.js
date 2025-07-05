const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { aiReconciliationService } = require('../../engine/aiReconciliation');
const { encryptionService } = require('../encryptionService');
const { auditLogger } = require('../auditService');

class FileProcessingService {
  constructor() {
    this.supportedFormats = ['csv', 'xlsx', 'pdf', 'json', 'xml'];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.maxConcurrentFiles = 10;
    this.processingJobs = new Map();
    this.uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Get multer upload middleware with security validation
   */
  getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      // Validate file type
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      if (!this.supportedFormats.includes(fileExtension)) {
        return cb(new Error(`Unsupported file type: ${fileExtension}`), false);
      }

      // Validate file size
      if (file.size > this.maxFileSize) {
        return cb(new Error(`File too large: ${file.size} bytes`), false);
      }

      // Check for CSV injection
      if (fileExtension === 'csv' && this.detectCSVInjection(file)) {
        return cb(new Error('Potential CSV injection detected'), false);
      }

      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: this.maxConcurrentFiles
      }
    });
  }

  /**
   * Detect potential CSV injection attacks
   */
  detectCSVInjection(file) {
    // This would implement ClamAV or similar virus scanning
    // For now, check for common injection patterns
    const dangerousPatterns = [
      /^=/, /^\+/, /^-/, /^@/, /^\/\//, /^=cmd/, /^=powershell/
    ];
    
    // In production, this would scan the actual file content
    return false; // Placeholder - implement actual scanning
  }

  /**
   * Process uploaded file with AI-powered data synthesis
   */
  async processFile(filePath, tenantId, userId) {
    const jobId = uuidv4();
    const startTime = Date.now();

    try {
      // Initialize job tracking
      this.processingJobs.set(jobId, {
        status: 'PROCESSING',
        progress: 0,
        startTime,
        tenantId,
        userId,
        filePath
      });

      // Extract file metadata
      const fileExtension = path.extname(filePath).toLowerCase().substring(1);
      const fileStats = fs.statSync(filePath);

      // Parse file based on type
      let parsedData = [];
      let schemaMapping = {};

      switch (fileExtension) {
        case 'csv':
          parsedData = await this.parseCSV(filePath);
          break;
        case 'xlsx':
          parsedData = await this.parseExcel(filePath);
          break;
        case 'json':
          parsedData = await this.parseJSON(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // AI-powered schema mapping
      schemaMapping = await this.mapSchemaIntelligently(parsedData, tenantId);

      // Validate data against medical spa patterns
      const validationResults = await this.validateMedicalSpaData(parsedData, schemaMapping);

      // Encrypt sensitive data
      const encryptedData = await this.encryptSensitiveData(parsedData, tenantId);

      // Update job status
      this.processingJobs.set(jobId, {
        status: 'COMPLETED',
        progress: 100,
        startTime,
        endTime: Date.now(),
        tenantId,
        userId,
        filePath,
        recordCount: parsedData.length,
        schemaMapping,
        validationResults,
        encryptedData
      });

      // Log audit trail
      await auditLogger.log({
        action: 'FILE_PROCESSED',
        userId,
        tenantId,
        details: {
          jobId,
          fileName: path.basename(filePath),
          recordCount: parsedData.length,
          processingTime: Date.now() - startTime,
          fileSize: fileStats.size
        }
      });

      return {
        jobId,
        status: 'COMPLETED',
        recordCount: parsedData.length,
        schemaMapping,
        validationResults,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      // Update job status to failed
      this.processingJobs.set(jobId, {
        status: 'FAILED',
        progress: 0,
        startTime,
        endTime: Date.now(),
        tenantId,
        userId,
        filePath,
        error: error.message
      });

      // Log error
      await auditLogger.log({
        action: 'FILE_PROCESSING_FAILED',
        userId,
        tenantId,
        details: {
          jobId,
          fileName: path.basename(filePath),
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Parse CSV file with medical spa optimization
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Sanitize data to prevent injection
          const sanitizedData = this.sanitizeRecord(data);
          results.push(sanitizedData);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Parse Excel file
   */
  async parseExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const results = xlsx.utils.sheet_to_json(worksheet);
    
    // Sanitize all records
    return results.map(record => this.sanitizeRecord(record));
  }

  /**
   * Parse JSON file
   */
  async parseJSON(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle both array and object formats
    const records = Array.isArray(data) ? data : [data];
    
    return records.map(record => this.sanitizeRecord(record));
  }

  /**
   * Sanitize record to prevent XSS and injection attacks
   */
  sanitizeRecord(record) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string') {
        // Remove potential script tags and dangerous patterns
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * AI-powered schema mapping for medical spa data
   */
  async mapSchemaIntelligently(parsedData, tenantId) {
    if (!parsedData.length) return {};

    const sampleRecord = parsedData[0];
    const columnNames = Object.keys(sampleRecord);
    
    // Medical spa specific field mappings
    const medicalSpaFields = {
      // Patient/Client fields
      patient: ['patient', 'client', 'customer', 'name', 'full_name', 'patient_name'],
      firstName: ['first', 'first_name', 'fname', 'given_name'],
      lastName: ['last', 'last_name', 'lname', 'surname', 'family_name'],
      email: ['email', 'e-mail', 'email_address'],
      phone: ['phone', 'telephone', 'phone_number', 'mobile', 'cell'],
      
      // Service fields
      service: ['service', 'treatment', 'procedure', 'service_name', 'treatment_name'],
      serviceCategory: ['category', 'service_category', 'treatment_category', 'type'],
      
      // Financial fields
      amount: ['amount', 'total', 'price', 'cost', 'charge', 'payment'],
      tax: ['tax', 'tax_amount', 'sales_tax'],
      discount: ['discount', 'discount_amount', 'savings'],
      
      // Date/Time fields
      date: ['date', 'service_date', 'appointment_date', 'visit_date'],
      time: ['time', 'appointment_time', 'service_time'],
      
      // Provider fields
      provider: ['provider', 'practitioner', 'doctor', 'therapist', 'staff'],
      
      // Location fields
      location: ['location', 'clinic', 'office', 'branch']
    };

    const mapping = {};
    
    for (const [standardField, possibleNames] of Object.entries(medicalSpaFields)) {
      for (const columnName of columnNames) {
        const normalizedColumn = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (possibleNames.some(name => 
          normalizedColumn.includes(name.toLowerCase().replace(/[^a-z0-9]/g, ''))
        )) {
          mapping[standardField] = columnName;
          break;
        }
      }
    }

    // Use AI service for confidence scoring if available
    if (aiReconciliationService && aiReconciliationService.isServiceAvailable()) {
      try {
        const aiMapping = await aiReconciliationService.analyzeSchemaMapping(
          parsedData.slice(0, 10), // Sample for AI analysis
          mapping
        );
        
        return { ...mapping, ...aiMapping };
      } catch (error) {
        console.warn('AI schema mapping failed, using rule-based mapping:', error.message);
      }
    }

    return mapping;
  }

  /**
   * Validate data against medical spa patterns
   */
  async validateMedicalSpaData(parsedData, schemaMapping) {
    const validationResults = {
      totalRecords: parsedData.length,
      validRecords: 0,
      invalidRecords: 0,
      warnings: [],
      errors: []
    };

    const medicalSpaPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      amount: /^\d+(\.\d{1,2})?$/,
      date: /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/
    };

    for (let i = 0; i < parsedData.length; i++) {
      const record = parsedData[i];
      let recordValid = true;

      // Validate email if present
      if (schemaMapping.email && record[schemaMapping.email]) {
        if (!medicalSpaPatterns.email.test(record[schemaMapping.email])) {
          validationResults.warnings.push({
            recordIndex: i,
            field: 'email',
            value: record[schemaMapping.email],
            message: 'Invalid email format'
          });
        }
      }

      // Validate phone if present
      if (schemaMapping.phone && record[schemaMapping.phone]) {
        const cleanPhone = record[schemaMapping.phone].replace(/\D/g, '');
        if (!medicalSpaPatterns.phone.test(cleanPhone)) {
          validationResults.warnings.push({
            recordIndex: i,
            field: 'phone',
            value: record[schemaMapping.phone],
            message: 'Invalid phone format'
          });
        }
      }

      // Validate amount if present
      if (schemaMapping.amount && record[schemaMapping.amount]) {
        const amount = parseFloat(record[schemaMapping.amount]);
        if (isNaN(amount) || amount < 0) {
          validationResults.errors.push({
            recordIndex: i,
            field: 'amount',
            value: record[schemaMapping.amount],
            message: 'Invalid amount'
          });
          recordValid = false;
        }
      }

      if (recordValid) {
        validationResults.validRecords++;
      } else {
        validationResults.invalidRecords++;
      }
    }

    return validationResults;
  }

  /**
   * Encrypt sensitive data for HIPAA compliance
   */
  async encryptSensitiveData(parsedData, tenantId) {
    const sensitiveFields = ['email', 'phone', 'firstName', 'lastName', 'patient'];
    
    return parsedData.map(record => {
      const encryptedRecord = { ...record };
      
      for (const field of sensitiveFields) {
        if (record[field]) {
          encryptedRecord[field] = encryptionService.encryptPHI({
            data: record[field],
            tenantId,
            fieldType: field
          });
        }
      }
      
      return encryptedRecord;
    });
  }

  /**
   * Get processing job status
   */
  getJobStatus(jobId) {
    return this.processingJobs.get(jobId) || null;
  }

  /**
   * Get data preview for job
   */
  getDataPreview(jobId, limit = 10) {
    const job = this.processingJobs.get(jobId);
    if (!job || job.status !== 'COMPLETED') {
      throw new Error('Job not found or not completed');
    }

    return {
      jobId,
      recordCount: job.recordCount,
      schemaMapping: job.schemaMapping,
      validationResults: job.validationResults,
      preview: job.encryptedData.slice(0, limit)
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles() {
    const files = fs.readdirSync(this.uploadDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(this.uploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = FileProcessingService; 