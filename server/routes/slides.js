const express = require('express');
const Slide = require('../models/Slide');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/slides — published slides (for students)
router.get('/', async (req, res) => {
  try {
    const slides = await Slide.find({ published: true }).sort({ createdAt: -1 });
    res.json(slides);
  } catch {
    res.status(500).json({ error: 'Could not load slides' });
  }
});

// GET /api/slides/all — super admin: every slide
router.get('/all', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const slides = await Slide.find().sort({ createdAt: -1 });
    res.json(slides);
  } catch {
    res.status(500).json({ error: 'Could not load slides' });
  }
});

// POST /api/slides — super admin: add
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { title, description, pdfUrl, embedUrl, published } = req.body;
    const resolvedUrl = pdfUrl || embedUrl;
    if (!title || !resolvedUrl) {
      return res.status(400).json({ error: 'Title and PDF URL are required' });
    }
    const slide = await Slide.create({
      title,
      description,
      pdfUrl: resolvedUrl,
      embedUrl: embedUrl || '',
      published,
    });
    res.status(201).json(slide);
  } catch {
    res.status(500).json({ error: 'Could not create slide' });
  }
});

// PUT /api/slides/:id — super admin: update
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.pdfUrl && body.embedUrl) {
      body.pdfUrl = body.embedUrl;
    }
    const slide = await Slide.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!slide) return res.status(404).json({ error: 'Slide not found' });
    res.json(slide);
  } catch {
    res.status(500).json({ error: 'Could not update slide' });
  }
});

// DELETE /api/slides/:id — super admin: delete
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await Slide.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slide deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete slide' });
  }
});

module.exports = router;
