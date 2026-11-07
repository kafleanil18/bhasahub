const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { cloudinary, uploadFileToCloudinary } = require('../utils/cloudinary');

test('Cloudinary uploads stream disk files using bounded chunks and preserve provider results', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-test-'));
  const filePath = path.join(directory, 'fixture.mp4');
  const original = cloudinary.uploader.upload_chunked_stream;
  try {
    await fs.writeFile(filePath, 'stream fixture');
    let bytes = 0;
    cloudinary.uploader.upload_chunked_stream = (options, done) => {
      assert.equal(options.resource_type, 'auto');
      assert.equal(options.chunk_size, 6 * 1024 * 1024);
      assert.equal(options.timeout, 120000);
      assert.equal(options.folder, 'bhashahub');
      return new Writable({
        write(chunk, encoding, next) { bytes += chunk.length; next(); },
        final(next) { done(null, { secure_url: 'https://example.com/video' }); next(); },
      });
    };
    assert.deepEqual(await uploadFileToCloudinary(filePath), { secure_url: 'https://example.com/video' });
    assert.equal(bytes, Buffer.byteLength('stream fixture'));
    await assert.rejects(uploadFileToCloudinary(path.join(directory, 'missing')), { code: 'ENOENT' });
    cloudinary.uploader.upload_chunked_stream = (options, done) => new Writable({
      write(chunk, encoding, next) { const error = new Error('Provider unavailable'); done(error); next(error); },
    });
    await assert.rejects(uploadFileToCloudinary(filePath), /Provider unavailable/);
  } finally {
    cloudinary.uploader.upload_chunked_stream = original;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
