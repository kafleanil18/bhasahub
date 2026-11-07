const mongoose = require('mongoose');

// Kept separate from SiteSettings, whose read endpoint is public.
const emailSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'google-smtp', unique: true },
  enabled: { type: Boolean, default: false },
  email: { type: String, default: '' },
  senderName: { type: String, default: 'Xiao Ao' },
  port: { type: Number, enum: [465, 587], default: 465 },
  appPasswordEncrypted: { type: String, default: '', select: false },
}, { timestamps: true, toJSON: { transform(_doc, value) { delete value.appPasswordEncrypted; return value; } } });

module.exports = mongoose.model('EmailSettings', emailSettingsSchema);
