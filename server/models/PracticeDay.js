const mongoose = require('mongoose');

// Active learning time for one student on one day of their own calendar (YYYY-MM-DD, local time).
// Powers the daily goal ring and the practice streak.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  seconds: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
schema.index({ user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('PracticeDay', schema);
