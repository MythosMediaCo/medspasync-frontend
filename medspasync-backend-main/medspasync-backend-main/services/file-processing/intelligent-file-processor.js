const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { eventBus } = require('../microservices/event-bus');

const prisma = new PrismaClient();

/**
 * Intelligent File Processing System
 * 
 * Features:
 * - AI-powered file type detection
 * - Automatic schema mapping
 * - Data validation and cleaning
 * - Medical spa context awareness
 * - Progress tracking and reporting
 * - Error handling and recovery
 * - Audit logging
 */

class IntelligentFileProcessor {
  constructor() {
    this.supportedFormats = ['csv', 'xlsx', 'xls', 'json', 'xml'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedMimeTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json',
      'application/xml',
      'text/xml'
    ];
    
    this.medicalSpaSchemas = this.initializeMedicalSpaSchemas();
    this.validationRules = this.initializeValidationRules();
  }

  /**
   * Initialize medical spa specific schemas
   */
  initializeMedicalSpaSchemas() {
    return {
      appointments: {
        required: ['clientName', 'service', 'date', 'time', 'practitioner'],
        optional: ['notes', 'duration', 'price', 'status'],
        mappings: {
          'Client Name': 'clientName',
          'Service Name': 'service',
          'Appointment Date': 'date',
          'Appointment Time': 'time',
          'Staff Member': 'practitioner',
          'Duration (min)': 'duration',
          'Price ($)': 'price',
          'Status': 'status',
          'Notes': 'notes'
        }
      },
      clients: {
        required: ['firstName', 'lastName', 'email', 'phone'],
        optional: ['dateOfBirth', 'address', 'emergencyContact', 'medicalHistory', 'preferences'],
        mappings: {
          'First Name': 'firstName',
          'Last Name': 'lastName',
          'Email Address': 'email',
          'Phone Number': 'phone',
          'Date of Birth': 'dateOfBirth',
          'Address': 'address',
          'Emergency Contact': 'emergencyContact',
          'Medical History': 'medicalHistory',
          'Preferences': 'preferences'
        }
      },
      services: {
        required: ['name', 'category', 'duration', 'price'],
        optional: ['description', 'active'],
        mappings: {
          'Service Name': 'name',
          'Category': 'category',
          'Duration (min)': 'duration',
          'Price ($)': 'price',
          'Description': 'description',
          'Active': 'active'
        }
      },
      transactions: {
        required: ['clientName', 'service', 'amount', 'date'],
        optional: ['paymentMethod', 'status', 'notes'],
        mappings: {
          'Client Name': 'clientName',
          'Service': 'service',
          'Amount ($)': 'amount',
          'Transaction Date': 'date',
          'Payment Method': 'paymentMethod',
          'Status': 'status',
          'Notes': 'notes'
        }
      }
    };
  }

