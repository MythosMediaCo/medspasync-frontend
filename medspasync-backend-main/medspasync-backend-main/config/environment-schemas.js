/**
 * MedSpaSync Pro - Environment Variable Schemas
 * 
 * Defines the structure and validation rules for environment variables
 * across all environments in the MedSpaSync Pro ecosystem.
 */

const environmentSchemas = {
  // Development Environment Schema
  development: {
    required: [
      'NODE_ENV'
    ],
    optional: [
      'PORT',
      'DATABASE_URL',
      'MONGO_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ML_SERVICE_URL',
      'AI_API_KEY',
      'PYTHON_SCRIPT_PATH',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM',
      'EMAIL_HOST',
      'EMAIL_PORT',
      'UPLOAD_MAX_MB',
      'UPLOAD_TEMP_DIR',
      'DEFAULT_CONFIDENCE_THRESHOLD',
      'PROCESSING_BATCH_SIZE',
      'MAX_TRANSACTIONS_PER_JOB',
      'AI_TIMEOUT',
      'MAX_CONCURRENT_AI_JOBS',
      'JOB_RETENTION_DAYS',
      'MAX_JOBS_PER_USER'
    ],
    defaults: {
      NODE_ENV: 'development',
      PORT: '5000',
      DATABASE_URL: 'postgresql://localhost:5432/medspasync_dev',
      MONGO_URI: 'mongodb://localhost:27017/medspasync_dev',
      JWT_SECRET: null,
      JWT_REFRESH_SECRET: null,
      ML_SERVICE_URL: 'http://localhost:8000',
      AI_API_KEY: 'dev_key',
      STRIPE_SECRET_KEY: null,
      STRIPE_WEBHOOK_SECRET: null,
      EMAIL_USER: 'dev@medspasyncpro.com',
      EMAIL_PASSWORD: 'dev_password',
      EMAIL_FROM: 'dev@medspasyncpro.com',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      UPLOAD_MAX_MB: '10',
      UPLOAD_TEMP_DIR: './uploads',
      DEFAULT_CONFIDENCE_THRESHOLD: '0.95',
      PROCESSING_BATCH_SIZE: '100',
      MAX_TRANSACTIONS_PER_JOB: '10000',
      AI_TIMEOUT: '300000',
      MAX_CONCURRENT_AI_JOBS: '3',
      JOB_RETENTION_DAYS: '90',
      MAX_JOBS_PER_USER: '100'
    }
  },

  // Staging Environment Schema
  staging: {
    required: [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ],
    optional: [
      'PORT',
      'MONGO_URI',
      'ML_SERVICE_URL',
      'AI_API_KEY',
      'PYTHON_SCRIPT_PATH',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM',
      'EMAIL_HOST',
      'EMAIL_PORT',
      'UPLOAD_MAX_MB',
      'UPLOAD_TEMP_DIR',
      'DEFAULT_CONFIDENCE_THRESHOLD',
      'PROCESSING_BATCH_SIZE',
      'MAX_TRANSACTIONS_PER_JOB',
      'AI_TIMEOUT',
      'MAX_CONCURRENT_AI_JOBS',
      'JOB_RETENTION_DAYS',
      'MAX_JOBS_PER_USER'
    ],
    defaults: {
      NODE_ENV: 'staging',
      PORT: '5000',
      UPLOAD_MAX_MB: '25',
      UPLOAD_TEMP_DIR: './uploads',
      DEFAULT_CONFIDENCE_THRESHOLD: '0.90',
      PROCESSING_BATCH_SIZE: '200',
      MAX_TRANSACTIONS_PER_JOB: '50000',
      AI_TIMEOUT: '600000',
      MAX_CONCURRENT_AI_JOBS: '5',
      JOB_RETENTION_DAYS: '30',
      MAX_JOBS_PER_USER: '50'
    }
  },

  // Production Environment Schema
  production: {
    required: [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'EMAIL_USER',
      'EMAIL_PASSWORD'
    ],
    optional: [
      'PORT',
      'MONGO_URI',
      'ML_SERVICE_URL',
      'AI_API_KEY',
      'PYTHON_SCRIPT_PATH',
      'EMAIL_FROM',
      'EMAIL_HOST',
      'EMAIL_PORT',
      'UPLOAD_MAX_MB',
      'UPLOAD_TEMP_DIR',
      'DEFAULT_CONFIDENCE_THRESHOLD',
      'PROCESSING_BATCH_SIZE',
      'MAX_TRANSACTIONS_PER_JOB',
      'AI_TIMEOUT',
      'MAX_CONCURRENT_AI_JOBS',
      'JOB_RETENTION_DAYS',
      'MAX_JOBS_PER_USER',
      'ENABLE_TRIAL',
      'TRIAL_DAYS',
      'ENV_ENCRYPTION_KEY'
    ],
    defaults: {
      NODE_ENV: 'production',
      PORT: '5000',
      UPLOAD_MAX_MB: '50',
      UPLOAD_TEMP_DIR: './uploads',
      DEFAULT_CONFIDENCE_THRESHOLD: '0.85',
      PROCESSING_BATCH_SIZE: '500',
      MAX_TRANSACTIONS_PER_JOB: '100000',
      AI_TIMEOUT: '900000',
      MAX_CONCURRENT_AI_JOBS: '10',
      JOB_RETENTION_DAYS: '90',
      MAX_JOBS_PER_USER: '1000',
      ENABLE_TRIAL: 'true',
      TRIAL_DAYS: '14'
    }
  },

  // Demo Environment Schema
  demo: {
    required: [
      'NODE_ENV'
    ],
    optional: [
      'PORT',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ML_SERVICE_URL',
      'AI_API_KEY',
      'PYTHON_SCRIPT_PATH',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM',
      'EMAIL_HOST',
      'EMAIL_PORT',
      'UPLOAD_MAX_MB',
      'UPLOAD_TEMP_DIR',
      'DEFAULT_CONFIDENCE_THRESHOLD',
      'PROCESSING_BATCH_SIZE',
      'MAX_TRANSACTIONS_PER_JOB',
      'AI_TIMEOUT',
      'MAX_CONCURRENT_AI_JOBS'
    ],
    defaults: {
      NODE_ENV: 'demo',
      PORT: '5000',
      JWT_SECRET: null,
      JWT_REFRESH_SECRET: null,
      ML_SERVICE_URL: 'https://demo-ai.medspasyncpro.com',
      AI_API_KEY: 'demo_key',
      STRIPE_SECRET_KEY: null,
      STRIPE_WEBHOOK_SECRET: null,
      EMAIL_USER: 'demo@medspasyncpro.com',
      EMAIL_PASSWORD: 'demo_password',
      EMAIL_FROM: 'demo@medspasyncpro.com',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      UPLOAD_MAX_MB: '5',
      UPLOAD_TEMP_DIR: './uploads',
      DEFAULT_CONFIDENCE_THRESHOLD: '0.80',
      PROCESSING_BATCH_SIZE: '50',
      MAX_TRANSACTIONS_PER_JOB: '1000',
      AI_TIMEOUT: '300000',
      MAX_CONCURRENT_AI_JOBS: '2'
    }
  }
};

