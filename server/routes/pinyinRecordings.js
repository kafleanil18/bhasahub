const express = require('express');
const PinyinRecording = require('../models/PinyinRecording');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const recordings = await PinyinRecording.find();
    res.json(recordings);
  } catch {
    res.status(500).json({ error: 'Could not load pinyin recordings' });
  }
});

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { syllable, tone, audioUrl } = req.body;
    if (!syllable || !tone || !audioUrl) {
      return res.status(400).json({ error: 'syllable, tone, and audioUrl are required' });
    }
    const recording = await PinyinRecording.findOneAndUpdate(
      { syllable, tone },
      { syllable, tone, audioUrl },
      { new: true, upsert: true }
    );
    res.status(201).json(recording);
  } catch (err) {
    console.error('Save pinyin recording error:', err);
    res.status(500).json({ error: err.message || 'Could not save recording' });
  }
});

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await PinyinRecording.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recording deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete recording' });
  }
});

module.exports = router;
