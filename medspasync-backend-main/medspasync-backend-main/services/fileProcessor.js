const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class FileProcessorService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
  }

  getUploadMiddleware() {
    return multer({
      dest: this.uploadPath,
      limits: { fileSize: this.maxFileSize },
      fileFilter: this.validateFileType.bind(this)
    });
  }

  validateFileType(req, file, cb) {
    if (this.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files allowed.'));
    }
  }

  async processFile(file, fileType) {
    try {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      let rawData;

      if (fileExtension === '.csv') {
        rawData = await this.processCSV(file.path);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        rawData = await this.processExcel(file.path);
      } else {
        throw new Error('Unsupported file format');
      }

      const processedData = this.normalizeTransactionData(rawData, fileType);
      const validation = this.validateTransactionData(processedData);

      fs.unlinkSync(file.path);

      return {
        filename: file.originalname,
        type: fileType,
        totalRows: rawData.length,
        validRows: validation.validTransactions.length,
        errors: validation.errors,
        data: validation.validTransactions
      };
    } catch (error) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = fs.createReadStream(filePath);
      stream
        .pipe(csv({
          skipEmptyLines: true,
          headers: headers => headers.map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
        }))
        .on('data', data => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async processExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const targetSheet = this.findTransactionSheet(sheetNames);
    const worksheet = workbook.Sheets[targetSheet];

    return XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: ''
    }).filter(row => row.some(cell => cell && cell.toString().trim()));
  }

  findTransactionSheet(sheetNames) {
    const preferredNames = ['transactions', 'data', 'export', 'sheet1'];
    return sheetNames.find(name =>
      preferredNames.some(pref => name.toLowerCase().includes(pref))
    ) || sheetNames[0];
  }

  normalizeTransactionData(rawData, sourceType) {
    return rawData.map((row, index) => {
      try {
        switch (sourceType) {
          case 'alle':
            return this.normalizeAlleTransaction(row, index);
          case 'aspire':
            return this.normalizeAspireTransaction(row, index);
          case 'pos':
            return this.normalizePOSTransaction(row, index);
          default:
            throw new Error(`Unknown source type: ${sourceType}`);
        }
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error.message);
        return null;
      }
    }).filter(Boolean);
  }

  normalizeAlleTransaction(row, index) {
    return {
      id: `alle_${index}_${Date.now()}`,
      customerName: this.cleanString(row.patient_name || row['patient name'] || ''),
      amount: this.parseAmount(row.reward_value || row['reward value'] || row.points_earned),
      date: this.parseDate(row.date || row['transaction date']),
      service: this.cleanString(row.product_name || row.service || row['product name'] || ''),
      phone: this.cleanPhone(row.patient_phone || row.phone || ''),
      email: this.cleanEmail(row.patient_email || row.email || ''),
      provider: this.cleanString(row.provider || row['selected provider'] || ''),
      sourceSystem: 'alle',
      sourceTransactionId: row.transaction_id || row.id,
      pointsEarned: this.parseNumber(row.points_earned || 0),
      certificateId: row.certificate_code || row.offer_code
    };
  }

  normalizeAspireTransaction(row, index) {
    return {
      id: `aspire_${index}_${Date.now()}`,
      customerName: this.cleanString(row.patient_name || row['patient name'] || ''),
      amount: this.parseAmount(row.amount || row.value || 0),
      date: this.parseDate(row.treatment_date || row.date),
      service: this.cleanString(row.description || row.service || ''),
      sourceSystem: 'aspire',
      sourceTransactionId: row.certificate_code || row.id,
      certificateId: row.certificate_code
    };
  }

  normalizePOSTransaction(row, index) {
    return {
      id: `pos_${index}_${Date.now()}`,
      customerName: this.cleanString(row.patient_name || row.customer_name || row.name || ''),
      amount: this.parseAmount(row.amount || row.total || row.price || 0),
      date: this.parseDate(row.date || row.transaction_date || row.payment_date),
      service: this.cleanString(row.service || row.description || row.treatment || ''),
      phone: this.cleanPhone(row.phone || row.customer_phone || ''),
      provider: this.cleanString(row.provider || row.practitioner || ''),
      sourceSystem: 'pos',
      sourceTransactionId: row.transaction_id || row.id,
      paymentMethod: this.cleanString(row.payment_method || row.payment_type || ''),
      treatmentNotes: this.cleanString(row.notes || row.comments || '')
    };
  }

  cleanString(value) {
    if (!value) return '';
    return value.toString().trim().replace(/\s+/g, ' ');
  }

  cleanPhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/\D/g, '');
  }

  cleanEmail(email) {
    if (!email) return '';
    const cleaned = email.toString().trim().toLowerCase();
    return cleaned.includes('@') ? cleaned : '';
  }

  parseAmount(value) {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[\$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  parseNumber(value) {
    if (!value) return 0;
    const parsed = parseInt(value.toString());
    return isNaN(parsed) ? 0 : parsed;
  }

  parseDate(dateValue) {
    if (!dateValue) return new Date().toISOString();
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        const formats = [
          /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/,
          /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
          /(\d{1,2})-(\d{1,2})-(\d{2,4})/
        ];
        for (const format of formats) {
          const match = dateValue.toString().match(format);
          if (match) {
            const [, month, day, year] = match;
            const fullYear = year.length === 2 ? `20${year}` : year;
            const parsedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString();
            }
          }
        }
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  validateTransactionData(transactions) {
    const validTransactions = [];
    const errors = [];

    transactions.forEach((txn, index) => {
      const txnErrors = [];
      if (!txn.customerName || txn.customerName.length < 2) {
        txnErrors.push('Invalid customer name');
      }
      if (!txn.amount || txn.amount <= 0) {
        txnErrors.push('Invalid amount');
      }
      if (!txn.service || txn.service.length < 2) {
        txnErrors.push('Invalid service description');
      }
      if (!txn.date) {
        txnErrors.push('Invalid date');
      }
      if (txnErrors.length === 0) {
        validTransactions.push(txn);
      } else {
        errors.push(`Row ${index + 1}: ${txnErrors.join(', ')}`);
      }
    });

    return { validTransactions, errors };
  }
}

module.exports = FileProcessorService;
