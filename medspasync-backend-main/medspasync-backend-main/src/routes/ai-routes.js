/**
 * AI Routes
 * MedSpaSync Pro AI Feature API Endpoints
 * 
 * Features:
 * - Predictive analytics endpoints
 * - NLP processing endpoints
 * - Intelligent insights endpoints
 * - Business optimization endpoints
 * - Real-time AI pipeline endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
// const { rateLimit } = require('../../middleware/enhanced-rate-limiter'); // Temporarily removed for testing
const { validateRequest } = require('../../middleware/validation');
const { logActivity } = require('../../middleware/security-monitoring');

// Import AI services
const { PredictiveAnalyticsEngine } = require('../services/ai/predictive-analytics/predictive-analytics-engine');
const { NLPService } = require('../services/ai/nlp/nlp-service');
const { IntelligentInsightsEngine } = require('../services/ai/insights/intelligent-insights-engine');
const { BusinessOptimizationEngine } = require('../services/ai/optimization/business-optimization-engine');
const { RealTimeAIPipeline } = require('../services/ai/pipeline/real-time-ai-pipeline');

// Initialize AI services
const predictiveAnalytics = new PredictiveAnalyticsEngine();
const nlpService = new NLPService();
const insightsEngine = new IntelligentInsightsEngine();
const optimizationEngine = new BusinessOptimizationEngine();
const aiPipeline = new RealTimeAIPipeline();

// ============================================================================
// PREDICTIVE ANALYTICS ROUTES
// ============================================================================

/**
 * @route POST /api/ai/predictive/revenue-forecast
 * @desc Generate revenue forecast with AI
 * @access Private (Premium/Enterprise)
 */
router.post('/predictive/revenue-forecast',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string',
      forecastHorizon: 'optional|integer|min:7|max:365',
      scenario: 'optional|object'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId, forecastHorizon = 30, scenario = null } = req.body;
      
      console.log(`🔮 Generating revenue forecast for tenant: ${tenantId}`);
      
      const forecast = await predictiveAnalytics.predictRevenue(tenantId, forecastHorizon, scenario);
      
      await logActivity(req.user.id, 'ai_revenue_forecast', {
        tenantId,
        forecastHorizon,
        scenario: scenario ? scenario.name : 'baseline'
      });
      
      res.json({
        success: true,
        data: forecast,
        message: 'Revenue forecast generated successfully'
      });
    } catch (error) {
      console.error('❌ Revenue forecast error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate revenue forecast',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/predictive/churn-prediction
 * @desc Predict patient churn and generate retention strategies
 * @access Private (Premium/Enterprise)
 */
router.post('/predictive/churn-prediction',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId } = req.body;
      
      console.log(`🔍 Predicting patient churn for tenant: ${tenantId}`);
      
      const churnPrediction = await predictiveAnalytics.predictPatientChurn(tenantId);
      
      await logActivity(req.user.id, 'ai_churn_prediction', {
        tenantId,
        highRiskPatients: churnPrediction.summary.highRisk
      });
      
      res.json({
        success: true,
        data: churnPrediction,
        message: 'Churn prediction completed successfully'
      });
    } catch (error) {
      console.error('❌ Churn prediction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to predict patient churn',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/predictive/demand-forecast
 * @desc Forecast demand for capacity optimization
 * @access Private (Premium/Enterprise)
 */
router.post('/predictive/demand-forecast',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string',
      serviceType: 'optional|string',
      timeHorizon: 'optional|integer|min:7|max:90'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId, serviceType = null, timeHorizon = 30 } = req.body;
      
      console.log(`📈 Forecasting demand for tenant: ${tenantId}`);
      
      const demandForecast = await predictiveAnalytics.predictDemand(tenantId, serviceType, timeHorizon);
      
      await logActivity(req.user.id, 'ai_demand_forecast', {
        tenantId,
        serviceType,
        timeHorizon
      });
      
      res.json({
        success: true,
        data: demandForecast,
        message: 'Demand forecast generated successfully'
      });
    } catch (error) {
      console.error('❌ Demand forecast error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate demand forecast',
        details: error.message
      });
    }
  }
);

