const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fs = require('node:fs/promises');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cloud = require('../utils/cloudinary');
const restore = [];
const servers = [];
function mock(object, key, value) { const old = object[key]; object[key] = value; restore.push(() => { object[key] = old; }); }
afterEach(async () => {
  for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  restore.reverse().forEach(fn => fn()); restore.length = 0;
});
async function setup(provider) {
  mock(process.env, 'JWT_SECRET', 'upload-test-secret');
  mock(User, 'findById', id => ({ select: async () => ({ _id: id, role: id }) }));
  mock(cloud, 'uploadFileToCloudinary', provider);
  delete require.cache[require.resolve('../routes/upload')];
  const app = express(); app.use('/upload', require('../routes/upload'));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  servers.push(server);
  return (name = 'picture.png', role = 'admin', extra = false) => {
    const body = new FormData(); body.append('file', new Blob(['upload fixture']), name);
    if (extra) body.append('file', new Blob(['second']), 'second.png');
    return fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST', body, headers: { Authorization: `Bearer ${jwt.sign({ id: role }, 'upload-test-secret')}` },
    });
  };
}
async function cleaned(filePath) {
  // Response delivery can precede asynchronous finally cleanup.
  for (let attempt = 0; attempt < 50; attempt++) {
    try { await fs.access(filePath); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('Temporary upload was not removed');
}

test('upload sends a disk path, preserves the response, and removes temporary files', async () => {
  let uploadedPath;
  const post = await setup(async filePath => {
    uploadedPath = filePath;
    assert.equal(await fs.readFile(filePath, 'utf8'), 'upload fixture');
    return { secure_url: 'https://example.com/media' };
  });
  const response = await post();
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { url: 'https://example.com/media', originalName: 'picture.png' });
  await cleaned(uploadedPath);
});

test('provider failures clean temporary files and do not expose provider details', async () => {
  let uploadedPath;
  const post = await setup(async filePath => { uploadedPath = filePath; throw new Error('private provider detail'); });
  const response = await post();
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('private provider detail'), false);
  await cleaned(uploadedPath);
});

test('rejects students, unsupported extensions, and multiple files before provider upload', async () => {
  const post = await setup(() => assert.fail('Must not call Cloudinary'));
  assert.equal((await post('picture.png', 'student')).status, 403);
  assert.equal((await post('script.exe')).status, 400);
  assert.equal((await post('picture.png', 'admin', true)).status, 400);
});

test('concurrent uploads are bounded and capacity recovers after completion', async () => {
  const pending = [];
  const post = await setup(() => new Promise(resolve => pending.push(resolve)));
  const first = post(); const second = post();
  for (let i = 0; pending.length < 2 && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(pending.length, 2);
  try {
    const busy = await post();
    assert.equal(busy.status, 503);
    assert.equal(busy.headers.get('retry-after'), '10');
  } finally { pending.splice(0).forEach(resolve => resolve({ secure_url: 'https://example.com/media' })); }
  assert.equal((await first).status, 201); assert.equal((await second).status, 201);
  await new Promise(resolve => setTimeout(resolve, 30));
  const third = post();
  for (let i = 0; pending.length < 1 && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(pending.length, 1);
  pending[0]({ secure_url: 'https://example.com/media' });
  assert.equal((await third).status, 201);
});
