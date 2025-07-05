// const mongoose = require('mongoose'); // Temporarily disabled for testing

// const leadSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     lowercase: true,
//     trim: true,
//     match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
//   },
//   phone: {
//     type: String,
//     trim: true
//   },
//   source: {
//     type: String,
//     enum: ['website', 'event', 'referral', 'ad', 'other'],
//     default: 'website'
//   },
//   interestedIn: {
//     type: [String],
//     default: []
//   },
//   message: {
//     type: String,
//     trim: true
//   },
//   contacted: {
//     type: Boolean,
//     default: false
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// leadSchema.index({ email: 1 });

// ✅ Prevent OverwriteModelError
// module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

// Temporary mock export for testing
module.exports = {
  find: () => Promise.resolve([]),
  create: (data) => Promise.resolve(data),
  findById: (id) => Promise.resolve(null),
  findOne: (query) => Promise.resolve(null),
  updateOne: (query, update) => Promise.resolve({ modifiedCount: 0 }),
  deleteOne: (query) => Promise.resolve({ deletedCount: 0 })
};
