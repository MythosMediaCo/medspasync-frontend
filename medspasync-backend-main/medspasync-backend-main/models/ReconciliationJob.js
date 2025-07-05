// const mongoose = require('mongoose'); // Temporarily disabled for testing

const reconciliationJobSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing', index: true },
  input: {
    alleCount: { type: Number, default: 0 },
    aspireCount: { type: Number, default: 0 },
    posCount: { type: Number, required: true },
    confidenceThreshold: { type: Number, default: 0.95 }
  },
  results: {
    autoAccepted: [{
      id: String,
      rewardTransaction: mongoose.Schema.Types.Mixed,
      posTransaction: mongoose.Schema.Types.Mixed,
      confidence: Number,
      recommendation: String,
      featureAnalysis: mongoose.Schema.Types.Mixed,
      processingTimestamp: String,
      manualReview: {
        decision: String,
        notes: String,
        reviewedBy: String,
        reviewedAt: String
      }
    }],
    needsReview: [{
      id: String,
      rewardTransaction: mongoose.Schema.Types.Mixed,
      posTransaction: mongoose.Schema.Types.Mixed,
      confidence: Number,
      recommendation: String,
      featureAnalysis: mongoose.Schema.Types.Mixed,
      processingTimestamp: String
    }],
    unmatched: [{
      type: String,
      transaction: mongoose.Schema.Types.Mixed,
      reason: String,
      rejectedAt: String
    }],
    summary: {
      totalRewardTransactions: Number,
      totalPOSTransactions: Number,
      autoAcceptedCount: Number,
      needsReviewCount: Number,
      unmatchedCount: Number,
      autoMatchRate: Number,
      processingDate: String
    }
  },
  processingTime: Number,
  error: String,
  createdAt: { type: Date, default: Date.now, index: true },
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  lastModified: { type: Date, default: Date.now }
});

reconciliationJobSchema.index({ userId: 1, createdAt: -1 });
reconciliationJobSchema.index({ status: 1, createdAt: -1 });
reconciliationJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const ReconciliationJob = mongoose.model('ReconciliationJob', reconciliationJobSchema);

// Temporary mock export for testing
module.exports = {
  find: () => Promise.resolve([]),
  create: (data) => Promise.resolve(data),
  findById: (id) => Promise.resolve(null),
  findOne: (query) => Promise.resolve(null),
  updateOne: (query, update) => Promise.resolve({ modifiedCount: 0 }),
  deleteOne: (query) => Promise.resolve({ deletedCount: 0 })
};
