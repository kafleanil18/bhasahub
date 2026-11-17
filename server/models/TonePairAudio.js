const mongoose = require('mongoose');

// The word list ships with the app (data/tonePairs.json); only teacher recordings are stored.
const tonePairAudioSchema = new mongoose.Schema({
  pairId: { type: String, required: true, unique: true },
  audioUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('TonePairAudio', tonePairAudioSchema);
