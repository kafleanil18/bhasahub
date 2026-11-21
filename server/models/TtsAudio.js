const mongoose = require('mongoose');

// Each phrase is synthesised by Azure once, then served from here for free.
const ttsAudioSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  voice: { type: String, required: true },
  rate: { type: String, required: true },
  audio: { type: Buffer, required: true },
}, { timestamps: true });

module.exports = mongoose.model('TtsAudio', ttsAudioSchema);
