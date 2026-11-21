const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const PlanRequest = require('../models/PlanRequest');
const PlatformPass = require('../models/PlatformPass');
const AuditLog = require('../models/AuditLog');
const { PLANS, findPlan } = require('../utils/plans');
const emailTransport = require('../utils/emailTransport');
const { planRequestMessage } = require('../utils/planRequestEmail');

const ADMIN_ID = '64b000000000000000000001';
const STUDENT_ID = '64b000000000000000000002';
const REQUEST_ID = '64b000000000000000000003';

function stub(target, name, value, restore) {
  const original = target[name];
  target[name] = value;
  restore.push(() => { target[name] = original; });
}

async function withApp(run) {
  const restore = [];
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'plans-test';
  stub(User, 'findById', id => ({ select: async () => (String(id) === ADMIN_ID ? { _id: ADMIN_ID, role: 'admin', name: 'Admin' } : { _id: STUDENT_ID, role: 'student', name: 'Sita', email: 'sita@example.com' }) }), restore);
  stub(AuditLog, 'create', async () => ({}), restore);
  const app = express();
  app.use(express.json());
  app.use('/api/plans', require('../routes/plans'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/plans`;
  const as = id => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });
  try {
    await run({ base, as, stub: (target, name, value) => stub(target, name, value, restore) });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    restore.reverse().forEach(undo => undo());
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
}

test('plans are 1, 3 and 6 months at Rs 1000, 2000 and 3000', () => {
  assert.deepEqual(PLANS.map(plan => [plan.id, plan.days, plan.price]), [['1-month', 30, 1000], ['3-months', 90, 2000], ['6-months', 180, 3000]]);
  assert.equal(findPlan('12-months'), null);
});

test('the plan list is public', async () => {
  await withApp(async ({ base }) => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).length, 3);
  });
});

test('students request a plan with the server price, super admins are emailed, and switching updates the request', async () => {
  await withApp(async ({ base, as, stub }) => {
    let pending = null;
    const created = [];
    const sent = [];
    emailTransport.setEmailSettingsLoader(async () => ({ provider: 'test', send: async message => { sent.push(message); } }));
    stub(User, 'find', filter => { assert.deepEqual(filter, { role: 'superadmin' }); return { select: async () => [{ email: 'owner@example.com' }, { email: 'owner@example.com' }, { email: 'second@example.com' }] }; });
    stub(PlanRequest, 'findOneAndUpdate', async (filter, update, options) => {
      assert.equal(options.new, false);
      const before = pending;
      if (pending) pending = { ...pending, ...update.$set };
      return before;
    });
    stub(PlanRequest, 'create', async fields => { created.push(fields); pending = { _id: REQUEST_ID, status: 'pending', ...fields }; return pending; });
    const settle = () => new Promise(resolve => setTimeout(resolve, 20));
    try {
      assert.equal((await fetch(`${base}/requests`, { method: 'POST', body: JSON.stringify({ planId: '3-months' }) })).status, 401);
      assert.equal((await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: 'free', price: 1 }) })).status, 400);

      const first = await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '3-months', price: 1 }) });
      assert.equal(first.status, 201);
      assert.deepEqual(created[0], { user: STUDENT_ID, plan: '3-months', price: 2000, days: 90 });
      await settle();
      assert.deepEqual(sent.map(message => message.to), ['owner@example.com', 'second@example.com']);
      assert.equal(sent[0].replyTo, 'sita@example.com');
      assert.equal(sent[0].subject, 'New plan request: Sita · 3 months · Rs 2,000');
      assert.match(sent[0].text, /Email: sita@example\.com/);

      const second = await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '6-months' }) });
      assert.equal(second.status, 200);
      assert.equal((await second.json()).price, 3000);
      assert.equal(created.length, 1);
      await settle();
      assert.equal(sent.length, 4);
      assert.equal(sent[2].subject, 'Plan changed: Sita · 6 months · Rs 3,000');
      assert.match(sent[2].text, /Changed from: 3 months/);

      await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '6-months' }) });
      await settle();
      assert.equal(sent.length, 4, 'choosing the same plan again does not email twice');

      assert.equal((await fetch(`${base}/requests`, { method: 'POST', headers: as(ADMIN_ID), body: JSON.stringify({ planId: '1-month' }) })).status, 403);
    } finally {
      emailTransport.setEmailSettingsLoader(async () => null);
    }
  });
});

test('a failed plan email still accepts the request', async () => {
  await withApp(async ({ base, as, stub }) => {
    const errors = [];
    stub(console, 'error', (...args) => errors.push(args.join(' ')));
    emailTransport.setEmailSettingsLoader(async () => ({ provider: 'test', send: async () => { throw new Error('mailbox offline'); } }));
    stub(User, 'find', () => ({ select: async () => [{ email: 'owner@example.com' }] }));
    stub(PlanRequest, 'findOneAndUpdate', async () => null);
    stub(PlanRequest, 'create', async fields => ({ _id: REQUEST_ID, status: 'pending', ...fields }));
    try {
      const response = await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '1-month' }) });
      assert.equal(response.status, 201);
      await new Promise(resolve => setTimeout(resolve, 20));
      assert.ok(errors.some(line => line.includes('mailbox offline')));
    } finally {
      emailTransport.setEmailSettingsLoader(async () => null);
    }
  });
});

test('the plan email escapes student names', () => {
  const message = planRequestMessage({ student: { name: '<b>Sita</b>', email: 'sita@example.com' }, request: { plan: '1-month', price: 1000, days: 30 }, adminUrl: 'https://example.com/admin/subscriptions' });
  assert.ok(!message.html.includes('<b>Sita</b>'));
  assert.ok(message.html.includes('&lt;b&gt;Sita&lt;/b&gt;'));
  assert.ok(message.html.includes('https://example.com/admin/subscriptions'));
});

test('only admins see and approve requests, and approval extends the plan by its days once', async () => {
  await withApp(async ({ base, as, stub }) => {
    let status = 'pending';
    const passUpdates = [];
    stub(PlanRequest, 'findOneAndUpdate', async (filter, update) => {
      if (filter.status !== status) return null;
      status = update.$set.status;
      return { _id: REQUEST_ID, user: STUDENT_ID, plan: '6-months', price: 3000, days: 180, status };
    });
    stub(PlanRequest, 'exists', async () => ({ _id: REQUEST_ID }));
    stub(PlatformPass, 'findOneAndUpdate', async (filter, update) => {
      passUpdates.push({ filter, update });
      return { user: STUDENT_ID, expiresAt: new Date(Date.now() + 180 * 86400000) };
    });

    assert.equal((await fetch(`${base}/requests/${REQUEST_ID}/approve`, { method: 'PUT', headers: as(STUDENT_ID) })).status, 403);
    const approved = await fetch(`${base}/requests/${REQUEST_ID}/approve`, { method: 'PUT', headers: as(ADMIN_ID) });
    assert.equal(approved.status, 200);
    const extend = passUpdates[1];
    assert.deepEqual(extend.filter, { user: STUDENT_ID, appliedRequests: { $ne: REQUEST_ID } });
    assert.deepEqual(extend.update[0].$set.expiresAt, { $add: [{ $max: ['$expiresAt', '$$NOW'] }, 180 * 86400000] });

    const again = await fetch(`${base}/requests/${REQUEST_ID}/approve`, { method: 'PUT', headers: as(ADMIN_ID) });
    assert.equal(again.status, 409);
  });
});

test('an active plan unlocks every published course', async () => {
  const restore = [];
  const { canAccessCourse } = require('../middleware/courseAccess');
  let passActive = true;
  stub(Course, 'findById', async () => ({ published: true }), restore);
  stub(PlatformPass, 'findOne', () => ({ select: () => ({ lean: async () => (passActive ? { expiresAt: new Date(Date.now() + 86400000) } : null) }) }), restore);
  stub(Subscription, 'exists', async () => null, restore);
  try {
    assert.equal(await canAccessCourse({ id: STUDENT_ID, role: 'student' }, 'course'), true);
    passActive = false;
    assert.equal(await canAccessCourse({ id: STUDENT_ID, role: 'student' }, 'course'), false);
  } finally {
    restore.reverse().forEach(undo => undo());
  }
});
