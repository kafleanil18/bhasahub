const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: { type: String },
  content: { type: mongoose.Schema.Types.Mixed },
  published: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PracticePaper', schema);
