const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    appliedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AccessRequest' }],
    expiresAt: { type: Date, required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);