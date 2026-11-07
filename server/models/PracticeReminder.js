const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sending', 'sent', 'failed', 'skipped', 'uncertain'], default: 'pending' },
  claimId: String,
  attemptedAt: Date,
}, { _id: false });

const schema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  clientUrl: { type: String, required: true },
  recipients: [recipientSchema],
}, { timestamps: true });

schema.index({ createdBy: 1, requestId: 1 }, { unique: true });
schema.index({ 'recipients.status': 1, createdAt: 1 });
module.exports = mongoose.model('PracticeReminder', schema);
