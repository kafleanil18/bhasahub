const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function withServer(role, run) {
  const original = { byId: User.findById, exists: User.exists };
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'students-test';
  User.findById = id => ({ select: async () => ({ _id: id, role }), then: (resolve) => resolve(null) });
  const app = express();
  app.use(express.json());
  app.use('/api/students', require('../routes/students'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/students`;
    const headers = { Authorization: `Bearer ${jwt.sign({ id: 'actor' }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' };
    await run(base, headers);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    User.findById = original.byId; User.exists = original.exists;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
}

test('student management is limited to super admins', async () => {
  for (const role of ['student', 'admin']) {
    await withServer(role, async (base, headers) => {
      for (const [path, method] of [['', 'GET'], ['', 'POST'], ['/abc', 'PUT'], ['/abc', 'DELETE'], ['/abc/trial', 'PUT'], ['/abc/plan', 'DELETE'], ['/abc/live-class', 'PUT']]) {
        const response = await fetch(base + path, { method, headers, body: method === 'GET' ? undefined : '{}' });
        assert.equal(response.status, 403, `${role} ${method} ${path}`);
      }
    });
  }
  await withServer('student', async base => assert.equal((await fetch(base)).status, 401));
});

test('creating a student validates name, email and password before touching the database', async () => {
  await withServer('superadmin', async (base, headers) => {
    User.exists = async () => { throw new Error('should not be called'); };
    for (const body of [{ email: 'a@b.co', password: 'password123' }, { name: 'A', email: 'nope', password: 'password123' }, { name: 'A', email: 'a@b.co', password: 'short' }]) {
      const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify(body) });
      assert.equal(response.status, 400, JSON.stringify(body));
    }
    assert.equal((await fetch(`${base}/not-an-id/trial`, { method: 'PUT', headers, body: '{}' })).status, 404);
  });
});

test('marking a student as joined in live classes needs a yes or no', async () => {
  await withServer('superadmin', async (base, headers) => {
    for (const body of [{}, { joined: 'yes' }]) {
      assert.equal((await fetch(`${base}/64b000000000000000000002/live-class`, { method: 'PUT', headers, body: JSON.stringify(body) })).status, 400, JSON.stringify(body));
    }
  });
});

test('live classes paid at checkout count while their plan length runs', () => {
  const { liveClassSummary } = require('../utils/liveClassAccess');
  const now = Date.parse('2026-11-28T00:00:00Z');
  const paid = [{ liveClass: true, status: 'approved', reviewedAt: '2026-11-10T00:00:00Z', days: 30 }];
  assert.equal(liveClassSummary(false, paid, now).allowed, true);
  assert.equal(liveClassSummary(false, paid, Date.parse('2026-12-11T00:00:00Z')).allowed, false);
  assert.equal(liveClassSummary(false, [{ ...paid[0], status: 'pending' }], now).allowed, false, 'a payment still being checked doesn’t count');
  assert.equal(liveClassSummary(true, [], now).allowed, true);
});
