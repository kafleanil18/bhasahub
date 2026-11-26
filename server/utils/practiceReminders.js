const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/Subscription');

class ReminderError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function validateMessage(body) {
  if (typeof body?.subject !== 'string' || !body.subject.trim() || body.subject.trim().length > 160 || /[\r\n]/.test(body.subject)) {
    throw new ReminderError('Enter a subject of 1–160 characters on one line.');
  }
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.trim().length > 5000) {
    throw new ReminderError('Enter a message of 1–5,000 characters.');
  }
  return { subject: body.subject.trim(), message: body.message.trim() };
}

function clientUrl() {
  const url = new URL(process.env.CLIENT_URL || 'http://localhost:5173');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid client URL');
  return url.origin;
}

async function eligibleStudents(userId) {
  const now = new Date();
  const subs = await Subscription.find({ expiresAt: { $gt: now }, ...(userId ? { user: userId } : {}) })
    .populate('user', 'name email role practiceReminderOptOut')
    .populate('course', 'language published').lean();
  const students = new Map();
  for (const sub of subs) {
    const user = sub.user;
    if (!user || user.role !== 'student' || user.practiceReminderOptOut || new Date(sub.expiresAt) <= now || sub.course?.language !== 'chinese' || !sub.course.published) continue;
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    if (!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email)) continue;
    if (!students.has(email)) students.set(email, { user: String(user._id), name: user.name || 'Student', email });
  }
  return [...students.values()].sort((a, b) => a.email.localeCompare(b.email));
}

// When each student's Chinese course access ends: the latest active subscription, so the page can
// find students whose access is running out. Kept out of eligibleStudents so preview fingerprints stay unchanged.
async function accessEndDates(students, now = new Date()) {
  const subs = await Subscription.find({ user: { $in: students.map(student => student.user) }, expiresAt: { $gt: now } })
    .populate('course', 'language published').select('user expiresAt course').lean();
  const ends = new Map();
  for (const sub of subs) {
    if (sub.course?.language !== 'chinese' || !sub.course.published) continue;
    const id = String(sub.user), time = new Date(sub.expiresAt).getTime();
    if (!ends.has(id) || time > ends.get(id)) ends.set(id, time);
  }
  return ends;
}

function audienceSummary(students) {
  return { count: students.length, students: students.slice(0, 25).map(({ name, email }) => ({ name, email })) };
}

function selectedStudents(body, eligible) {
  // Existing broadcasts remain supported. The interactive page always supplies IDs.
  if (body.studentIds === undefined) return eligible;
  if (!Array.isArray(body.studentIds) || !body.studentIds.length || body.studentIds.length > 5000 || body.studentIds.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/.test(id))) {
    throw new ReminderError('Select between 1 and 5,000 eligible students before reviewing.');
  }
  const ids = new Set(body.studentIds);
  const selected = eligible.filter(student => ids.has(student.user));
  if (selected.length !== ids.size) throw new ReminderError('Some selected students are no longer eligible. Refresh the student list and review the reminder again.', 409);
  return selected;
}

function fingerprint(students, content, origin) {
  return crypto.createHash('sha256').update(JSON.stringify({ students, content, origin })).digest('hex');
}

function previewToken(actor, students, content, origin) {
  // No session `id` claim: this token cannot be used to authenticate as a user.
  return jwt.sign({ actor, fingerprint: fingerprint(students, content, origin) }, process.env.JWT_SECRET, { audience: 'practice-reminder-preview', expiresIn: '15m' });
}

function checkPreview(token, actor, students, content, origin) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], audience: 'practice-reminder-preview' });
    if (payload.actor === actor && payload.fingerprint === fingerprint(students, content, origin)) return;
  } catch { /* Return the same actionable error for changed and expired previews. */ }
  throw new ReminderError('The message or eligible students changed, or the preview expired. Review the reminder again before sending.', 409);
}

function unsubscribeToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('Reminder signing is not configured');
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`practice-reminder:${userId}`).digest('base64url');
  return `${userId}.${signature}`;
}

function unsubscribeUserId(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{24}\.[A-Za-z0-9_-]{43}$/.test(token)) throw new ReminderError('This unsubscribe link is invalid.');
  const id = token.split('.')[0];
  const expected = unsubscribeToken(id);
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) throw new ReminderError('This unsubscribe link is invalid.');
  return id;
}

function reminderEmail(campaign, recipient) {
  const practiceUrl = `${campaign.clientUrl}/my-courses`;
  const unsubscribeUrl = `${campaign.clientUrl}/email/reminders/unsubscribe?token=${encodeURIComponent(unsubscribeToken(String(recipient.user)))}`;
  return {
    to: recipient.email,
    subject: campaign.subject,
    text: `Hi ${recipient.name},\n\n${campaign.message}\n\nContinue your Chinese practice: ${practiceUrl}\n\nXiao Ao, Chinese made simple\n\nStop practice reminder emails: ${unsubscribeUrl}\nThis does not affect your course access or account emails.`,
  };
}

function campaignSummary(campaign) {
  const counts = { pending: 0, sending: 0, sent: 0, failed: 0, skipped: 0, uncertain: 0 };
  for (const recipient of campaign.recipients) counts[recipient.status]++;
  return {
    id: String(campaign._id), subject: campaign.subject, createdAt: campaign.createdAt,
    total: campaign.recipients.length, counts, complete: counts.pending + counts.sending === 0,
  };
}

module.exports = { ReminderError, validateMessage, clientUrl, eligibleStudents, accessEndDates, selectedStudents, audienceSummary, previewToken, checkPreview, unsubscribeToken, unsubscribeUserId, reminderEmail, campaignSummary };
