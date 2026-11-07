const StudentSignIn = require('../models/StudentSignIn');
StudentSignIn.create = async () => ({});
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const email = require('../utils/email');
const restorations = [];
function mock(object, key, value) {
  const original = object[key]; object[key] = value;
  restorations.push(() => { object[key] = original; });
}
afterEach(() => { restorations.reverse().forEach(fn => fn()); restorations.length = 0; });
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function setup(flag = false, failDelivery = false) {
  mock(process.env, 'JWT_SECRET', 'verification-test-secret');
  mock(bcrypt, 'compare', async () => true);
  const user = { _id: 'user', name: 'Student', email: 'student@example.com', role: 'student', password: 'hash', emailVerified: flag, save: async () => {} };
  mock(User, 'findOne', async () => user);
  mock(User, 'findOneAndUpdate', async () => ({ signInCount: 1 }));
  mock(StudentSignIn, 'exists', async () => null);
  let sent;
  mock(email, 'sendEmailVerificationOtp', async (to, code) => {
    if (failDelivery) throw new Error('delivery failed');
    sent = { to, code };
  });
  delete require.cache[require.resolve('../routes/auth')];
  const run = require('../routes/auth').stack.find(layer => layer.route?.path === '/login').route.stack.at(-1).handle;
  return { user, run, sent: () => sent };
}
const credentials = { email: ' Student@Example.com ', password: 'password' };

test('first login sends a hashed expiring OTP and withholds the session', async () => {
  const { user, run, sent } = setup();
  const res = response();
  await run({ body: credentials }, res);
  assert.equal(res.body.verificationRequired, true);
  assert.equal(res.body.token, undefined);
  assert.match(sent().code, /^\d{6}$/);
  assert.equal(sent().to, user.email);
  assert.equal(user.emailVerificationHash, crypto.createHash('sha256').update(sent().code).digest('hex'));
  assert.ok(user.emailVerificationExpires > new Date());
  const firstHash = user.emailVerificationHash;
  const again = response();
  await run({ body: credentials }, again);
  assert.equal(user.emailVerificationHash, firstHash);
  assert.ok(again.body.retryAfter > 0);
});

test('valid OTP is atomically consumed before issuing a session', async () => {
  const { run } = setup();
  let consumed = false;
  mock(User, 'findOneAndUpdate', async (filter, update) => {
    if (update.$inc) return { signInCount: 1 };
    assert.equal(filter.emailVerified, false);
    assert.equal(filter.emailVerificationHash, crypto.createHash('sha256').update('123456').digest('hex'));
    assert.ok(filter.emailVerificationExpires.$gt instanceof Date);
    assert.equal(update.$set.emailVerified, true);
    assert.equal(update.$unset.emailVerificationHash, '');
    if (consumed) return null;
    consumed = true;
    return {};
  });
  let res = response();
  await run({ body: { ...credentials, otp: '123456' } }, res);
  assert.ok(res.body.token);
  res = response();
  await run({ body: { ...credentials, otp: '123456' } }, res);
  assert.equal(res.code, 400);
  assert.equal(res.body.token, undefined);
});

test('incorrect or expired OTP cannot issue a session', async () => {
  const { run } = setup();
  mock(User, 'findOneAndUpdate', async () => null);
  const res = response();
  await run({ body: { ...credentials, otp: '000000' } }, res);
  assert.equal(res.code, 400);
  assert.equal(res.body.token, undefined);
});

test('verified and legacy accounts sign in without another OTP', async () => {
  for (const flag of [true, undefined]) {
    const { user, run, sent } = setup();
    user.emailVerified = flag;
    const res = response();
    await run({ body: credentials }, res);
    assert.ok(res.body.token);
    assert.equal(sent(), undefined);
  }
});

test('wrong password never sends an OTP or issues a session', async () => {
  const { run, sent } = setup();
  mock(bcrypt, 'compare', async () => false);
  const res = response();
  await run({ body: credentials }, res);
  assert.equal(res.code, 401);
  assert.equal(sent(), undefined);
  assert.equal(res.body.token, undefined);
});

test('delivery failure clears the pending code and allows a retry', async () => {
  const { user, run } = setup(false, true);
  let cleared = false;
  mock(User, 'updateOne', async filter => {
    assert.equal(filter.emailVerificationHash, user.emailVerificationHash);
    cleared = true;
  });
  const res = response();
  await run({ body: credentials }, res);
  assert.equal(res.code, 502);
  assert.equal(cleared, true);
  assert.equal(res.body.token, undefined);
});
