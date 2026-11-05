const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentSignIn = require('../models/StudentSignIn');
const { dayRange, nepalDate, recordStudentSignIn } = require('../utils/studentSignIns');
const restorations = [];
function mock(object, key, value) { const original = object[key]; object[key] = value; restorations.push(() => { object[key] = original; }); }
afterEach(() => { restorations.reverse().forEach(fn => fn()); restorations.length = 0; });
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const handlers = (file, path, method = 'get') => require(file).stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.map(layer => layer.handle);

test('Nepal date boundaries and malformed dates', () => {
  const range = dayRange('2026-11-05');
  assert.equal(range.start.toISOString(), '2026-11-04T18:15:00.000Z');
  assert.equal(range.end.toISOString(), '2026-11-05T18:15:00.000Z');
  assert.equal(nepalDate(new Date('2026-11-04T18:14:59Z')), '2026-11-04');
  assert.equal(nepalDate(range.start), '2026-11-05');
  for (const day of ['2026-02-30', '2026-13-01', '', []]) assert.equal(dayRange(day), null);
});

test('only students are recorded; logging outages do not prevent login', async () => {
  const events = [];
  mock(StudentSignIn, 'create', async event => events.push(event));
  const user = { _id: 'student', name: 'Learner', email: 'learner@example.com', role: 'student' };
  await recordStudentSignIn(user, 'email');
  for (const role of ['admin', 'superadmin']) await recordStudentSignIn({ ...user, role }, 'google');
  assert.deepEqual(events, [{ student: 'student', name: 'Learner', email: 'learner@example.com', method: 'email' }]);
  mock(StudentSignIn, 'create', async () => { throw new Error('unavailable'); });
  mock(console, 'error', () => {});
  await assert.doesNotReject(recordStudentSignIn(user, 'google'));
});

test('only completed email and Google authentication record events', async () => {
  mock(process.env, 'JWT_SECRET', 'test-secret');
  const events = [];
  mock(StudentSignIn, 'create', async event => events.push(event));
  const user = { _id: 'student', name: 'Learner', email: 'learner@example.com', role: 'student', password: 'hash', emailVerified: true, googleId: 'google' };
  mock(User, 'findOne', async () => user);
  mock(bcrypt, 'compare', async () => false);
  const login = handlers('../routes/auth', '/login', 'post').at(-1);
  let res = response();
  await login({ body: { email: user.email, password: 'wrong' } }, res);
  assert.equal(res.code, 401); assert.equal(events.length, 0);
  mock(bcrypt, 'compare', async () => true);
  user.emailVerified = false; user.emailVerificationSentAt = new Date();
  res = response(); await login({ body: { email: user.email, password: 'right' } }, res);
  assert.equal(res.body.verificationRequired, true); assert.equal(events.length, 0);
  user.emailVerified = true;
  res = response(); await login({ body: { email: user.email, password: 'right' } }, res);
  assert.ok(res.body.token); assert.equal(events.length, 1); assert.equal(events[0].method, 'email');
  mock(global, 'fetch', async () => ({ ok: true, json: async () => ({ sub: 'google', email: user.email, email_verified: true, aud: process.env.GOOGLE_CLIENT_ID }) }));
  res = response(); await handlers('../routes/auth', '/google', 'post').at(-1)({ body: { credential: 'credential' } }, res);
  assert.ok(res.body.token); assert.equal(events.length, 2); assert.equal(events[1].method, 'google');
});

test('report requires a current superadmin role even with a stale superadmin token', async () => {
  mock(process.env, 'JWT_SECRET', 'test-secret');
  const [auth, guard] = handlers('../routes/auditLog', '/student-sign-ins');
  let res = response(); await auth({ headers: {} }, res, () => assert.fail('anonymous access')); assert.equal(res.code, 401);
  for (const role of ['student', 'admin', 'superadmin']) {
    mock(User, 'findById', () => ({ select: async () => ({ _id: 'user', role }) }));
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: 'user', role: 'superadmin' }, process.env.JWT_SECRET)}` } };
    res = response(); let allowed = false;
    await auth(req, res, () => guard(req, res, () => { allowed = true; }));
    assert.equal(allowed, role === 'superadmin'); if (!allowed) assert.equal(res.code, 403);
  }
});

test('daily aggregation groups students and paginates without limiting daily totals', async () => {
  const report = handlers('../routes/auditLog', '/student-sign-ins').at(-1);
  mock(StudentSignIn, 'aggregate', async pipeline => {
    assert.deepEqual(pipeline[0].$match.signedInAt, { $gte: new Date('2026-11-04T18:15Z'), $lt: new Date('2026-11-05T18:15Z') });
    assert.equal(pipeline[2].$group._id, '$student');
    assert.deepEqual(pipeline[2].$group.count, { $sum: 1 });
    assert.equal(pipeline[3].$facet.students[1].$skip, 50);
    return [{ summary: [{ uniqueStudents: 51, totalSignIns: 80 }], students: [{ _id: 'student', count: 2 }] }];
  });
  const res = response(); await report({ query: { date: '2026-11-05', page: '2' } }, res);
  assert.equal(res.body.uniqueStudents, 51); assert.equal(res.body.totalSignIns, 80);
  for (const query of [{ date: '2026-02-30' }, { page: '-1' }, { page: '1.5' }]) {
    const bad = response(); await report({ query }, bad); assert.equal(bad.code, 400);
  }
  mock(StudentSignIn, 'aggregate', async () => [{ summary: [], students: [] }]);
  const empty = response(); await report({ query: {} }, empty); assert.equal(empty.body.uniqueStudents, 0);
});
