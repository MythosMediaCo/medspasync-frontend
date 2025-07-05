// const mongoose = require('mongoose'); // Temporarily disabled for testing
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  accessCode: {
    type: String,
    required: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🔒 Hash access code before saving
clientSchema.pre('save', async function (next) {
  if (!this.isModified('accessCode')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.accessCode = await bcrypt.hash(this.accessCode, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔑 Verify access code
clientSchema.methods.verifyAccessCode = async function (plainTextCode) {
  return await bcrypt.compare(plainTextCode, this.accessCode);
};

// ✅ Prevent OverwriteModelError
// module.exports = mongoose.models.Client || mongoose.model('Client', clientSchema);

// Temporary mock export for testing
module.exports = {
  find: () => Promise.resolve([]),
  create: (data) => Promise.resolve(data),
  findById: (id) => Promise.resolve(null),
  findOne: (query) => Promise.resolve(null),
  updateOne: (query, update) => Promise.resolve({ modifiedCount: 0 }),
  deleteOne: (query) => Promise.resolve({ deletedCount: 0 })
};
