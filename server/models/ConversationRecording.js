const mongoose = require('mongoose');

// Keep in sync with TOPICS in client/src/ConversationPractice.jsx
const TOPIC_IDS = ['introduction', 'restaurant', 'shopping', 'directions', 'taxi', 'hotel', 'phone', 'friend'];

const conversationRecordingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true, enum: TOPIC_IDS },
    turnIndex: { type: Number },
    photoUrl: { type: String },
    audioUrl: { type: String, required: true },
  },
  { timestamps: true }
);

conversationRecordingSchema.index({ user: 1, topic: 1, createdAt: -1 });

module.exports = mongoose.model('ConversationRecording', conversationRecordingSchema);
module.exports.TOPIC_IDS = TOPIC_IDS;
