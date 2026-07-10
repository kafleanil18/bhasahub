const express = require('express');
const Testimonial = require('../models/Testimonial');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/testimonials — public: approved only, newest first
router.get('/', async (req, res) => {
  try {
    const items = await Testimonial.find({ approved: true }).sort({ createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Could not load testimonials' });
  }
});

// GET /api/testimonials/all — admin: everything, pending first
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = await Testimonial.find().sort({ approved: 1, createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Could not load testimonials' });
  }
});

// POST /api/testimonials — logged-in users submit (saved as pending)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, text, rating, photo } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'Name and testimonial text are required' });
    }
    await Testimonial.create({
      name, text, rating: rating || 5, photo: photo || '',
      user: req.user.id, approved: false,
    });
    res.status(201).json({ message: 'Thank you! Your testimonial is awaiting approval.' });
  } catch {
    res.status(500).json({ error: 'Could not submit testimonial' });
  }
});

// PUT /api/testimonials/:id/approve — admin: approve
router.put('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Testimonial.findByIdAndUpdate(req.params.id, { approved: true });
    res.json({ message: 'Approved' });
  } catch {
    res.status(500).json({ error: 'Could not approve' });
  }
});

// DELETE /api/testimonials/:id — admin: delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete' });
  }
});

module.exports = router;