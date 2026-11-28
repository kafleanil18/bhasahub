const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const PaymentSettings = require('../models/PaymentSettings');
const { paymentDetails, SAMPLE_BANK, SAMPLE_QR } = require('../utils/paymentDetails');

// Checkout's bank account and merchant QR: sample details until a super admin saves real ones.
async function withApp(run) {
  const originals = { findOne: PaymentSettings.findOne, findOneAndUpdate: PaymentSettings.findOneAndUpdate, findById: User.findById, create: AuditLog.create };
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'payment-settings-test';
  let stored = null;
  const roles = { boss: 'superadmin', helper: 'admin', learner: 'student' };
  PaymentSettings.findOne = () => ({ lean: async () => stored });
  PaymentSettings.findOneAndUpdate = (filter, { $set }) => ({ lean: async () => (stored = { _id: 'settings', key: 'main', ...$set }) });
  User.findById = id => ({ select: async () => (roles[id] ? { _id: id, role: roles[id] } : null) });
  AuditLog.create = async entry => entry;
  const app = express();
  app.use(express.json());
  app.use('/api/payment-settings', require('../routes/paymentSettings'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/payment-settings`;
  const as = id => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' });
  try { await run({ base, as }); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    Object.assign(PaymentSettings, { findOne: originals.findOne, findOneAndUpdate: originals.findOneAndUpdate });
    User.findById = originals.findById;
    AuditLog.create = originals.create;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
}

test('until real details are saved, checkout shows sample ones, marked as samples', () => withApp(async ({ base, as }) => {
  assert.equal((await fetch(base)).status, 401);
  const details = await (await fetch(base, { headers: as('learner') })).json();
  assert.deepEqual(details.bank, { ...SAMPLE_BANK, sample: true });
  assert.deepEqual(details.qr, { ...SAMPLE_QR, sample: true });
  assert.equal(details.saved, undefined, 'students don’t get the settings form values');
}));

test('a super admin saves the real details; students then see them', () => withApp(async ({ base, as }) => {
  const save = (body, who = 'boss') => fetch(base, { method: 'PUT', headers: as(who), body: JSON.stringify(body) });
  const real = { bank: { bankName: ' Nabil Bank ', accountName: 'Xiao Ao Pvt. Ltd.', accountNumber: '0123456789', branch: 'Lalitpur' }, qr: { image: 'https://res.cloudinary.com/demo/image/upload/qr.png', label: 'Fonepay' }, note: 'Write your email as the remark.' };
  assert.equal((await save(real, 'helper')).status, 403);
  assert.equal((await save(real, 'learner')).status, 403);
  assert.equal((await save({ ...real, bank: { ...real.bank, accountNumber: '9'.repeat(61) } })).status, 400);
  assert.equal((await save({ ...real, qr: { image: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await save({ ...real, note: 7 })).status, 400);

  const saved = await save(real);
  assert.equal(saved.status, 200);
  const body = await saved.json();
  assert.equal(body.saved.bank.bankName, 'Nabil Bank');
  const details = await (await fetch(base, { headers: as('learner') })).json();
  assert.deepEqual(details.bank, { bankName: 'Nabil Bank', accountName: 'Xiao Ao Pvt. Ltd.', accountNumber: '0123456789', branch: 'Lalitpur', sample: false });
  assert.deepEqual(details.qr, { image: real.qr.image, label: 'Fonepay', sample: false });
  assert.equal(details.note, 'Write your email as the remark.');
}));

test('each method switches to real details on its own', () => {
  const onlyBank = paymentDetails({ bank: { bankName: 'Bank', accountName: 'Name', accountNumber: '1' }, qr: { image: '' } });
  assert.equal(onlyBank.bank.sample, false);
  assert.equal(onlyBank.qr.sample, true);
  const partial = paymentDetails({ bank: { bankName: 'Bank', accountName: '', accountNumber: '1' } });
  assert.equal(partial.bank.sample, true, 'a half-filled account stays the sample');
});

test('a super admin changes the plan and live class prices; bad prices are refused', () => withApp(async ({ base, as }) => {
  const save = body => fetch(base, { method: 'PUT', headers: as('boss'), body: JSON.stringify(body) });
  const full = { '1-month': { plan: 1200, liveClass: 7500 }, '3-months': { plan: 2400, liveClass: 9600 }, '6-months': { plan: 3300, liveClass: 12500 } };
  assert.equal((await save({ prices: { ...full, '3-months': { plan: 0, liveClass: 9600 } } })).status, 400);
  assert.equal((await save({ prices: { ...full, '6-months': { plan: 12.5, liveClass: 1 } } })).status, 400);
  assert.equal((await save({ prices: { '1-month': full['1-month'] } })).status, 400, 'every plan needs both prices');
  assert.equal((await save({ prices: [] })).status, 400);
  const saved = await save({ prices: full });
  assert.equal(saved.status, 200);
  const body = await saved.json();
  assert.deepEqual(body.plans.map(plan => [plan.id, plan.price, plan.liveClassPrice]), [['1-month', 1200, 7500], ['3-months', 2400, 9600], ['6-months', 3300, 12500]]);
  const forBoss = await (await fetch(base, { headers: as('boss') })).json();
  assert.equal(forBoss.plans[1].price, 2400);
}));
