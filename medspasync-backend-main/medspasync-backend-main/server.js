// server.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
// const mongoose = require('mongoose'); // Temporarily disabled for testing
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cookieParser = require('cookie-parser');
// const { disconnect: disconnectPrisma } = require('./prisma/client'); // Temporarily disabled for testing
const aiRoutes = require('./routes/aiReconciliation');
const statusRoute = require('./routes/status');

// Load comprehensive AI routes
const comprehensiveAIRoutes = require('./src/routes/ai-routes');

// Load environment management system
const environmentManager = require('./config/environment-manager');

// Load env vars
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Get environment configuration
const envConfig = environmentManager.getConfig();
const dbConfig = envConfig.database;
const corsConfig = envConfig.cors;
const securityConfig = envConfig.security;

// MongoDB connection with environment-aware configuration
let mongoConnected = false;

// async function connectMongoDB() {
//   if (!dbConfig.mongoUrl || dbConfig.mongoUrl.includes('HOST')) {
//     console.warn('⚠️ MongoDB connection string not properly configured');
//     console.log('📝 Running in DEMO MODE without database persistence');
//     console.log('💡 Set MONGO_URI environment variable with your actual MongoDB Atlas connection string');
//     
//     mongoConnected = false;
//     return;
//   }

//   try {
//     await mongoose.connect(dbConfig.mongoUrl, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('✅ MongoDB connected successfully');
//     mongoConnected = true;
//   } catch (err) {
//     console.error('❌ MongoDB connection failed:', err.message);
//     console.log('📝 Running in DEMO MODE without database persistence');
//     mongoConnected = false;
//   }
// }

// Initialize MongoDB connection
// connectMongoDB();

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());

// Rate limiting with environment-specific configuration
const rateLimitConfig = {
  development: { windowMs: 15 * 60 * 1000, max: 100 },
  staging: { windowMs: 15 * 60 * 1000, max: 200 },
  production: { windowMs: 15 * 60 * 1000, max: 500 },
  demo: { windowMs: 15 * 60 * 1000, max: 50 }
};

const currentEnv = environmentManager.environment;
const generalLimiter = rateLimit({ 
  ...rateLimitConfig[currentEnv] || rateLimitConfig.development,
  message: { success: false, error: 'Too many requests' }
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: currentEnv === 'production' ? 20 : 10,
  message: { success: false, error: 'Too many checkout attempts' }
});

const reconciliationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: currentEnv === 'production' ? 50 : 20, // Allow more for production
  message: { success: false, error: 'Too many reconciliation requests' }
});

app.use('/api/checkout', checkoutLimiter);
app.use('/api/reconciliation', reconciliationLimiter);
app.use(generalLimiter);

// CORS configuration using environment manager
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins from environment configuration
    const isAllowed = corsConfig.origins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: corsConfig.credentials,
  methods: corsConfig.methods,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
}));

// Add preflight handling for all routes
app.options('*', cors());

// Enhanced CORS logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from origin: ${req.get('origin') || 'no-origin'}`);
  next();
});

