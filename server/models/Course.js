const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    language: { type: String, enum: ['chinese', 'nepali'], required: true },
    level: { type: String, default: 'Beginner' },
    description: { type: String, default: '' },
    glyph: { type: String, default: '' },
    image: { type: String, default: '' },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);