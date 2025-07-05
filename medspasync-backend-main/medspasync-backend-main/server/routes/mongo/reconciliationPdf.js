// rout../../reconciliationPdf.js
const express = require('express');
const PDFDocument = require('pdfkit');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const { isProfessional } = require('../../../utils/planHelpers');
const ReconciliationHistory = require('../../../models/ReconciliationHistory');

const router = express.Router();

const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many PDF requests, please try again later.'
});

// 🔒 GET /a../../reconciliation/pdf/:id
router.get('/pdf/:id', authenticateToken, verifySubscription, pdfLimiter, async (req, res) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  try {
    const { id } = req.params;
    const history = await ReconciliationHistory.findById(id);

    if (!history) {
      return res.status(404).json({ success: false, error: 'Reconciliation record not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reconciliation_${id}.pdf`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Reconciliation Report', { align: 'center' });
    doc.moveDown();

    // Summary
    doc.fontSize(12).text(`Practice ID: ${history.practiceId}`);
    doc.text(`User ID: ${history.userId}`);
    doc.text(`Uploaded At: ${new Date(history.uploadedAt).toLocaleString()}`);
    doc.text(`Exact Matches: ${history.summary.exactMatches}`);
    doc.text(`Fuzzy Matches: ${history.summary.fuzzyMatches}`);
    doc.text(`Unmatched: ${history.summary.unmatched}`);
    doc.moveDown();

    // Samples
    const section = (title, data) => {
      doc.fontSize(14).text(title);
      data.slice(0, 5).forEach((record, i) => {
        doc.fontSize(10).text(`  ${i + 1}. ${JSON.stringify(record)}`, { indent: 10 });
      });
      doc.moveDown();
    };

    section('🔍 Sample Matches', history.samples.matches);
    section('🧠 Sample Fuzzy Matches', history.samples.fuzzy);
    section('❌ Sample Unmatched', history.samples.unmatched);

    doc.text(`Generated at: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('[RECONCILIATION_PDF_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

module.exports = router;
