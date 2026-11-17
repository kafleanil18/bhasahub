const express = require('express');
const mongoose = require('mongoose');
const { createHash } = require('crypto');
const rateLimit = require('express-rate-limit');
const PinyinRecording = require('../models/PinyinRecording');
const TonePairAudio = require('../models/TonePairAudio');
const Activity = require('../models/StudioActivity');
const pairCatalog = require('../data/tonePairs.json');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');
const { logActivity } = require('../utils/auditLog');
const { audioUpload, audioUploadErrors } = require('../utils/audioUpload');
const router = express.Router();
const limiter = rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many recordings saved. Please wait before saving another.' },
});
const pairs = new Map(pairCatalog.pairs.map(pair => [pair.id, pair]));
const validTone = tone => Number.isInteger(tone) && tone >= 1 && tone <= 4;

// First checked answer is retained across repeated rounds and concurrent requests.
async function saveFirstAnswer(userId, itemKey, fields) {
  const eventId = createHash('sha256').update(JSON.stringify(['tones', itemKey])).digest('hex');
  try {
    await Activity.updateOne({ user: userId, eventId }, { $setOnInsert: { studio: 'tones', itemKey, ...fields } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}

router.get('/questions', requireAuth, async (req, res) => {
  try {
    const questions = await PinyinRecording.find({ tone: { $in: [1, 2, 3, 4] }, audioUrl: { $regex: '\\S' } }).select('_id syllable audioUrl').lean();
    res.json({ questions });
  } catch { res.status(500).json({ error: 'Could not load tone recordings. Please try again.' }); }
});

router.post('/answer', requireAuth, limiter, async (req, res) => {
  const { recordingId, selectedTone } = req.body;
  if (!mongoose.isObjectIdOrHexString(recordingId) || !validTone(selectedTone)) {
    return res.status(400).json({ error: 'Choose a recording and one of the four tones.' });
  }
  try {
    const recording = await PinyinRecording.findById(recordingId).select('syllable tone audioUrl');
    if (!recording?.audioUrl?.trim() || ![1, 2, 3, 4].includes(recording.tone)) return res.status(404).json({ error: 'This recording is no longer available. Skip it or start a new round.' });
    const correct = selectedTone === recording.tone;
    const itemKey = String(recording._id);
    await saveFirstAnswer(req.user.id, itemKey, { correct, targetTone: recording.tone, selectedTone });
    res.json({ recordingId: itemKey, syllable: recording.syllable, selectedTone, correctTone: recording.tone, correct });
  } catch { res.status(500).json({ error: 'Could not check and save your answer. Please try again.' }); }
});

// Students get the word and toneless syllables only; tones are revealed by /pairs/answer.
router.get('/pairs', requireAuth, async (req, res) => {
  try {
    const recordings = await TonePairAudio.find().select('pairId audioUrl').lean();
    const audio = new Map(recordings.map(recording => [recording.pairId, recording.audioUrl]));
    const admin = ['admin', 'superadmin'].includes(req.user.role);
    res.json({ pairs: pairCatalog.pairs.map(pair => ({
      id: pair.id, hanzi: pair.hanzi, syllables: pair.syllables, english: pair.english, audioUrl: audio.get(pair.id) || '',
      // Lets students focus a round on 3rd-tone, 不 and 一 words without revealing the tones.
      toneRule: Boolean(pair.rule),
      ...(admin ? { pinyin: pair.pinyin, writtenPinyin: pair.writtenPinyin, rule: pair.rule } : {}),
    })) });
  } catch { res.status(500).json({ error: 'Could not load tone pairs. Please try again.' }); }
});

router.post('/pairs/answer', requireAuth, limiter, async (req, res) => {
  const { pairId, selectedTones } = req.body;
  const pair = typeof pairId === 'string' ? pairs.get(pairId) : undefined;
  if (!Array.isArray(selectedTones) || selectedTones.length !== 2 || !selectedTones.every(validTone)) {
    return res.status(400).json({ error: 'Choose a tone for both syllables.' });
  }
  if (!pair) return res.status(404).json({ error: 'This word is no longer available. Skip it or start a new round.' });
  try {
    const correct = selectedTones.every((tone, index) => tone === pair.tones[index]);
    await saveFirstAnswer(req.user.id, `pair:${pair.id}`, { correct, targetTones: pair.tones, selectedTones });
    res.json({
      pairId: pair.id, hanzi: pair.hanzi, english: pair.english, pinyin: pair.pinyin, writtenPinyin: pair.writtenPinyin || null,
      rule: pair.rule, toneChange: pair.writtenTones.some((tone, index) => tone !== pair.tones[index]),
      selectedTones, correctTones: pair.tones, correct,
    });
  } catch { res.status(500).json({ error: 'Could not check and save your answer. Please try again.' }); }
});

function knownPair(req, res, next) {
  if (!pairs.has(req.params.id)) return res.status(404).json({ error: 'Word not found' });
  next();
}

router.post('/pairs/:id/audio', requireAuth, requireSuperAdmin, knownPair, uploadLimiter, audioUpload.single('recording'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Record audio before saving.' });
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'bhashahub/tone-pairs');
    const recording = await TonePairAudio.findOneAndUpdate(
      { pairId: req.params.id },
      { $set: { audioUrl: result.secure_url, uploadedBy: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    logActivity(req, { action: 'record', resourceType: 'tone-pair-audio', resourceId: recording._id, label: pairs.get(req.params.id).hanzi });
    res.status(201).json({ pairId: recording.pairId, audioUrl: recording.audioUrl });
  } catch {
    res.status(502).json({ error: 'Could not save the recording. Please try saving again.' });
  }
});

router.delete('/pairs/:id/audio', requireAuth, requireSuperAdmin, knownPair, async (req, res) => {
  try {
    await TonePairAudio.deleteOne({ pairId: req.params.id });
    logActivity(req, { action: 'delete', resourceType: 'tone-pair-audio', resourceId: req.params.id, label: pairs.get(req.params.id).hanzi });
    res.json({ pairId: req.params.id, audioUrl: '' });
  } catch {
    res.status(500).json({ error: 'Could not remove this recording. Please try again.' });
  }
});

router.use(audioUploadErrors);
module.exports = router;
