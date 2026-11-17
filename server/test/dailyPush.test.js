const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Setting = require('../models/PracticeReminderSetting');
const StudioActivity = require('../models/StudioActivity');
const Progress = require('../models/Progress');
const VocabSchedule = require('../models/VocabSchedule');
const HskAttempt = require('../models/HskAttempt');
const push = require('../utils/dailyPush');
const router = require('../routes/push');

const keys = webpush.generateVAPIDKeys();
const user = { id: '507f1f77bcf86cd799439011', role: 'student' };
const env = {};
beforeEach(() => {
  for (const [key, value] of Object.entries({ VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, VAPID_SUBJECT: 'https://example.com', PUSH_CRON_SECRET: 'a-very-long-cron-secret' })) {
    env[key] = process.env[key]; process.env[key] = value;
  }
});
afterEach(() => {
  mock.restoreAll();
  for (const [key, value] of Object.entries(env)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
const handler = (method, path) => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const lean = value => ({ lean: async () => value, select() { return this; } });

// 13:20 UTC is 19:05 in Kathmandu (UTC+5:45).
const evening = new Date('2026-11-17T13:20:00Z');
const setting = (overrides = {}) => ({ _id: 's1', user: user.id, enabled: true, time: '19:00', timezone: 'Asia/Kathmandu', lastHandledDate: '', ...overrides });

test('local date and time follow the student timezone, including across midnight', () => {
  assert.deepEqual((({ date, minutes }) => ({ date, minutes }))(push.localDateTime(evening, 'Asia/Kathmandu')), { date: '2026-11-17', minutes: 19 * 60 + 5 });
  const late = push.localDateTime(new Date('2026-11-17T18:20:00Z'), 'Asia/Kathmandu');
  assert.equal(late.date, '2026-11-18'); assert.equal(late.minutes, 5);
  assert.equal(late.midnight.toISOString(), '2026-11-17T18:15:00.000Z');
  assert.equal(push.localDateTime(evening, 'America/New_York').date, '2026-11-17');
  assert.equal(push.validTimezone('Asia/Kathmandu'), true);
  assert.equal(push.validTimezone('Mars/Base'), false);
});

test('a reminder is due once per local day, after the chosen time and before 10 pm', () => {
  assert.equal(push.isDue(setting(), evening), true);
  assert.equal(push.isDue(setting({ time: '19:30' }), evening), false);
  assert.equal(push.isDue(setting({ lastHandledDate: '2026-11-17' }), evening), false);
  assert.equal(push.isDue(setting({ enabled: false }), evening), false);
  assert.equal(push.isDue(setting({ time: '07:00' }), new Date('2026-11-17T16:30:00Z')), false); // 22:15 local
});

function practice({ practised = false, subscriptions = [{ _id: 'p1', endpoint: 'https://push.example/1', keys: { p256dh: 'abc', auth: 'def' } }], settings = [setting()], claim = true, activity = [] } = {}) {
  mock.method(Setting, 'find', () => lean(settings));
  const claims = mock.method(Setting, 'findOneAndUpdate', async () => (claim ? { _id: 's1' } : null));
  for (const model of [StudioActivity, Progress, VocabSchedule, HskAttempt]) mock.method(model, 'exists', async () => (practised && model === StudioActivity ? { _id: 'a' } : null));
  mock.method(StudioActivity, 'find', () => lean(activity));
  mock.method(PushSubscription, 'find', () => lean(subscriptions));
  mock.method(PushSubscription, 'updateOne', async () => ({}));
  const deleted = mock.method(PushSubscription, 'deleteOne', async () => ({}));
  const sent = mock.method(webpush, 'sendNotification', async () => ({ statusCode: 201 }));
  return { claims, sent, deleted };
}

test('due students who have not practised get one notification per device with their streak', async () => {
  const { claims, sent } = practice({ activity: [{ createdAt: new Date('2026-11-16T10:00:00Z') }, { createdAt: new Date('2026-11-15T10:00:00Z') }] });
  const result = await push.runDailyReminders(evening);
  assert.deepEqual(result, { checked: 1, sent: 1, skipped: 0 });
  assert.deepEqual(claims.mock.calls[0].arguments[0], { _id: 's1', enabled: true, lastHandledDate: { $ne: '2026-11-17' } });
  const payload = JSON.parse(sent.mock.calls[0].arguments[1]);
  assert.equal(payload.title, '🔥 2-day streak — keep it going!');
  assert.equal(payload.url, '/');
});

test('students who already practised today are skipped but the day is still handled', async () => {
  const { claims, sent } = practice({ practised: true });
  assert.deepEqual(await push.runDailyReminders(evening), { checked: 1, sent: 0, skipped: 1 });
  assert.equal(claims.mock.callCount(), 1); assert.equal(sent.mock.callCount(), 0);
});

test('a day already claimed by another run never sends twice', async () => {
  const { sent } = practice({ claim: false });
  assert.equal((await push.runDailyReminders(evening)).sent, 0);
  assert.equal(sent.mock.callCount(), 0);
});

test('expired subscriptions are removed and other devices still receive the reminder', async () => {
  const { sent, deleted } = practice({ subscriptions: [
    { _id: 'gone', endpoint: 'https://push.example/gone', keys: { p256dh: 'a', auth: 'b' } },
    { _id: 'ok', endpoint: 'https://push.example/ok', keys: { p256dh: 'a', auth: 'b' } },
  ] });
  sent.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('Gone'), { statusCode: 410 }); });
  assert.equal((await push.runDailyReminders(evening)).sent, 1);
  assert.deepEqual(deleted.mock.calls[0].arguments[0], { _id: 'gone' });
});

