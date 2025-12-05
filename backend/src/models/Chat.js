const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'bot'],
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
  status: {
    type: String,
    enum: ['active', 'resolved', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

chatSchema.index({ userId: 1 });
chatSchema.index({ status: 1 });

module.exports = mongoose.model('Chat', chatSchema);

