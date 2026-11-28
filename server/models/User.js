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
    // Bumped when the password changes; sign-in tokens with an older version are rejected.
    tokenVersion: { type: Number, default: 0 },
    googleId: { type: String, sparse: true, unique: true },
    avatar: { type: String },
    signInCount: { type: Number, default: 0 },
    // Ticked by a super admin when a student has joined live classes: opens Recorded sessions
    // (see utils/liveClassAccess.js, which also counts live classes paid for at checkout).
    liveClassAccess: { type: Boolean, default: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    // Missing on legacy accounts; only new local registrations are explicitly unverified.
    emailVerified: { type: Boolean },
    practiceReminderOptOut: { type: Boolean, default: false },
    // Minutes of learning a day the student aims for (daily goal ring on the dashboard).
    dailyGoalMinutes: { type: Number, enum: [5, 10, 15, 20, 30], default: 10 },
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
