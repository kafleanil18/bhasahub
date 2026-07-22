const mongoose = require('mongoose');

const hanziClipSchema = new mongoose.Schema({
  character: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  pinyin: {
    type: String,
    default: '',
    trim: true,
  },
  meaning: {
    type: String,
    default: '',
    trim: true,
  },
  strokeCount: {
    type: Number,
    default: 1,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  tips: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'Basic Strokes',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HanziClip', hanziClipSchema);
