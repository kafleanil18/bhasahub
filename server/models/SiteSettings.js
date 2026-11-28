const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  welcomeVideoUrl: { type: String, default: '' },
  // The one HSK 1 mock test every signed-in student can take for free (see utils/freePaper.js).
  freePaperId: { type: String, default: '' },
  conversationLessons: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
