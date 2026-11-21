const mongoose = require('mongoose');

// One row per student: while expiresAt is in the future, every published course is unlocked.
const platformPassSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    expiresAt: { type: Date, required: true },
    plan: { type: String, default: '' },
    appliedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlanRequest' }],
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformPass', platformPassSchema);
