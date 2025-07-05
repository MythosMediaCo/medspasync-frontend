const mongoose = require('mongoose');

const ReconciliationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  practiceId: {
    type: String,
    required: true
  },
  uploadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  },
  summary: {
    exactMatches: { type: Number, default: 0 },
    fuzzyMatches: { type: Number, default: 0 },
    unmatched: { type: Number, default: 0 }
  },
  samples: {
    matches: [{ type: Object }],
    fuzzy: [{ type: Object }],
    unmatched: [{ type: Object }]
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ReconciliationHistorySchema.index({ userId: 1 });
ReconciliationHistorySchema.index({ practiceId: 1 });
ReconciliationHistorySchema.index({ uploadedAt: -1 });

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.ReconciliationHistory || mongoose.model('ReconciliationHistory', ReconciliationHistorySchema);
