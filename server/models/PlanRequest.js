const mongoose = require('mongoose');
const { PLAN_IDS } = require('../utils/plans');

const planRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: PLAN_IDS, required: true },
    price: { type: Number, required: true },
    days: { type: Number, required: true },
    // Live classes for the same length, added at checkout, and their price at the time.
    liveClass: { type: Boolean, default: false },
    liveClassPrice: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    // The student's payment, sent from checkout: how they paid, the screenshot of the payment (always
    // required) and any transaction details. An admin checks it, then starts the plan.
    payment: {
      method: { type: String, enum: ['bank', 'qr'] },
      screenshot: { type: String, default: '' },
      reference: { type: String, default: '' },
      note: { type: String, default: '' },
      submittedAt: { type: Date },
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    // Result of the last email to super admins, so a failed delivery is visible in admin.
    adminEmail: {
      sentTo: { type: [String], default: undefined },
      error: { type: String, default: '' },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

planRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('PlanRequest', planRequestSchema);
