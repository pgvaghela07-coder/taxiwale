const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['aadhaar', 'driving-license', 'digilocker'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  data: {
    // Encrypted/hashed sensitive data
    aadhaarNumber: String, // Hashed
    dlNumber: String, // Hashed
    digilockerId: String
  },
  verifiedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

// Hash sensitive data before saving
verificationSchema.pre('save', async function(next) {
  if (this.isModified('data.aadhaarNumber') && this.data.aadhaarNumber) {
    this.data.aadhaarNumber = await bcrypt.hash(this.data.aadhaarNumber, 10);
  }
  if (this.isModified('data.dlNumber') && this.data.dlNumber) {
    this.data.dlNumber = await bcrypt.hash(this.data.dlNumber, 10);
  }
  next();
});

verificationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Verification', verificationSchema);

