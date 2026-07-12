const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    category: { type: String, default: 'vocabulary' },
    dialogue: { type: String, default: '' },
    dialogueImage: { type: String, default: '' },
    dialogueLines: [
      {
        text: { type: String, default: '' },
        audioUrl: { type: String, default: '' },
      },
    ],
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);