const mongoose = require('mongoose');

const playgroundSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
    maxlength: [100, 'Session name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    enum: ['javascript', 'typescript', 'jsx', 'tsx', 'html', 'css'],
    default: 'tsx'
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified on save
playgroundSessionSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Index for better query performance
playgroundSessionSchema.index({ userId: 1, createdAt: -1 });
playgroundSessionSchema.index({ isPublic: 1, createdAt: -1 });
playgroundSessionSchema.index({ tags: 1 });

module.exports = mongoose.model('PlaygroundSession', playgroundSessionSchema);
