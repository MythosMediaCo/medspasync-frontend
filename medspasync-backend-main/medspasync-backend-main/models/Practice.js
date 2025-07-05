const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'US' }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  phone: { type: String, trim: true },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  website: { type: String, trim: true }
}, { _id: false });

const practiceSchema = new mongoose.Schema({
  practiceId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: addressSchema,
  contact: contactSchema,
  subscriptionTier: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    default: 'starter'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    autoReconciliation: { type: Boolean, default: false },
    reconciliationFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    notificationEmail: { type: String, trim: true, lowercase: true },
    timezone: { type: String, default: 'America/New_York' }
  },
  integrations: {
    posSystem: {
      type: String,
      enum: ['square', 'toast', 'clover', 'lightspeed', 'other'],
      default: null
    },
    alleSystem: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, select: false }
    },
    aspireSystem: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, select: false }
    }
  },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['owner', 'admin', 'user'],
      default: 'user'
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  billing: {
    planStartDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date },
    customerId: { type: String, select: false } // Stripe customer ID
  }
}, {
  timestamps: true
});

// Indexes
practiceSchema.index({ ownerUserId: 1 });
practiceSchema.index({ 'members.userId': 1 });
practiceSchema.index({ isActive: 1 });

// Virtuals
practiceSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Methods
practiceSchema.methods.addMember = function (userId, role = 'user') {
  const existing = this.members.find(m => m.userId.toString() === userId.toString());
  if (!existing) {
    this.members.push({ userId, role });
    return this.save();
  }
  throw new Error('User is already a member of this practice');
};

practiceSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(m => m.userId.toString() !== userId.toString());
  return this.save();
};

practiceSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [
      { ownerUserId: userId },
      { 'members.userId': userId }
    ]
  });
};

// Pre-save middleware
practiceSchema.pre('save', function (next) {
  if (!this.billing.nextBillingDate && this.billing.planStartDate) {
    const nextBilling = new Date(this.billing.planStartDate);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    this.billing.nextBillingDate = nextBilling;
  }
  next();
});

// ✅ Safe export
module.exports = mongoose.models.Practice || mongoose.model('Practice', practiceSchema);
