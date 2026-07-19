const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: ['founder', 'developer', 'pm'] },
    photo: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeamMember', teamMemberSchema);
