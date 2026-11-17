const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const PushSubscription = require('../models/PushSubscription');
const PracticeReminderSetting = require('../models/PracticeReminderSetting');
const { requireAuth } = require('../middleware/auth');
const push = require('../utils/dailyPush');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });
const testLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many test notifications. Please wait a few minutes.' } });
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

function validEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 1024) return false;
  try { return new URL(endpoint).protocol === 'https:'; } catch { return false; }
}
const validKey = (value, max) => typeof value === 'string' && value.length >= 8 && value.length <= max && BASE64URL.test(value);
const deviceLabel = agent => {
  const ua = String(agent || '');
  const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'browser';
  return `${browser} on ${os}`;
};
const settingView = setting => ({ enabled: !!setting?.enabled, time: setting?.time || '19:00', timezone: setting?.timezone || '' });

function requireConfigured(req, res, next) {
  if (!push.pushPublicKey()) return res.status(503).json({ error: 'Push reminders are not set up on this server yet.' });
  next();
}

// The scheduler endpoint is called by a cron job; it is not a user route.
router.post('/run', async (req, res) => {
  const secret = process.env.PUSH_CRON_SECRET || '';
  const given = String(req.headers.authorization || '').replace(/^Bearer /, '');
  const valid = secret.length >= 16 && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!valid) return res.status(401).json({ error: 'Not authorized' });
  try { res.json(await push.runDailyReminders()); }
  catch { res.status(500).json({ error: 'Could not process reminders' }); }
});

router.use(requireAuth);

router.get('/public-key', (req, res) => {
  const publicKey = push.pushPublicKey();
  res.json({ configured: !!publicKey, publicKey });
});

router.get('/me', async (req, res) => {
  try {
    const endpoint = typeof req.query.endpoint === 'string' ? req.query.endpoint : '';
    const [setting, thisDevice, devices] = await Promise.all([
      PracticeReminderSetting.findOne({ user: req.user.id }).lean(),
      endpoint ? PushSubscription.exists({ user: req.user.id, endpoint }) : null,
      PushSubscription.countDocuments({ user: req.user.id }),
    ]);
    res.json({ ...settingView(setting), devices, thisDevice: !!thisDevice });
  } catch { res.status(500).json({ error: 'Could not load your reminder settings.' }); }
});

router.post('/subscriptions', limiter, requireConfigured, async (req, res) => {
  const { subscription, time = '19:00', timezone } = req.body || {};
  if (!validEndpoint(subscription?.endpoint) || !validKey(subscription?.keys?.p256dh, 200) || !validKey(subscription?.keys?.auth, 100)) {
    return res.status(400).json({ error: 'This browser sent an invalid notification subscription. Please try again.' });
  }
  if (!TIME.test(time) || !push.validTimezone(timezone)) return res.status(400).json({ error: 'Choose a valid reminder time.' });
  try {
    // A shared device belongs to whoever enabled reminders on it most recently.
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { $set: { user: req.user.id, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }, device: deviceLabel(req.headers['user-agent']) } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    const setting = await PracticeReminderSetting.findOneAndUpdate(
      { user: req.user.id }, { $set: { enabled: true, time, timezone } },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(201).json({ ...settingView(setting), thisDevice: true });
  } catch { res.status(500).json({ error: 'Could not turn on reminders. Please try again.' }); }
});

router.delete('/subscriptions', limiter, async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!validEndpoint(endpoint)) return res.status(400).json({ error: 'Missing device subscription.' });
  try {
    await PushSubscription.deleteOne({ user: req.user.id, endpoint });
    const remaining = await PushSubscription.countDocuments({ user: req.user.id });
    if (!remaining) await PracticeReminderSetting.updateOne({ user: req.user.id }, { $set: { enabled: false } });
    res.json({ enabled: remaining > 0, devices: remaining, thisDevice: false });
  } catch { res.status(500).json({ error: 'Could not turn off reminders on this device. Please try again.' }); }
});

router.put('/settings', limiter, async (req, res) => {
  const { time, timezone } = req.body || {};
  if (!TIME.test(time) || !push.validTimezone(timezone)) return res.status(400).json({ error: 'Choose a valid reminder time.' });
  try {
    const setting = await PracticeReminderSetting.findOneAndUpdate(
      { user: req.user.id }, { $set: { time, timezone } }, { returnDocument: 'after', runValidators: true },
    ).lean();
    if (!setting) return res.status(404).json({ error: 'Turn on reminders first.' });
    res.json(settingView(setting));
  } catch { res.status(500).json({ error: 'Could not save your reminder time. Please try again.' }); }
});

router.post('/test', testLimiter, requireConfigured, async (req, res) => {
  try {
    const result = await push.sendToUser(req.user.id, { title: 'Reminders are on ✓', body: 'This is how your daily Chinese practice reminder will look.', url: '/progress', tag: 'daily-practice-test' });
    if (!result.sent) return res.status(404).json({ error: 'No device could receive the test. Turn reminders off and on again on this device.' });
    res.json(result);
  } catch { res.status(500).json({ error: 'Could not send a test notification.' }); }
});

module.exports = router;
