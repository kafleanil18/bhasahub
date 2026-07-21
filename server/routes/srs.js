const express = require('express');
const VocabSchedule = require('../models/VocabSchedule');
const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LIMIT = 50;

// applies the SM-2 update in place given a review quality (0-5)
function applySm2(schedule, quality) {
  if (quality < 3) {
    schedule.repetitions = 0;
    schedule.intervalDays = 1;
  } else {
    if (schedule.repetitions === 0) schedule.intervalDays = 1;
    else if (schedule.repetitions === 1) schedule.intervalDays = 6;
    else schedule.intervalDays = Math.round(schedule.intervalDays * schedule.easeFactor);
    schedule.repetitions += 1;
  }

  const nextEase =
    schedule.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  schedule.easeFactor = Math.max(1.3, nextEase);

  schedule.lastReviewedAt = new Date();
  schedule.dueDate = new Date(Date.now() + schedule.intervalDays * DAY_MS);
}

function toCard(schedule, vocab) {
  const word = vocab || schedule.vocabulary;
  return {
    vocabularyId: word._id,
    word: word.word,
    pronunciation: word.pronunciation,
    meaning: word.meaning,
    audioUrl: word.audioUrl,
    scheduleId: schedule ? schedule._id : null,
    easeFactor: schedule ? schedule.easeFactor : 2.5,
    intervalDays: schedule ? schedule.intervalDays : 0,
    repetitions: schedule ? schedule.repetitions : 0,
    dueDate: schedule ? schedule.dueDate : null,
    isNew: !schedule,
  };
}

// GET /api/srs/due?lessonId=&limit= — cards due (plus new cards to fill the queue)
router.get('/due', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, MAX_LIMIT);
    const lessonFilter = req.query.lessonId ? { lesson: req.query.lessonId } : {};

    const dueSchedules = await VocabSchedule.find({
      user: req.user.id,
      dueDate: { $lte: new Date() },
      ...lessonFilter,
    })
      .populate('vocabulary')
      .sort({ dueDate: 1 })
      .limit(limit);

    const dueCards = dueSchedules
      .filter((s) => s.vocabulary) // vocabulary may have been deleted
      .map((s) => toCard(s));

    let newCards = [];
    let newCount = 0;
    if (req.query.lessonId) {
      const scheduledVocabIds = await VocabSchedule.find({
        user: req.user.id,
        lesson: req.query.lessonId,
      }).distinct('vocabulary');

      const unscheduledVocab = await Vocabulary.find({
        lesson: req.query.lessonId,
        _id: { $nin: scheduledVocabIds },
      }).sort({ order: 1 });

      newCount = unscheduledVocab.length;
      if (dueCards.length < limit) {
        newCards = unscheduledVocab.slice(0, limit - dueCards.length).map((v) => toCard(null, v));
      }
    }

    res.json({
      cards: [...dueCards, ...newCards],
      dueCount: dueCards.length,
      newCount,
    });
  } catch (err) {
    console.error('Load due cards error:', err);
    res.status(500).json({ error: 'Could not load review queue' });
  }
});

// POST /api/srs/review — grade a card and reschedule it via SM-2
router.post('/review', requireAuth, async (req, res) => {
  try {
    const { vocabularyId, quality } = req.body;
    if (![0, 3, 4, 5].includes(quality)) {
      return res.status(400).json({ error: 'Invalid quality grade' });
    }

    let schedule = await VocabSchedule.findOne({ user: req.user.id, vocabulary: vocabularyId });

    if (!schedule) {
      const vocab = await Vocabulary.findById(vocabularyId);
      if (!vocab) return res.status(404).json({ error: 'Vocabulary word not found' });
      const lesson = await Lesson.findById(vocab.lesson);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      try {
        schedule = await VocabSchedule.create({
          user: req.user.id,
          vocabulary: vocab._id,
          lesson: lesson._id,
          course: lesson.course,
        });
      } catch (e) {
        if (e.code === 11000) {
          schedule = await VocabSchedule.findOne({ user: req.user.id, vocabulary: vocabularyId });
        } else throw e;
      }
    }

    applySm2(schedule, quality);
    await schedule.save();

    const vocab = await Vocabulary.findById(schedule.vocabulary);
    res.json(toCard(schedule, vocab));
  } catch (err) {
    console.error('Review card error:', err);
    res.status(500).json({ error: 'Could not save review' });
  }
});

module.exports = router;
