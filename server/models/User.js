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
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordOtpHash: { type: String },
    resetPasswordOtpExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);