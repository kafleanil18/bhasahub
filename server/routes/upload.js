const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Allow audio, image, PDF, and video files, max 200 MB (videos need more room)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.m4a', '.wav', '.ogg', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// POST /api/upload — admin only, one file under the field name "file"
router.post('/', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }
  try {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    res.status(201).json({
      url: result.secure_url,
      originalName: req.file.originalname,
    });
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Friendly error handler (file too big, wrong type)
router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed' });
});

module.exports = router;
