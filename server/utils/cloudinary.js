require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { createReadStream } = require('node:fs');
const { pipeline } = require('node:stream');

// Reads CLOUDINARY_URL (cloudinary://key:secret@cloud_name) from env automatically.
cloudinary.config({ secure: true });

function uploadBufferToCloudinary(buffer, folder = 'bhashahub') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Local file paths are read as a stream; at most one 6 MB chunk is assembled
// per upload instead of holding the complete (up to 200 MB) file in memory.
function uploadFileToCloudinary(filePath, folder = 'bhashahub') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_chunked_stream({
      resource_type: 'auto', folder, chunk_size: 6 * 1024 * 1024, timeout: 120000,
    }, (error, result) => {
      if (error) { stream.destroy(error); reject(error); }
      else resolve(result);
    });
    pipeline(createReadStream(filePath), stream, error => { if (error) reject(error); });
  });
}

module.exports = { cloudinary, uploadBufferToCloudinary, uploadFileToCloudinary };
