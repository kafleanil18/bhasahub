const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    level: { type: String, default: '' },
    description: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    questions: [
      {
        questionText: { type: String, default: '' },
        options: [{ type: String }],
        correctIndex: { type: Number, default: 0 },
      },
    ],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);
