const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('crypto');
const Activity = require('../models/StudioActivity');
const HskAttempt = require('../models/HskAttempt');
const Attempt = require('../models/Attempt');
const PracticePaper = require('../models/PracticePaper');
const router = require('../routes/studioActivity');
const handler = (method, path) => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const user = { id: '507f1f77bcf86cd799439011' };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
afterEach(() => mock.restoreAll());

test('graded studio activity is bound to the session user and uses idempotent upsert', async () => {
  let saved;
  mock.method(Activity, 'updateOne', async (...args) => { saved = args; });
  const body = { studio: 'sentences', eventId: '12345678-1234-1234-1234-123456789012', correct: true, itemKey: 'sentence-1', user: 'attacker' };
  const res = response();
  await handler('post', '/')({ user, body }, res);
  assert.equal(res.code, 201);
  assert.deepEqual(saved[0], { user: user.id, eventId: createHash('sha256').update(JSON.stringify(['sentences', 'sentence-1'])).digest('hex') });
  assert.deepEqual(saved[1], { $setOnInsert: { studio: 'sentences', correct: true, itemKey: 'sentence-1' } });
  assert.deepEqual(saved[2], { upsert: true });
});

test('invalid studios and fabricated accuracy on ungraded activity are rejected', async () => {
  for (const body of [
    { studio: 'unknown', eventId: '1234567890123456', correct: true },
    { studio: 'trace', eventId: '1234567890123456', correct: true },
    { studio: 'numbers', eventId: '1234567890123456', correct: 1 },
    { studio: 'numbers', eventId: '', correct: true },
  ]) {
    const res = response(); await handler('post', '/')({ user, body }, res);
    assert.equal(res.code, 400);
  }
});

