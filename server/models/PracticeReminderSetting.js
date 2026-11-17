const mongoose = require('mongoose');

// A student's daily push reminder choice. Dates and times are in the student's own timezone.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  enabled: { type: Boolean, default: false },
  time: { type: String, default: '19:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  timezone: { type: String, default: 'UTC' },
  // The local date already reminded or skipped, so each day is handled at most once.
  lastHandledDate: { type: String, default: '' },
}, { timestamps: true });
schema.index({ enabled: 1 });

module.exports = mongoose.model('PracticeReminderSetting', schema);
