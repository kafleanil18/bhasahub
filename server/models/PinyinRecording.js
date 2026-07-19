const mongoose = require('mongoose');

const pinyinRecordingSchema = new mongoose.Schema(
  {
    syllable: { type: String, required: true }, // base syllable, e.g. "ma"
    tone: { type: Number, required: true, min: 1, max: 4 },
    audioUrl: { type: String, required: true },
  },
  { timestamps: true }
);

pinyinRecordingSchema.index({ syllable: 1, tone: 1 }, { unique: true });

module.exports = mongoose.model('PinyinRecording', pinyinRecordingSchema);
