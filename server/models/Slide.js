const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    embedUrl: { type: String, default: '' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Slide', slideSchema);