// ============================================================================
// NLP PROCESSING ROUTES
// ============================================================================

/**
 * @route POST /api/ai/nlp/transcribe
 * @desc Transcribe voice note to clinical documentation
 * @access Private (Premium/Enterprise)
 */
router.post('/nlp/transcribe',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      audioData: 'required|string', // Base64 encoded audio
      context: 'required|object',
      sessionId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { audioData, context, sessionId } = req.body;
      
      console.log(`🎤 Transcribing voice note for session: ${sessionId}`);
      
      // Convert base64 audio to stream
      const audioStream = Buffer.from(audioData, 'base64');
      
      const transcription = await nlpService.transcribeVoiceNote(audioStream, {
        ...context,
        sessionId,
        startTime: Date.now()
      });
      
      await logActivity(req.user.id, 'ai_voice_transcription', {
        sessionId,
        treatmentType: context.treatmentType,
        confidence: transcription.confidence
      });
      
      res.json({
        success: true,
        data: transcription,
        message: 'Voice transcription completed successfully'
      });
    } catch (error) {
      console.error('❌ Voice transcription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to transcribe voice note',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/nlp/treatment-plan
 * @desc Generate AI-powered treatment plan
 * @access Private (Premium/Enterprise)
 */
router.post('/nlp/treatment-plan',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      patientProfile: 'required|object',
      consultationNotes: 'required|string',
      desiredOutcomes: 'required|array'
    }
  }),
  async (req, res) => {
    try {
      const { patientProfile, consultationNotes, desiredOutcomes } = req.body;
      
      console.log(`📋 Generating treatment plan for patient: ${patientProfile.id}`);
      
      const treatmentPlan = await nlpService.generateTreatmentPlan(
        patientProfile,
        consultationNotes,
        desiredOutcomes
      );
      
      await logActivity(req.user.id, 'ai_treatment_plan', {
        patientId: patientProfile.id,
        confidence: treatmentPlan.confidence,
        requiresReview: treatmentPlan.requiresPhysicianReview
      });
      
      res.json({
        success: true,
        data: treatmentPlan,
        message: 'Treatment plan generated successfully'
      });
    } catch (error) {
      console.error('❌ Treatment plan generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate treatment plan',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/nlp/analyze-communications
 * @desc Analyze patient communications for sentiment and insights
 * @access Private (Premium/Enterprise)
 */
router.post('/nlp/analyze-communications',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string',
      timeframe: 'optional|string|in:7d,30d,90d'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId, timeframe = '30d' } = req.body;
      
      console.log(`💬 Analyzing communications for tenant: ${tenantId}`);
      
      const analysis = await nlpService.analyzePatientCommunications(tenantId, timeframe);
      
      await logActivity(req.user.id, 'ai_communication_analysis', {
        tenantId,
        timeframe,
        urgentItems: analysis.urgentItems.length
      });
      
      res.json({
        success: true,
        data: analysis,
        message: 'Communication analysis completed successfully'
      });
    } catch (error) {
      console.error('❌ Communication analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze communications',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/nlp/semantic-search
 * @desc Perform semantic search across spa data
 * @access Private (Premium/Enterprise)
 */
router.post('/nlp/semantic-search',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      query: 'required|string|min:3',
      tenantId: 'required|string',
      searchTypes: 'optional|array',
      maxResults: 'optional|integer|min:1|max:100'
    }
  }),
  async (req, res) => {
    try {
      const { query, tenantId, searchTypes = ['patients', 'treatments', 'documents'], maxResults = 20 } = req.body;
      
      console.log(`🔍 Performing semantic search: "${query}"`);
      
      const searchResults = await nlpService.semanticSearch(query, tenantId, {
        searchTypes,
        maxResults,
        minRelevance: 0.7
      });
      
      await logActivity(req.user.id, 'ai_semantic_search', {
        tenantId,
        query,
        resultCount: searchResults.totalResults
      });
      
      res.json({
        success: true,
        data: searchResults,
        message: 'Semantic search completed successfully'
      });
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform semantic search',
        details: error.message
      });
    }
  }
);

