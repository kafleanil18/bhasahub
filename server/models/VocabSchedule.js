const mongoose = require('mongoose');

const vocabScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    easeFactor: { type: Number, default: 2.5 },
    intervalDays: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    dueDate: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// one schedule per user per vocabulary word
vocabScheduleSchema.index({ user: 1, vocabulary: 1 }, { unique: true });
vocabScheduleSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model('VocabSchedule', vocabScheduleSchema);
