const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'session-test-secret';
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { signSession, secretsMatch } = require('../utils/sessionToken');

function run(token, stored) {
  const original = User.findById;
  User.findById = () => ({ select: async () => stored });
  return new Promise(resolve => {
    const res = { status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code, body }); } };
    requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, () => resolve({ code: 200 }));
  }).finally(() => { User.findById = original; });
}

test('a token signed at the current version is accepted', async () => {
  const user = { _id: 'u1', role: 'student', tokenVersion: 2 };
  assert.equal((await run(signSession(user), user)).code, 200);
});

test('tokens issued before a password change are rejected', async () => {
  const token = signSession({ _id: 'u1', role: 'student', tokenVersion: 0 });
  const result = await run(token, { _id: 'u1', role: 'student', tokenVersion: 1 });
  assert.equal(result.code, 401);
  assert.match(result.body.error, /password was changed/);
});

test('sessions from before token versions existed keep working until the password changes', async () => {
  const legacy = jwt.sign({ id: 'u1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  assert.equal((await run(legacy, { _id: 'u1', role: 'student' })).code, 200);
  assert.equal((await run(legacy, { _id: 'u1', role: 'student', tokenVersion: 1 })).code, 401);
});

test('tokens signed with another algorithm are rejected', async () => {
  const unsigned = jwt.sign({ id: 'u1', role: 'superadmin' }, null, { algorithm: 'none' });
  assert.equal((await run(unsigned, { _id: 'u1', role: 'superadmin' })).code, 401);
  const hs512 = jwt.sign({ id: 'u1', role: 'superadmin' }, process.env.JWT_SECRET, { algorithm: 'HS512' });
  assert.equal((await run(hs512, { _id: 'u1', role: 'superadmin' })).code, 401);
});

test('the admin code only matches exactly and never matches when unset', () => {
  assert.equal(secretsMatch('code-1234', 'code-1234'), true);
  assert.equal(secretsMatch('code-123', 'code-1234'), false);
  assert.equal(secretsMatch('', ''), false);
  assert.equal(secretsMatch('anything', undefined), false);
  assert.equal(secretsMatch({}, 'code-1234'), false);
});
