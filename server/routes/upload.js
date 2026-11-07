const express = require('express');
const multer = require('multer');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs/promises');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadFileToCloudinary } = require('../utils/cloudinary');

const router = express.Router();
// Bound both temporary disk usage and concurrent Cloudinary chunk buffers per process.
const MAX_ACTIVE_UPLOADS = 2;
let activeUploads = 0;
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, done) => done(null, req.uploadDirectory),
    filename: (req, file, done) => done(null, `media${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
  fileFilter: (req, file, done) => {
    const allowed = ['.mp3', '.m4a', '.wav', '.ogg', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.mov'];
    done(allowed.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error('File type not allowed'), true);
  },
}).single('file');

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  if (activeUploads >= MAX_ACTIVE_UPLOADS) {
    res.set('Retry-After', '10');
    return res.status(503).json({ error: 'Uploads are busy. Please try again shortly.' });
  }
  activeUploads += 1;
  let directory;
  try {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'xiao-ao-upload-'));
    req.uploadDirectory = directory;
    await new Promise((resolve, reject) => upload(req, res, error => error ? reject(error) : resolve()));
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    if (req.aborted || res.destroyed) return;
    const result = await uploadFileToCloudinary(req.file.path);
    if (!res.destroyed) res.status(201).json({ url: result.secure_url, originalName: req.file.originalname });
  } catch (error) {
    if (req.aborted || res.destroyed) return;
    if (error instanceof multer.MulterError || error.message === 'File type not allowed') {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 200 MB limit' : error.message });
    } else {
      console.error('Upload failed:', error.message);
      res.status(502).json({ error: 'Could not upload the file. Please try again.' });
    }
  } finally {
    try {
      if (directory) await fs.rm(directory, { recursive: true, force: true });
    } catch (error) {
      console.error('Temporary upload cleanup failed:', error.message);
    } finally {
      activeUploads -= 1;
    }
  }
});

module.exports = router;
