const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SentenceAudio = require('../models/SentenceAudio');
const AuditLog = require('../models/AuditLog');
const cloud = require('../utils/cloudinary');
const catalog = require('../data/hsk1Sentences.json');

const restorations = [];
const servers = [];
function mock(object, key, value) {
  const original = object[key]; object[key] = value;
  restorations.push(() => { object[key] = original; });
}
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  restorations.reverse().forEach(restore => restore()); restorations.length = 0;
});
async function setup(role = 'superadmin') {
  mock(process.env, 'JWT_SECRET', 'sentence-test-secret');
  mock(User, 'findById', () => ({ select: async () => ({ _id: '507f1f77bcf86cd799439011', role }) }));
  mock(AuditLog, 'create', async () => ({}));
  let stored = [];
  mock(SentenceAudio, 'find', () => ({ select: async () => stored }));
  mock(SentenceAudio, 'findOneAndUpdate', async (filter, update, options) => {
    assert.equal(options.upsert, true);
    assert.equal(options.runValidators, true);
    const recording = { _id: 'recording', sentenceId: filter.sentenceId, ...update.$set };
    stored = [recording];
    return recording;
  });
  mock(SentenceAudio, 'deleteOne', async filter => { stored = stored.filter(item => item.sentenceId !== filter.sentenceId); return { deletedCount: 1 }; });
  let uploads = 0;
  mock(cloud, 'uploadBufferToCloudinary', async (buffer, folder) => {
    uploads++;
    assert.ok(buffer.length);
    assert.equal(folder, 'bhashahub/sentences');
    return { secure_url: 'https://res.cloudinary.com/test/video/upload/sentence.mp3' };
  });
  delete require.cache[require.resolve('../routes/sentences')];
  const app = express();
  app.use('/api/sentences', require('../routes/sentences'));
  const server = await new Promise((resolve, reject) => {
    const listening = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve(listening));
    listening.on('error', reject);
  });
  servers.push(server);
  const base = `http://127.0.0.1:${server.address().port}/api/sentences`;
  const headers = { Authorization: `Bearer ${jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET)}` };
  return { base, headers, uploads: () => uploads };
}
function audioForm(type = 'audio/webm', name = 'sentence.webm', size = 16) {
  const body = new FormData();
  body.append('recording', new Blob([new Uint8Array(size)], { type }), name);
  return body;
}

test('super admin saves microphone recordings, replaces them, and removes sentence audio', async () => {
  const { base, headers, uploads } = await setup();
  let result = await fetch(base, { headers });
  let data = await result.json();
  assert.equal(data.sentences.length, 1300);
  assert.equal(data.topics.length, 60);
  assert.equal(data.sentences[0].audioUrl, '');
  for (let i = 0; i < 2; i++) {
    result = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', headers, body: audioForm() });
    assert.equal(result.status, 201);
    assert.equal((await result.json()).sentenceId, 'hsk1-001');
  }
  assert.equal(uploads(), 2);
  data = await (await fetch(base, { headers })).json();
  assert.match(data.sentences[0].audioUrl, /^https:\/\/res.cloudinary.com/);
  assert.deepEqual(data.sentences[0].tokens, catalog.sentences[0].tokens);
  result = await fetch(`${base}/hsk1-001/audio`, { method: 'DELETE', headers });
  assert.equal(result.status, 200);
  data = await (await fetch(base, { headers })).json();
  assert.equal(data.sentences[0].audioUrl, '');
  assert.equal(data.sentences.length, 1300);
});

test('anonymous users, students, and ordinary admins cannot change sentence audio', async () => {
  for (const role of ['student', 'admin']) {
    const { base, headers, uploads } = await setup(role);
    for (const method of ['POST', 'DELETE']) {
      const response = await fetch(`${base}/hsk1-001/audio`, { method, headers, ...(method === 'POST' ? { body: audioForm() } : {}) });
      assert.equal(response.status, 403);
    }
    const anonymous = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', body: audioForm() });
    assert.equal(anonymous.status, 401);
    assert.equal(uploads(), 0);
  }
});

test('unknown sentences, missing files, non-audio files, and oversized files are rejected before storage', async () => {
  const { base, headers, uploads } = await setup();
  let response = await fetch(`${base}/hsk1-9999/audio`, { method: 'POST', headers, body: audioForm() });
  assert.equal(response.status, 404);
  response = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', headers });
  assert.equal(response.status, 400);
  for (const [type, name] of [['text/plain', 'fake.mp3'], ['audio/mpeg', 'file.exe']]) {
    response = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', headers, body: audioForm(type, name) });
    assert.equal(response.status, 400);
  }
  response = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', headers, body: audioForm('audio/webm', 'large.webm', 16 * 1024 * 1024) });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /15 MB/);
  assert.equal(uploads(), 0);
});

test('a failed upload leaves the previously saved recording available', async () => {
  const { base, headers } = await setup();
  const before = 'https://res.cloudinary.com/test/video/upload/existing.mp3';
  mock(SentenceAudio, 'find', () => ({ select: async () => [{ sentenceId: 'hsk1-001', audioUrl: before }] }));
  mock(SentenceAudio, 'findOneAndUpdate', () => assert.fail('failed uploads must not replace the database record'));
  mock(cloud, 'uploadBufferToCloudinary', async () => { throw new Error('provider unavailable'); });
  // Reload the router so the handler captures the failing provider.
  delete require.cache[require.resolve('../routes/sentences')];
  const handler = require('../routes/sentences').stack.find(layer => layer.route?.methods.post).route.stack.at(-1).handle;
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ user: { id: 'superadmin' }, params: { id: 'hsk1-001' }, file: { buffer: Buffer.from('audio') } }, res);
  assert.equal(res.code, 502);
  assert.equal((await (await fetch(base, { headers })).json()).sentences[0].audioUrl, before);
});


test('browser WebM, MP4, and OGG recordings can be saved; legacy file uploads are rejected', async () => {
  const { base, headers, uploads } = await setup();
  for (const [type, name] of [['audio/webm;codecs=opus', 'recording.webm'], ['audio/mp4', 'recording.m4a'], ['audio/ogg;codecs=opus', 'recording.ogg']]) {
    const response = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', headers, body: audioForm(type, name) });
    assert.equal(response.status, 201);
  }
  const legacy = new FormData();
  legacy.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'old.webm');
  const response = await fetch(`${base}/hsk1-001/audio`, { method: 'POST', headers, body: legacy });
  assert.equal(response.status, 400);
  assert.equal(uploads(), 3);
});

test('new four-digit sentence IDs support microphone recordings and appear in the catalog', async () => {
  const { base, headers } = await setup();
  const saved = await fetch(`${base}/hsk1-1300/audio`, { method: 'POST', headers, body: audioForm() });
  assert.equal(saved.status, 201);
  assert.equal((await saved.json()).sentenceId, 'hsk1-1300');
  const data = await (await fetch(base, { headers })).json();
  const sentence = data.sentences.find(row => row.id === 'hsk1-1300');
  assert.ok(sentence.audioUrl);
  assert.equal(sentence.number, 1300);
  assert.ok(sentence.tokenPinyin.length);
  assert.equal(data.sentences[0].audioUrl, '');
});


test('sentence catalog requires a valid session and is available to every signed-in role', async () => {
  for (const role of ['student', 'admin', 'superadmin']) {
    const { base, headers } = await setup(role);
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
    const response = await fetch(base, { headers });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).sentences.length, 1300);
  }
});
