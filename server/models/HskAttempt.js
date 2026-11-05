const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  paper: { type: String, required: true, default: 'h11226' },
  status: { type: String, enum: ['started', 'submitted'], default: 'started' },
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
  answers: [Number],
  paperSnapshot: { type: mongoose.Schema.Types.Mixed },
  listening: Number,
  reading: Number,
  score: Number,
}, { timestamps: true });
schema.index({ user: 1, paper: 1, createdAt: -1 });
module.exports = mongoose.model('HskAttempt', schema);
