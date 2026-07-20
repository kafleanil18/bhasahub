const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    category: { type: String, default: 'vocabulary' },
    dialogue: { type: String, default: '' },
    dialogueImage: { type: String, default: '' },
    grammarExplanation: { type: String, default: '' },
    grammarImage: { type: String, default: '' },
    dialogueLines: [
      {
        speaker: { type: String, default: '' },
        text: { type: String, default: '' }, // the sentence in its native script
        pinyin: { type: String, default: '' },
        meaning: { type: String, default: '' },
        audioUrl: { type: String, default: '' },
        order: { type: Number, default: 0 },
      },
    ],
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);