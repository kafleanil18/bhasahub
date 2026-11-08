const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  provider: { type: String, enum: ['resend', 'brevo'], default: 'resend' },
  enabled: { type: Boolean, default: false },
  senderEmail: { type: String, default: '' },
  senderName: { type: String, default: 'Xiao Ao' },
  apiKeyEncrypted: { type: String, default: '', select: false },
  connectionError: { type: String, default: '' },
}, { timestamps: true, toJSON: { transform(_doc, value) { delete value.apiKeyEncrypted; return value; } } });

module.exports = mongoose.model('EmailApiSettings', schema);