// ============================================================================
// INTELLIGENT INSIGHTS ROUTES
// ============================================================================

/**
 * @route POST /api/ai/insights/daily
 * @desc Generate daily business insights
 * @access Private (Premium/Enterprise)
 */
router.post('/insights/daily',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      tenantId: 'optional|string'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId } = req.body;
      
      console.log(`📊 Generating daily insights for tenant: ${tenantId || 'all'}`);
      
      const insights = await insightsEngine.generateDailyInsights(tenantId);
      
      await logActivity(req.user.id, 'ai_daily_insights', {
        tenantId: tenantId || 'all',
        insightCount: insights.length
      });
      
      res.json({
        success: true,
        data: insights,
        message: 'Daily insights generated successfully'
      });
    } catch (error) {
      console.error('❌ Daily insights generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate daily insights',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/insights/revenue
 * @desc Generate revenue optimization insights
 * @access Private (Premium/Enterprise)
 */
router.post('/insights/revenue',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string',
      revenueData: 'required|object'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId, revenueData } = req.body;
      
      console.log(`💰 Generating revenue insights for tenant: ${tenantId}`);
      
      const insights = await insightsEngine.generateRevenueInsights(revenueData, tenantId);
      
      await logActivity(req.user.id, 'ai_revenue_insights', {
        tenantId,
        insightCount: insights.length
      });
      
      res.json({
        success: true,
        data: insights,
        message: 'Revenue insights generated successfully'
      });
    } catch (error) {
      console.error('❌ Revenue insights generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate revenue insights',
        details: error.message
      });
    }
  }
);

/**
 * @route GET /api/ai/insights/statistics
 * @desc Get insights engine statistics
 * @access Private (Premium/Enterprise)
 */
router.get('/insights/statistics',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    query: {
      tenantId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId } = req.query;
      
      const statistics = await insightsEngine.getInsightsStatistics(tenantId);
      
      res.json({
        success: true,
        data: statistics,
        message: 'Insights statistics retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Insights statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve insights statistics',
        details: error.message
      });
    }
  }
);

/**
 * @route GET /api/ai/insights/recommendations
 * @desc Get AI-generated recommendations
 * @access Private (Premium/Enterprise)
 */
router.get('/insights/recommendations',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenantId || req.query.tenantId;
      
      console.log(`🎯 Getting recommendations for tenant: ${tenantId}`);
      
      const recommendations = await insightsEngine.getRecommendations(tenantId);
      
      res.json({
        success: true,
        data: recommendations,
        message: 'Recommendations retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Recommendations retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recommendations',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/insights/execute-recommendation
 * @desc Execute AI recommendation
 * @access Private (Premium/Enterprise)
 */
router.post('/insights/execute-recommendation',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      recommendationId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { recommendationId } = req.body;
      const tenantId = req.user.tenantId;
      
      console.log(`⚡ Executing recommendation: ${recommendationId}`);
      
      const result = await insightsEngine.executeRecommendation(recommendationId, tenantId);
      
      await logActivity(req.user.id, 'ai_recommendation_executed', {
        recommendationId,
        tenantId,
        action: result.action
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Recommendation executed successfully'
      });
    } catch (error) {
      console.error('❌ Recommendation execution error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute recommendation',
        details: error.message
      });
    }
  }
);

// ============================================================================
// BUSINESS OPTIMIZATION ROUTES
// ============================================================================

/**
 * @route POST /api/ai/optimization/comprehensive
 * @desc Comprehensive spa optimization
 * @access Private (Enterprise)
 */
