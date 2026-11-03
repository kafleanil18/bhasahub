const mongoose = require('mongoose');

const sentenceAudioSchema = new mongoose.Schema({
  sentenceId: { type: String, required: true, unique: true },
  audioUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('SentenceAudio', sentenceAudioSchema);
