const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HskAttempt = require('../models/HskAttempt');
const PracticePaper = require('../models/PracticePaper');
const AuditLog = require('../models/AuditLog');
const paper = require('../data/hsk11226');
const h10901 = require('../data/hsk10901');
const { publicPaper, grade, result } = require('../utils/hsk11226');
// Independently transcribed from the PDF's printed answer key, A=0 and ✓=0.
const key = [1,1,1,0,0, 0,2,2,0,1, 3,0,4,1,5, 2,1,1,2,0, 0,1,0,0,1, 2,0,1,5,3, 2,3,1,0,4, 2,4,5,0,1];
// H10901_1.pdf page 14, independently transcribed; A=0 and ✓=0.
const h10901Key = [0,1,1,1,0, 0,0,2,0,2, 3,1,0,4,5, 1,1,2,2,1, 0,0,1,1,0, 3,5,2,0,1, 2,3,0,1,4, 5,1,4,0,2];

test('H10901 preserves the printed key, original pictures, examples, and its own recording', () => {
  const questions = h10901.groups.flatMap(group => group.questions);
  assert.equal(h10901.groups.length, 8);
  assert.ok(h10901.groups.every(group => group.questions.length === 5 && group.example));
  assert.deepEqual(questions.map(q => q.number), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.deepEqual(questions.map(q => q.correctIndex), h10901Key);
  assert.ok(questions.slice(0, 20).every(q => q.listeningText));
  assert.ok(questions.slice(20).every(q => q.text && q.pinyin));
  for (const image of [...h10901.groups, ...questions].flatMap(row => [row.image, row.exampleImage]).filter(Boolean)) {
    assert.ok(image.startsWith('/hsk1/h10901/'));
    assert.ok(fs.statSync(path.join(__dirname, '../../client/public', image)).size > 1000, image);
  }
  assert.deepEqual(h10901.groups.filter(group => group.exampleImage).map(group => group.id), ['l1', 'l2', 'l3', 'r1', 'r2']);
  assert.equal(h10901.audioUrl, '/hsk1/h10901/listening.mp3');
  assert.equal(fs.statSync(path.join(__dirname, '../../client/public', h10901.audioUrl)).size, 20974992);
  assert.equal(h10901.listeningSeconds, 874);
  assert.equal(h10901.transferSeconds, 180);
  assert.equal(h10901.readingSeconds, 1020);
  const tools = require('../utils/hsk11226').createPaperTools(h10901);
  assert.deepEqual(tools.grade(h10901Key), { listening: 20, reading: 20, score: 40 });
  assert.deepEqual(tools.grade(Array(40).fill(null)), { listening: 0, reading: 0, score: 0 });
  const publicJson = JSON.stringify(tools.publicPaper());
  for (const privateField of ['correctIndex', 'explanation', 'listeningText']) assert.ok(!publicJson.includes(privateField));
});

test('all forty questions agree with the printed answer key and every picture exists', () => {
  const questions = paper.groups.flatMap(group => group.questions);
  assert.equal(paper.groups.length, 8);
  assert.ok(paper.groups.every(group => group.questions.length === 5));
  assert.deepEqual(questions.map(q => q.number), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.deepEqual(questions.map(q => q.correctIndex), key);
  assert.ok(paper.groups.every(group => group.example), 'Every part includes its worked example');
  assert.deepEqual(paper.groups.filter(group => group.exampleImage).map(group => group.id), ['l1', 'l2', 'l3', 'r1', 'r2']);
  for (const image of [...paper.groups, ...questions].flatMap(row => [row.image, row.exampleImage]).filter(Boolean)) {
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
  mock(User, 'findById', id => ({ select: async () => ({ _id: id, role: ['admin', 'superadmin'].includes(id) ? id : 'student' }) }));
  const publications = new Map();
  mock(PracticePaper, 'findById', async id => publications.get(id));
  mock(PracticePaper, 'find', async () => [...publications.values()]);
  mock(PracticePaper, 'create', async fields => { publications.set(fields._id, structuredClone(fields)); return fields; });
  mock(PracticePaper, 'findByIdAndUpdate', async (id, update) => {
    const saved = { ...publications.get(id), _id: id, ...update.$set }; publications.set(id, saved); return saved;
  });
  mock(AuditLog, 'create', async () => ({}));
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
  return { app, base: `http://127.0.0.1:${server.address().port}/api/hsk1/h11226`, headers: headers('507f1f77bcf86cd799439011'), other: headers('507f1f77bcf86cd799439012'), admin: headers('admin'), superadmin: headers('superadmin') };
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

test('resuming an older H11226 snapshot includes new examples without changing its questions or timer', async () => {
  const { base, headers } = await setup();
  const snapshot = structuredClone(paper);
  for (const group of snapshot.groups) {
    for (const field of ['example', 'exampleImage', 'exampleImageAlt', 'exampleImageCompact']) delete group[field];
  }
  snapshot.listeningSeconds = 901;
  snapshot.groups[0].questions[0].text = 'Original saved question';
  const answers = Array(40).fill(null); answers[0] = 1;
  mock(HskAttempt, 'findOne', async () => ({ _id: '507f1f77bcf86cd799439013', paper: 'h11226', user: 'private-id', status: 'started', startedAt: '2026-11-05T00:00:00.000Z', answers, paperSnapshot: snapshot }));
  const response = await fetch(`${base}/attempts/507f1f77bcf86cd799439013`, { headers });
  assert.equal(response.status, 200);
  const resumed = await response.json();
  assert.deepEqual(resumed.answers, answers);
  assert.equal(resumed.startedAt, '2026-11-05T00:00:00.000Z');
  assert.equal(resumed.paperDefinition.listeningSeconds, 901);
  assert.equal(resumed.paperDefinition.groups[0].questions[0].text, 'Original saved question');
  for (const group of resumed.paperDefinition.groups) {
    assert.equal(group.example, paper.groups.find(current => current.id === group.id).example);
  }
  assert.equal(resumed.paperDefinition.groups[0].exampleImage, '/hsk1/h11226/examples/l1.png');
  assert.ok(!JSON.stringify(resumed).includes('correctIndex'));
  assert.ok(!JSON.stringify(resumed).includes('explanation'));
  assert.ok(!resumed.user);
  assert.ok(!snapshot.groups[0].example, 'Stored snapshot remains unchanged');
});

test('H10901 uses the shared portal with isolated attempts, publication, and immutable reference content', async () => {
  const { base, headers, other, admin, superadmin } = await setup();
  const root = base.replace('/h11226', '');
  const url = `${root}/h10901`;
  assert.equal((await fetch(url)).status, 401);
  const listing = await (await fetch(root, { headers })).json();
  assert.deepEqual(listing.map(row => row.id), ['h11226', 'h10901', 'h11556']);
  assert.ok(listing.every(row => !row.custom && row.published));
  const response = await fetch(url, { headers });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const content = await response.json();
  assert.equal(content.code, 'H10901');
  assert.equal(content.groups.flatMap(g => g.questions).length, 40);
  assert.ok(!JSON.stringify(content).includes('listeningText'));
  const created = await (await fetch(`${url}/attempts`, { method: 'POST', headers })).json();
  assert.equal(created.paper, 'h10901');
  assert.equal(created.paperDefinition.id, 'h10901');
  const attemptUrl = `${url}/attempts/${created._id}`;
  assert.equal((await fetch(attemptUrl, { headers: other })).status, 404);
  assert.equal((await fetch(`${base}/attempts/${created._id}`, { headers })).status, 404);
  const submitted = await (await fetch(`${attemptUrl}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: h10901Key }) })).json();
  assert.equal(submitted.score, 40);
  assert.equal(submitted.review.length, 40);
  const retry = await (await fetch(`${attemptUrl}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: Array(40).fill(null) }) })).json();
  assert.equal(retry.score, 40);
  assert.equal((await fetch(`${url}/editor`, { headers: superadmin })).status, 400);
  assert.equal((await fetch(`${url}/content`, { method: 'PUT', headers: superadmin, body: JSON.stringify(h10901) })).status, 400);
  const hidden = await fetch(`${url}/publication`, { method: 'PUT', headers: admin, body: JSON.stringify({ published: false }) });
  assert.equal(hidden.status, 200);
  assert.equal((await fetch(url, { headers })).status, 404);
  assert.equal((await fetch(url, { headers: admin })).status, 200);
  assert.equal((await fetch(base, { headers })).status, 200);
  assert.deepEqual((await (await fetch(root, { headers })).json()).map(row => row.id), ['h11226', 'h11556']);
  assert.equal((await fetch(attemptUrl, { headers })).status, 200);
});

test('admins control publication; hidden papers block students but allow staff preview', async () => {
  const { base, headers, admin, superadmin } = await setup();
  const url = `${base}/publication`;
  const setVisibility = (auth, published) => fetch(url, { method: 'PUT', headers: auth, body: JSON.stringify({ published }) });
  assert.equal((await fetch(url)).status, 401);
  assert.deepEqual(await (await fetch(url, { headers })).json(), { published: true });
  assert.equal((await setVisibility(headers, false)).status, 403);
  assert.equal((await setVisibility(admin, 'false')).status, 400);
  assert.equal((await setVisibility(admin, false)).status, 200);
  assert.deepEqual(await (await fetch(url, { headers })).json(), { published: false });
  assert.equal((await fetch(base, { headers })).status, 404);
  assert.equal((await fetch(`${base}/attempts`, { method: 'POST', headers })).status, 404);
  for (const staff of [admin, superadmin]) {
    const response = await fetch(base, { headers: staff });
    assert.equal(response.status, 200);
    assert.ok(!JSON.stringify(await response.json()).includes('correctIndex'));
    assert.equal((await fetch(`${base}/attempts`, { method: 'POST', headers: staff })).status, 201);
  }
  assert.equal((await setVisibility(superadmin, true)).status, 200);
  assert.equal((await fetch(base, { headers })).status, 200);
  assert.equal((await fetch(`${base}/attempts`, { method: 'POST', headers })).status, 201);
});

test('hiding a paper preserves an existing student attempt and its saved result', async () => {
  const { base, headers, admin } = await setup();
  const started = await (await fetch(`${base}/attempts`, { method: 'POST', headers })).json();
  await fetch(`${base}/publication`, { method: 'PUT', headers: admin, body: JSON.stringify({ published: false }) });
  const url = `${base}/attempts/${started._id}`;
  assert.equal((await fetch(url, { headers })).status, 200);
  const submitted = await fetch(`${url}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: key }) });
  assert.equal(submitted.status, 200);
  assert.equal((await submitted.json()).score, 40);
  assert.equal((await (await fetch(url, { headers })).json()).score, 40);
});

test('superadmin creates and edits complete papers; incomplete drafts cannot be made live', async () => {
  const { base, headers, admin, superadmin } = await setup();
  const root = base.replace('/h11226', '');
  const content = structuredClone(paper); content.title = 'Teacher paper'; content.code = 'CLASS02';
  const send = (url, auth, body, method = 'POST') => fetch(url, { method, headers: auth, body: JSON.stringify(body) });
  assert.equal((await send(root, headers, content)).status, 403);
  assert.equal((await send(root, admin, content)).status, 403);
  assert.equal((await send(root, superadmin, { ...content, groups: [] })).status, 400);
  const draft = { ...content, audioUrl: '' };
  const createdResponse = await send(root, superadmin, draft);
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.match(created.id, /^paper-[a-f0-9]{24}$/);
  assert.equal(created.published, false);
  const url = `${root}/${created.id}`;
  assert.equal((await fetch(`${url}/editor`, { headers })).status, 403);
  assert.equal((await fetch(`${url}/editor`, { headers: admin })).status, 403);
  const editor = await (await fetch(`${url}/editor`, { headers: superadmin })).json();
  assert.equal(editor.title, 'Teacher paper');
  assert.equal(editor.groups[0].questions[0].correctIndex, 1);
  assert.equal((await send(`${url}/content`, admin, content, 'PUT')).status, 403);
  assert.equal((await send(`${url}/publication`, admin, { published: true }, 'PUT')).status, 400);
  assert.equal((await send(`${url}/attempts`, superadmin, {})).status, 400);
  assert.equal((await fetch(url, { headers })).status, 404);
  assert.equal((await (await fetch(root, { headers })).json()).length, 2);
  assert.equal((await (await fetch(root, { headers: superadmin })).json()).length, 3);
  assert.equal((await send(`${url}/content`, superadmin, content, 'PUT')).status, 200);
  assert.equal((await send(`${url}/publication`, admin, { published: true }, 'PUT')).status, 200);
  const publicResponse = await fetch(url, { headers });
  assert.equal(publicResponse.status, 200);
  const publicContent = await publicResponse.json();
  assert.equal(publicContent.code, 'CLASS02');
  assert.ok(!JSON.stringify(publicContent).includes('correctIndex'));
  assert.ok(!JSON.stringify(publicContent).includes('explanation'));
  const listing = await (await fetch(root, { headers })).json();
  assert.ok(listing.some(row => row.id === created.id));
  assert.ok(!JSON.stringify(listing).includes('correctIndex'));
  assert.equal((await fetch(root + '/hg1002', { headers: superadmin })).status, 404);
  assert.equal((await send(`${base}/content`, superadmin, content, 'PUT')).status, 400);
});

test('editing a custom paper hides it and preserves grading and questions of existing attempts', async () => {
  const { base, headers, superadmin } = await setup();
  const root = base.replace('/h11226', '');
  const content = structuredClone(paper); content.title = 'Original teacher version';
  const created = await (await fetch(root, { method: 'POST', headers: superadmin, body: JSON.stringify(content) })).json();
  const url = `${root}/${created.id}`;
  await fetch(`${url}/publication`, { method: 'PUT', headers: superadmin, body: JSON.stringify({ published: true }) });
  const started = await (await fetch(`${url}/attempts`, { method: 'POST', headers })).json();
  assert.ok(started.paperDefinition);
  assert.ok(!JSON.stringify(started).includes('paperSnapshot'));
  assert.ok(!JSON.stringify(started).includes('correctIndex'));
  const changed = structuredClone(content); changed.title = 'Revised teacher version';
  changed.groups[0].questions[0].correctIndex = 0;
  await fetch(`${url}/content`, { method: 'PUT', headers: superadmin, body: JSON.stringify(changed) });
  assert.equal((await fetch(url, { headers })).status, 404);
  assert.equal((await fetch(`${base}/attempts/${started._id}`, { headers })).status, 404);
  const submitted = await fetch(`${url}/attempts/${started._id}/submit`, { method: 'POST', headers, body: JSON.stringify({ answers: key }) });
  assert.equal(submitted.status, 200);
  const saved = await submitted.json();
  assert.equal(saved.score, 40);
  assert.equal(saved.paperDefinition.title, content.title);
  assert.equal(saved.review[0].correctIndex, 1);
  assert.ok(!JSON.stringify(saved.paperDefinition).includes('correctIndex'));
});

test('manual paper validation rejects broken sections, unsafe media, and missing answer keys', () => {
  const { cleanContent, validateReady } = require('../utils/practicePaperContent');
  const content = cleanContent(structuredClone(paper));
  assert.doesNotThrow(() => validateReady(content));
  const missingKey = structuredClone(content); missingKey.groups[0].questions[0].correctIndex = null;
  assert.throws(() => validateReady(missingKey), /correct answer/);
  const missingPicture = structuredClone(content); missingPicture.groups[1].questions[0].image = '';
  assert.throws(() => validateReady(missingPicture), /picture/);
  const wrongSection = structuredClone(content); wrongSection.groups[0].id = 'r1';
  assert.throws(() => cleanContent(wrongSection), /order/);
  const unsafe = structuredClone(content); unsafe.audioUrl = 'javascript:alert(1)';
  assert.throws(() => cleanContent(unsafe), /uploaded file URL/);
});

test('superadmin can upload question pictures and audio; students cannot upload', async () => {
  const { app, base, headers, superadmin } = await setup();
  const cloud = require('../utils/cloudinary');
  mock(cloud, 'uploadBufferToCloudinary', async () => ({ secure_url: 'https://example.com/uploaded-file' }));
  app.use('/api/upload', require('../routes/upload'));
  const url = base.replace('/api/hsk1/h11226', '/api/upload');
  for (const [name, mime] of [['question.png', 'image/png'], ['listening.mp3', 'audio/mpeg']]) {
    const body = new FormData(); body.append('file', new Blob(['uploaded fixture'], { type: mime }), name);
    const response = await fetch(url, { method: 'POST', headers: { Authorization: superadmin.Authorization }, body });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).url, 'https://example.com/uploaded-file');
  }
  const denied = new FormData(); denied.append('file', new Blob(['picture']), 'question.png');
  assert.equal((await fetch(url, { method: 'POST', headers: { Authorization: headers.Authorization }, body: denied })).status, 403);
});
