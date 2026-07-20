const express = require('express');
const Test = require('../models/Test');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tests = await Test.find({ published: true }).sort({ createdAt: -1 });
    res.json(tests);
  } catch {
    res.status(500).json({ error: 'Could not load tests' });
  }
});

router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch {
    res.status(500).json({ error: 'Could not load tests' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch {
    res.status(500).json({ error: 'Could not load test' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const test = await Test.create(req.body);
    logActivity(req, { action: 'create', resourceType: 'test', resourceId: test._id, label: test.title });
    res.status(201).json(test);
  } catch (err) {
    console.error('Create test error:', err);
    res.status(500).json({ error: err.message || 'Could not create test' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: test._id, label: test.title });
    res.json(test);
  } catch (err) {
    console.error('Update test error:', err);
    res.status(500).json({ error: err.message || 'Could not update test' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (test) logActivity(req, { action: 'delete', resourceType: 'test', resourceId: test._id, label: test.title });
    res.json({ message: 'Test deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete test' });
  }
});

module.exports = router;