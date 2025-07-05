const express = require('express');
const router = express.Router();
const axios = require('axios');

const authenticateToken = require('../middleware/authenticateToken');
const requireProfessionalTier = require('../middleware/requireProfessionalTier');
const AIMatch = require('../models/AIMatch');
const { 
  computeConfidenceScore, 
  getExplainableAuditTrail,
  aiReconciliationService 
} = require('../engine/aiReconciliation');

// Apply authentication and tier check to all routes
router.use(authenticateToken, requireProfessionalTier);

// GET /api/ai/matches - list matches
router.get('/matches', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const matches = await AIMatch.find(query).sort({ createdAt: -1 });
    res.json({ success: true, matches });
  } catch (err) {
    console.error('AI matches fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

// GET /api/ai/match/:id - single match with audit
router.get('/match/:id', async (req, res) => {
  try {
    const match = await AIMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    // Use async AI service for confidence and audit
    const [confidence, audit] = await Promise.all([
      computeConfidenceScore(match),
      getExplainableAuditTrail(match)
    ]);

    res.json({ success: true, match, confidence, audit });
  } catch (err) {
    console.error('AI match fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch match' });
  }
});

// POST /api/ai/train - submit user feedback
router.post('/train', async (req, res) => {
  try {
    const { id, feedback = {}, status } = req.body;
    const match = await AIMatch.findById(id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (status) match.status = status;
    match.feedback = { ...feedback, submittedAt: new Date() };
    await match.save();

    // Send feedback to AI service for model training
    if (process.env.ML_SERVICE_URL) {
      try {
        await axios.post(`${process.env.ML_SERVICE_URL}/api/v1/ai/train`, { 
          matchId: id, 
          feedback,
          training_data: [match]
        });
      } catch (err) {
        console.warn('AI service training request failed:', err.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('AI training error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

// POST /api/ai/reprocess - queue reprocessing with AI service
router.post('/reprocess', async (req, res) => {
  try {
    const { matchId } = req.body;
    
    if (matchId) {
      // Reprocess specific match
      const match = await AIMatch.findById(matchId);
      if (!match) return res.status(404).json({ error: 'Match not found' });

      // Use AI service to reprocess
      const newConfidence = await computeConfidenceScore(match);
      const newAudit = await getExplainableAuditTrail(match);

      match.confidenceScore = newConfidence;
      match.auditTrail = newAudit;
      await match.save();

      res.json({ success: true, match });
    } else {
      // Queue bulk reprocessing
      res.json({ success: true, queued: true, message: 'Bulk reprocessing queued' });
    }
  } catch (err) {
    console.error('Reprocessing error:', err);
    res.status(500).json({ success: false, error: 'Failed to reprocess' });
  }
});

// POST /api/ai/reconcile - start new reconciliation job
router.post('/reconcile', async (req, res) => {
  try {
    const { rewardTransactions, posTransactions, threshold = 0.95 } = req.body;

    if (!rewardTransactions || !posTransactions) {
      return res.status(400).json({ 
        success: false, 
        error: 'rewardTransactions and posTransactions are required' 
      });
    }

    // Start reconciliation job using AI service
    const jobId = await aiReconciliationService.startReconciliationJob(
      rewardTransactions, 
      posTransactions, 
      threshold
    );

    res.json({ 
      success: true, 
      jobId, 
      message: 'Reconciliation job started successfully' 
    });
  } catch (err) {
    console.error('Reconciliation job start error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start reconciliation job',
      details: err.message 
    });
  }
});

// GET /api/ai/reconcile/:jobId/status - get reconciliation job status
router.get('/reconcile/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await aiReconciliationService.getReconciliationStatus(jobId);
    res.json({ success: true, status });
  } catch (err) {
    console.error('Reconciliation status error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get reconciliation status',
      details: err.message 
    });
  }
});

// GET /api/ai/reconcile/:jobId/results - get reconciliation results
router.get('/reconcile/:jobId/results', async (req, res) => {
  try {
    const { jobId } = req.params;
    const results = await aiReconciliationService.getReconciliationResults(jobId);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Reconciliation results error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get reconciliation results',
      details: err.message 
    });
  }
});

// GET /api/ai/model/metrics - retrieve metrics from ML service
router.get('/model/metrics', async (req, res) => {
  if (!process.env.ML_SERVICE_URL) {
    return res.status(501).json({ success: false, error: 'ML service not configured' });
  }

  try {
    const response = await axios.get(`${process.env.ML_SERVICE_URL}/api/v1/analytics/performance`);
    res.json({ success: true, metrics: response.data });
  } catch (err) {
    console.error('ML service metrics error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

// GET /api/ai/service-health - check Python AI service health
router.get('/service-health', async (req, res) => {
  try {
    const isAvailable = await aiReconciliationService.isServiceAvailable();
    res.json({ 
      success: true, 
      service: {
        available: isAvailable,
        url: process.env.ML_SERVICE_URL || process.env.AI_API_URL,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('AI service health check error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to contact AI service',
      details: err.message 
    });
  }
});

// GET /api/ai/accuracy-analytics - get accuracy analytics
router.get('/accuracy-analytics', async (req, res) => {
  if (!process.env.ML_SERVICE_URL) {
    return res.status(501).json({ success: false, error: 'ML service not configured' });
  }

  try {
    const response = await axios.get(`${process.env.ML_SERVICE_URL}/api/v1/analytics/accuracy`);
    res.json({ success: true, analytics: response.data });
  } catch (err) {
    console.error('Accuracy analytics error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch accuracy analytics' });
  }
});

module.exports = router;
