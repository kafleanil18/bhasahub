const mongoose = require('mongoose');

// Two-syllable words added by the super admin in the Tone pair studio, served alongside data/tonePairs.json.
const tonePairWordSchema = new mongoose.Schema({
  hanzi: { type: String, required: true, unique: true, trim: true },
  syllables: { type: [String], required: true, validate: value => value.length === 2 },
  tones: { type: [Number], required: true, validate: value => value.length === 2 },
  writtenTones: { type: [Number], required: true, validate: value => value.length === 2 },
  english: { type: String, required: true, trim: true, maxlength: 80 },
  rule: { type: String, enum: ['third', 'bu', 'yi', null], default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('TonePairWord', tonePairWordSchema);
