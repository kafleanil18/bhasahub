const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Reads CLOUDINARY_URL (cloudinary://key:secret@cloud_name) from env automatically.
cloudinary.config({ secure: true });

// Keep the file in memory just long enough to stream it to Cloudinary —
// nothing is written to local disk, so uploads survive restarts/redeploys.
const storage = multer.memoryStorage();

// Allow audio, image, PDF, and video files, max 200 MB (videos need more room)
const upload = multer({
  storage,
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

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'bhashahub' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

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
  } catch (err) {
    res.status(502).json({ error: err.message || 'Upload to storage failed' });
  }
});

// Friendly error handler (file too big, wrong type)
router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed' });
});

module.exports = router;
