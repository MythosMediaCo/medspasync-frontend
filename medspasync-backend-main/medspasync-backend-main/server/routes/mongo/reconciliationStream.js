const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const { isProfessional } = require('../../../utils/planHelpers');
const { runReconciliationFromFileStreams, logReconciliation } = require('../../../reconciliation/engine');

const router = express.Router();
const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_MB || '10') * 1024 * 1024;
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_SIZE }
});

// POST /a../../reconciliation/stream
router.post(
  '/stream',
  authenticateToken,
  verifySubscription,
  (req, res, next) => {
    upload.fields([
      { name: 'pos', maxCount: 1 },
      { name: 'alle', maxCount: 1 },
      { name: 'aspire', maxCount: 1 }
    ])(req, res, err => {
      if (err) {
        if (err instanceof multer.MulterError) {
          const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
          return res.status(400).json({ success: false, error: msg });
        }
        return next(err);
      }
      next();
    });
  },
  async (req, res) => {
  const planType = req.user.planType || 'core';
  const files = req.files || {};
  try {
    const posFile = files.pos?.[0];
    if (!posFile) {
      return res.status(400).json({ success: false, error: 'POS file is required' });
    }

    const alleFile = files.alle?.[0];
    const aspireFile = files.aspire?.[0];

    const { results, summaries, summary, detailed, meta } = await runReconciliationFromFileStreams({
      posPath: posFile.path,
      allePath: alleFile ? alleFile.path : null,
      aspirePath: planType === 'professional' && aspireFile ? aspireFile.path : null,
      planType
    });

    if (isProfessional(req.user)) {
      await logReconciliation(
        req.user.practiceId || null,
        req.user.id || req.user.userId,
        summary,
        detailed,
        {
          alleRecords: meta.alleRecords,
          aspireRecords: meta.aspireRecords,
          planType,
          sourceIp: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    res.json({ success: true, results, summaries, summary });
  } catch (err) {
    console.error('❌ Reconciliation stream error:', err);
    res.status(500).json({ success: false, error: 'Reconciliation failed' });
  } finally {
    for (const key of Object.keys(files)) {
      for (const file of files[key]) {
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
      }
    }
  }
});

module.exports = router;
