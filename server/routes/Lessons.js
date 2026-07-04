const express = require('express');
const Lesson = require('../models/Lesson');
const Vocabulary = require('../models/Vocabulary');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/lessons/course/:courseId — public: published lessons of a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId, published: true }).sort({ order: 1 });
    res.json(lessons);
  } catch {
    res.status(500).json({ error: 'Could not load lessons' });
  }
});

// GET /api/lessons/course/:courseId/all — admin: all lessons, drafts included
router.get('/course/:courseId/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ order: 1 });
    res.json(lessons);
  } catch {
    res.status(500).json({ error: 'Could not load lessons' });
  }
});

// POST /api/lessons — admin: create a lesson
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { course, title, order, published } = req.body;
    if (!course || !title) {
      return res.status(400).json({ error: 'Course id and title are required' });
    }
    const lesson = await Lesson.create({ course, title, order, published });
    res.status(201).json(lesson);
  } catch {
    res.status(500).json({ error: 'Could not create lesson' });
  }
});

// PUT /api/lessons/:id — admin: update a lesson
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch {
    res.status(500).json({ error: 'Could not update lesson' });
  }
});

// DELETE /api/lessons/:id — admin: delete a lesson AND its vocabulary
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    await Vocabulary.deleteMany({ lesson: req.params.id });
    res.json({ message: 'Lesson and its vocabulary deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete lesson' });
  }
});

// GET /api/lessons/:id/vocabulary — public: words in a lesson
router.get('/:id/vocabulary', async (req, res) => {
  try {
    const words = await Vocabulary.find({ lesson: req.params.id }).sort({ order: 1 });
    res.json(words);
  } catch {
    res.status(500).json({ error: 'Could not load vocabulary' });
  }
});

// POST /api/lessons/:id/vocabulary — admin: add a word to a lesson
router.post('/:id/vocabulary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { word, pronunciation, meaning, order } = req.body;
    if (!word || !pronunciation || !meaning) {
      return res.status(400).json({ error: 'Word, pronunciation and meaning are required' });
    }
    const item = await Vocabulary.create({ lesson: req.params.id, word, pronunciation, meaning, order });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Could not add word' });
  }
});

// DELETE /api/lessons/vocabulary/:vocabId — admin: remove a word
router.delete('/vocabulary/:vocabId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await Vocabulary.findByIdAndDelete(req.params.vocabId);
    if (!item) return res.status(404).json({ error: 'Word not found' });
    res.json({ message: 'Word deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete word' });
  }
});

module.exports = router;