const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const PlanRequest = require('../models/PlanRequest');
const PlatformPass = require('../models/PlatformPass');
const PaymentSettings = require('../models/PaymentSettings');
const AuditLog = require('../models/AuditLog');
const { PLANS, findPlan } = require('../utils/plans');
const emailTransport = require('../utils/emailTransport');
const { planRequestMessage } = require('../utils/planRequestEmail');

const ADMIN_ID = '64b000000000000000000001';
const STUDENT_ID = '64b000000000000000000002';
const REQUEST_ID = '64b000000000000000000003';
const SCREENSHOT = 'https://res.cloudinary.com/demo/image/upload/payment-proofs/receipt.png';
const PAYMENT = { method: 'qr', screenshot: SCREENSHOT };

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
  const saved = [];
  stub(PlanRequest, 'updateOne', async (filter, update) => { saved.push({ filter, update }); return {}; }, restore);
  let activePass = null;
  stub(PlatformPass, 'findOne', () => ({ select: () => ({ lean: async () => activePass }) }), restore);
  let waiting = null;
  stub(PlanRequest, 'findOne', () => ({ select: () => ({ lean: async () => waiting }) }), restore);
  let prices = {};
  stub(PaymentSettings, 'findOne', () => ({ select: () => ({ lean: async () => ({ prices }) }) }), restore);
  const app = express();
  app.use(express.json());
  app.use('/api/plans', require('../routes/plans'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/plans`;
  const as = id => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });
  try {
    await run({ base, as, saved, setActivePass: value => { activePass = value; }, setWaiting: value => { waiting = value; }, setPrices: value => { prices = value; }, stub: (target, name, value) => stub(target, name, value, restore) });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    restore.reverse().forEach(undo => undo());
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
}

test('plans are 1, 3 and 6 months at Rs 1000, 2000 and 3000, with live classes at Rs 7000, 9000 and 12000', () => {
  assert.deepEqual(PLANS.map(plan => [plan.id, plan.days, plan.price, plan.liveClassPrice]), [['1-month', 30, 1000, 7000], ['3-months', 90, 2000, 9000], ['6-months', 180, 3000, 12000]]);
  assert.equal(findPlan('12-months'), null);
});

test('the plan list is public', async () => {
  await withApp(async ({ base }) => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).length, 3);
  });
});

test('a student sends a payment with the required screenshot, the server sets the price, and super admins are emailed', async () => {
  await withApp(async ({ base, as, stub, setWaiting }) => {
    const created = [];
    const sent = [];
    emailTransport.setEmailSettingsLoader(async () => ({ provider: 'test', send: async message => { sent.push(message); } }));
    stub(User, 'find', filter => { assert.deepEqual(filter, { role: 'superadmin' }); return { select: async () => [{ email: 'owner@example.com' }, { email: 'owner@example.com' }, { email: 'second@example.com' }] }; });
    stub(PlanRequest, 'findOneAndUpdate', async () => null);
    stub(PlanRequest, 'create', async fields => { created.push(fields); return { _id: REQUEST_ID, status: 'pending', ...fields }; });
    const send = (body, who = STUDENT_ID) => fetch(`${base}/requests`, { method: 'POST', headers: as(who), body: JSON.stringify(body) });
    try {
      assert.equal((await fetch(`${base}/requests`, { method: 'POST', body: JSON.stringify({ planId: '3-months', ...PAYMENT }) })).status, 401);
      assert.equal((await send({ planId: 'free', ...PAYMENT })).status, 400);
      assert.equal((await send({ planId: '3-months', method: 'cash', screenshot: SCREENSHOT })).status, 400);
      const missing = await send({ planId: '3-months', method: 'bank' });
      assert.equal(missing.status, 400);
      assert.match((await missing.json()).error, /screenshot of your payment\. It’s required/);
      assert.equal((await send({ planId: '3-months', method: 'bank', screenshot: 'https://example.com/tracker.png' })).status, 400, 'only uploaded screenshots are accepted');
      assert.equal((await send({ planId: '3-months', ...PAYMENT, reference: 'x'.repeat(121) })).status, 400);
      assert.equal((await send({ planId: '3-months', ...PAYMENT, note: 'x'.repeat(501) })).status, 400);
      assert.equal(created.length, 0);

      const first = await send({ planId: '3-months', price: 1, method: 'bank', screenshot: SCREENSHOT, reference: ' TX-1001 ', note: 'Paid from my account' });
      assert.equal(first.status, 201);
      const { submittedAt, ...payment } = created[0].payment;
      assert.ok(submittedAt instanceof Date);
      assert.deepEqual({ ...created[0], payment }, { user: STUDENT_ID, plan: '3-months', price: 2000, days: 90, liveClass: false, liveClassPrice: 0, payment: { method: 'bank', screenshot: SCREENSHOT, reference: 'TX-1001', note: 'Paid from my account' } });
      await new Promise(resolve => setTimeout(resolve, 20));
      assert.deepEqual(sent.map(message => message.to), ['owner@example.com', 'second@example.com']);
      assert.equal(sent[0].replyTo, 'sita@example.com');
      assert.equal(sent[0].subject, 'Plan payment: Sita · 3 months · Rs 2,000');
      assert.match(sent[0].text, /Paid by: Bank transfer/);
      assert.match(sent[0].text, /Transaction ID: TX-1001/);
      assert.ok(sent[0].text.includes(`Payment screenshot: ${SCREENSHOT}`));

      // While that payment is being checked, another one is refused.
      setWaiting({ plan: '3-months' });
      const again = await send({ planId: '6-months', ...PAYMENT });
      assert.equal(again.status, 409);
      assert.match((await again.json()).error, /checking your payment for the 3 months plan/);
      assert.equal(created.length, 1);

      assert.equal((await send({ planId: '1-month', ...PAYMENT }, ADMIN_ID)).status, 403);
    } finally {
      emailTransport.setEmailSettingsLoader(async () => null);
    }
  });
});

test('an older request without a payment becomes the payment', async () => {
  await withApp(async ({ base, as, stub }) => {
    let created = 0;
    stub(PlanRequest, 'findOneAndUpdate', async (filter, update) => { assert.equal(update.$set.payment.method, 'qr'); return { _id: REQUEST_ID, status: 'pending', plan: '1-month', price: 1000, days: 30 }; });
    stub(PlanRequest, 'create', async () => { created += 1; });
    stub(User, 'find', () => ({ select: async () => [] }));
    const response = await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '6-months', ...PAYMENT }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.plan, '6-months');
    assert.equal(body.payment.screenshot, SCREENSHOT);
    assert.equal(created, 0);
  });
});

test('a sent payment can’t be cancelled; a request without one can', async () => {
  await withApp(async ({ base, as, stub }) => {
    let paid = true;
    let deleted = 0;
    stub(PlanRequest, 'exists', async () => (paid ? { _id: REQUEST_ID } : null));
    stub(PlanRequest, 'findOneAndDelete', async () => { deleted += 1; return { _id: REQUEST_ID }; });
    const blocked = await fetch(`${base}/requests/my`, { method: 'DELETE', headers: as(STUDENT_ID) });
    assert.equal(blocked.status, 409);
    assert.equal(deleted, 0);
    paid = false;
    assert.equal((await fetch(`${base}/requests/my`, { method: 'DELETE', headers: as(STUDENT_ID) })).status, 200);
    assert.equal(deleted, 1);
  });
});

test('payment screenshots upload for students only, as images', async () => {
  await withApp(async ({ base, as }) => {
    const upload = (who, name, type) => {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array([137, 80, 78, 71])], { type }), name);
      const headers = as(who);
      delete headers['Content-Type'];
      return fetch(`${base}/payment-proof`, { method: 'POST', headers, body: form });
    };
    assert.equal((await upload(ADMIN_ID, 'receipt.png', 'image/png')).status, 403);
    const wrongType = await upload(STUDENT_ID, 'receipt.pdf', 'application/pdf');
    assert.equal(wrongType.status, 400);
    assert.match((await wrongType.json()).error, /JPG, PNG or WebP/);
    assert.equal((await fetch(`${base}/payment-proof`, { method: 'POST' })).status, 401);
  });
});

test('a failed plan email still accepts the request and records why it failed', async () => {
  await withApp(async ({ base, as, stub, saved }) => {
    const errors = [];
    stub(console, 'error', (...args) => errors.push(args.join(' ')));
    emailTransport.setEmailSettingsLoader(async () => ({ provider: 'test', send: async () => { throw new Error('mailbox offline'); } }));
    stub(User, 'find', () => ({ select: async () => [{ email: 'owner@example.com' }] }));
    stub(PlanRequest, 'findOneAndUpdate', async () => null);
    stub(PlanRequest, 'create', async fields => ({ _id: REQUEST_ID, status: 'pending', ...fields }));
    try {
      const response = await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '1-month', ...PAYMENT }) });
      assert.equal(response.status, 201);
      await new Promise(resolve => setTimeout(resolve, 20));
      assert.ok(errors.some(line => line.includes('mailbox offline')));
      const status = saved.at(-1).update.$set.adminEmail;
      assert.deepEqual(status.sentTo, []);
      assert.equal(status.error, 'owner@example.com: mailbox offline');
    } finally {
      emailTransport.setEmailSettingsLoader(async () => null);
    }
  });
});

test('admins can resend the plan email and see whether it was delivered', async () => {
  await withApp(async ({ base, as, stub, saved }) => {
    stub(PlanRequest, 'findById', async () => ({ _id: REQUEST_ID, user: STUDENT_ID, plan: '6-months', price: 3000, days: 180, status: 'pending' }));
    stub(User, 'find', () => ({ select: async () => [{ email: 'owner@example.com' }] }));
    try {
      emailTransport.setEmailSettingsLoader(async () => null);
      const previousEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        assert.equal((await fetch(`${base}/requests/${REQUEST_ID}/notify`, { method: 'POST', headers: as(STUDENT_ID) })).status, 403);
        const failed = await fetch(`${base}/requests/${REQUEST_ID}/notify`, { method: 'POST', headers: as(ADMIN_ID) });
        assert.equal(failed.status, 502);
        assert.equal((await failed.json()).error, 'Email not sent: owner@example.com: Email delivery is not configured');
      } finally {
        if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
      }
      const sent = [];
      emailTransport.setEmailSettingsLoader(async () => ({ provider: 'test', send: async message => { sent.push(message); } }));
      const ok = await fetch(`${base}/requests/${REQUEST_ID}/notify`, { method: 'POST', headers: as(ADMIN_ID) });
      assert.equal(ok.status, 200);
      assert.deepEqual((await ok.json()).adminEmail.sentTo, ['owner@example.com']);
      assert.equal(sent[0].replyTo, 'sita@example.com');
      assert.deepEqual(saved.at(-1).update.$set.adminEmail.sentTo, ['owner@example.com']);
    } finally {
      emailTransport.setEmailSettingsLoader(async () => null);
    }
  });
});

test('no super admin email is reported instead of silently skipped', async () => {
  const restore = [];
  stub(User, 'findById', () => ({ select: async () => ({ name: 'Sita', email: 'sita@example.com' }) }), restore);
  stub(User, 'find', () => ({ select: async () => [{ email: '' }] }), restore);
  try {
    const { notifyPlanRequest } = require('../utils/planRequestEmail');
    assert.deepEqual(await notifyPlanRequest({ studentId: STUDENT_ID, request: { plan: '1-month', price: 1000, days: 30 } }), { sentTo: [], error: 'No super admin account has an email address.' });
  } finally {
    restore.reverse().forEach(undo => undo());
  }
});

test('students with an active plan cannot request another until it ends', async () => {
  await withApp(async ({ base, as, stub, setActivePass }) => {
    let created = 0;
    stub(PlanRequest, 'findOneAndUpdate', async () => null);
    stub(PlanRequest, 'create', async fields => { created += 1; return { _id: REQUEST_ID, ...fields }; });
    setActivePass({ expiresAt: new Date('2027-03-12T00:00:00.000Z') });
    const response = await fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify({ planId: '1-month', ...PAYMENT }) });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /already active until 12 Mar 2027/);
    assert.equal(created, 0);
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

test('live classes can be added at checkout, and the prices a super admin set are used', async () => {
  await withApp(async ({ base, as, stub, setPrices }) => {
    const created = [];
    stub(PlanRequest, 'findOneAndUpdate', async () => null);
    stub(PlanRequest, 'create', async fields => { created.push(fields); return { _id: REQUEST_ID, status: 'pending', ...fields }; });
    stub(User, 'find', () => ({ select: async () => [] }));
    const send = body => fetch(`${base}/requests`, { method: 'POST', headers: as(STUDENT_ID), body: JSON.stringify(body) });
    assert.equal((await send({ planId: '3-months', ...PAYMENT, liveClass: 'yes' })).status, 400);
    assert.equal((await send({ planId: '3-months', ...PAYMENT, liveClass: true, price: 1, liveClassPrice: 1 })).status, 201);
    assert.equal(created[0].price, 2000);
    assert.equal(created[0].liveClass, true);
    assert.equal(created[0].liveClassPrice, 9000);

    setPrices({ '3-months': { plan: 2500, liveClass: 9500 }, '6-months': { plan: -4, liveClass: 'free' } });
    const plans = await (await fetch(base)).json();
    assert.deepEqual(plans.map(plan => [plan.id, plan.price, plan.liveClassPrice]), [['1-month', 1000, 7000], ['3-months', 2500, 9500], ['6-months', 3000, 12000]], 'invalid saved prices fall back to the defaults');
    assert.equal((await send({ planId: '3-months', ...PAYMENT, liveClass: true })).status, 201);
    assert.equal(created[1].price, 2500);
    assert.equal(created[1].liveClassPrice, 9500);
  });
});

test('the plan email shows live classes and the total', () => {
  const message = planRequestMessage({ student: { name: 'Sita', email: 'sita@example.com' }, request: { plan: '6-months', price: 3000, days: 180, liveClass: true, liveClassPrice: 12000, payment: { method: 'bank', screenshot: SCREENSHOT } }, adminUrl: 'https://example.com/admin/subscriptions' });
  assert.equal(message.subject, 'Plan payment: Sita · 6 months + live classes · Rs 15,000');
  assert.match(message.text, /Amount paid: Rs 15,000/);
  assert.match(message.text, /Breakdown: plan Rs 3,000 \+ live classes \(6 months\) Rs 12,000/);
});