test('nothing is sent when push keys are not configured', async () => {
  delete process.env.VAPID_PUBLIC_KEY;
  const { sent } = practice();
  assert.deepEqual(await push.runDailyReminders(evening), { checked: 0, sent: 0, skipped: 0 });
  assert.equal(sent.mock.callCount(), 0);
});

test('the cron endpoint requires the shared secret', async () => {
  practice({ settings: [] });
  for (const authorization of [undefined, 'Bearer wrong', 'Bearer a-very-long-cron-secreT']) {
    const res = response(); await handler('post', '/run')({ headers: { authorization } }, res);
    assert.equal(res.code, 401);
  }
  const res = response(); await handler('post', '/run')({ headers: { authorization: 'Bearer a-very-long-cron-secret' } }, res);
  assert.equal(res.code, 200);
  process.env.PUSH_CRON_SECRET = '';
  const open = response(); await handler('post', '/run')({ headers: { authorization: 'Bearer ' } }, open);
  assert.equal(open.code, 401);
});

const validSubscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', keys: { p256dh: 'BOr1x2y3z4abcdefghij', auth: 'abcdefghijkl' } };

test('subscriptions are validated before saving', async () => {
  const saves = mock.method(PushSubscription, 'findOneAndUpdate', async () => ({}));
  for (const body of [
    { subscription: { ...validSubscription, endpoint: 'http://insecure.example/1' }, time: '19:00', timezone: 'Asia/Kathmandu' },
    { subscription: { ...validSubscription, keys: { p256dh: 'bad key!', auth: 'abcdefghijkl' } }, time: '19:00', timezone: 'Asia/Kathmandu' },
    { subscription: validSubscription, time: '25:00', timezone: 'Asia/Kathmandu' },
    { subscription: validSubscription, time: '19:00', timezone: 'Nowhere/Here' },
  ]) {
    const res = response(); await handler('post', '/subscriptions')({ user, body, headers: {} }, res);
    assert.equal(res.code, 400);
  }
  assert.equal(saves.mock.callCount(), 0);
});

test('subscribing assigns the device to the signed-in student and enables reminders', async () => {
  const saved = mock.method(PushSubscription, 'findOneAndUpdate', async () => ({}));
  const settings = mock.method(Setting, 'findOneAndUpdate', () => lean({ enabled: true, time: '07:30', timezone: 'Asia/Kathmandu' }));
  const res = response();
  await handler('post', '/subscriptions')({ user, body: { subscription: validSubscription, time: '07:30', timezone: 'Asia/Kathmandu' }, headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/131.0' } }, res);
  assert.equal(res.code, 201);
  assert.deepEqual(saved.mock.calls[0].arguments[0], { endpoint: validSubscription.endpoint });
  assert.equal(saved.mock.calls[0].arguments[1].$set.user, user.id);
  assert.equal(saved.mock.calls[0].arguments[1].$set.device, 'Chrome on Android');
  assert.deepEqual(settings.mock.calls[0].arguments[1], { $set: { enabled: true, time: '07:30', timezone: 'Asia/Kathmandu' } });
  assert.deepEqual(res.body, { enabled: true, time: '07:30', timezone: 'Asia/Kathmandu', thisDevice: true });
});

test('removing the last device turns reminders off', async () => {
  const removed = mock.method(PushSubscription, 'deleteOne', async () => ({}));
  mock.method(PushSubscription, 'countDocuments', async () => 0);
  const updated = mock.method(Setting, 'updateOne', async () => ({}));
  const res = response(); await handler('delete', '/subscriptions')({ user, body: { endpoint: validSubscription.endpoint } }, res);
  assert.deepEqual(removed.mock.calls[0].arguments[0], { user: user.id, endpoint: validSubscription.endpoint });
  assert.deepEqual(updated.mock.calls[0].arguments[1], { $set: { enabled: false } });
  assert.equal(res.body.enabled, false);
});
