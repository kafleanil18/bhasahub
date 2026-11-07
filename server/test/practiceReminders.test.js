const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/Subscription');
const PracticeReminder = require('../models/PracticeReminder');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const email = require('../utils/emailTransport');
const reminders = require('../utils/practiceReminders');
const worker = require('../utils/practiceReminderWorker');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const router = require('../routes/practiceReminders');

const actor = '507f1f77bcf86cd799439010';
const studentId = '507f1f77bcf86cd799439011';
const content = { subject: 'Practice Chinese today', message: 'Take ten minutes to review vocabulary and practice speaking.' };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const handler = (method, path) => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
let subs;
let campaign;
let originalEnv;

function subscription(extra = {}) {
  return { expiresAt: new Date(Date.now() + 86400000), course: { language: 'chinese', published: true }, user: { _id: studentId, name: 'Student', email: 'student@example.com', role: 'student' }, ...extra };
}

beforeEach(() => {
  originalEnv = { JWT_SECRET: process.env.JWT_SECRET, CLIENT_URL: process.env.CLIENT_URL };
  process.env.JWT_SECRET = 'practice-reminder-test-secret'; process.env.CLIENT_URL = 'https://learn.example.com';
  subs = [subscription()]; campaign = null;
  mock.method(Subscription, 'find', filter => ({
    populate() { return this; },
    lean: async () => subs.filter(sub => !filter.user || String(sub.user?._id) === String(filter.user)),
  }));
  mock.method(PracticeReminder, 'findOne', () => ({ lean: async () => campaign }));
  mock.method(PracticeReminder, 'create', async data => {
    campaign = { ...data, _id: '507f1f77bcf86cd799439022', createdAt: new Date() }; return campaign;
  });
  mock.method(PracticeReminder, 'findOneAndUpdate', (_filter, update) => ({ lean: async () => {
    const recipient = campaign?.recipients.find(item => item.status === 'pending');
    if (!recipient) return null;
    recipient.status = 'sending'; recipient.claimId = update.$set['recipients.$.claimId']; recipient.attemptedAt = update.$set['recipients.$.attemptedAt'];
    return structuredClone(campaign);
  } }));
  mock.method(PracticeReminder, 'updateOne', async (filter, update) => {
    campaign.recipients.find(item => item.claimId === filter['recipients.claimId']).status = update.$set['recipients.$.status']; return { modifiedCount: 1 };
  });
  mock.method(AuditLog, 'create', async () => ({}));
  mock.method(email, 'isEmailConfigured', async () => true);
  mock.method(email, 'sendEmail', async () => {});
});

