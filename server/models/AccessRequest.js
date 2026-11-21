const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, enum: ['course', 'tests'], default: 'course' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: function () { return this.scope !== 'tests'; } },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
