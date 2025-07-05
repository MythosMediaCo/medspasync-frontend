// models/ReconciliationLog.js
const mongoose = require('mongoose');

const ReconciliationResultSchema = new mongoose.Schema({
  posRecord: {
    name: String,
    amount: Number,
    date: String,
    email: String,
    service: String
  },
  rewardRecord: {
    name: String,
    amount: Number,
    date: String,
    email: String,
    program: String
  },
  matchType: {
    type: String,
    enum: ['Alle', 'Aspire', null],
    default: null
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['matched', 'review', 'unmatched'],
    required: true
  }
}, { _id: false });

const ReconciliationLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  posRecords: {
    type: Number,
    required: true,
    min: 0
  },
  alleRecords: {
    type: Number,
    default: 0,
    min: 0
  },
  aspireRecords: {
    type: Number,
    default: 0,
    min: 0
  },
  matched: {
    type: Number,
    required: true,
    min: 0
  },
  unmatched: {
    type: Number,
    required: true,
    min: 0
  },
  needReview: {
    type: Number,
    default: 0,
    min: 0
  },
  recoveredRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  matchRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  avgConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  planType: {
    type: String,
    enum: ['core', 'professional', 'demo'],
    required: true
  },
  processingTime: {
    type: Number,
    min: 0
  },
  results: [ReconciliationResultSchema],
  sourceIp: String,
  userAgent: String,
  version: {
    type: String,
    default: '1.0.0'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ReconciliationLogSchema.index({ userId: 1, createdAt: -1 });
ReconciliationLogSchema.index({ planType: 1, createdAt: -1 });
ReconciliationLogSchema.index({ sessionId: 1 });
ReconciliationLogSchema.index({ createdAt: -1 });

ReconciliationLogSchema.virtual('totalRecords').get(function() {
  return this.posRecords;
});

ReconciliationLogSchema.virtual('efficiency').get(function() {
  return Math.round(this.matchRate * 0.7 + (this.avgConfidence || 0) * 0.3);
});

ReconciliationLogSchema.statics.getAnalytics = async function(options = {}) {
  const { userId, planType, startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = options;
  const match = { createdAt: { $gte: startDate, $lte: endDate } };
  if (userId) match.userId = userId;
  if (planType) match.planType = planType;
  const analytics = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalReconciliations: { $sum: 1 },
        totalRecordsProcessed: { $sum: '$posRecords' },
        totalRevenue: { $sum: '$recoveredRevenue' },
        avgMatchRate: { $avg: '$matchRate' },
        avgProcessingTime: { $avg: '$processingTime' },
        totalMatches: { $sum: '$matched' },
        totalUnmatched: { $sum: '$unmatched' }
      }
    }
  ]);
  return analytics[0] || {
    totalReconciliations: 0,
    totalRecordsProcessed: 0,
    totalRevenue: 0,
    avgMatchRate: 0,
    avgProcessingTime: 0,
    totalMatches: 0,
    totalUnmatched: 0
  };
};

ReconciliationLogSchema.statics.getMonthlyTrends = async function(userId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const match = { createdAt: { $gte: startDate } };
  if (userId) match.userId = userId;
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        reconciliations: { $sum: 1 },
        revenue: { $sum: '$recoveredRevenue' },
        avgMatchRate: { $avg: '$matchRate' },
        recordsProcessed: { $sum: '$posRecords' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

ReconciliationLogSchema.methods.getSummary = function() {
  return {
    id: this._id,
    sessionId: this.sessionId,
    planType: this.planType,
    totalRecords: this.totalRecords,
    matched: this.matched,
    unmatched: this.unmatched,
    matchRate: this.matchRate,
    recoveredRevenue: this.recoveredRevenue,
    processingTime: this.processingTime,
    efficiency: this.efficiency,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.models.ReconciliationLog || mongoose.model('ReconciliationLog', ReconciliationLogSchema);