  /**
   * Initialize validation rules for medical spa data
   */
  initializeValidationRules() {
    return {
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      },
      phone: {
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        message: 'Invalid phone number format'
      },
      date: {
        pattern: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/,
        message: 'Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY'
      },
      time: {
        pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        message: 'Invalid time format. Use HH:MM (24-hour)'
      },
      price: {
        pattern: /^\d+(\.\d{1,2})?$/,
        message: 'Invalid price format. Use numbers with up to 2 decimal places'
      },
      duration: {
        pattern: /^\d+$/,
        message: 'Duration must be a positive integer'
      }
    };
  }

  /**
   * Process uploaded file with intelligent detection and processing
   */
  async processFile(file, practiceId, userId, options = {}) {
    const jobId = crypto.randomUUID();
    
    try {
      // Create processing job record
      const job = await prisma.fileProcessingJob.create({
        data: {
          id: jobId,
          practiceId,
          userId,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          status: 'PROCESSING',
          metadata: {
            originalName: file.originalname,
            encoding: file.encoding,
            fieldname: file.fieldname
          }
        }
      });

      logger.info(`File processing started`, { jobId, fileName: file.originalname });

      // Detect file type and content
      const fileAnalysis = await this.analyzeFile(file);
      
      // Update job with analysis results
      await prisma.fileProcessingJob.update({
        where: { id: jobId },
        data: {
          detectedType: fileAnalysis.type,
          detectedSchema: fileAnalysis.schema,
          metadata: {
            ...job.metadata,
            analysis: fileAnalysis
          }
        }
      });

      // Parse file content
      const parsedData = await this.parseFile(file, fileAnalysis);
      
      // Map data to schema
      const mappedData = await this.mapDataToSchema(parsedData, fileAnalysis.schema);
      
      // Validate and clean data
      const validationResults = await this.validateAndCleanData(mappedData, fileAnalysis.schema);
      
      // Process data based on schema type
      const processingResults = await this.processDataBySchema(
        validationResults.cleanData, 
        fileAnalysis.schema, 
        practiceId
      );

      // Update job with results
      await prisma.fileProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          recordsProcessed: processingResults.processedCount,
          recordsFailed: validationResults.failedCount,
          results: {
            validation: validationResults,
            processing: processingResults,
            summary: {
              totalRecords: parsedData.length,
              validRecords: validationResults.cleanData.length,
              invalidRecords: validationResults.failedCount,
              processedRecords: processingResults.processedCount,
              errors: validationResults.errors
            }
          }
        }
      });

      // Publish event
      await eventBus.publishEvent('file.processing.completed', {
        jobId,
        practiceId,
        userId,
        fileName: file.originalname,
        results: processingResults
      });

      logger.info(`File processing completed`, { 
        jobId, 
        fileName: file.originalname,
        processedCount: processingResults.processedCount 
      });

      return {
        jobId,
        status: 'completed',
        results: processingResults,
        validation: validationResults
      };

    } catch (error) {
      logger.error(`File processing failed`, { jobId, fileName: file.originalname, error: error.message });
      
      // Update job with error
      if (jobId) {
        await prisma.fileProcessingJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: error.message,
            results: {
              error: error.message,
              stack: error.stack
            }
          }
        });
      }

      throw error;
    }
  }

  /**
   * Analyze file to detect type and content
   */
  async analyzeFile(file) {
    try {
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      const mimeType = file.mimetype;
      
      // Detect file type
      let detectedType = this.detectFileType(fileExtension, mimeType);
      
      // Read file content for deeper analysis
      const content = await this.readFileContent(file, detectedType);
      
      // Analyze content structure
      const structure = await this.analyzeContentStructure(content, detectedType);
      
      // Detect schema based on content
      const detectedSchema = await this.detectSchema(content, structure);
      
      return {
        type: detectedType,
        schema: detectedSchema,
        structure,
        confidence: this.calculateConfidence(structure, detectedSchema)
      };
    } catch (error) {
      logger.error('File analysis failed', { error: error.message });
      throw new Error(`File analysis failed: ${error.message}`);
    }
  }

  /**
   * Detect file type based on extension and mime type
   */
  detectFileType(extension, mimeType) {
    const typeMap = {
      'csv': 'csv',
      'xlsx': 'excel',
      'xls': 'excel',
      'json': 'json',
      'xml': 'xml'
    };

    const mimeTypeMap = {
      'text/csv': 'csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
      'application/vnd.ms-excel': 'excel',
      'application/json': 'json',
      'application/xml': 'xml',
      'text/xml': 'xml'
    };

    return typeMap[extension] || mimeTypeMap[mimeType] || 'unknown';
  }

  /**
   * Read file content based on type
   */
  async readFileContent(file, type) {
    switch (type) {
      case 'csv':
        return await this.readCSVContent(file);
      case 'excel':
        return await this.readExcelContent(file);
      case 'json':
        return await this.readJSONContent(file);
      case 'xml':
        return await this.readXMLContent(file);
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  }

  /**
   * Read CSV content
   */
  async readCSVContent(file) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Read Excel content
   */
  async readExcelContent(file) {
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  }

  /**
   * Read JSON content
   */
  async readJSONContent(file) {
    const content = fs.readFileSync(file.path, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Read XML content
   */
  async readXMLContent(file) {
    // Implement XML parsing logic
    const content = fs.readFileSync(file.path, 'utf8');
    // Use a library like xml2js for proper XML parsing
    return [{ content }]; // Placeholder
  }

  /**
   * Analyze content structure
   */
  async analyzeContentStructure(content, type) {
    if (!content || content.length === 0) {
      return { columns: [], rowCount: 0, hasHeaders: false };
    }

    const firstRow = content[0];
    const columns = Object.keys(firstRow);
    
    return {
      columns,
      rowCount: content.length,
      hasHeaders: this.detectHeaders(columns),
      dataTypes: this.inferDataTypes(content, columns),
      sampleData: content.slice(0, 5)
    };
  }

  /**
   * Detect if first row contains headers
   */
  detectHeaders(columns) {
    const headerPatterns = [
      /name/i, /email/i, /phone/i, /date/i, /time/i, /service/i, /client/i,
      /appointment/i, /price/i, /duration/i, /status/i
    ];

    return columns.some(col => 
      headerPatterns.some(pattern => pattern.test(col))
    );
  }

  /**
   * Infer data types from content
   */
  inferDataTypes(content, columns) {
    const dataTypes = {};
    
    columns.forEach(column => {
      const values = content.slice(0, 100).map(row => row[column]).filter(v => v !== undefined && v !== null);
      
      if (values.length === 0) {
        dataTypes[column] = 'string';
        return;
      }

      // Check for email
      if (values.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
        dataTypes[column] = 'email';
      }
      // Check for date
      else if (values.some(v => /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/.test(v))) {
        dataTypes[column] = 'date';
      }
      // Check for time
      else if (values.some(v => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v))) {
        dataTypes[column] = 'time';
      }
      // Check for number
      else if (values.some(v => !isNaN(v) && v !== '')) {
        dataTypes[column] = 'number';
      }
      // Default to string
      else {
        dataTypes[column] = 'string';
      }
    });

    return dataTypes;
  }

  /**
   * Detect schema based on content analysis
   */
  async detectSchema(content, structure) {
    const { columns } = structure;
    
    // Calculate similarity scores for each schema
    const schemaScores = Object.entries(this.medicalSpaSchemas).map(([schemaName, schema]) => {
      const score = this.calculateSchemaSimilarity(columns, schema);
      return { schemaName, score };
    });

    // Sort by score and return the best match
    schemaScores.sort((a, b) => b.score - a.score);
    
    const bestMatch = schemaScores[0];
    
    // Only return schema if confidence is high enough
    if (bestMatch.score > 0.3) {
      return bestMatch.schemaName;
    }
    
    return 'unknown';
  }

  /**
   * Calculate similarity between columns and schema
   */
  calculateSchemaSimilarity(columns, schema) {
    const schemaColumns = [...schema.required, ...schema.optional];
    const schemaMappings = Object.values(schema.mappings);
    
    let matches = 0;
    let totalColumns = Math.max(columns.length, schemaColumns.length);
    
    columns.forEach(column => {
      // Check direct matches
      if (schemaColumns.includes(column) || schemaMappings.includes(column)) {
        matches++;
      } else {
        // Check fuzzy matches
        const fuzzyMatch = schemaColumns.find(schemaCol => 
          this.fuzzyMatch(column, schemaCol) > 0.7
        );
        if (fuzzyMatch) {
          matches += 0.5;
        }
      }
    });
    
    return matches / totalColumns;
  }

  /**
   * Fuzzy string matching
   */
  fuzzyMatch(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Map data to detected schema
   */
  async mapDataToSchema(data, schemaName) {
    if (schemaName === 'unknown') {
      return data; // Return unmapped data
    }

    const schema = this.medicalSpaSchemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown schema: ${schemaName}`);
    }

    return data.map(row => {
      const mappedRow = {};
      
      Object.keys(row).forEach(originalKey => {
        // Find mapping for this key
        const mappedKey = schema.mappings[originalKey] || 
                         Object.keys(schema.mappings).find(key => 
                           this.fuzzyMatch(originalKey, key) > 0.7
                         );
        
        if (mappedKey) {
          mappedRow[mappedKey] = row[originalKey];
        } else {
          // Keep original key if no mapping found
          mappedRow[originalKey] = row[originalKey];
        }
      });
      
      return mappedRow;
    });
  }

  /**
   * Validate and clean data
   */
  async validateAndCleanData(data, schemaName) {
    const schema = this.medicalSpaSchemas[schemaName];
    const cleanData = [];
    const errors = [];
    let failedCount = 0;

    data.forEach((row, index) => {
      const rowErrors = [];
      const cleanRow = {};

      // Validate required fields
      if (schema) {
        schema.required.forEach(field => {
          if (!row[field] || row[field].toString().trim() === '') {
            rowErrors.push(`Missing required field: ${field}`);
          }
        });
      }

      // Validate field formats
      Object.keys(row).forEach(field => {
        const value = row[field];
        if (value !== undefined && value !== null) {
          const validationRule = this.validationRules[field];
          if (validationRule) {
            const isValid = validationRule.pattern.test(value.toString());
            if (!isValid) {
              rowErrors.push(`${field}: ${validationRule.message}`);
            }
          }
        }
        
        // Clean the value
        cleanRow[field] = this.cleanValue(value, field);
      });

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: rowErrors,
          data: row
        });
        failedCount++;
      } else {
        cleanData.push(cleanRow);
      }
    });

    return {
      cleanData,
      errors,
      failedCount,
      totalCount: data.length
    };
  }

  /**
   * Clean individual values
   */
  cleanValue(value, field) {
    if (value === undefined || value === null) {
      return null;
    }

    const stringValue = value.toString().trim();

    // Clean based on field type
    switch (field) {
      case 'email':
        return stringValue.toLowerCase();
      case 'phone':
        return stringValue.replace(/[^\d+]/g, '');
      case 'date':
        return this.normalizeDate(stringValue);
      case 'time':
        return this.normalizeTime(stringValue);
      case 'price':
        return parseFloat(stringValue.replace(/[^\d.]/g, ''));
      case 'duration':
        return parseInt(stringValue.replace(/[^\d]/g, ''));
      default:
        return stringValue;
    }
  }

  /**
   * Normalize date format
   */
  normalizeDate(dateString) {
    // Handle various date formats
    const dateFormats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/ // MM-DD-YYYY
    ];

    for (const format of dateFormats) {
      const match = dateString.match(format);
      if (match) {
        if (format.source.includes('YYYY-MM-DD')) {
          return dateString; // Already in correct format
        } else {
          const [, month, day, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    return dateString; // Return as-is if no format matches
  }

  /**
   * Normalize time format
   */
  normalizeTime(timeString) {
    // Handle various time formats
    const timeFormats = [
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM (24-hour)
      /^([01]?[0-9]):[0-5][0-9]\s*(AM|PM)$/i // HH:MM AM/PM
    ];

    for (const format of timeFormats) {
      const match = timeString.match(format);
      if (match) {
        if (format.source.includes('AM|PM')) {
          const [, hour, minute, period] = match;
          let hour24 = parseInt(hour);
          if (period.toUpperCase() === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          return `${hour24.toString().padStart(2, '0')}:${minute}`;
        } else {
          return timeString; // Already in correct format
        }
      }
    }

    return timeString; // Return as-is if no format matches
  }

  /**
   * Process data based on schema type
   */
  async processDataBySchema(data, schemaName, practiceId) {
    switch (schemaName) {
      case 'appointments':
        return await this.processAppointments(data, practiceId);
      case 'clients':
        return await this.processClients(data, practiceId);
      case 'services':
        return await this.processServices(data, practiceId);
      case 'transactions':
        return await this.processTransactions(data, practiceId);
      default:
        return {
          processedCount: 0,
          message: `Unknown schema: ${schemaName}`,
          data: data
        };
    }
  }

  /**
   * Process appointments data
   */
  async processAppointments(data, practiceId) {
    let processedCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        // Find or create client
        const client = await this.findOrCreateClient(row, practiceId);
        
        // Find or create service
        const service = await this.findOrCreateService(row, practiceId);
        
        // Find staff member
        const staff = await this.findStaffMember(row.practitioner, practiceId);
        
        if (!staff) {
          errors.push(`Staff member not found: ${row.practitioner}`);
          continue;
        }

        // Create appointment
        const appointment = await prisma.appointment.create({
          data: {
            practiceId,
            clientId: client.id,
            serviceId: service.id,
            staffId: staff.id,
            dateTime: new Date(`${row.date}T${row.time}`),
            duration: row.duration || service.duration,
            status: row.status || 'SCHEDULED',
            notes: row.notes,
            price: row.price || service.price,
            paymentStatus: 'PENDING'
          }
        });

        processedCount++;
      } catch (error) {
        errors.push(`Failed to process appointment: ${error.message}`);
      }
    }

    return {
      processedCount,
      errors,
      message: `Processed ${processedCount} appointments`
    };
  }

  /**
   * Process clients data
   */
  async processClients(data, practiceId) {
    let processedCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const client = await prisma.client.upsert({
          where: { email: row.email },
          update: {
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone,
            status: row.status || 'ACTIVE',
            notes: row.notes
          },
          create: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            status: row.status || 'ACTIVE',
            notes: row.notes
          }
        });

        processedCount++;
      } catch (error) {
        errors.push(`Failed to process client: ${error.message}`);
      }
    }

    return {
      processedCount,
      errors,
      message: `Processed ${processedCount} clients`
    };
  }

  /**
   * Process services data
   */
  async processServices(data, practiceId) {
    let processedCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const service = await prisma.service.upsert({
          where: { 
            name_practiceId: {
              name: row.name,
              practiceId: practiceId
            }
          },
          update: {
            category: row.category,
            description: row.description,
            duration: row.duration,
            price: row.price,
            active: row.active !== false
          },
          create: {
            name: row.name,
            category: row.category,
            description: row.description,
            duration: row.duration,
            price: row.price,
            active: row.active !== false
          }
        });

        processedCount++;
      } catch (error) {
        errors.push(`Failed to process service: ${error.message}`);
      }
    }

    return {
      processedCount,
      errors,
      message: `Processed ${processedCount} services`
    };
  }

  /**
   * Process transactions data
   */
  async processTransactions(data, practiceId) {
    // Implementation for transaction processing
    return {
      processedCount: 0,
      errors: [],
      message: 'Transaction processing not yet implemented'
    };
  }

  /**
   * Helper methods for data processing
   */
  async findOrCreateClient(row, practiceId) {
    return await prisma.client.upsert({
      where: { email: row.clientName }, // Assuming clientName is email
      update: {},
      create: {
        firstName: row.clientName.split(' ')[0] || row.clientName,
        lastName: row.clientName.split(' ').slice(1).join(' ') || '',
        email: row.clientName, // This should be the actual email
        status: 'ACTIVE'
      }
    });
  }

  async findOrCreateService(row, practiceId) {
    return await prisma.service.upsert({
      where: { 
        name_practiceId: {
          name: row.service,
          practiceId: practiceId
        }
      },
      update: {},
      create: {
        name: row.service,
        category: 'Imported',
        duration: row.duration || 60,
        price: row.price || 0,
        active: true
      }
    });
  }

  async findStaffMember(name, practiceId) {
    return await prisma.staff.findFirst({
      where: {
        practiceId,
        OR: [
          { firstName: { contains: name, mode: 'insensitive' } },
          { lastName: { contains: name, mode: 'insensitive' } },
          { 
            AND: [
              { firstName: { contains: name.split(' ')[0], mode: 'insensitive' } },
              { lastName: { contains: name.split(' ').slice(1).join(' '), mode: 'insensitive' } }
            ]
          }
        ]
      }
    });
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(structure, schema) {
    if (schema === 'unknown') return 0;
    
    const schemaColumns = this.medicalSpaSchemas[schema];
    if (!schemaColumns) return 0;

    const requiredMatches = schemaColumns.required.filter(req => 
      structure.columns.some(col => 
        col === req || this.fuzzyMatch(col, req) > 0.7
      )
    ).length;

    return requiredMatches / schemaColumns.required.length;
  }

  /**
   * Get processing job status
   */
  async getJobStatus(jobId) {
    return await prisma.fileProcessingJob.findUnique({
      where: { id: jobId }
    });
  }

  /**
   * Get all processing jobs for a practice
   */
  async getPracticeJobs(practiceId, limit = 50) {
    return await prisma.fileProcessingJob.findMany({
      where: { practiceId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

module.exports = IntelligentFileProcessor; 