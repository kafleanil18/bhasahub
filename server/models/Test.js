const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  pinyin: { type: String, default: '' }
}, { _id: false });

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    level: { type: String, default: '' },
    description: { type: String, default: '' },
    testType: { type: String, enum: ['listening', 'reading'], default: 'listening' },
    audioUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    questions: [
      {
        questionText: { type: String, default: '' },
        questionPinyin: { type: String, default: '' },
        options: [optionSchema],
        correctIndex: { type: Number, default: 0 },
      },
    ],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);
