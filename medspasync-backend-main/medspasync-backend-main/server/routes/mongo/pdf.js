const express = require('express');
const PDFDocument = require('pdfkit');
const stream = require('stream');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../../../middleware/authenticateToken');
const verifySubscription = require('../../../middleware/verifySubscription');
const { isProfessional } = require('../../../utils/planHelpers');
const ReconciliationLog = require('../../../models/ReconciliationLog');
const Upload = require('../../../models/Upload');
const User = require('../../../models/User');
const { sendEmailWithAttachment } = require('../../../utils/mailer');

const router = express.Router();

const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many PDF requests, please try again later.'
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many email requests, please try again later.'
});

// ✅ Download PDF via GET (Pro only)
router.get('/analytics/pdf', authenticateToken, verifySubscription, pdfLimiter, async (req, res) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  try {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=MedSpaSyncPro_Analytics_Summary.pdf');
    doc.pipe(res);

    const uploads = await Upload.countDocuments();
    const users = await User.countDocuments();
    const recon = await ReconciliationLog.getAnalytics();

    const trialExpirations = await User.countDocuments({
      isSubscribed: false,
      createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    });

    doc.fontSize(22).text('MedSpaSync Pro - Analytics Summary', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).text(`📈 Total Uploads: ${uploads}`);
    doc.text(`👥 Total Users: ${users}`);
    doc.text(`💰 Recovered Revenue: $${recon.totalRevenue.toFixed(2)}`);
    doc.text(`✅ Avg Match Rate: ${recon.avgMatchRate.toFixed(2)}%`);
    doc.text(`⚠️ Failed Record Rate: ${recon.totalUnmatched}/${recon.totalRecordsProcessed}`);
    doc.text(`⏳ Trial Expirations This Month: ${trialExpirations}`);
    doc.moveDown();

    doc.fontSize(10).text(`🕒 Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('[PDF_EXPORT_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// ✉️ Send PDF via email POST (Pro only)
router.post('/analytics/pdf/email', authenticateToken, verifySubscription, emailLimiter, async (req, res) => {
  if (!isProfessional(req.user)) {
    return res.status(403).json({ success: false, error: 'Professional plan required' });
  }
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Recipient email required' });

    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      await sendEmailWithAttachment({
        to: email,
        subject: 'MedSpaSync Pro Analytics Report',
        text: 'Attached is your PDF analytics summary.',
        attachmentBuffer: pdfBuffer,
        filename: 'analytics_summary.pdf'
      });

      res.json({ success: true, message: 'PDF emailed successfully' });
    });

    const uploads = await Upload.countDocuments();
    const users = await User.countDocuments();
    const recon = await ReconciliationLog.getAnalytics();

    const trialExpirations = await User.countDocuments({
      isSubscribed: false,
      createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    });

    doc.pipe(new stream.PassThrough());
    doc.fontSize(22).text('MedSpaSync Pro - Analytics Summary (Emailed)', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).text(`📈 Total Uploads: ${uploads}`);
    doc.text(`👥 Total Users: ${users}`);
    doc.text(`💰 Recovered Revenue: $${recon.totalRevenue.toFixed(2)}`);
    doc.text(`✅ Avg Match Rate: ${recon.avgMatchRate.toFixed(2)}%`);
    doc.text(`⚠️ Failed Record Rate: ${recon.totalUnmatched}/${recon.totalRecordsProcessed}`);
    doc.text(`⏳ Trial Expirations This Month: ${trialExpirations}`);
    doc.moveDown();
    doc.fontSize(10).text(`🕒 Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('[EMAIL_ANALYTICS_PDF_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to email PDF' });
  }
});

module.exports = router;
