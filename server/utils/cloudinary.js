const cloudinary = require('cloudinary').v2;

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

module.exports = { cloudinary, uploadBufferToCloudinary };
