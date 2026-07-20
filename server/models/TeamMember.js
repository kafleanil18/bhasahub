const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    photo: { type: String, default: '' },
    offsetX: { type: Number, default: 50 },
    offsetY: { type: Number, default: 50 },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    bio: { type: String, default: '' },
    scale: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeamMember', teamMemberSchema);
