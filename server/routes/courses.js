const express = require('express');
const Course = require('../models/Course');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses — public: published courses only
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ published: true }).sort({ createdAt: 1 });
    res.json(courses);
  } catch {
    res.status(500).json({ error: 'Could not load courses' });
  }
});

// GET /api/courses/all — admin: every course, drafts included
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: 1 });
    res.json(courses);
 } catch (err) {
    console.error('COURSES ERROR:', err);
    res.status(500).json({ error: 'Could not load courses' });
  }
});

// POST /api/courses — admin: create a course
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, language, level, description, glyph, published } = req.body;
    if (!title || !language) {
      return res.status(400).json({ error: 'Title and language are required' });
    }
    const course = await Course.create({ title, language, level, description, glyph, published });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: 'Could not create course' });
  }
});

// PUT /api/courses/:id — admin: update a course
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch {
    res.status(500).json({ error: 'Could not update course' });
  }
});

// DELETE /api/courses/:id — admin: delete a course
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete course' });
  }
});

module.exports = router;