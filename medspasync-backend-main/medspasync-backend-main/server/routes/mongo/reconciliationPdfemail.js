// rout../../reconciliationPdfEmail.js
const express = require('express');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const { isProfessional } = require('../../../utils/planHelpers');
const ReconciliationHistory = require('../../../models/ReconciliationHistory');
const { sendEmailWithAttachment } = require('../../../utils/mailer');

const router = express.Router();

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many email requests, please try again later.'
});

// 🔒 POST /a../../reconciliation/email/:id
router.post('/email/:id', authenticateToken, verifySubscription, emailLimiter, async (req, res) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  try {
    const { id } = req.params;
    const { to } = req.body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({ success: false, error: 'Valid recipient email required' });
    }

    const history = await ReconciliationHistory.findById(id);
    if (!history) {
      return res.status(404).json({ success: false, error: 'Reconciliation record not found' });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Send email
      await sendEmailWithAttachment({
        to,
        subject: 'Reconciliation Report PDF - MedSpaSync Pro',
        text: 'Attached is your reconciliation report in PDF format.',
        attachmentBuffer: pdfBuffer,
        filename: `reconciliation_${id}.pdf`
      });

      res.json({ success: true, message: 'PDF emailed successfully' });
    });

    // Content
    doc.fontSize(20).text('Reconciliation Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Practice ID: ${history.practiceId}`);
    doc.text(`User ID: ${history.userId}`);
    doc.text(`Uploaded At: ${new Date(history.uploadedAt).toLocaleString()}`);
    doc.text(`Exact Matches: ${history.summary.exactMatches}`);
    doc.text(`Fuzzy Matches: ${history.summary.fuzzyMatches}`);
    doc.text(`Unmatched: ${history.summary.unmatched}`);
    doc.moveDown();

    const section = (label, data) => {
      doc.fontSize(14).text(label);
      data.slice(0, 5).forEach((row, i) => {
        doc.fontSize(10).text(`  ${i + 1}. ${JSON.stringify(row)}`, { indent: 10 });
      });
      doc.moveDown();
    };

    section('🔍 Sample Matches', history.samples.matches);
    section('🧠 Sample Fuzzy Matches', history.samples.fuzzy);
    section('❌ Sample Unmatched', history.samples.unmatched);

    doc.text(`Generated at: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('[EMAIL_RECONCILIATION_PDF_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to email PDF' });
  }
});

module.exports = router;
