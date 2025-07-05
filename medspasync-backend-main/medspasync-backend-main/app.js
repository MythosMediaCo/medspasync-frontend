const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const reconciliationRoutes = require('./routes/reconciliation');
const reportingRoutes = require('./routes/reporting');
const performanceRoutes = require('./routes/performance-optimization');
const scalabilityRoutes = require('./routes/scalability-load-balancing');
const { validateEnvironment } = require('./config/reconciliation');
const keyVaultManager = require('./config/azure-keyvault');
const monitoringAnalyticsRoutes = require('./routes/monitoring-analytics');
const demoRoutes = require('./routes/demo');
const analyticsRoutes = require('./routes/analytics');

// Import optimization services
const PerformanceOptimizationMiddleware = require('./middleware/performance-optimization');
const { RedisManager } = require('./config/redis-cluster');
const AdvancedCacheManager = require('./services/AdvancedCacheManager');
const DatabaseShardManager = require('./services/DatabaseShardManager');
const { CDNManager } = require('./config/cdn-config');

// Initialize Azure Key Vault before validating environment
async function initializeApp() {
  try {
    // Initialize Azure Key Vault first
    await keyVaultManager.initialize();
    
    // Then validate environment
    validateEnvironment();
    
    console.log('🚀 Backend application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error.message);
    process.exit(1);
  }
}

// Initialize the app
initializeApp();

const app = express();

// Initialize performance optimization
const performanceMiddleware = new PerformanceOptimizationMiddleware();
const redisManager = new RedisManager();
const cacheManager = new AdvancedCacheManager(redisManager);
const databaseShardManager = new DatabaseShardManager();
const cdnManager = new CDNManager();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Performance optimization middleware
app.use(performanceMiddleware.compression());
app.use(performanceMiddleware.corsOptimization());
app.use(performanceMiddleware.rateLimiter());

// CDN cache headers
app.use(cdnManager.setupCacheHeaders());

// Request optimization
app.use(performanceMiddleware.optimizeRequest());
app.use(performanceMiddleware.optimizeDatabase());
app.use(performanceMiddleware.optimizeSessions());

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', performanceMiddleware.healthCheck());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/scalability', scalabilityRoutes);
app.use('/api/monitoring', monitoringAnalyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/demo', demoRoutes);

// Error handling
app.use(performanceMiddleware.errorHandler());

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close database connections
  for (const [name, connection] of databaseShardManager.connections) {
    await connection.close();
  }
  
  // Close Redis connections
  await redisManager.cluster.disconnect();
  await redisManager.sessions.disconnect();
  await redisManager.cache.disconnect();
  await redisManager.queue.disconnect();
  
  process.exit(0);
});

module.exports = app;
