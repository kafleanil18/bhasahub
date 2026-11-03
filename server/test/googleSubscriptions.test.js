const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const AccessRequest = require('../models/AccessRequest');
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

test('a new Google student can request a subscription visible to the super admin', async () => {
  mock(process.env, 'JWT_SECRET', 'google-subscription-test-secret');
  mock(process.env, 'GOOGLE_CLIENT_ID', 'test-client');
  const student = { _id: '507f1f77bcf86cd799439011', name: 'Google Student', email: 'student@example.com', role: 'student' };
  const course = { _id: '507f1f77bcf86cd799439012', title: 'HSK 1', published: true };
  mock(global, 'fetch', async () => ({ ok: true, json: async () => ({
    sub: 'google-student', email: student.email, name: student.name, email_verified: true, aud: 'test-client',
  }) }));
  mock(User, 'findOne', async () => null);
  mock(User, 'create', async data => {
    assert.equal(data.role, 'student');
    assert.equal(data.googleId, 'google-student');
    return student;
  });
  const login = response();
  await route('../routes/auth', '/google', 'post').at(-1).handle({ body: { credential: 'google-credential' } }, login);
  assert.equal(login.code, 200);
  assert.ok(login.body.token);

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
  const adminReq = { user: { id: 'superadmin', role: 'superadmin' } };
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
});