router.post('/optimization/comprehensive',
  authenticateToken,
  authorizeRole(['enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string',
      optimizationGoals: 'required|object'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId, optimizationGoals } = req.body;
      
      console.log(`⚙️ Running comprehensive optimization for tenant: ${tenantId}`);
      
      const optimization = await optimizationEngine.optimizeSpaOperations(tenantId, optimizationGoals);
      
      await logActivity(req.user.id, 'ai_comprehensive_optimization', {
        tenantId,
        expectedImpact: optimization.expectedImpact
      });
      
      res.json({
        success: true,
        data: optimization,
        message: 'Comprehensive optimization completed successfully'
      });
    } catch (error) {
      console.error('❌ Comprehensive optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform comprehensive optimization',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/optimization/scheduling
 * @desc Optimize appointment scheduling
 * @access Private (Premium/Enterprise)
 */
router.post('/optimization/scheduling',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      spaData: 'required|object',
      goals: 'required|object'
    }
  }),
  async (req, res) => {
    try {
      const { spaData, goals } = req.body;
      
      console.log('📅 Optimizing appointment scheduling');
      
      const optimization = await optimizationEngine.optimizeScheduling(spaData, goals);
      
      await logActivity(req.user.id, 'ai_scheduling_optimization', {
        expectedImprovements: optimization.expectedImprovements
      });
      
      res.json({
        success: true,
        data: optimization,
        message: 'Scheduling optimization completed successfully'
      });
    } catch (error) {
      console.error('❌ Scheduling optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize scheduling',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/optimization/pricing
 * @desc Optimize pricing strategy
 * @access Private (Premium/Enterprise)
 */
router.post('/optimization/pricing',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      spaData: 'required|object',
      goals: 'required|object'
    }
  }),
  async (req, res) => {
    try {
      const { spaData, goals } = req.body;
      
      console.log('💰 Optimizing pricing strategy');
      
      const optimization = await optimizationEngine.optimizePricing(spaData, goals);
      
      await logActivity(req.user.id, 'ai_pricing_optimization', {
        expectedImpact: optimization.expectedImpact
      });
      
      res.json({
        success: true,
        data: optimization,
        message: 'Pricing optimization completed successfully'
      });
    } catch (error) {
      console.error('❌ Pricing optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize pricing',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/optimization/inventory
 * @desc Optimize inventory management
 * @access Private (Premium/Enterprise)
 */
router.post('/optimization/inventory',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      spaData: 'required|object',
      goals: 'required|object'
    }
  }),
  async (req, res) => {
    try {
      const { spaData, goals } = req.body;
      
      console.log('📦 Optimizing inventory management');
      
      const optimization = await optimizationEngine.optimizeInventory(spaData, goals);
      
      await logActivity(req.user.id, 'ai_inventory_optimization', {
        expectedImprovements: optimization.expectedImprovements
      });
      
      res.json({
        success: true,
        data: optimization,
        message: 'Inventory optimization completed successfully'
      });
    } catch (error) {
      console.error('❌ Inventory optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize inventory',
        details: error.message
      });
    }
  }
);

/**
 * @route GET /api/ai/optimization/statistics
 * @desc Get optimization engine statistics
 * @access Private (Premium/Enterprise)
 */
router.get('/optimization/statistics',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    query: {
      tenantId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { tenantId } = req.query;
      
      const statistics = await optimizationEngine.getOptimizationStatistics(tenantId);
      
      res.json({
        success: true,
        data: statistics,
        message: 'Optimization statistics retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Optimization statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve optimization statistics',
        details: error.message
      });
    }
  }
);

// ============================================================================
// REAL-TIME AI PIPELINE ROUTES
// ============================================================================

/**
 * @route POST /api/ai/pipeline/request
 * @desc Submit AI processing request
 * @access Private (Premium/Enterprise)
 */
