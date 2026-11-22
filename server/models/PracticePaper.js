const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: { type: String },
  content: { type: mongoose.Schema.Types.Mixed },
  published: { type: Boolean, default: true },
  // Soft delete: hidden from everyone and closed to new attempts, but restorable by a superadmin.
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PracticePaper', schema);