afterEach(() => {
  mock.restoreAll();
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

async function preview() {
  const res = response(); await handler('post', '/preview')({ user: { id: actor }, body: content }, res);
  assert.equal(res.code, 200); return res.body;
}

async function enqueue(extra = {}) {
  const reviewed = await preview();
  const body = { ...content, previewToken: reviewed.previewToken, requestId: crypto.randomUUID(), ...extra };
  const res = response(); await handler('post', '/campaigns')({ user: { id: actor }, body }, res);
  return { res, body };
}

test('eligibility includes only active subscribed students in published Chinese courses, deduplicated by email', async () => {
  const student = subscription().user;
  subs = [
    subscription(), subscription(),
    subscription({ expiresAt: new Date(Date.now() - 1), user: { ...student, email: 'expired@example.com' } }),
    subscription({ user: { ...student, role: 'admin', email: 'admin@example.com' } }),
    subscription({ user: { ...student, role: 'superadmin', email: 'owner@example.com' } }),
    subscription({ user: { ...student, practiceReminderOptOut: true, email: 'optout@example.com' } }),
    subscription({ user: null }), subscription({ course: null }),
    subscription({ course: { language: 'chinese', published: false }, user: { ...student, email: 'hidden@example.com' } }),
    subscription({ course: { language: 'other', published: true }, user: { ...student, email: 'other@example.com' } }),
    subscription({ user: { ...student, email: 'bad@example.com,other@example.com' } }),
  ];
  const result = await reminders.eligibleStudents();
  assert.deepEqual(result, [{ user: studentId, name: 'Student', email: 'student@example.com' }]);
  const filter = Subscription.find.mock.calls[0].arguments[0]; assert.ok(filter.expiresAt.$gt instanceof Date);
});

test('only a current superadmin can access sending endpoints even with a stale token', async () => {
  assert.ok(router.stack.some(layer => layer.handle === requireAuth));
  assert.ok(router.stack.some(layer => layer.handle === requireSuperAdmin));
  let res = response(); await requireAuth({ headers: {} }, res, () => assert.fail('anonymous access')); assert.equal(res.code, 401);
  for (const role of ['student', 'admin', 'superadmin']) {
    mock.method(User, 'findById', () => ({ select: async () => ({ _id: actor, role }) }));
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: actor, role: 'superadmin' }, process.env.JWT_SECRET)}` } };
    res = response(); let allowed = false;
    await requireAuth(req, res, () => requireSuperAdmin(req, res, () => { allowed = true; }));
    assert.equal(allowed, role === 'superadmin');
  }
});

test('preview binds the actor, message, audience, and practice site; preview never sends', async () => {
  const reviewed = await preview();
  const students = await reminders.eligibleStudents();
  assert.equal(reviewed.audience.count, 1); assert.equal(reviewed.practiceUrl, 'https://learn.example.com/my-courses');
  assert.doesNotThrow(() => reminders.checkPreview(reviewed.previewToken, actor, students, content, reminders.clientUrl()));
  for (const args of [
    [reviewed.previewToken, 'another-actor', students, content, reminders.clientUrl()],
    [reviewed.previewToken, actor, [], content, reminders.clientUrl()],
    [reviewed.previewToken, actor, students, { ...content, message: 'Changed' }, reminders.clientUrl()],
    [reviewed.previewToken, actor, students, content, 'https://another.example.com'],
    ['invalid', actor, students, content, reminders.clientUrl()],
  ]) assert.throws(() => reminders.checkPreview(...args), error => error.status === 409);
  assert.equal(jwt.decode(reviewed.previewToken).id, undefined);
  assert.equal(email.sendEmail.mock.callCount(), 0);
});

test('confirmation creates one durable campaign and retries return the same campaign without resending', async () => {
  const { res, body } = await enqueue();
  assert.equal(res.code, 202); assert.equal(res.body.total, 1); assert.equal(res.body.counts.pending, 1);
  const again = response(); await handler('post', '/campaigns')({ user: { id: actor }, body }, again);
  assert.equal(again.body.id, res.body.id); assert.equal(PracticeReminder.create.mock.callCount(), 1);
  assert.equal(email.sendEmail.mock.callCount(), 0);
});

test('changing content or eligible audience after review requires a fresh preview', async () => {
  const reviewed = await preview(); subs[0].user.practiceReminderOptOut = true;
  const res = response();
  await handler('post', '/campaigns')({ user: { id: actor }, body: { ...content, previewToken: reviewed.previewToken, requestId: crypto.randomUUID(), recipients: ['attacker@example.com'] } }, res);
  assert.equal(res.code, 409); assert.equal(PracticeReminder.create.mock.callCount(), 0);
});

test('recipient lists supplied by clients are ignored; concurrent duplicate requests use the existing campaign', async () => {
  const reviewed = await preview();
  const existing = { _id: 'saved', ...content, createdAt: new Date(), recipients: [{ user: studentId, email: 'student@example.com', status: 'pending' }] };
  let lookups = 0;
  PracticeReminder.findOne.mock.restore();
  mock.method(PracticeReminder, 'findOne', () => ({ lean: async () => ++lookups === 1 ? null : existing }));
  PracticeReminder.create.mock.restore();
  mock.method(PracticeReminder, 'create', async data => {
    assert.deepEqual(data.recipients.map(item => item.email), ['student@example.com']);
    const error = new Error('duplicate'); error.code = 11000; throw error;
  });
  const res = response();
  await handler('post', '/campaigns')({ user: { id: actor }, body: { ...content, previewToken: reviewed.previewToken, requestId: crypto.randomUUID(), recipients: ['attacker@example.com'] } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.id, 'saved');
});

test('worker sends a separate personalized email through required delivery and never repeats sent recipients', async () => {
  await enqueue();
  assert.equal(await worker.processNextReminder(), true);
  assert.equal(campaign.recipients[0].status, 'sent');
  const [payload, , options] = email.sendEmail.mock.calls[0].arguments;
  assert.equal(payload.to, 'student@example.com'); assert.equal(payload.bcc, undefined); assert.equal(payload.cc, undefined);
  assert.match(payload.text, /Hi Student/); assert.match(payload.text, /https:\/\/learn.example.com\/my-courses/);
  assert.match(payload.text, /Stop practice reminder emails/); assert.deepEqual(options, { requireDelivery: true });
  assert.equal(await worker.processNextReminder(), false); assert.equal(email.sendEmail.mock.callCount(), 1);
});

test('expired access, changed addresses, or opting out before delivery skips the student', async () => {
  for (const invalidate of [() => { subs[0].expiresAt = new Date(0); }, () => { subs[0].user.email = 'changed@example.com'; }, () => { subs[0].user.practiceReminderOptOut = true; }]) {
    campaign = null; subs = [subscription()];
    await enqueue(); invalidate();
    await worker.processNextReminder(); assert.equal(campaign.recipients[0].status, 'skipped');
  }
  assert.equal(email.sendEmail.mock.callCount(), 0);
});

test('provider failure is counted and does not silently succeed or automatically resend', async () => {
  await enqueue();
  email.sendEmail.mock.restore(); mock.method(email, 'sendEmail', async () => { throw new Error('provider rejected'); });
  await worker.processNextReminder();
  assert.equal(campaign.recipients[0].status, 'failed');
  assert.equal(await worker.processNextReminder(), false);
  assert.equal(reminders.campaignSummary(campaign).counts.failed, 1);
});

test('interrupted result recording leaves an uncertain delivery instead of sending a duplicate', async () => {
  await enqueue();
  PracticeReminder.updateOne.mock.restore(); mock.method(PracticeReminder, 'updateOne', async () => { throw new Error('database outage'); });
  await assert.rejects(worker.processNextReminder(), /database outage/);
  assert.equal(campaign.recipients[0].status, 'sending');
  mock.method(PracticeReminder, 'updateMany', async (filter, update, options) => {
    assert.equal(update.$set['recipients.$[recipient].status'], 'uncertain');
    assert.equal(options.arrayFilters[0]['recipient.status'], 'sending');
    for (const recipient of campaign.recipients) if (recipient.status === 'sending' && recipient.attemptedAt < filter.recipients.$elemMatch.attemptedAt.$lt) recipient.status = 'uncertain';
  });
  await worker.recoverInterruptedDeliveries(new Date(Date.now() + 11 * 60000));
  assert.equal(campaign.recipients[0].status, 'uncertain');
  assert.equal(await worker.processNextReminder(), false); assert.equal(email.sendEmail.mock.callCount(), 1);
});

test('unsubscribe requires a signed token and changes only the reminder preference', async () => {
  const token = reminders.unsubscribeToken(studentId);
  assert.equal(reminders.unsubscribeUserId(token), studentId);
  assert.throws(() => reminders.unsubscribeUserId(`${studentId}.${'A'.repeat(43)}`));
  assert.throws(() => jwt.verify(token, process.env.JWT_SECRET));
  mock.method(User, 'updateOne', async (filter, update) => {
    assert.deepEqual(filter, { _id: studentId }); assert.deepEqual(update, { $set: { practiceReminderOptOut: true } });
  });
  let res = response(); await handler('post', '/unsubscribe')({ body: { token: 'invalid' } }, res);
  assert.equal(res.code, 400); assert.equal(User.updateOne.mock.callCount(), 0);
  res = response(); await handler('post', '/unsubscribe')({ body: { token } }, res);
  assert.equal(res.code, 200); assert.equal(User.updateOne.mock.callCount(), 1);
});

test('empty audiences, missing email services, and invalid messages cannot be queued', async () => {
  for (const body of [{ ...content, subject: 'Injected\nHeader' }, { ...content, message: '' }, { ...content, subject: 'x'.repeat(161) }, { ...content, message: 'x'.repeat(5001) }]) {
    const res = response(); await handler('post', '/preview')({ body, user: { id: actor } }, res); assert.equal(res.code, 400);
  }
  subs = []; let res = response(); await handler('post', '/preview')({ body: content, user: { id: actor } }, res); assert.equal(res.code, 400);
  subs = [subscription()]; email.isEmailConfigured.mock.restore(); mock.method(email, 'isEmailConfigured', async () => false);
  res = response(); await handler('post', '/preview')({ body: content, user: { id: actor } }, res); assert.equal(res.code, 400);
  assert.equal(PracticeReminder.create.mock.callCount(), 0);
});

test('interactive previews and confirmation send only selected eligible students', async () => {
  const secondId = '507f1f77bcf86cd799439012';
  subs.push(subscription({ user: { _id: secondId, name: 'Second Student', email: 'second@example.com', role: 'student' } }));
  const reviewed = response();
  await handler('post', '/preview')({ user: { id: actor }, body: { ...content, studentIds: [secondId] } }, reviewed);
  assert.equal(reviewed.code, 200); assert.equal(reviewed.body.audience.count, 1);
  assert.deepEqual(reviewed.body.studentIds, [secondId]);
  const res = response();
  await handler('post', '/campaigns')({ user: { id: actor }, body: { ...content, studentIds: reviewed.body.studentIds, previewToken: reviewed.body.previewToken, requestId: crypto.randomUUID() } }, res);
  assert.equal(res.code, 202);
  assert.deepEqual(campaign.recipients.map(student => student.user), [secondId]);
});

test('changing selected IDs after review invalidates the preview', async () => {
  const secondId = '507f1f77bcf86cd799439012';
  subs.push(subscription({ user: { _id: secondId, name: 'Second Student', email: 'second@example.com', role: 'student' } }));
  const reviewed = response();
  await handler('post', '/preview')({ user: { id: actor }, body: { ...content, studentIds: [studentId] } }, reviewed);
  const res = response();
  await handler('post', '/campaigns')({ user: { id: actor }, body: { ...content, studentIds: [secondId], previewToken: reviewed.body.previewToken, requestId: crypto.randomUUID() } }, res);
  assert.equal(res.code, 409); assert.equal(PracticeReminder.create.mock.callCount(), 0);
});

test('newly eligible students are not silently added to a reviewed manual selection', async () => {
  const reviewed = response();
  await handler('post', '/preview')({ user: { id: actor }, body: { ...content, studentIds: [studentId] } }, reviewed);
  subs.push(subscription({ user: { _id: '507f1f77bcf86cd799439012', name: 'New Student', email: 'new@example.com', role: 'student' } }));
  const res = response();
  await handler('post', '/campaigns')({ user: { id: actor }, body: { ...content, studentIds: [studentId], previewToken: reviewed.body.previewToken, requestId: crypto.randomUUID() } }, res);
  assert.equal(res.code, 202); assert.equal(campaign.recipients.length, 1); assert.equal(campaign.recipients[0].user, studentId);
});

test('invalid selections are rejected and a selected student becoming ineligible prevents queuing', async () => {
  for (const studentIds of [[], ['bad-id'], [null], 'all', [{ $ne: null }]]) {
    const res = response(); await handler('post', '/preview')({ user: { id: actor }, body: { ...content, studentIds } }, res); assert.equal(res.code, 400);
  }
  let res = response();
  await handler('post', '/preview')({ user: { id: actor }, body: { ...content, studentIds: ['507f1f77bcf86cd799439099'] } }, res);
  assert.equal(res.code, 409);
  const reviewed = response();
  await handler('post', '/preview')({ user: { id: actor }, body: { ...content, studentIds: [studentId] } }, reviewed);
  subs[0].user.practiceReminderOptOut = true;
  res = response();
  await handler('post', '/campaigns')({ user: { id: actor }, body: { ...content, studentIds: [studentId], previewToken: reviewed.body.previewToken, requestId: crypto.randomUUID() } }, res);
  assert.equal(res.code, 409); assert.equal(PracticeReminder.create.mock.callCount(), 0);
});
