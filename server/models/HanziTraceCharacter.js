const mongoose = require('mongoose');

const hanziTraceCharacterSchema = new mongoose.Schema(
  {
    character: { type: String, required: true, trim: true },
    pinyin: { type: String, default: '', trim: true },
    meaning: { type: String, default: '', trim: true },
    category: { type: String, default: 'Basic Strokes' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HanziTraceCharacter', hanziTraceCharacterSchema);
