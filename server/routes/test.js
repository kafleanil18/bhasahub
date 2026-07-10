const express = require('express');
const Test = require('../models/Test');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tests — public: published tests only
router.get('/', async (req, res) => {
  try {
    const tests = await Test.find({ published: true }).sort({ createdAt: -1 });
    res.json(tests);
  } catch {
    res.status(500).json({ error: 'Could not load tests' });
  }
});

// GET /api/tests/all — admin: all tests, drafts included
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch {
    res.status(500).json({ error: 'Could not load tests' });
  }
});

// GET /api/tests/:id — one test (public, so students can take it)
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch {
    res.status(500).json({ error: 'Could not load test' });
  }
});

// POST /api/tests — admin: create
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const test = await Test.create(req.body);
    res.status(201).json(test);
  } catch {
    res.status(500).json({ error: 'Could not create test' });
  }
});

// PUT /api/tests/:id — admin: update
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch {
    res.status(500).json({ error: 'Could not update test' });
  }
});

// DELETE /api/tests/:id — admin: delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete test' });
  }
});

module.exports = router;