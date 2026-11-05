const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  welcomeVideoUrl: { type: String, default: '' },
  conversationLessons: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
