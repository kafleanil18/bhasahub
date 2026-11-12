const mongoose = require('mongoose');
const studios = ['pinyin', 'trace', 'listening', 'sentences', 'measures', 'numbers', 'dictation', 'conversation'];
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: String, required: true },
  studio: { type: String, enum: studios, required: true },
  correct: { type: Boolean, default: null },
  itemKey: { type: String },
}, { timestamps: true });
schema.index({ user: 1, eventId: 1 }, { unique: true });
schema.index({ user: 1, studio: 1, createdAt: -1 });
module.exports = mongoose.model('StudioActivity', schema);
module.exports.studios = studios;
