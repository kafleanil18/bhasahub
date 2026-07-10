const express = require('express');
const Feedback = require('../models/Feedback');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback — anyone can send feedback
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'A message is required' });
    }
    await Feedback.create({ name, email, message });
    res.status(201).json({ message: 'Feedback received' });
  } catch {
    res.status(500).json({ error: 'Could not send feedback' });
  }
});

// GET /api/feedback — admin: list all feedback (newest first)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Could not load feedback' });
  }
});

// PUT /api/feedback/:id/read — admin: mark as read
router.put('/:id/read', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked read' });
  } catch {
    res.status(500).json({ error: 'Could not update' });
  }
});

// DELETE /api/feedback/:id — admin: delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete' });
  }
});

module.exports = router;