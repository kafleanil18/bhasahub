const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HskAttempt = require('../models/HskAttempt');
const paper = require('../data/hsk11226');
const { publicPaper, grade, result } = require('../utils/hsk11226');
// Independently transcribed from the PDF's printed answer key, A=0 and ✓=0.
const key = [1,1,1,0,0, 0,2,2,0,1, 3,0,4,1,5, 2,1,1,2,0, 0,1,0,0,1, 2,0,1,5,3, 2,3,1,0,4, 2,4,5,0,1];

test('all forty questions agree with the printed answer key and every picture exists', () => {
  const questions = paper.groups.flatMap(group => group.questions);
  assert.equal(paper.groups.length, 8);
  assert.ok(paper.groups.every(group => group.questions.length === 5));
  assert.deepEqual(questions.map(q => q.number), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.deepEqual(questions.map(q => q.correctIndex), key);
  for (const image of [...paper.groups, ...questions].map(row => row.image).filter(Boolean)) {
    assert.ok(fs.existsSync(path.join(__dirname, '../../client/public', image)), image);
  }
  const audio = fs.readFileSync(path.join(__dirname, '../../client/public', paper.audioUrl));
  assert.equal(audio.subarray(4, 8).toString(), 'ftyp');
  assert.equal(audio.subarray(8, 12).toString(), 'M4A ');
});
test('grading handles perfect, blank, mixed, and malformed answers without trusting client scores', () => {
  assert.deepEqual(grade(key), { listening: 20, reading: 20, score: 40 });
  assert.deepEqual(grade(Array(40).fill(null)), { listening: 0, reading: 0, score: 0 });
  const mixed = [...key]; mixed[0] = null; mixed[21] = 0;
  assert.deepEqual(grade(mixed), { listening: 19, reading: 19, score: 38 });
  for (const invalid of [[], {}, Array(40).fill(-1), Array(40).fill('0'), Array(40).fill(6), [...key.slice(0, 39), 1.5]]) assert.throws(() => grade(invalid));
});
test('student paper and unfinished attempts never disclose answers or explanations', () => {
  const json = JSON.stringify(publicPaper());
  assert.ok(!json.includes('correctIndex'));
  assert.ok(!json.includes('explanation'));
  assert.ok(!JSON.stringify(result({ status: 'started', user: 'private-id' })).includes('private-id'));
});

const restorations = [];
const servers = [];
const mock = (object, property, replacement) => {
  const original = object[property]; object[property] = replacement;
  restorations.push(() => { object[property] = original; });
};
afterEach(async () => {
  for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  restorations.reverse().forEach(restore => restore()); restorations.length = 0;
});
async function setup() {
  mock(process.env, 'JWT_SECRET', 'hsk-test-secret');
  mock(User, 'findById', id => ({ select: async () => ({ _id: id, role: 'student' }) }));
  let stored;
  const matches = filter => stored && Object.entries(filter).every(([key, value]) => String(stored[key]) === String(value));
  mock(HskAttempt, 'create', async fields => (stored = { ...fields, _id: '507f1f77bcf86cd799439013', status: 'started', startedAt: new Date() }));
  mock(HskAttempt, 'findOne', async filter => matches(filter) ? structuredClone(stored) : null);
  mock(HskAttempt, 'findOneAndUpdate', async (filter, update) => {
    if (!matches(filter)) return null;
    Object.assign(stored, update.$set); return structuredClone(stored);
  });
  const app = express(); app.use(express.json()); app.use('/api/hsk1', require('../routes/hsk1'));
  const server = await new Promise((resolve, reject) => { const item = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve(item)); item.on('error', reject); });
  servers.push(server);
  const headers = id => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });
  return { base: `http://127.0.0.1:${server.address().port}/api/hsk1/h11226`, headers: headers('507f1f77bcf86cd799439011'), other: headers('507f1f77bcf86cd799439012') };
}
test('authenticated owner gets a server-graded result; retries cannot change the published score', async () => {
  const { base, headers, other } = await setup();
  assert.equal((await fetch(base)).status, 401);
  const content = await (await fetch(base, { headers })).json();
  assert.ok(!JSON.stringify(content).includes('correctIndex'));
  const started = await (await fetch(`${base}/attempts`, { method: 'POST', headers })).json();
  const url = `${base}/attempts/${started._id}`;
  assert.equal((await fetch(url, { headers: other })).status, 404);
  assert.equal((await fetch(`${url}/submit`, { method: 'POST', headers: other, body: JSON.stringify({ answers: key }) })).status, 404);
  assert.equal((await fetch(`${url}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: [], score: 40 }) })).status, 400);
  const submitted = await (await fetch(`${url}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: key, score: 0 }) })).json();
  assert.equal(submitted.score, 40); assert.equal(submitted.percent, 100);
  assert.equal(submitted.listening, 20); assert.equal(submitted.reading, 20);
  assert.equal(submitted.review.length, 40); assert.ok(!submitted.user);
  const retry = await (await fetch(`${url}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: Array(40).fill(null) }) })).json();
  assert.equal(retry.score, 40); assert.deepEqual(retry.answers, key);
  assert.equal((await (await fetch(url, { headers })).json()).score, 40);
});
