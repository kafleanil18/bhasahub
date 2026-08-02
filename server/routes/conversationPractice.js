const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');
const ConversationRecording = require('../models/ConversationRecording');

const router = express.Router();

const recordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many uploads — please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Kept in memory just long enough to stream to Cloudinary — never written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photo' && file.mimetype.startsWith('image/')) return cb(null, true);
    if (file.fieldname === 'audio' && file.mimetype.startsWith('audio/')) return cb(null, true);
    cb(new Error('Only image and audio files are allowed'));
  },
});

// GET /api/conversation-practice/recordings?topic=xxx — the current user's own recordings
router.get('/recordings', requireAuth, async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.topic) filter.topic = req.query.topic;
    const recordings = await ConversationRecording.find(filter).sort('-createdAt');
    res.json(recordings);
  } catch {
    res.status(500).json({ error: 'Could not load your recordings' });
  }
});

// POST /api/conversation-practice/recordings — save a voice recording (photo optional) for a topic
router.post(
  '/recordings',
  requireAuth,
  recordLimiter,
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'photo', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { topic } = req.body;
      if (!ConversationRecording.TOPIC_IDS.includes(topic)) {
        return res.status(400).json({ error: 'Unknown topic' });
      }
      const audioFile = req.files?.audio?.[0];
      const photoFile = req.files?.photo?.[0];
      if (!audioFile) return res.status(400).json({ error: 'A voice recording is required' });

      const turnIndex = Number.isInteger(Number(req.body.turnIndex)) && req.body.turnIndex !== undefined
        ? Number(req.body.turnIndex)
        : undefined;

      const [audioResult, photoResult] = await Promise.all([
        uploadBufferToCloudinary(audioFile.buffer),
        photoFile ? uploadBufferToCloudinary(photoFile.buffer) : Promise.resolve(null),
      ]);

      const recording = await ConversationRecording.create({
        user: req.user.id,
        topic,
        turnIndex,
        audioUrl: audioResult.secure_url,
        photoUrl: photoResult?.secure_url,
      });
      res.status(201).json(recording);
    } catch (err) {
      console.error('Save conversation recording error:', err);
      res.status(500).json({ error: err.message || 'Could not save your recording' });
    }
  }
);

// DELETE /api/conversation-practice/recordings/:id — only the owner may delete
router.delete('/recordings/:id', requireAuth, async (req, res) => {
  try {
    const recording = await ConversationRecording.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!recording) return res.status(404).json({ error: 'Recording not found' });
    res.json({ message: 'Recording deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete the recording' });
  }
});

// Friendly error handler (file too big, wrong type)
router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed' });
});

module.exports = router;
