const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Make sure the uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Tell multer where to save files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}${ext}`);
  },
});

// Allow audio, image, and PDF files, max 25 MB
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.m4a', '.wav', '.ogg', '.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// POST /api/upload — admin only, one file under the field name "file"
router.post('/', requireAuth, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
  });
});

// Friendly error handler (file too big, wrong type)
router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed' });
});

module.exports = router;