const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const { isProfessional } = require('../../../utils/planHelpers');
const {
  runReconciliation,
  logReconciliation
} = require('../../../reconciliation/engine');

// POST /a../../reconciliation/run
router.post('/run', authenticateToken, verifySubscription, async (req, res) => {
  try {
    const { alleData = [], aspireData = [], posData = [] } = req.body;

    if (!Array.isArray(posData) || posData.length === 0) {
      return res.status(400).json({ success: false, error: 'POS data is required and must be an array' });
    }

    const planType = req.user.planType || 'core';

    // Run reconciliation
    const {
      results,
      summaries,
      summary,
      detailed
    } = await runReconciliation({ alleData, aspireData, posData, planType });

    if (isProfessional(req.user)) {
      await logReconciliation(
        req.user.practiceId || null,
        req.user.id || req.user.userId,
        summary,
        detailed,
        {
          alleRecords: alleData.length,
          aspireRecords: aspireData.length,
          planType,
          sourceIp: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    res.json({
      success: true,
      results,
      summaries,
      summary
    });
  } catch (err) {
    console.error('❌ Reconciliation error:', err);
    res.status(500).json({ success: false, error: 'Reconciliation failed' });
  }
});

module.exports = router;