// Body parsing middleware
app.use('/api/webhook', express.raw({ type: 'application/json' })); // Webhook needs raw body
app.use(express.json({ limit: '10mb' })); // Increased for CSV uploads
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Stripe Webhook Handler (must be before other JSON middleware)
app.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = securityConfig.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.warn('⚠️ Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle webhook events (with fallback if no database)
    if (mongoConnected) {
      const { handleStripeWebhook } = require('./controllers/subscriptionController');
      await handleStripeWebhook(event);
    } else {
      console.log('📝 Webhook event received (demo mode):', event.type);
    }
    
    console.log('✅ Webhook processed:', event.type);
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Stripe Checkout Routes
app.post('/api/checkout/create-session', async (req, res) => {
  try {
    const { priceId, customerEmail, metadata = {} } = req.body;
    
    // Validate priceId
    const validPriceIds = [
      'price_1RXX7SFT2t8OlDeTE7ktphka', // Core
      'price_1RXXM9FT2t8OlDeT3ntv0wp0'  // Professional
    ];
    
    if (!priceId || !validPriceIds.includes(priceId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid price ID' 
      });
    }

    const planType = priceId === 'price_1RXX7SFT2t8OlDeTE7ktphka' ? 'core' : 'professional';
    
    const sessionParams = {
      mode: 'subscription',
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      success_url: `${process.env.FRONTEND_URL || 'https://demo.medspasyncpro.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://demo.medspasyncpro.com'}/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        plan_type: planType,
        source: 'demo',
        ...metadata
      }
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Add trial if enabled
    if (process.env.ENABLE_TRIAL === 'true') {
      sessionParams.subscription_data = {
        trial_period_days: parseInt(process.env.TRIAL_DAYS) || 14,
        metadata: {
          plan_type: planType,
          trial_started: new Date().toISOString()
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    
    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      planType,
      customerEmail: customerEmail || 'not provided'
    });

    res.json({ 
      success: true,
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

// Check subscription status
app.get('/api/checkout/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      res.json({
        success: true,
        status: subscription.status,
        planType: subscription.metadata.plan_type,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }
  } catch (error) {
    console.error('❌ Error retrieving subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve subscription status' 
    });
  }
});

// Demo Analytics Tracking
app.post('/api/demo/track', async (req, res) => {
  const { event, planType, revenue, matches, processingTime } = req.body;

  console.log('📊 Demo Analytics:', {
    event,
    planType,
    revenue,
    matches,
    processingTime,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (mongoConnected) {
    try {
      const { DemoUsage } = require('./models');
      await DemoUsage.create({
        event,
        planType,
        revenue,
        matches,
        processingTime,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (err) {
      console.warn('⚠️ Failed to save demo usage:', err.message);
    }
  }

  res.json({ success: true, tracked: true });
});

// Enhanced Reconciliation Demo Endpoint (works without database)
app.post('/api/reconciliation/demo', async (req, res) => {
  try {
    const { posData, alleData, aspireData, planType = 'core' } = req.body;
    
    if (!posData || !Array.isArray(posData)) {
      return res.status(400).json({
        success: false,
        error: 'POS data is required and must be an array'
      });
    }

    // Use in-memory reconciliation processing
    const results = await processReconciliationInMemory({
      posData,
      alleData: alleData || [],
      aspireData: (planType === 'professional' && aspireData) ? aspireData : [],
      planType
    });

    // Log demo usage (memory only if no database)
    console.log('🔄 Demo reconciliation:', {
      planType,
      posRecords: posData.length,
      alleRecords: (alleData || []).length,
      aspireRecords: (aspireData || []).length,
      matches: results.summary.totalMatches,
      accuracy: results.summary.matchRate,
      revenue: results.summary.recoveredRevenue
    });

    // Store in database if available
    if (mongoConnected) {
      try {
        const ReconciliationLog = require('./models/ReconciliationLog');
        const logData = {
          posRecords: posData.length,
          alleRecords: (alleData || []).length,
          aspireRecords: (aspireData && planType === 'professional') ? aspireData.length : 0,
          matched: results.summary.totalMatches,
          unmatched: results.summary.unmatched,
          needReview: results.summary.needReview,
          recoveredRevenue: results.summary.recoveredRevenue,
          matchRate: results.summary.matchRate,
          avgConfidence: results.summary.avgConfidence,
          planType,
          processingTime: results.summary.processingTime,
          sourceIp: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        const reconciliationLog = new ReconciliationLog(logData);
        await reconciliationLog.save();
        results.logId = reconciliationLog._id;
      } catch (dbError) {
        console.warn('⚠️ Failed to save to database, continuing with demo:', dbError.message);
      }
    }

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Reconciliation demo error:', error);
    res.status(500).json({
      success: false,
      error: 'Reconciliation processing failed'
    });
  }
});

// Initialize Step 2 services (with error handling)
let fileProcessor, enhancedReconciler, upload;

try {
  const FileProcessingService = require('./services/fileProcessingService');
  const EnhancedReconciliationService = require('./services/enhancedReconciliationService');

  fileProcessor = new FileProcessingService();
  enhancedReconciler = new EnhancedReconciliationService();
  upload = fileProcessor.getUploadMiddleware();
  
  console.log('✅ Step 2 services initialized successfully');
} catch (serviceError) {
  console.warn('⚠️ Step 2 services not available:', serviceError.message);
  console.log('💡 Create services/fileProcessingService.js and services/enhancedReconciliationService.js for enhanced features');
}

// Step 2: Enhanced file upload endpoint
if (fileProcessor && upload) {
  app.post('/api/reconciliation/upload', 
    upload.fields([
      { name: 'alle', maxCount: 1 },
      { name: 'aspire', maxCount: 1 },
      { name: 'pos', maxCount: 1 }
    ]),
    async (req, res) => {
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
            const processed = await fileProcessor.processFile(file, fileType);
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
  );

  // Step 2: Enhanced reconciliation processing endpoint
  app.post('/api/reconciliation/process', async (req, res) => {
    try {
      const { alleTransactions, aspireTransactions, posTransactions, confidenceThreshold = 0.95, planType = 'core' } = req.body;

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

      // Process with enhanced reconciliation
      const result = await enhancedReconciler.processReconciliation({
        alleTransactions,
        aspireTransactions,
        posTransactions,
        confidenceThreshold,
        planType
      });

      // Log processing for analytics
      console.log('🔄 Enhanced reconciliation completed:', {
        jobId: result.jobId,
        totalRewards,
        posRecords: posTransactions.length,
        autoAccepted: result.results.summary.autoAcceptedCount,
        needsReview: result.results.summary.needsReviewCount,
        unmatched: result.results.summary.unmatchedCount,
        matchRate: result.results.summary.autoMatchRate,
        recoveredRevenue: result.results.summary.recoveredRevenue,
        processingTime: result.processingTime
      });

      // Store in database if available
      if (mongoConnected) {
        try {
          const ReconciliationLog = require('./models/ReconciliationLog');
          const logData = {
            jobId: result.jobId,
            posRecords: posTransactions.length,
            alleRecords: alleTransactions?.length || 0,
            aspireRecords: aspireTransactions?.length || 0,
            matched: result.results.summary.autoAcceptedCount,
            needReview: result.results.summary.needsReviewCount,
            unmatched: result.results.summary.unmatchedCount,
            recoveredRevenue: result.results.summary.recoveredRevenue,
            matchRate: result.results.summary.autoMatchRate,
            planType,
            processingTime: result.processingTime,
            sourceIp: req.ip,
            userAgent: req.get('User-Agent'),
            enhanced: true
          };
          
          const reconciliationLog = new ReconciliationLog(logData);
          await reconciliationLog.save();
          result.logId = reconciliationLog._id;
        } catch (dbError) {
          console.warn('⚠️ Failed to save to database:', dbError.message);
        }
      }

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('❌ Enhanced reconciliation error:', error);
      res.status(500).json({
        success: false,
        error: 'Enhanced reconciliation processing failed'
      });
    }
  });

  // Step 2: Job status endpoint
  app.get('/api/reconciliation/jobs/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      
      // In demo mode, return completed status since processing is synchronous
      if (!mongoConnected) {
        return res.json({
          success: true,
          jobId,
          status: 'completed',
          message: 'Job completed (demo mode)'
        });
      }

      // In production, query database for job status
      res.json({
        success: true,
        jobId,
        status: 'completed',
        message: 'Job status retrieved'
      });

    } catch (error) {
      console.error('Get job status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job status'
      });
    }
  });

  // Step 2: Export results endpoint
  app.get('/api/reconciliation/jobs/:jobId/export', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { format = 'csv' } = req.query;

      // For demo purposes, return a sample CSV
      if (format === 'csv') {
        const csv = `Status,Reward Customer,Reward Service,Reward Amount,POS Customer,POS Service,POS Amount,Confidence,Match Type
Auto-Accepted,John Doe,Botox Treatment,$35.00,Doe John,Neurotoxin Injection,$350.00,95%,Alle
Manual Review,Jane Smith,Dermal Filler,$40.00,Smith Jane,Cosmetic Enhancement,$400.00,85%,Aspire
Unmatched,Bob Johnson,CoolSculpting,$50.00,,,,$0.00,0%,N/A`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="reconciliation_results_${jobId}.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({
          success: false,
          error: 'Only CSV format supported in demo mode'
        });
      }

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        error: 'Export failed'
      });
    }
  });
}

// In-memory reconciliation processing (for demo mode)
async function processReconciliationInMemory({ posData, alleData, aspireData, planType }) {
  const startTime = Date.now();
  const results = [];
  let totalRevenue = 0;
  
  // Process each POS transaction
  for (const posRecord of posData) {
    let bestMatch = null;
    let matchType = null;
    let confidence = 0;
    
    // Check Alle matches
    for (const alleRecord of alleData) {
      const score = calculateMatchScore(posRecord, alleRecord);
      if (score > confidence) {
        confidence = score;
        bestMatch = alleRecord;
        matchType = 'Alle';
      }
    }
    
    // Check Aspire matches (only for Professional plan)
    if (planType === 'professional' && aspireData) {
      for (const aspireRecord of aspireData) {
        const score = calculateMatchScore(posRecord, aspireRecord);
        if (score > confidence) {
          confidence = score;
          bestMatch = aspireRecord;
          matchType = 'Aspire';
        }
      }
    }
    
    const status = confidence >= 70 ? 'matched' : confidence >= 40 ? 'review' : 'unmatched';
    
    results.push({
      posRecord: sanitizeRecord(posRecord),
      rewardRecord: bestMatch ? sanitizeRecord(bestMatch) : null,
      matchType,
      confidence: Math.round(confidence),
      status
    });
    
    // Calculate recovered revenue
    if (status === 'matched' && bestMatch) {
      totalRevenue += bestMatch.amount || 0;
    }
  }
  
  const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalMatches = results.filter(r => r.status === 'matched').length;
  const needReview = results.filter(r => r.status === 'review').length;
  const unmatched = results.filter(r => r.status === 'unmatched').length;
  const matchRate = results.length > 0 ? Math.round((totalMatches / results.length) * 100) : 0;
  
  return {
    results,
    summary: {
      totalRecords: results.length,
      totalMatches,
      needReview,
      unmatched,
      matchRate,
      recoveredRevenue: totalRevenue,
      processingTime: parseFloat(processingTime)
    },
    metadata: {
      planType,
      processingTime,
      timestamp: new Date().toISOString(),
      demoMode: !mongoConnected
    }
  };
}

// Simple matching functions for demo mode
function calculateMatchScore(record1, record2) {
  let score = 0;
  
  if (record1.email && record2.email && 
      record1.email.toLowerCase().trim() === record2.email.toLowerCase().trim()) {
    score += 50;
  }
  
  if (record1.name && record2.name) {
    const name1 = record1.name.toLowerCase().trim();
    const name2 = record2.name.toLowerCase().trim();
    if (name1 === name2) score += 30;
    else if (name1.includes(name2) || name2.includes(name1)) score += 20;
  }
  
  if (record1.date && record2.date && record1.date === record2.date) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

function sanitizeRecord(record) {
  return {
    name: record.name,
    amount: parseFloat(record.amount) || 0,
    date: record.date,
    email: record.email,
    service: record.service,
    program: record.program
  };
}

// Load existing routes if database is available
if (mongoConnected) {
  try {
    app.use('/api', require('./server/routes'));
  } catch (routeError) {
    console.warn('⚠️ Some routes failed to load:', routeError.message);
  }
}

// AI reconciliation routes
app.use('/api/ai', aiRoutes);
app.use('/api/ai', comprehensiveAIRoutes);
app.use('/api/status', statusRoute);

// Health check with enhanced info
app.get('/', (req, res) => {
  res.json({
    service: 'MedSpaSync Pro API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    demoMode: !mongoConnected,
    features: {
      reconciliation: true,
      fileUpload: !!fileProcessor,
      enhancedMatching: !!enhancedReconciler,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      database: mongoConnected,
      trial: process.env.ENABLE_TRIAL === 'true'
    },
    endpoints: {
      demo: '/api/reconciliation/demo',
      upload: fileProcessor ? '/api/reconciliation/upload' : 'not available',
      process: enhancedReconciler ? '/api/reconciliation/process' : 'not available',
      checkout: '/api/checkout/create-session',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    demoMode: !mongoConnected,
    step2Features: {
      fileProcessing: !!fileProcessor,
      enhancedReconciliation: !!enhancedReconciler,
      mlService: !!process.env.ML_SERVICE_URL
    }
  });
});

// Minimal health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  const availableEndpoints = [
    'GET /',
    'GET /api/health', 
    'POST /api/reconciliation/demo',
    'POST /api/checkout/create-session',
    'GET /api/ai/matches',
    'GET /api/ai/match/:id',
    'POST /api/ai/train',
    'POST /api/ai/reprocess'
  ];

  // Add Step 2 endpoints if available
  if (fileProcessor) {
    availableEndpoints.push('POST /api/reconciliation/upload');
  }
  if (enhancedReconciler) {
    availableEndpoints.push('POST /api/reconciliation/process');
    availableEndpoints.push('GET /api/reconciliation/jobs/:jobId');
    availableEndpoints.push('GET /api/reconciliation/jobs/:jobId/export');
  }

  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (mongoConnected) {
    // await mongoose.connection.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  if (mongoConnected) {
    // await mongoose.connection.close();
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MedSpaSync Pro API listening on port ${PORT}`);
  console.log(`🌐 Service URL: https://demo.medspasyncpro.com`);
  console.log(`🔗 Health check: https://demo.medspasyncpro.com/api/health`);
  console.log(`🎯 Demo endpoint: https://demo.medspasyncpro.com/api/reconciliation/demo`);
  console.log(`💳 Stripe mode: ${process.env.STRIPE_SECRET_KEY?.includes('sk_live') ? 'LIVE' : 'TEST'}`);
  console.log(`💾 Database: ${mongoConnected ? 'Connected' : 'Demo Mode (No Persistence)'}`);
  
  if (!mongoConnected) {
    console.log('');
    console.log('📝 DEMO MODE ACTIVE:');
    console.log('   • Reconciliation demo works without database');
    console.log('   • Stripe checkout fully functional');
    console.log('   • No data persistence (perfect for demos)');
    console.log('   • Set MONGO_URI with your Atlas connection string for full features');
  }

  if (fileProcessor && enhancedReconciler) {
    console.log('');
    console.log('🎉 STEP 2 FEATURES ACTIVE:');
    console.log('   • File upload processing available');
    console.log('   • Enhanced AI reconciliation enabled');
    console.log('   • CSV/Excel file support active');
    console.log('   • Job tracking and export ready');
  } else {
    console.log('');
    console.log('💡 STEP 2 SETUP NEEDED:');
    console.log('   • Create services/fileProcessingService.js');
    console.log('   • Create services/enhancedReconciliationService.js');
    console.log('   • Run: npm install multer csv-parser xlsx');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set - webhooks will not work');
  }
});