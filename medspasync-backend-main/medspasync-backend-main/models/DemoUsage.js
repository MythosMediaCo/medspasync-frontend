// const mongoose = require('mongoose'); // Temporarily disabled for testing

const demoUsageSchema = new mongoose.Schema({
  event: { type: String, required: true },
  planType: { type: String, enum: ['core', 'professional'], default: 'core' },
  revenue: { type: Number, default: 0 },
  matches: { type: Number, default: 0 },
  processingTime: { type: Number, default: 0 },
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

// Temporary mock export for testing
module.exports = {
  find: () => Promise.resolve([]),
  create: (data) => Promise.resolve(data),
  findById: (id) => Promise.resolve(null),
  findOne: (query) => Promise.resolve(null),
  updateOne: (query, update) => Promise.resolve({ modifiedCount: 0 }),
  deleteOne: (query) => Promise.resolve({ deletedCount: 0 })
};
