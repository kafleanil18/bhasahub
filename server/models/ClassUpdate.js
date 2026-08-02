const mongoose = require('mongoose');

const classUpdateSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    date: { type: Date, required: true },
    time: { type: String, default: '' }, // 'HH:MM' 24-hour, e.g. '19:00' for a 7 PM class
    title: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

classUpdateSchema.index({ date: -1, time: 1 });

module.exports = mongoose.model('ClassUpdate', classUpdateSchema);
