const reconciliationConfig = {
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
    allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    tempDirectory: process.env.UPLOAD_TEMP_DIR || './uploads'
  },
  ai: {
    apiUrl: process.env.AI_API_URL || 'http://localhost:8000',
    apiKey: process.env.AI_API_KEY,
    scriptPath: process.env.PYTHON_SCRIPT_PATH || './ai/medspa_api_complete.py',
    timeout: parseInt(process.env.AI_TIMEOUT) || 300000,
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_AI_JOBS) || 5
  },
  processing: {
    defaultConfidenceThreshold: parseFloat(process.env.DEFAULT_CONFIDENCE_THRESHOLD) || 0.95,
    batchSize: parseInt(process.env.PROCESSING_BATCH_SIZE) || 100,
    maxTransactionsPerJob: parseInt(process.env.MAX_TRANSACTIONS_PER_JOB) || 10000
  },
  database: {
    jobRetentionDays: parseInt(process.env.JOB_RETENTION_DAYS) || 90,
    maxJobsPerUser: parseInt(process.env.MAX_JOBS_PER_USER) || 100
  }
};

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const recommendedEnvVars = ['AI_API_URL', 'AI_API_KEY', 'PYTHON_SCRIPT_PATH'];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const missingRecommended = recommendedEnvVars.filter(envVar => !process.env[envVar]);
  if (missingRecommended.length > 0) {
    console.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    console.warn('AI reconciliation will use fallback methods');
  }
}

module.exports = { reconciliationConfig, validateEnvironment };