/**
 * Validate environment variables against schema
 */
function validateEnvironmentVariables(environment = 'development') {
  const schema = environmentSchemas[environment];
  if (!schema) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  const errors = [];
  const warnings = [];
  const missing = [];

  // Check required variables
  for (const requiredVar of schema.required) {
    if (!process.env[requiredVar]) {
      missing.push(requiredVar);
      errors.push(`Required environment variable missing: ${requiredVar}`);
    }
  }

  // Check optional variables and provide warnings
  for (const optionalVar of schema.optional) {
    if (!process.env[optionalVar] && schema.defaults[optionalVar]) {
      warnings.push(`Optional environment variable not set: ${optionalVar} (using default: ${schema.defaults[optionalVar]})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missing,
    environment,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate environment variable template
 */
function generateEnvironmentTemplate(environment = 'development') {
  const schema = environmentSchemas[environment];
  if (!schema) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  let template = `# MedSpaSync Pro - ${environment.toUpperCase()} Environment\n`;
  template += `# Generated on: ${new Date().toISOString()}\n\n`;

  // Required variables
  template += `# REQUIRED VARIABLES\n`;
  for (const requiredVar of schema.required) {
    const defaultValue = schema.defaults[requiredVar];
    template += `${requiredVar}=${defaultValue || ''}\n`;
  }

  template += `\n# OPTIONAL VARIABLES\n`;
  for (const optionalVar of schema.optional) {
    const defaultValue = schema.defaults[optionalVar];
    template += `# ${optionalVar}=${defaultValue || ''}\n`;
  }

  return template;
}

/**
 * Get environment variable documentation
 */
function getEnvironmentDocumentation() {
  const docs = {
    database: {
      DATABASE_URL: 'PostgreSQL connection string (required for production)',
      MONGO_URI: 'MongoDB connection string (optional, for legacy data)'
    },
    security: {
      JWT_SECRET: 'Secret key for JWT token signing (required for production)',
      JWT_REFRESH_SECRET: 'Secret key for JWT refresh tokens (required for production)',
      ENV_ENCRYPTION_KEY: 'Encryption key for sensitive environment variables (production only)'
    },
    ai: {
      ML_SERVICE_URL: 'URL of the AI/ML service for reconciliation',
      AI_API_KEY: 'API key for AI service authentication',
      PYTHON_SCRIPT_PATH: 'Path to Python reconciliation script'
    },
    payment: {
      STRIPE_SECRET_KEY: 'Stripe secret key for payment processing (required for production)',
      STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret for payment verification (required for production)'
    },
    email: {
      EMAIL_USER: 'Email service username (required for production)',
      EMAIL_PASSWORD: 'Email service password (required for production)',
      EMAIL_FROM: 'From email address for system emails',
      EMAIL_HOST: 'SMTP host (default: smtp.gmail.com)',
      EMAIL_PORT: 'SMTP port (default: 587)'
    },
    processing: {
      UPLOAD_MAX_MB: 'Maximum file upload size in MB',
      UPLOAD_TEMP_DIR: 'Temporary directory for file uploads',
      DEFAULT_CONFIDENCE_THRESHOLD: 'Default confidence threshold for AI matching',
      PROCESSING_BATCH_SIZE: 'Number of records to process in each batch',
      MAX_TRANSACTIONS_PER_JOB: 'Maximum transactions per reconciliation job',
      AI_TIMEOUT: 'Timeout for AI service requests in milliseconds',
      MAX_CONCURRENT_AI_JOBS: 'Maximum concurrent AI processing jobs',
      JOB_RETENTION_DAYS: 'Number of days to retain job history',
      MAX_JOBS_PER_USER: 'Maximum jobs per user'
    }
  };

  return docs;
}

module.exports = {
  environmentSchemas,
  validateEnvironmentVariables,
  generateEnvironmentTemplate,
  getEnvironmentDocumentation
}; 