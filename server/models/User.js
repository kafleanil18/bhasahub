const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { 
      type: String, 
      required: function () { 
        return !this.googleId; 
      } 
    },
    role: { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student' },
    googleId: { type: String, sparse: true, unique: true },
    avatar: { type: String },
    signInCount: { type: Number, default: 0 },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    // Missing on legacy accounts; only new local registrations are explicitly unverified.
    emailVerified: { type: Boolean },
    practiceReminderOptOut: { type: Boolean, default: false },
    emailVerificationHash: { type: String },
    emailVerificationExpires: { type: Date },
    emailVerificationSentAt: { type: Date },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordOtpHash: { type: String },
    resetPasswordOtpExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
