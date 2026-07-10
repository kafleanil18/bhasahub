const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    image: { type: String, default: '' },
    author: { type: String, default: '' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);