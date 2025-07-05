const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  practiceId: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  cleanedRecordCount: {
    type: Number,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  resultFileUrl: {
    type: String // If exported to S3 or generated later
  },
  tags: {
    type: [String],
    default: []
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

uploadSchema.index({ practiceId: 1 });
uploadSchema.index({ userId: 1 });
uploadSchema.index({ createdAt: -1 });

// ✅ Prevent OverwriteModelError in dev or hot-reload environments
module.exports =
  mongoose.models.Upload || mongoose.model('Upload', uploadSchema);
