const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  method: { type: String, enum: ['email', 'google'], required: true },
  signedInAt: { type: Date, default: Date.now, required: true },
});
schema.index({ signedInAt: -1, student: 1 });
module.exports = mongoose.model('StudentSignIn', schema);
