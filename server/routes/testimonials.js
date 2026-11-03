const express = require('express');
const multer = require('multer');
const path = require('path');
const Testimonial = require('../models/Testimonial');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');

const router = express.Router();
const testimonialPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    if (allowedTypes.has(file.mimetype) && allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      return callback(null, true);
    }
    callback(new Error('Please upload a JPG, PNG, WEBP, or GIF image.'));
  },
});

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

// POST /api/testimonials/photo — logged-in students can upload a testimonial image
router.post('/photo', requireAuth, testimonialPhotoUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'bhashahub/testimonials');
    res.status(201).json({ url: result.secure_url });
  } catch {
    res.status(500).json({ error: 'Photo upload failed. Please try again.' });
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
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (testimonial) {
      logActivity(req, { action: 'approve', resourceType: 'testimonial', resourceId: testimonial._id, label: testimonial.name });
    }
    res.json({ message: 'Approved' });
  } catch {
    res.status(500).json({ error: 'Could not approve' });
  }
});

// DELETE /api/testimonials/:id — admin: delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (testimonial) {
      logActivity(req, { action: 'delete', resourceType: 'testimonial', resourceId: testimonial._id, label: testimonial.name });
    }
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete' });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Images must be 5 MB or smaller.' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Could not process that image. Please try another.' });
  }
  if (err) return res.status(400).json({ error: err.message || 'Could not upload that image.' });
  next();
});

module.exports = router;
