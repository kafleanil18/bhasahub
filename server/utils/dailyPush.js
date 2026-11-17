const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const PracticeReminderSetting = require('../models/PracticeReminderSetting');
const StudioActivity = require('../models/StudioActivity');
const Progress = require('../models/Progress');
const VocabSchedule = require('../models/VocabSchedule');
const HskAttempt = require('../models/HskAttempt');

const LATEST_SEND_MINUTES = 22 * 60; // Never remind after 10 pm local time.
const MESSAGES = [
  '你好! Five minutes of Chinese today?',
  'A few tones a day keeps them sharp. Ready?',
  'Your Chinese practice is waiting. 加油!',
  'Quick round of listening practice before bed?',
  'Small steps every day. Practise one studio now?',
];

let configuredKey = '';
// Returns the public key when VAPID is configured, otherwise ''.
function pushPublicKey() {
  const { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey } = process.env;
  if (!publicKey || !privateKey) return '';
  const subject = process.env.VAPID_SUBJECT || process.env.CLIENT_URL || 'https://localhost';
  const key = `${subject}|${publicKey}|${privateKey}`;
  if (configuredKey !== key) {
    try { webpush.setVapidDetails(subject, publicKey, privateKey); configuredKey = key; }
    catch { console.error('Push notifications are misconfigured. Check the VAPID settings.'); return ''; }
  }
  return publicKey;
}

function validTimezone(timezone) {
  if (typeof timezone !== 'string' || !timezone || timezone.length > 64) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); return true; } catch { return false; }
}

// The wall-clock date and time for `now` in the student's timezone.
function localDateTime(now, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: validTimezone(timezone) ? timezone : 'UTC', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now).map(part => [part.type, part.value]));
  const hours = Number(parts.hour), minutes = Number(parts.minute), seconds = Number(parts.second);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hours * 60 + minutes,
    // The instant of local midnight today.
    midnight: new Date(now.getTime() - ((hours * 60 + minutes) * 60 + seconds) * 1000 - now.getMilliseconds()),
  };
}

const toMinutes = time => { const [h, m] = String(time).split(':').map(Number); return h * 60 + m; };

function isDue(setting, now) {
  if (!setting?.enabled) return false;
  const local = localDateTime(now, setting.timezone);
  return setting.lastHandledDate !== local.date && local.minutes >= toMinutes(setting.time) && local.minutes < LATEST_SEND_MINUTES;
}

async function practisedSince(user, since) {
  const checks = await Promise.all([
    StudioActivity.exists({ user, createdAt: { $gte: since } }),
    Progress.exists({ user, updatedAt: { $gte: since } }),
    VocabSchedule.exists({ user, lastReviewedAt: { $gte: since } }),
    HskAttempt.exists({ user, createdAt: { $gte: since } }),
  ]);
  return checks.some(Boolean);
}

// Consecutive days with studio practice ending yesterday (today has no practice yet).
async function streakDays(user, now, timezone) {
  const rows = await StudioActivity.find({ user, createdAt: { $gte: new Date(now.getTime() - 32 * 86400000) } }).select('createdAt').lean();
  const days = new Set(rows.map(row => localDateTime(row.createdAt, timezone).date));
  let streak = 0;
  for (let offset = 1; offset <= 31; offset++) {
    if (!days.has(localDateTime(new Date(now.getTime() - offset * 86400000), timezone).date)) break;
    streak++;
  }
  return streak;
}

function reminderPayload(streak, date) {
  const index = [...date].reduce((sum, char) => sum + char.charCodeAt(0), 0) % MESSAGES.length;
  return {
    title: streak >= 2 ? `🔥 ${streak}-day streak — keep it going!` : 'Time for Chinese practice',
    body: MESSAGES[index], url: '/', tag: 'daily-practice',
  };
}

// Sends to every device of a user. Expired subscriptions are removed.
async function sendToUser(user, payload) {
  const subscriptions = await PushSubscription.find({ user }).lean();
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal', topic: 'daily-practice' });
      sent++;
      await PushSubscription.updateOne({ _id: subscription._id }, { $set: { lastSuccessAt: new Date() } });
    } catch (error) {
      if ([404, 410].includes(error.statusCode)) await PushSubscription.deleteOne({ _id: subscription._id });
      else console.error(`Push delivery failed (${error.statusCode || 'network'}).`);
    }
  }
  return { devices: subscriptions.length, sent };
}

async function runDailyReminders(now = new Date()) {
  const result = { checked: 0, sent: 0, skipped: 0 };
  if (!pushPublicKey()) return result;
  const settings = await PracticeReminderSetting.find({ enabled: true }).lean();
  for (const setting of settings) {
    if (!isDue(setting, now)) continue;
    result.checked++;
    const local = localDateTime(now, setting.timezone);
    // Claim the day first so overlapping runs (timer + cron) never send twice.
    const claimed = await PracticeReminderSetting.findOneAndUpdate(
      { _id: setting._id, enabled: true, lastHandledDate: { $ne: local.date } },
      { $set: { lastHandledDate: local.date } },
    );
    if (!claimed) continue;
    try {
      if (await practisedSince(setting.user, local.midnight)) { result.skipped++; continue; }
      const streak = await streakDays(setting.user, now, setting.timezone);
      const { sent } = await sendToUser(setting.user, reminderPayload(streak, local.date));
      result.sent += sent;
    } catch { console.error('A daily practice reminder could not be processed.'); }
  }
  return result;
}

function startDailyPushWorker(intervalMs = 10 * 60 * 1000) {
  let stopped = false, timer;
  async function tick() {
    try { await runDailyReminders(); } catch { console.error('Daily practice reminders are temporarily unavailable.'); }
    if (!stopped) { timer = setTimeout(tick, intervalMs); timer.unref(); }
  }
  timer = setTimeout(tick, 30000); timer.unref();
  return { stop() { stopped = true; clearTimeout(timer); } };
}

module.exports = { pushPublicKey, validTimezone, localDateTime, isDue, practisedSince, streakDays, reminderPayload, sendToUser, runDailyReminders, startDailyPushWorker };
