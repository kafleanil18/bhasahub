const mongoose = require('mongoose');

// Saved text for the About pages. `content` holds only the fields a super admin changed; the client
// fills the rest from its defaults (client/src/about/aboutContent.js). Only About Xiao Ao can be
// hidden, and it starts hidden.
const aboutPageSchema = new mongoose.Schema({
  slug: { type: String, enum: ['xiao-ao', 'hsk'], required: true, unique: true },
  visible: { type: Boolean, default: false },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('AboutPage', aboutPageSchema);
