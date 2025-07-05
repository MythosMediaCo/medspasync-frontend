// config/environment.js (enhance existing)
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const aiEnvVars = [
  'ML_SERVICE_URL', // Primary AI service URL
  'AI_API_URL',     // Alternative AI service URL
  'AI_API_KEY'      // Optional API key for AI service
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check if AI service is configured
  const aiConfigured = process.env.ML_SERVICE_URL || process.env.AI_API_URL;
  if (!aiConfigured) {
    console.warn('⚠️  No AI service configured. Will use demo mode.');
    process.env.DEMO_MODE = 'true';
  } else {
    console.log('✅ AI service configured:', aiConfigured);
  }

  // Validate AI service URL format
  if (aiConfigured) {
    try {
      new URL(aiConfigured);
    } catch (error) {
      console.warn('⚠️  Invalid AI service URL format:', aiConfigured);
    }
  }

  return {
    isDemoMode: !aiConfigured,
    hasMLService: !!process.env.ML_SERVICE_URL,
    hasAIService: !!aiConfigured,
    databaseConfigured: !!process.env.DATABASE_URL,
    aiServiceUrl: process.env.ML_SERVICE_URL || process.env.AI_API_URL,
    aiApiKey: process.env.AI_API_KEY
  };
}

// AI service configuration helper
export function getAIServiceConfig() {
  return {
    url: process.env.ML_SERVICE_URL || process.env.AI_API_URL,
    apiKey: process.env.AI_API_KEY,
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.AI_SERVICE_MAX_RETRIES) || 3,
    healthCheckInterval: parseInt(process.env.AI_HEALTH_CHECK_INTERVAL) || 30000
  };
}

// Health check configuration
export function getHealthCheckConfig() {
  return {
    aiService: {
      enabled: !!(process.env.ML_SERVICE_URL || process.env.AI_API_URL),
      interval: parseInt(process.env.AI_HEALTH_CHECK_INTERVAL) || 30000,
      timeout: parseInt(process.env.AI_HEALTH_CHECK_TIMEOUT) || 5000
    },
    database: {
      enabled: !!process.env.DATABASE_URL,
      interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 60000,
      timeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT) || 5000
    }
  };
}