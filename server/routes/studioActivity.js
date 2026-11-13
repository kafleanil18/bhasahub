const express = require('express');
const { createHash } = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Activity = require('../models/StudioActivity');
const HskAttempt = require('../models/HskAttempt');
const Attempt = require('../models/Attempt');
const PracticePaper = require('../models/PracticePaper');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const limiter = rateLimit({ windowMs: 60000, max: 180, standardHeaders: true, legacyHeaders: false });

router.post('/', requireAuth, limiter, async (req, res) => {
  const { studio, eventId, correct, itemKey } = req.body;
  const validItem = studio === 'pinyin' ? typeof itemKey === 'string' && /^[a-züêv]{1,20}$/i.test(itemKey)
    : studio === 'trace' ? typeof itemKey === 'string' && /^\p{Script=Han}$/u.test(itemKey)
      : typeof itemKey === 'string' && itemKey.trim().length > 0 && itemKey.length <= 512 && !/[\u0000-\u001f]/.test(itemKey);
  const graded = ['listening', 'sentences', 'measures', 'numbers', 'dictation'].includes(studio);
  if (studio === 'tones' || !validItem || !Activity.studios.includes(studio) || typeof eventId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(eventId)
    || (graded ? typeof correct !== 'boolean' : correct !== undefined && correct !== null)) {
    return res.status(400).json({ error: 'Invalid studio activity' });
  }
  try {
    const key = studio === 'pinyin' ? itemKey.toLowerCase() : itemKey.trim();
    // The existing unique user/event index also prevents concurrent duplicate answers.
    const uniqueEvent = createHash('sha256').update(JSON.stringify([studio, key])).digest('hex');
    await Activity.updateOne({ user: req.user.id, eventId: uniqueEvent }, { $setOnInsert: { studio, correct: graded ? correct : null, itemKey: key } }, { upsert: true });
    res.status(201).json({ saved: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ saved: true });
    res.status(500).json({ error: 'Could not save practice activity' });
  }
});

router.delete('/:studio', requireAuth, limiter, async (req, res) => {
  if (!Activity.studios.includes(req.params.studio) || req.body?.confirmed !== true) {
    return res.status(400).json({ error: 'Confirm which studio count you want to reset.' });
  }
  try {
    await Activity.deleteMany({ user: req.user.id, studio: req.params.studio });
    res.json({ message: 'Studio count reset. New practice will count again.' });
  } catch {
    res.status(500).json({ error: 'Could not reset your studio count. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = new mongoose.Types.ObjectId(req.user.id);
    const [rows, papers, legacyTests, toneRows] = await Promise.all([
      Activity.aggregate([
        // Older events without a question identity cannot be counted uniquely.
        { $match: { user, itemKey: { $type: 'string' } } },
        { $sort: { createdAt: 1, _id: 1 } },
        { $group: { _id: { studio: '$studio', item: '$itemKey' }, correct: { $first: '$correct' }, lastPracticed: { $max: { $ifNull: ['$updatedAt', '$createdAt'] } } } },
        { $group: { _id: '$_id.studio', activities: { $sum: 1 }, graded: { $sum: { $cond: [{ $ne: ['$correct', null] }, 1, 0] } }, correct: { $sum: { $cond: [{ $eq: ['$correct', true] }, 1, 0] } }, lastPracticed: { $max: '$lastPracticed' } } },
      ]),
      HskAttempt.aggregate([
        { $match: { user } },
        { $group: { _id: '$paper', completed: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } }, unfinished: { $sum: { $cond: [{ $eq: ['$status', 'started'] }, 1, 0] } }, bestScore: { $max: { $cond: [{ $eq: ['$status', 'submitted'] }, '$score', null] } }, score: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, '$score', 0] } }, lastCompleted: { $max: '$submittedAt' } } },
        { $sort: { _id: 1 } },
      ]),
      Attempt.find({ user, type: 'test' }).select('test score total createdAt').populate('test', 'title').sort({ createdAt: -1 }).lean(),
      Activity.aggregate([
        { $match: { user, studio: 'tones', targetTone: { $in: [1, 2, 3, 4] } } },
        { $sort: { createdAt: 1, _id: 1 } },
        { $group: { _id: '$itemKey', correct: { $first: '$correct' }, tone: { $first: '$targetTone' } } },
        { $group: { _id: '$tone', attempted: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } },
      ]),
    ]);
    const customPapers = await PracticePaper.find({ _id: { $in: papers.map(row => row._id) } }).select('_id content.title').lean();
    const studios = Activity.studios.map(studio => {
      const row = rows.find(item => item._id === studio);
      return { studio, activities: row?.activities || 0, graded: row?.graded || 0, correct: row?.correct || 0, accuracy: row?.graded ? Math.round(row.correct / row.graded * 100) : null, lastPracticed: row?.lastPracticed || null };
    });
    const tonePerformance = [1, 2, 3, 4].map(tone => {
      const row = toneRows.find(item => item._id === tone);
      return { tone, attempted: row?.attempted || 0, correct: row?.correct || 0, accuracy: row?.attempted ? Math.round(row.correct / row.attempted * 100) : null };
    });
    res.json({ studios, tonePerformance, hsk: papers.map(row => ({ paper: row._id, title: customPapers.find(paper => paper._id === row._id)?.content?.title || `HSK 1 · ${row._id.toUpperCase()}`, completed: row.completed, unfinished: row.unfinished, bestPercent: row.completed ? Math.round(row.bestScore / 40 * 100) : null, averagePercent: row.completed ? Math.round(row.score / (row.completed * 40) * 100) : null, lastCompleted: row.lastCompleted || null })), otherTests: legacyTests.map(row => ({ id: row._id, title: row.test?.title || 'Archived test', score: row.score, total: row.total, date: row.createdAt })) });
  } catch {
    res.status(500).json({ error: 'Could not load studio analytics' });
  }
});
module.exports = router;