test('ungraded practice records activity without a score; duplicate events succeed', async () => {
  mock.method(Activity, 'updateOne', async (_filter, update) => {
    assert.equal(update.$setOnInsert.correct, null);
    throw Object.assign(new Error('duplicate'), { code: 11000 });
  });
  const res = response();
  await handler('post', '/')({ user, body: { studio: 'pinyin', eventId: '1234567890123456', itemKey: 'ma' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.saved, true);
});

function summaries(rows = [], hsk = []) {
  for (const [model, result] of [[Activity, rows], [HskAttempt, hsk]]) {
    mock.method(model, 'aggregate', async pipeline => {
      assert.equal(String(pipeline[0].$match.user), user.id);
      return result;
    });
  }
  mock.method(Attempt, 'find', filter => {
    assert.equal(String(filter.user), user.id);
    assert.equal(filter.type, 'test');
    const chain = { select() { return chain; }, populate() { return chain; }, sort() { return chain; }, lean: async () => [] }; return chain;
  });
  mock.method(PracticePaper, 'find', () => ({ select: () => ({ lean: async () => [] }) }));
}

test('summary returns all nine studios with accuracy only for graded answers', async () => {
  summaries([{ _id: 'sentences', activities: 4, graded: 4, correct: 3, lastPracticed: '2026-11-12' }], [{ _id: 'h11226', completed: 2, unfinished: 1, bestScore: 36, score: 60, lastCompleted: '2026-11-12' }]);
  const res = response(); await handler('get', '/me')({ user }, res);
  assert.equal(res.body.studios.length, 9);
  assert.equal(res.body.studios.find(row => row.studio === 'sentences').accuracy, 75);
  assert.equal(res.body.studios.find(row => row.studio === 'trace').accuracy, null);
  assert.equal(res.body.hsk[0].bestPercent, 90);
  assert.equal(res.body.hsk[0].averagePercent, 75);
  assert.equal(res.body.hsk[0].completed, 2);
  assert.equal(res.body.hsk[0].unfinished, 1);
});

test('empty history distinguishes no score from zero accuracy', async () => {
  summaries();
  const res = response(); await handler('get', '/me')({ user }, res);
  assert.ok(res.body.studios.every(row => row.activities === 0 && row.accuracy === null));
  assert.deepEqual(res.body.hsk, []);
});

test('database failures report an error instead of empty analytics', async () => {
  summaries();
  mock.method(Activity, 'aggregate', async () => { throw new Error('offline'); });
  const res = response(); await handler('get', '/me')({ user }, res);
  assert.equal(res.code, 500);
});


test('syllables and characters require an item identity and preserve it for unique counting', async () => {
  let item;
  mock.method(Activity, 'updateOne', async (_filter, update) => { item = update.$setOnInsert.itemKey; });
  for (const [studio, itemKey, expected] of [['pinyin', 'MA', 'ma'], ['trace', '中', '中']]) {
    const res = response();
    await handler('post', '/')({ user, body: { studio, itemKey, eventId: '1234567890123456' } }, res);
    assert.equal(res.code, 201);
    assert.equal(item, expected);
  }
  for (const [studio, itemKey] of [['pinyin', undefined], ['trace', undefined], ['trace', '中文'], ['trace', 'stroke'], ['pinyin', 'ma1']]) {
    const res = response();
    await handler('post', '/')({ user, body: { studio, itemKey, eventId: '1234567890123456' } }, res);
    assert.equal(res.code, 400);
  }
});


test('repeat questions with different request IDs keep one count and the first answer across all studios', async () => {
  const saved = new Map();
  mock.method(Activity, 'updateOne', async (filter, update) => {
    const key = `${filter.user}:${filter.eventId}`;
    if (!saved.has(key)) saved.set(key, update.$setOnInsert);
  });
  const items = { pinyin: 'ma', trace: '中', listening: 'vocab-1', sentences: 'sentence-1', measures: 'measure-1', numbers: 'number-1', dictation: 'sentence-1', conversation: '你好' };
  for (const [studio, itemKey] of Object.entries(items)) {
    for (const [index, correct] of [false, true].entries()) {
      const res = response();
      await handler('post', '/')({ user, body: { studio, itemKey, eventId: `123456789012345${index}`, correct: ['pinyin', 'trace', 'conversation'].includes(studio) ? null : correct } }, res);
      assert.equal(res.code, 201);
    }
  }
  assert.equal(saved.size, 8);
  assert.equal([...saved.values()].find(row => row.studio === 'sentences').correct, false);
});

test('reset requires explicit confirmation and only deletes the signed-in user’s chosen studio', async () => {
  let filter;
  mock.method(Activity, 'deleteMany', async value => { filter = value; });
  for (const body of [{}, { confirmed: false }, { confirmed: 'true' }]) {
    const res = response();
    await handler('delete', '/:studio')({ user, params: { studio: 'sentences' }, body }, res);
    assert.equal(res.code, 400);
    assert.equal(filter, undefined);
  }
  const res = response();
  await handler('delete', '/:studio')({ user, params: { studio: 'sentences' }, body: { confirmed: true, user: 'other' } }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(filter, { user: user.id, studio: 'sentences' });
});

test('reset rejects unknown studios and reports storage failures', async () => {
  let res = response();
  await handler('delete', '/:studio')({ user, params: { studio: 'hsk' }, body: { confirmed: true } }, res);
  assert.equal(res.code, 400);
  mock.method(Activity, 'deleteMany', async () => { throw new Error('offline'); });
  res = response();
  await handler('delete', '/:studio')({ user, params: { studio: 'sentences' }, body: { confirmed: true } }, res);
  assert.equal(res.code, 500);
});


test('tone performance reports all four tones and does not invent accuracy for unanswered tones', async () => {
  summaries([{ _id: 'tones', activities: 3, graded: 3, correct: 2 }]);
  mock.method(Activity, 'aggregate', async pipeline => {
    assert.equal(String(pipeline[0].$match.user), user.id);
    if (pipeline[0].$match.studio === 'tones') return [{ _id: 2, attempted: 2, correct: 1 }, { _id: 4, attempted: 1, correct: 1 }];
    return [{ _id: 'tones', activities: 3, graded: 3, correct: 2 }];
  });
  const res = response(); await handler('get', '/me')({ user }, res);
  assert.deepEqual(res.body.tonePerformance, [
    { tone: 1, attempted: 0, correct: 0, accuracy: null },
    { tone: 2, attempted: 2, correct: 1, accuracy: 50 },
    { tone: 3, attempted: 0, correct: 0, accuracy: null },
    { tone: 4, attempted: 1, correct: 1, accuracy: 100 },
  ]);
  assert.equal(res.body.studios.find(row => row.studio === 'tones').accuracy, 67);
});
