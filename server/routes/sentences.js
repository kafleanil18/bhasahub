const express = require('express');
const multer = require('multer');
const path = require('node:path');
const rateLimit = require('express-rate-limit');
const catalog = require('../data/hsk1Sentences.json');
const SentenceAudio = require('../models/SentenceAudio');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();
const ids = new Set(catalog.sentences.map(sentence => sentence.id));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, done) {
    const extension = path.extname(file.originalname).toLowerCase();
    const audio = file.mimetype.startsWith('audio/') || file.mimetype === 'application/ogg';
    if (audio && ['.mp3', '.m4a', '.wav', '.ogg', '.webm'].includes(extension)) return done(null, true);
    done(new Error('Could not read the audio recording. Please record it again.'));
  },
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many recordings saved. Please wait before saving another.' },
});

function knownSentence(req, res, next) {
  if (!ids.has(req.params.id)) return res.status(404).json({ error: 'Sentence not found' });
  next();
}

// The catalog ships with the app; only recordings need database storage.
router.get('/', requireAuth, async (req, res) => {
  try {
    const recordings = await SentenceAudio.find().select('sentenceId audioUrl');
    const byId = new Map(recordings.map(recording => [recording.sentenceId, recording.audioUrl]));
    res.json({ ...catalog, sentences: catalog.sentences.map(sentence => ({ ...sentence, audioUrl: byId.get(sentence.id) || '' })) });
  } catch {
    res.status(503).json({ error: 'Could not load sentence practice. Please try again.' });
  }
});

router.post('/:id/audio', requireAuth, requireSuperAdmin, knownSentence, uploadLimiter, upload.single('recording'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Record audio before saving.' });
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'bhashahub/sentences');
    const recording = await SentenceAudio.findOneAndUpdate(
      { sentenceId: req.params.id },
      { $set: { audioUrl: result.secure_url, uploadedBy: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    logActivity(req, { action: 'record', resourceType: 'sentence-audio', resourceId: recording._id, label: req.params.id });
    res.status(201).json({ sentenceId: recording.sentenceId, audioUrl: recording.audioUrl });
  } catch {
    res.status(502).json({ error: 'Could not save the recording. Please try saving again.' });
  }
});

router.delete('/:id/audio', requireAuth, requireSuperAdmin, knownSentence, async (req, res) => {
  try {
    await SentenceAudio.deleteOne({ sentenceId: req.params.id });
    logActivity(req, { action: 'delete', resourceType: 'sentence-audio', resourceId: req.params.id, label: req.params.id });
    res.json({ sentenceId: req.params.id, audioUrl: '' });
  } catch {
    res.status(500).json({ error: 'Could not remove this recording. Please try again.' });
  }
});

router.use((err, req, res, next) => {
  res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Recordings must be 15 MB or smaller.' : err.message || 'Could not save the recording.' });
});

module.exports = router;
