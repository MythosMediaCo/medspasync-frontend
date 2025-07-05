const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const authenticateToken = require('../../../middleware/authenticateToken');
const requireSubscription = require('../../../middleware/requireSubscription');

const Upload = require('../../../models/Upload');
const Practice = require('../../../models/Practice');

const router = express.Router();
const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_MB || '10', 10) * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE }
});

// Clean csv row values
const cleanRow = row =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim(), typeof v === 'string' ? v.trim() : v])
  );

router.post(
  '/',
  authenticateToken,
  requireSubscription,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { file, user } = req;
      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const allowed = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/csv',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Invalid file type' });
      }

      const practice = await Practice.findOne({
        $or: [{ ownerUserId: user.id }, { 'members.userId': user.id }]
      });
      if (!practice) {
        return res.status(403).json({ success: false, message: 'Practice not found' });
      }

      let cleanedCount = 0;
      await pipeline(
        Readable.from(file.buffer),
        csv(),
        async function* (source) {
          for await (const row of source) {
            cleanRow(row);
            cleanedCount++;
          }
        }
      );

      const uploadRecord = await Upload.create({
        userId: user.id,
        practiceId: practice.practiceId,
        originalFileName: file.originalname,
        cleanedRecordCount: cleanedCount,
        tags: req.body.tags || [],
        notes: req.body.notes || '',
        uploadedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Upload successful',
        recordCount: cleanedCount,
        uploadId: uploadRecord._id
      });
    } catch (err) {
      next(err);
    }
  }
);

router.use((err, req, res, next) => {
  console.error('[UPLOAD_ERROR]', err);
  res.status(500).json({ success: false, message: 'Upload failed' });
});

module.exports = router;
