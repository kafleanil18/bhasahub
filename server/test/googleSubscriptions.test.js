const StudentSignIn = require('../models/StudentSignIn');
StudentSignIn.create = async () => ({});
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const AccessRequest = require('../models/AccessRequest');
const Enrollment = require('../models/Enrollment');
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');

const restorations = [];
function mock(object, key, value) {
  const original = object[key];
  object[key] = value;
  restorations.push(() => { object[key] = original; });
}
afterEach(() => { restorations.reverse().forEach(restore => restore()); restorations.length = 0; });
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function route(module, path, method) {
  return require(module).stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack;
}

test('a Google student requests access and receives it only after super admin approval', async () => {
  mock(process.env, 'JWT_SECRET', 'google-subscription-test-secret');
  mock(process.env, 'GOOGLE_CLIENT_ID', 'test-client');
  const student = { _id: '507f1f77bcf86cd799439011', name: 'Google Student', email: 'student@example.com', role: 'student' };
  const course = { _id: '507f1f77bcf86cd799439012', title: 'HSK 1', published: true };
  mock(global, 'fetch', async () => ({ ok: true, json: async () => ({
    sub: 'google-student', email: student.email, name: student.name, email_verified: true, aud: 'test-client',
  }) }));
  mock(User, 'findOne', async () => null);
  mock(User, 'findOneAndUpdate', async () => ({ signInCount: 0 }));
  mock(StudentSignIn, 'exists', async () => null);
  mock(User, 'create', async data => {
    assert.equal(data.role, 'student');
    assert.equal(data.googleId, 'google-student');
    return student;
  });
  const login = response();
  await route('../routes/auth', '/google', 'post').at(-1).handle({ body: { credential: 'google-credential' } }, login);
  assert.equal(login.code, 200);
  assert.ok(login.body.token);
  assert.equal(login.body.user.isFirstLogin, true);

  mock(User, 'findById', () => ({ select: async () => student }));
  const req = { headers: { authorization: `Bearer ${login.body.token}` }, body: { courseId: course._id } };
  let authenticated = false;
  await requireAuth(req, response(), () => { authenticated = true; });
  assert.equal(authenticated, true);
  assert.equal(req.user.id, student._id);
  mock(Course, 'findById', async () => course);
  mock(Subscription, 'findOne', async () => null);
  let saved;
  mock(AccessRequest, 'findOne', async () => saved || null);
  mock(AccessRequest, 'create', async data => { saved = { _id: 'request', ...data }; return saved; });
  const submit = route('../routes/accessRequests', '/', 'post').at(-1).handle;
  const submitted = response();
  await submit(req, submitted);
  assert.equal(submitted.code, 201);
  assert.equal(saved.user, student._id);
  assert.equal(saved.course, course._id);
  assert.equal(saved.status, 'pending');
  const repeated = response();
  await submit(req, repeated);
  assert.equal(repeated.code, 200);
  assert.equal(repeated.body._id, saved._id);

  const list = route('../routes/accessRequests', '/', 'get');
  const denied = response();
  list[1].handle(req, denied, () => assert.fail('students cannot list everyone’s requests'));
  assert.equal(denied.code, 403);
  const adminReq = { user: { id: '507f1f77bcf86cd799439013', role: 'superadmin' } };
  let authorized = false;
  list[1].handle(adminReq, response(), () => { authorized = true; });
  assert.equal(authorized, true);
  const query = {
    populate() { return this; },
    sort: async () => [{ ...saved, user: student, course }],
  };
  mock(AccessRequest, 'find', () => query);
  const visible = response();
  await list.at(-1).handle(adminReq, visible);
  assert.equal(visible.body[0].user.email, student.email);
  assert.equal(visible.body[0].course.title, course.title);
  assert.equal(visible.body[0].status, 'pending');

  const check = route('../routes/subscriptions', '/check/:courseId', 'get').at(-1).handle;
  req.params = { courseId: course._id };
  const locked = response();
  await check(req, locked);
  assert.equal(locked.body.hasAccess, false);

  mock(AccessRequest, 'findById', async () => ({ ...saved, save: async function () { saved.status = this.status; } }));
  let subscription;
  mock(Subscription, 'findOneAndUpdate', async (filter, update) => {
    if (update.$setOnInsert) return { _id: 'subscription', ...update.$setOnInsert };
    assert.equal(String(update[0].$set.grantedBy), adminReq.user.id);
    assert.equal(update[0].$set.expiresAt.$add[1], 30 * 86400000);
    subscription = { user: student._id, course: course._id, expiresAt: new Date(Date.now() + 30 * 86400000) };
    return subscription;
  });
  mock(Enrollment, 'updateOne', async (filter, update) => {
    assert.equal(filter.user, student._id);
    assert.equal(update.$setOnInsert.course, course._id);
    return { upsertedCount: 1 };
  });
  mock(User, 'findById', () => ({ select: async () => student }));
  mock(Course, 'findById', () => ({ select: async () => course }));
  mock(AuditLog, 'create', async () => ({}));
  const approve = route('../routes/accessRequests', '/:id/approve', 'put');
  let canApprove = false;
  approve[1].handle(adminReq, response(), () => { canApprove = true; });
  assert.equal(canApprove, true);
  const approved = response();
  await approve.at(-1).handle({ ...adminReq, params: { id: saved._id }, body: { days: 30 } }, approved);
  assert.equal(approved.code, 200);
  assert.equal(saved.status, 'approved');
  mock(Subscription, 'findOne', async filter => {
    assert.equal(filter.user, student._id);
    assert.equal(filter.course, course._id);
    return subscription;
  });
  const unlocked = response();
  await check(req, unlocked);
  assert.equal(unlocked.body.hasAccess, true);
  assert.ok(unlocked.body.expiresAt > new Date());
});
