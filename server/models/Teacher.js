const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    photo: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
