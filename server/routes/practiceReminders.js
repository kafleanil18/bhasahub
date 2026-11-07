const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const PracticeReminder = require('../models/PracticeReminder');
const User = require('../models/User');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const reminders = require('../utils/practiceReminders');
const email = require('../utils/emailTransport');
const { logActivity } = require('../utils/auditLog');
const { reminderStudentActivity } = require('../utils/reminderStudentActivity');

const router = express.Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.post('/unsubscribe', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }), async (req, res) => {
  try {
    const id = reminders.unsubscribeUserId(req.body?.token);
    await User.updateOne({ _id: id }, { $set: { practiceReminderOptOut: true } });
    res.json({ message: 'Practice reminder emails are turned off. Your course access and account emails are unchanged.' });
  } catch (error) { fail(res, error); }
});
router.use(requireAuth, requireSuperAdmin);

function fail(res, error) {
  res.status(error instanceof reminders.ReminderError ? error.status : 503).json({ error: error instanceof reminders.ReminderError ? error.message : 'Could not complete the reminder request. Check your email settings and try again.' });
}

router.get('/audience', async (_req, res) => {
  try {
    const [students, emailConfigured] = await Promise.all([reminders.eligibleStudents(), email.isEmailConfigured()]);
    res.json({ ...reminders.audienceSummary(students), emailConfigured });
  } catch (error) { fail(res, error); }
});

router.get('/students', async (_req, res) => {
  try {
    const students = await reminders.eligibleStudents();
    if (students.length > 5000) throw new reminders.ReminderError('The interactive student list supports up to 5,000 eligible students.');
    const asOf = new Date();
    res.json({ students: await reminderStudentActivity(students, asOf), asOf });
  } catch (error) { fail(res, error); }
});

router.post('/preview', async (req, res) => {
  try {
    const content = reminders.validateMessage(req.body);
    if (!await email.isEmailConfigured()) throw new reminders.ReminderError('Enable an email service in Email settings before sending reminders.');
    const students = reminders.selectedStudents(req.body, await reminders.eligibleStudents());
    if (!students.length) throw new reminders.ReminderError('There are no eligible students with active Chinese course subscriptions.');
    if (students.length > 5000) throw new reminders.ReminderError('This reminder exceeds the supported audience size of 5,000 students.');
    const origin = reminders.clientUrl();
    res.json({ ...content, studentIds: students.map(student => student.user), audience: reminders.audienceSummary(students), practiceUrl: `${origin}/my-courses`, previewToken: reminders.previewToken(req.user.id, students, content, origin) });
  } catch (error) { fail(res, error); }
});

router.post('/campaigns', async (req, res) => {
  try {
    if (typeof req.body?.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(req.body.requestId)) throw new reminders.ReminderError('Review the reminder before sending.');
    const key = { createdBy: req.user.id, requestId: req.body.requestId };
    let campaign = await PracticeReminder.findOne(key).lean();
    if (campaign) return res.json(reminders.campaignSummary(campaign));
    const content = reminders.validateMessage(req.body);
    const students = reminders.selectedStudents(req.body, await reminders.eligibleStudents());
    const origin = reminders.clientUrl();
    reminders.checkPreview(req.body.previewToken, req.user.id, students, content, origin);
    if (!students.length || students.length > 5000) throw new reminders.ReminderError('The eligible audience changed. Review the reminder again.', 409);
    if (!await email.isEmailConfigured()) throw new reminders.ReminderError('Enable an email service in Email settings before sending reminders.');
    try {
      campaign = await PracticeReminder.create({ ...key, ...content, clientUrl: origin, recipients: students.map(student => ({ ...student, status: 'pending' })) });
    } catch (error) {
      if (error.code !== 11000) throw error;
      campaign = await PracticeReminder.findOne(key).lean();
      if (!campaign) throw error;
      return res.json(reminders.campaignSummary(campaign));
    }
    logActivity(req, { action: 'send', resourceType: 'practice-reminder', resourceId: campaign._id, label: `Practice reminder queued for ${students.length} subscribed students` });
    res.status(202).json(reminders.campaignSummary(campaign));
  } catch (error) { fail(res, error); }
});

router.get('/campaigns', async (_req, res) => {
  try {
    const campaigns = await PracticeReminder.find().select('subject createdAt recipients.status').sort({ createdAt: -1 }).limit(10).lean();
    res.json(campaigns.map(reminders.campaignSummary));
  } catch (error) { fail(res, error); }
});

router.get('/campaigns/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new reminders.ReminderError('Reminder not found.', 404);
    const campaign = await PracticeReminder.findById(req.params.id).select('subject createdAt recipients.status').lean();
    if (!campaign) throw new reminders.ReminderError('Reminder not found.', 404);
    res.json(reminders.campaignSummary(campaign));
  } catch (error) { fail(res, error); }
});

module.exports = router;
