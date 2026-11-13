const express = require('express');
const mongoose = require('mongoose');
const { createHash } = require('crypto');
const rateLimit = require('express-rate-limit');
const PinyinRecording = require('../models/PinyinRecording');
const Activity = require('../models/StudioActivity');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const limiter = rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false });

router.get('/questions', requireAuth, async (req, res) => {
  try {
    const questions = await PinyinRecording.find({ tone: { $in: [1, 2, 3, 4] }, audioUrl: { $regex: '\\S' } }).select('_id syllable audioUrl').lean();
    res.json({ questions });
  } catch { res.status(500).json({ error: 'Could not load tone recordings. Please try again.' }); }
});

router.post('/answer', requireAuth, limiter, async (req, res) => {
  const { recordingId, selectedTone } = req.body;
  if (!mongoose.isObjectIdOrHexString(recordingId) || !Number.isInteger(selectedTone) || selectedTone < 1 || selectedTone > 4) {
    return res.status(400).json({ error: 'Choose a recording and one of the four tones.' });
  }
  try {
    const recording = await PinyinRecording.findById(recordingId).select('syllable tone audioUrl');
    if (!recording?.audioUrl?.trim() || ![1, 2, 3, 4].includes(recording.tone)) return res.status(404).json({ error: 'This recording is no longer available. Skip it or start a new round.' });
    const correct = selectedTone === recording.tone;
    const itemKey = String(recording._id);
    const eventId = createHash('sha256').update(JSON.stringify(['tones', itemKey])).digest('hex');
    // First checked answer is retained across repeated rounds and concurrent requests.
    try {
      await Activity.updateOne({ user: req.user.id, eventId }, { $setOnInsert: { studio: 'tones', itemKey, correct, targetTone: recording.tone, selectedTone } }, { upsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    res.json({ recordingId: itemKey, syllable: recording.syllable, selectedTone, correctTone: recording.tone, correct });
  } catch { res.status(500).json({ error: 'Could not check and save your answer. Please try again.' }); }
});
module.exports = router;
