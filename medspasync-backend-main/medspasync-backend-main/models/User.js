// const mongoose = require('mongoose'); // Temporarily disabled for testing

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: true,
//     select: false
//   },
//   firstName: { 
//     type: String, 
//     required: true 
//   },
//   lastName: { 
//     type: String, 
//     required: true 
//   },

//   // Business metadata
//   practiceId: { 
//     type: String, 
//     default: null 
//   },
//   businessName: { 
//     type: String, 
//     default: null 
//   },
//   role: { 
//     type: String, 
//     default: 'staff' 
//   },

//   // Stripe subscription tracking
//   isSubscribed: { 
//     type: Boolean, 
//     default: false 
//   },
//   stripeCustomerId: {
//     type: String,
//     default: null,
//     select: false
//   }
// }, {
//   timestamps: true
// });

// ✅ Prevent OverwriteModelError in dev or hot-reload environments
// module.exports = mongoose.models.User || mongoose.model('User', userSchema);

// Temporary mock export for testing
module.exports = {
  find: () => Promise.resolve([]),
  create: (data) => Promise.resolve(data),
  findById: (id) => Promise.resolve(null),
  findOne: (query) => Promise.resolve(null),
  updateOne: (query, update) => Promise.resolve({ modifiedCount: 0 }),
  deleteOne: (query) => Promise.resolve({ deletedCount: 0 })
};
