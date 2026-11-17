const multer = require('multer');
const path = require('node:path');

// Shared by teacher recording endpoints: microphone recordings or common audio files up to 15 MB.
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, done) {
    const extension = path.extname(file.originalname).toLowerCase();
    const audio = file.mimetype.startsWith('audio/') || file.mimetype === 'application/ogg';
    if (audio && ['.mp3', '.m4a', '.wav', '.ogg', '.webm'].includes(extension)) return done(null, true);
    done(new Error('Could not read the audio recording. Please record it again.'));
  },
});

function audioUploadErrors(err, req, res, next) {
  res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Recordings must be 15 MB or smaller.' : err.message || 'Could not save the recording.' });
}

module.exports = { audioUpload, audioUploadErrors };
