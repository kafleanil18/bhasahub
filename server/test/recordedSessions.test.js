const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RecordedSession = require('../models/RecordedSession');
const AuditLog = require('../models/AuditLog');
const PlanRequest = require('../models/PlanRequest');
const ids = { boss: '111111111111111111111111', helper: '222222222222222222222222', learner: '333333333333333333333333', other: '444444444444444444444444', session: '555555555555555555555555' };

async function withServer(run) {
  const saved = [];
  const stub = (object, key, value) => { saved.push(() => { object[key] = value; }); object[key] = value; };
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'recording-test';
  let rows = [];
  const roles = { [ids.boss]: 'superadmin', [ids.helper]: 'admin', [ids.learner]: 'student', [ids.other]: 'student' };
  // Students are in live classes unless a test says otherwise (see utils/liveClassAccess.js).
  const joined = new Set([ids.learner, ids.other]);
  const paid = [];
  stub(User, 'findById', id => ({ select: () => { const user = { _id: id, role: roles[id], liveClassAccess: joined.has(id) }; const found = Promise.resolve(user); found.lean = async () => user; return found; } }));
  stub(PlanRequest, 'find', filter => ({ select() { return this; }, lean: async () => paid.filter(row => row.user === filter.user) }));
  stub(User, 'countDocuments', async filter => filter._id.$in.filter(id => roles[id] === 'student').length);
  stub(User, 'find', () => ({ select() { return this; }, sort() { return this; }, lean: async () => [{ _id: ids.learner, name: 'Sita' }, { _id: ids.other, name: 'Ram' }] }));
  const query = (filter = {}, one = false) => {
    let fields;
    return { select(value) { fields = value.split(' '); return this; }, sort() { return this; }, lean: async () => {
      const matches = rows.filter(row => (!filter._id || row._id === filter._id) && (!filter.allowedStudents || row.allowedStudents.includes(filter.allowedStudents)) && (!filter.sessionDate || row.sessionDate === filter.sessionDate));
      const result = matches.map(row => fields ? Object.fromEntries(['_id', ...fields].map(key => [key, row[key]])) : { ...row });
      return one ? result[0] || null : result;
    } };
  };
  stub(RecordedSession, 'find', filter => query(filter));
  stub(RecordedSession, 'findOne', filter => query(filter, true));
  stub(RecordedSession, 'create', async data => { const row = { ...data, _id: ids.session }; rows.push(row); return row; });
  stub(RecordedSession, 'findByIdAndUpdate', async (id, update) => { const row = rows.find(item => item._id === id); if (!row) return null; Object.assign(row, update.$set); return row; });
  stub(RecordedSession, 'findByIdAndDelete', async id => { const row = rows.find(item => item._id === id); rows = rows.filter(item => item._id !== id); return row || null; });
  stub(AuditLog, 'create', async () => ({}));
  const app = express(); app.use(express.json()); app.use('/api/recorded-sessions', require('../routes/recordedSessions'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const request = (path = '', who = 'boss', method = 'GET', body) => fetch(`http://127.0.0.1:${server.address().port}/api/recorded-sessions${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(who ? { Authorization: `Bearer ${jwt.sign({ id: ids[who] }, process.env.JWT_SECRET)}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try { await run(request, { joined, paid }); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); saved.reverse().forEach(restore => restore()); if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret; }
}
const input = { title: 'Greetings & People', description: 'Review the class', sessionDate: '2026-11-28', videoUrl: 'https://example.com/lesson.mp4', allowedStudents: [ids.learner] };

test('only superadmin can manage recordings or see the student roster', () => withServer(async request => {
  assert.equal((await request('', null)).status, 401);
  for (const role of ['learner', 'helper']) {
    for (const [path, method] of [['', 'GET'], ['/students', 'GET'], ['', 'POST'], [`/${ids.session}`, 'PUT'], [`/${ids.session}`, 'DELETE']]) {
      assert.equal((await request(path, role, method, method === 'GET' ? undefined : input)).status, 403);
    }
  }
}));

test('selected students alone can find and watch a session; revocation and deletion take effect', () => withServer(async request => {
  assert.equal((await request('', 'boss', 'POST', input)).status, 201);
  const own = await request('/mine?date=2026-11-28', 'learner');
  assert.equal(own.headers.get('cache-control'), 'no-store');
  const list = await own.json(); assert.equal(list.length, 1);
  assert.equal(list[0].videoUrl, undefined); assert.equal(list[0].allowedStudents, undefined);
  assert.equal((await (await request('/mine?date=2026-11-27', 'learner')).json()).length, 0);
  assert.equal((await (await request('/mine', 'other')).json()).length, 0);
  assert.equal((await request(`/${ids.session}/watch`, 'other')).status, 404);
  assert.equal((await request(`/${ids.session}/watch`, 'helper')).status, 403);
  assert.equal((await (await request(`/${ids.session}/watch`, 'learner')).json()).videoUrl, input.videoUrl);
  assert.equal((await request(`/${ids.session}`, 'boss', 'PUT', { ...input, allowedStudents: [ids.other] })).status, 200);
  assert.equal((await request(`/${ids.session}/watch`, 'learner')).status, 404);
  assert.equal((await request(`/${ids.session}/watch`, 'other')).status, 200);
  assert.equal((await request(`/${ids.session}`, 'boss', 'PUT', { ...input, allowedStudents: [] })).status, 200);
  assert.equal((await request(`/${ids.session}/watch`, 'other')).status, 404);
  assert.equal((await request(`/${ids.session}`, 'boss', 'DELETE')).status, 200);
  assert.equal((await (await request()).json()).length, 0);
}));

test('invalid dates, unsafe URLs and nonstudent recipients are rejected', () => withServer(async request => {
  for (const changes of [{ title: '' }, { sessionDate: '2026-02-30' }, { sessionDate: '2026-13-01' }, { videoUrl: 'javascript:alert(1)' }, { videoUrl: 'http://example.com/video' }, { videoUrl: 'https://user:password@example.com/video' }, { allowedStudents: [ids.helper] }, { allowedStudents: ['bad'] }, { allowedStudents: 'all' }, { description: 123 }]) {
    assert.equal((await request('', 'boss', 'POST', { ...input, ...changes })).status, 400, JSON.stringify(changes));
  }
  assert.equal((await request('/mine?date=bad', 'learner')).status, 400);
  assert.equal((await request('/bad/watch', 'learner')).status, 404);
}));

test('recordings are only for students in live classes: paid at checkout or marked joined', () => withServer(async (request, { joined, paid }) => {
  assert.equal((await request('', 'boss', 'POST', input)).status, 201);
  joined.delete(ids.learner);
  const access = await (await request('/access', 'learner')).json();
  assert.equal(access.allowed, false);
  const mine = await request('/mine', 'learner');
  assert.equal(mine.status, 403);
  assert.equal((await mine.json()).code, 'RECORDED_LOCKED');
  assert.equal((await request(`/${ids.session}/watch`, 'learner')).status, 403);

  // Live classes paid at checkout open it while the plan length runs.
  paid.push({ user: ids.learner, liveClass: true, status: 'approved', reviewedAt: new Date(Date.now() - 5 * 86400000), days: 30 });
  assert.equal((await (await request('/access', 'learner')).json()).allowed, true);
  assert.equal((await request('/mine', 'learner')).status, 200);
  paid[0].reviewedAt = new Date(Date.now() - 40 * 86400000);
  assert.equal((await (await request('/access', 'learner')).json()).allowed, false, 'it closes when the paid period ends');

  joined.add(ids.learner);
  assert.deepEqual(await (await request('/access', 'learner')).json(), { allowed: true, granted: true, paidUntil: null });
  assert.equal((await request('/access', 'helper')).status, 403);
}));
