const express = require('express');
const Attempt = require('../models/Attempt');
const Lesson = require('../models/Lesson');
const Test = require('../models/Test');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const Vocabulary = require('../models/Vocabulary');
const { canAccessCourse, isAdmin } = require('../middleware/courseAccess');
const router = express.Router();

// POST /api/attempts/quiz — record a finished vocabulary quiz
router.post('/quiz', requireAuth, async (req, res) => {
  try {
    const { lessonId, answers } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || (!lesson.published && !isAdmin(req.user))) return res.status(404).json({ error: 'Lesson not found' });
    if (!await canAccessCourse(req.user, lesson.course)) return res.status(403).json({ error: 'Active course access required' });
    const words = await Vocabulary.find({ lesson: lessonId });
    if (!words.length || !Array.isArray(answers) || answers.length !== words.length ||
        new Set(answers.map(a => a?.vocabularyId)).size !== words.length ||
        answers.some(a => !a || !words.some(w => String(w._id) === a.vocabularyId) || (a.answer !== null && typeof a.answer !== 'string'))) {
      return res.status(400).json({ error: 'Submit one answer per vocabulary word' });
    }
    const missedVocabularyIds = words.filter(w => answers.find(a => a.vocabularyId === String(w._id)).answer !== w.meaning).map(w => w._id);
    const total = words.length;
    const score = total - missedVocabularyIds.length;

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
router.post('/test', optionalAuth, async (req, res) => {
  try {
    const { testId, answers } = req.body;
    const test = await Test.findById(testId);
    if (!test || (!test.published && !isAdmin(req.user))) return res.status(404).json({ error: 'Test not found' });
    if (!Array.isArray(answers) || answers.length !== test.questions.length ||
        answers.some((a, i) => a !== null && (!Number.isInteger(a) || a < 0 || a >= test.questions[i].options.length))) {
      return res.status(400).json({ error: 'Invalid test answers' });
    }
    const score = test.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const total = test.questions.length;
    const attempt = req.user ? await Attempt.create({ user: req.user.id, type: 'test', test: test._id, score, total }) : { score, total };
    res.status(201).json({ ...(attempt.toObject ? attempt.toObject() : attempt), correctIndices: test.questions.map(q => q.correctIndex) });
  } catch (err) {
    console.error('Save test attempt error:', err);
    res.status(500).json({ error: 'Could not save test attempt' });
  }
});

// GET /api/attempts/test/:testId — the current user's past attempts at a test, oldest first
router.get('/test/:testId', requireAuth, async (req, res) => {
  try {
    const attempts = await Attempt.find({
      user: req.user.id,
      type: 'test',
      test: req.params.testId,
    })
      .sort({ createdAt: 1 })
      .select('score total createdAt');
    res.json(attempts);
  } catch (err) {
    console.error('Fetch test attempt history error:', err);
    res.status(500).json({ error: 'Could not fetch test attempt history' });
  }
});

module.exports = router;
