const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const HskAttempt = require('../models/HskAttempt');
const Progress = require('../models/Progress');
const VocabSchedule = require('../models/VocabSchedule');
const ConversationRecording = require('../models/ConversationRecording');
const PracticeReminder = require('../models/PracticeReminder');

async function reminderStudentActivity(students, now = new Date()) {
  if (!students.length) return [];
  const ids = students.map(student => new mongoose.Types.ObjectId(student.user));
  const latest = (model, match, date) => model.aggregate([
    { $match: { user: { $in: ids }, ...match } },
    { $group: { _id: '$user', at: { $max: date } } },
  ]);
  const results = await Promise.all([
    latest(Attempt, {}, '$createdAt'),
    latest(HskAttempt, { status: 'submitted' }, { $ifNull: ['$submittedAt', '$updatedAt'] }),
    latest(Progress, { completed: true }, { $ifNull: ['$updatedAt', '$createdAt'] }),
    latest(VocabSchedule, { lastReviewedAt: { $ne: null } }, '$lastReviewedAt'),
    latest(ConversationRecording, {}, '$createdAt'),
    PracticeReminder.aggregate([
      { $match: { 'recipients.user': { $in: ids }, 'recipients.status': 'sent' } },
      { $unwind: '$recipients' },
      { $match: { 'recipients.user': { $in: ids }, 'recipients.status': 'sent' } },
      { $group: { _id: '$recipients.user', at: { $max: '$recipients.attemptedAt' } } },
    ]),
  ]);
  const practice = new Map();
  const sent = new Map();
  for (const [index, rows] of results.entries()) {
    const target = index === results.length - 1 ? sent : practice;
    for (const row of rows) {
      if (!row.at) continue;
      const timestamp = Math.min(new Date(row.at).getTime(), now.getTime());
      if (!Number.isFinite(timestamp)) continue;
      const id = String(row._id);
      if (!target.has(id) || timestamp > target.get(id)) target.set(id, timestamp);
    }
  }
  return students.map(student => ({
    ...student,
    lastPracticeAt: practice.has(student.user) ? new Date(practice.get(student.user)).toISOString() : null,
    inactiveDays: practice.has(student.user) ? Math.floor((now.getTime() - practice.get(student.user)) / 86400000) : null,
    lastReminderAt: sent.has(student.user) ? new Date(sent.get(student.user)).toISOString() : null,
  }));
}

module.exports = { reminderStudentActivity };
