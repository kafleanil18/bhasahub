const mongoose = require('mongoose');

// One row per browser/device that agreed to receive practice reminders.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  device: { type: String, default: '' },
  lastSuccessAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', schema);