router.post('/pipeline/request',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    body: {
      type: 'required|string|in:prediction,transcription,optimization,sentiment_analysis',
      data: 'required|object',
      options: 'optional|object',
      requestId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { type, data, options = {}, requestId } = req.body;
      
      console.log(`🚀 Submitting AI request: ${type}`);
      
      // Add request to processing queue
      await aiPipeline.redisClient.lpush('ai_request_queue', JSON.stringify({
        type,
        data,
        options,
        requestId,
        userId: req.user.id,
        timestamp: Date.now()
      }));
      
      await logActivity(req.user.id, 'ai_pipeline_request', {
        type,
        requestId
      });
      
      res.json({
        success: true,
        data: { requestId },
        message: 'AI request submitted successfully',
        status: 'queued'
      });
    } catch (error) {
      console.error('❌ AI pipeline request error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit AI request',
        details: error.message
      });
    }
  }
);

/**
 * @route GET /api/ai/pipeline/result/:requestId
 * @desc Get AI processing result
 * @access Private (Premium/Enterprise)
 */
router.get('/pipeline/result/:requestId',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    params: {
      requestId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // Get result from cache
      const result = await aiPipeline.redisClient.get(`ai_result:${requestId}`);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Result not found or still processing',
          status: 'processing'
        });
      }
      
      const parsedResult = JSON.parse(result);
      
      res.json({
        success: true,
        data: parsedResult,
        message: 'AI result retrieved successfully',
        status: 'completed'
      });
    } catch (error) {
      console.error('❌ AI pipeline result retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI result',
        details: error.message
      });
    }
  }
);

/**
 * @route GET /api/ai/pipeline/statistics
 * @desc Get AI pipeline statistics
 * @access Private (Premium/Enterprise)
 */
router.get('/pipeline/statistics',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  validateRequest({
    query: {
      tenantId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      const statistics = await aiPipeline.getAIPipelineStatistics();
      
      res.json({
        success: true,
        data: statistics,
        message: 'AI pipeline statistics retrieved successfully'
      });
    } catch (error) {
      console.error('❌ AI pipeline statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI pipeline statistics',
        details: error.message
      });
    }
  }
);

// ============================================================================
// AI SERVICE HEALTH & STATUS ROUTES
// ============================================================================

/**
 * @route GET /api/ai/health
 * @desc Get AI services health status
 * @access Private (Premium/Enterprise)
 */
router.get('/health',
  authenticateToken,
  authorizeRole(['premium', 'enterprise']),
  async (req, res) => {
    try {
      const healthStatus = {
        predictiveAnalytics: await predictiveAnalytics.getPredictionStatistics(req.user.tenantId),
        nlpService: await nlpService.getNLPStatistics(req.user.tenantId),
        insightsEngine: await insightsEngine.getInsightsStatistics(req.user.tenantId),
        optimizationEngine: await optimizationEngine.getOptimizationStatistics(req.user.tenantId),
        aiPipeline: await aiPipeline.getAIPipelineStatistics(),
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: healthStatus,
        message: 'AI services health status retrieved successfully'
      });
    } catch (error) {
      console.error('❌ AI health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve AI health status',
        details: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/health/refresh
 * @desc Refresh AI services and models
 * @access Private (Enterprise)
 */
router.post('/health/refresh',
  authenticateToken,
  authorizeRole(['enterprise']),
  validateRequest({
    body: {
      tenantId: 'required|string'
    }
  }),
  async (req, res) => {
    try {
      console.log('🔄 Refreshing AI services...');
      
      // Refresh all AI services
      await Promise.all([
        predictiveAnalytics.loadPretrainedModels(),
        nlpService.loadMedicalVocabulary(),
        insightsEngine.loadBusinessRules(),
        optimizationEngine.loadOptimizationParameters(),
        aiPipeline.updateOptimizationModels()
      ]);
      
      await logActivity(req.user.id, 'ai_services_refresh', {
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'AI services refreshed successfully'
      });
    } catch (error) {
      console.error('❌ AI services refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh AI services',
        details: error.message
      });
    }
  }
);

module.exports = router; 