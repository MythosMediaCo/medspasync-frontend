const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middleware/authenticateToken');
const Upload = require('../../../models/Upload');
const ReconciliationLog = require('../../../models/ReconciliationLog');

// @route   GET /api/analytics/summary
// @desc    Return basic analytics summary (e.g. upload trends)
// @access  Private
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const uploadTrends = await Upload.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ]);

    const totalUploads = await Upload.countDocuments();
    const recon = await ReconciliationLog.getAnalytics();

    res.json({
      success: true,
      data: {
        uploadTrends,
        totalUploads,
        avgMatchRate: recon.avgMatchRate
      }
    });
  } catch (error) {
    console.error('📉 Analytics error:', error);
    res.status(500).json({ success: false, message: 'Analytics failed.' });
  }
});

module.exports = router;
