// models/AIMatch.js
// const mongoose = require('mongoose'); // Temporarily disabled for testing

// const AIMatchSchema = new mongoose.Schema({
//   matchId: { type: String, required: true },
//   source: { type: String, enum: ['alle', 'aspire', 'pos'], required: true },
//   transactionA: { type: Object, required: true },
//   transactionB: { type: Object },
//   confidenceScore: { type: Number, default: 0 },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'rejected'],
//     default: 'pending'
//   },
//   feedback: { type: Object, default: null },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.models.AIMatch || mongoose.model('AIMatch', AIMatchSchema);

// Temporary mock export for testing
module.exports = {
  find: () => Promise.resolve([]),
  create: (data) => Promise.resolve(data),
  findById: (id) => Promise.resolve(null),
  findOne: (query) => Promise.resolve(null),
  updateOne: (query, update) => Promise.resolve({ modifiedCount: 0 }),
  deleteOne: (query) => Promise.resolve({ deletedCount: 0 })
};
