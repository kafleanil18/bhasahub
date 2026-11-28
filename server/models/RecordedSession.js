const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 3000 },
  // A calendar date, not a timestamp: students in different timezones see the same class date.
  sessionDate: { type: String, required: true },
  videoUrl: { type: String, required: true, maxlength: 2048 },
  allowedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
schema.index({ allowedStudents: 1, sessionDate: -1 });
module.exports = mongoose.model('RecordedSession', schema);
