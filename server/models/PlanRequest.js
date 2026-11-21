const mongoose = require('mongoose');
const { PLAN_IDS } = require('../utils/plans');

const planRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: PLAN_IDS, required: true },
    price: { type: Number, required: true },
    days: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

planRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('PlanRequest', planRequestSchema);
