const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Test = require('../models/Test');
const AccessRequest = require('../models/AccessRequest');

test('mock test list and questions require authentication and remain available to students', async () => {
  const originalUser = User.findById, originalFind = Test.find, originalById = Test.findById, originalExists = AccessRequest.exists;
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'practice-access-test';
  User.findById = () => ({ select: async () => ({ _id: 'student', role: 'student' }) });
  Test.find = () => ({ select: () => ({ sort: async () => [] }) });
  Test.findById = async () => ({ published: true, toObject: () => ({ questions: [{ prompt: 'Test', correctIndex: 0 }] }) });
  AccessRequest.exists = async () => true;
  const app = express();
  app.use('/api/tests', require('../routes/tests'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/tests`;
    const headers = { Authorization: `Bearer ${jwt.sign({ id: 'student' }, process.env.JWT_SECRET)}` };
    for (const path of ['', '/sample']) {
      assert.equal((await fetch(base + path)).status, 401);
      assert.equal((await fetch(base + path, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
      const response = await fetch(base + path, { headers });
      assert.equal(response.status, 200);
      const data = await response.json();
      if (path) assert.equal(data.questions[0].correctIndex, undefined);
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    User.findById = originalUser; Test.find = originalFind; Test.findById = originalById; AccessRequest.exists = originalExists;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
});

test('free access lasts seven days from approval and cannot be requested again once used', async () => {
  const AuditLog = require('../models/AuditLog');
  const { hasTestAccess, FREE_ACCESS_DAYS } = require('../utils/testAccess');
  const originals = { userById: User.findById, byId: AccessRequest.findById, findOne: AccessRequest.findOne, exists: AccessRequest.exists, audit: AuditLog.create };
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'practice-access-test';
  let role = 'superadmin';
  User.findById = id => ({ select: async () => ({ _id: id, role, name: 'Student' }) });
  AuditLog.create = async () => ({});
  const saved = [];
  AccessRequest.findById = async () => ({ _id: 'r1', user: 'student', scope: 'tests', status: 'pending', save: async function () { saved.push({ status: this.status, expiresAt: this.expiresAt }); } });
  const app = express();
  app.use(express.json());
  app.use('/api/access-requests', require('../routes/accessRequests'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/access-requests`;
    const headers = id => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });

    const before = Date.now();
    const approve = await fetch(`${base}/r1/approve`, { method: 'PUT', headers: headers('admin'), body: '{}' });
    assert.equal(approve.status, 200);
    assert.equal(FREE_ACCESS_DAYS, 7);
    assert.equal(saved[0].status, 'approved');
    const length = saved[0].expiresAt.getTime() - before;
    assert.ok(length >= 7 * 86400000 && length < 7 * 86400000 + 60000, `expected 7 days, got ${length}ms`);

    // Only unexpired (or legacy, undated) approvals unlock tests.
    let filter;
    AccessRequest.exists = async query => { filter = query; return null; };
    assert.equal(await hasTestAccess({ id: 'student', role: 'student' }), false);
    assert.equal(filter.status, 'approved');
    assert.ok(filter.$or.some(clause => clause.expiresAt && clause.expiresAt.$gt instanceof Date));

    // After the free week ends, asking again is refused with a clear message.
    role = 'student';
    AccessRequest.findOne = async () => null;
    AccessRequest.exists = async query => query.status === 'approved' && !query.$or;
    const again = await fetch(base, { method: 'POST', headers: headers('student'), body: JSON.stringify({ scope: 'tests' }) });
    assert.equal(again.status, 400);
    assert.equal((await again.json()).code, 'FREE_ACCESS_USED');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    User.findById = originals.userById; AccessRequest.findById = originals.byId; AccessRequest.findOne = originals.findOne; AccessRequest.exists = originals.exists; AuditLog.create = originals.audit;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
});
