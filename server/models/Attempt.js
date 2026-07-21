const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['vocab-quiz', 'test'], required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    missedVocabulary: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, createdAt: -1 });
attemptSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
