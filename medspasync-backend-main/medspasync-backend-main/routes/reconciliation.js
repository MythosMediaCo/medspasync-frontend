// routes/reconciliation.js (CommonJS)
const express = require('express');
const ReconciliationController = require('../controllers/reconciliationController.js');
const FileProcessingService = require('../services/fileProcessingService.js');

const router = express.Router();
const reconciliationController = new ReconciliationController();
const fileProcessor = new FileProcessingService();

// File upload middleware
const upload = fileProcessor.getUploadMiddleware();

// Routes
router.post('/upload', 
  upload.fields([
    { name: 'alle', maxCount: 1 },
    { name: 'aspire', maxCount: 1 },
    { name: 'pos', maxCount: 1 }
  ]),
  reconciliationController.uploadFiles.bind(reconciliationController)
);

router.post('/process',
  reconciliationController.startReconciliation.bind(reconciliationController)
);

router.get('/jobs/:jobId',
  reconciliationController.getReconciliationResults.bind(reconciliationController)
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'reconciliation',
    timestamp: new Date().toISOString(),
    mode: process.env.DATABASE_URL ? 'production' : 'demo'
  });
});

module.exports = router;