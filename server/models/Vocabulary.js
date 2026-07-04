const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    word: { type: String, required: true },
    pronunciation: { type: String, required: true },
    meaning: { type: String, required: true },
    audioUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vocabulary', vocabularySchema);