const express = require('express');
const Attempt = require('../models/Attempt');
const Lesson = require('../models/Lesson');
const Test = require('../models/Test');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/attempts/quiz — record a finished vocabulary quiz
router.post('/quiz', requireAuth, async (req, res) => {
  try {
    const { lessonId, score, total, missedVocabularyIds } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const attempt = await Attempt.create({
      user: req.user.id,
      type: 'vocab-quiz',
      lesson: lesson._id,
      course: lesson.course,
      score,
      total,
      missedVocabulary: missedVocabularyIds || [],
    });
    res.status(201).json(attempt);
  } catch (err) {
    console.error('Save quiz attempt error:', err);
    res.status(500).json({ error: 'Could not save quiz attempt' });
  }
});

// POST /api/attempts/test — record a finished listening/reading test
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { testId, score, total } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const attempt = await Attempt.create({
      user: req.user.id,
      type: 'test',
      test: test._id,
      score,
      total,
    });
    res.status(201).json(attempt);
  } catch (err) {
    console.error('Save test attempt error:', err);
    res.status(500).json({ error: 'Could not save test attempt' });
  }
});

module.exports = router;
