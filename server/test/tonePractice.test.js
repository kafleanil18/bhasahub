const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('crypto');
const Recording = require('../models/PinyinRecording');
const Activity = require('../models/StudioActivity');
const router = require('../routes/tonePractice');
const studioRouter = require('../routes/studioActivity');
const handler = (method, path) => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const user = { id: '507f1f77bcf86cd799439011' };
const recording = { _id: '507f1f77bcf86cd799439012', syllable: 'ma', tone: 2, audioUrl: 'https://example.com/ma.mp3' };
afterEach(() => mock.restoreAll());
function recordingQuery(value = recording) { mock.method(Recording, 'findById', () => ({ select: async () => value })); }

test('questions use only four-tone recordings with audio and withhold the answer key', async () => {
  mock.method(Recording, 'find', filter => {
    assert.deepEqual(filter.tone, { $in: [1, 2, 3, 4] });
    assert.deepEqual(filter.audioUrl, { $regex: '\\S' });
    return { select(fields) {
      assert.equal(fields, '_id syllable audioUrl');
      return { lean: async () => [{ _id: recording._id, syllable: 'ma', audioUrl: recording.audioUrl }] };
    } };
  });
  const res = response(); await handler('get', '/questions')({ user }, res);
  assert.equal(res.body.questions[0].tone, undefined);
});

test('answer is graded from the saved recording, ignoring client correctness and identity', async () => {
  recordingQuery(); let saved;
  mock.method(Activity, 'updateOne', async (...args) => { saved = args; return {}; });
  const res = response();
  await handler('post', '/answer')({ user, body: { recordingId: recording._id, selectedTone: 1, correct: true, targetTone: 1, user: 'other' } }, res);
  assert.equal(res.body.correct, false);
  assert.equal(res.body.correctTone, 2);
  assert.deepEqual(saved[0], { user: user.id, eventId: createHash('sha256').update(JSON.stringify(['tones', recording._id])).digest('hex') });
  assert.deepEqual(saved[1].$setOnInsert, { studio: 'tones', itemKey: recording._id, correct: false, targetTone: 2, selectedTone: 1 });
});

test('repeated answers keep the first score and count once, including duplicate-key races', async () => {
  recordingQuery(); const rows = new Map();
  mock.method(Activity, 'updateOne', async (filter, update) => {
    if (rows.has(filter.eventId)) throw Object.assign(new Error('duplicate'), { code: 11000 });
    rows.set(filter.eventId, update.$setOnInsert);
  });
  for (const tone of [1, 2, 2]) {
    const res = response(); await handler('post', '/answer')({ user, body: { recordingId: recording._id, selectedTone: tone } }, res);
    assert.equal(res.code, 200); assert.equal(res.body.correct, tone === 2);
  }
  assert.equal(rows.size, 1); assert.equal([...rows.values()][0].correct, false);
});

test('invalid choices and missing recordings cannot create practice results', async () => {
  let saves = 0;
  mock.method(Activity, 'updateOne', async () => saves++);
  for (const body of [{ recordingId: 'bad', selectedTone: 1 }, ...[0, 5, 1.5, '2', null].map(selectedTone => ({ recordingId: recording._id, selectedTone }))]) {
    const res = response(); await handler('post', '/answer')({ user, body }, res); assert.equal(res.code, 400);
  }
  recordingQuery(null);
  const res = response(); await handler('post', '/answer')({ user, body: { recordingId: recording._id, selectedTone: 2 } }, res);
  assert.equal(res.code, 404); assert.equal(saves, 0);
});

test('saving failures return an error so the student can retry the same question', async () => {
  recordingQuery(); mock.method(Activity, 'updateOne', async () => { throw new Error('offline'); });
  const res = response(); await handler('post', '/answer')({ user, body: { recordingId: recording._id, selectedTone: 2 } }, res);
  assert.equal(res.code, 500); assert.equal(res.body.correctTone, undefined);
});

test('tone answers cannot be fabricated through the generic studio endpoint', async () => {
  const run = studioRouter.stack.find(layer => layer.route?.path === '/' && layer.route.methods.post).route.stack.at(-1).handle;
  const res = response(); await run({ user, body: { studio: 'tones', correct: true, itemKey: recording._id, eventId: '1234567890123456' } }, res);
  assert.equal(res.code, 400);
});
