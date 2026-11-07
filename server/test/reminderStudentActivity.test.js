const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const Attempt = require('../models/Attempt');
const HskAttempt = require('../models/HskAttempt');
const Progress = require('../models/Progress');
const VocabSchedule = require('../models/VocabSchedule');
const ConversationRecording = require('../models/ConversationRecording');
const PracticeReminder = require('../models/PracticeReminder');
const { reminderStudentActivity } = require('../utils/reminderStudentActivity');

const id = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const students = [{ user: id, name: 'Student One', email: 'one@example.com' }, { user: otherId, name: 'Student Two', email: 'two@example.com' }];
const now = new Date('2026-11-07T12:00:00.000Z');
const models = [Attempt, HskAttempt, Progress, VocabSchedule, ConversationRecording, PracticeReminder];
let rows;
beforeEach(() => {
  rows = models.map(() => []);
  models.forEach((model, index) => mock.method(model, 'aggregate', async () => rows[index]));
});
afterEach(() => mock.restoreAll());

test('latest saved learning activity wins across quizzes, lessons, reviews, tests, and recordings', async () => {
  rows[0] = [{ _id: id, at: new Date('2026-10-01') }];
  rows[1] = [{ _id: id, at: new Date('2026-10-20') }];
  rows[2] = [{ _id: id, at: new Date('2026-10-25') }];
  rows[3] = [{ _id: id, at: new Date('2026-11-04T12:00:00Z') }];
  rows[4] = [{ _id: otherId, at: new Date('2026-11-07T11:00:00Z') }];
  rows[5] = [{ _id: id, at: new Date('2026-11-06T12:00:00Z') }];
  const result = await reminderStudentActivity(students, now);
  assert.equal(result[0].lastPracticeAt, '2026-11-04T12:00:00.000Z');
  assert.equal(result[0].inactiveDays, 3);
  assert.equal(result[0].lastReminderAt, '2026-11-06T12:00:00.000Z');
  assert.equal(result[1].inactiveDays, 0);
  assert.equal(result[1].lastReminderAt, null);
});

test('activity queries are limited to eligible IDs and exclude unfinished exams and unreviewed vocabulary', async () => {
  await reminderStudentActivity(students, now);
  for (const model of models.slice(0, 5)) {
    const match = model.aggregate.mock.calls[0].arguments[0][0].$match;
    assert.deepEqual(match.user.$in.map(String), [id, otherId]);
  }
  assert.equal(HskAttempt.aggregate.mock.calls[0].arguments[0][0].$match.status, 'submitted');
  assert.equal(Progress.aggregate.mock.calls[0].arguments[0][0].$match.completed, true);
  assert.deepEqual(VocabSchedule.aggregate.mock.calls[0].arguments[0][0].$match.lastReviewedAt, { $ne: null });
  const pipeline = PracticeReminder.aggregate.mock.calls[0].arguments[0];
  assert.equal(pipeline[2].$match['recipients.status'], 'sent');
  assert.deepEqual(pipeline[2].$match['recipients.user'].$in.map(String), [id, otherId]);
});

test('no recorded practice stays unknown rather than being assigned an invented inactivity duration', async () => {
  rows[5] = [{ _id: id, at: new Date('2026-11-01') }];
  const result = await reminderStudentActivity(students, now);
  assert.equal(result[0].lastPracticeAt, null); assert.equal(result[0].inactiveDays, null);
  assert.equal(result[1].lastPracticeAt, null); assert.equal(result[1].inactiveDays, null);
  assert.equal(result[0].lastReminderAt, '2026-11-01T00:00:00.000Z');
});

test('inactivity uses full elapsed days and tolerates invalid or future historical dates', async () => {
  rows[0] = [{ _id: id, at: new Date('2026-11-04T12:00:00.001Z') }, { _id: otherId, at: 'invalid' }];
  let result = await reminderStudentActivity(students, now);
  assert.equal(result[0].inactiveDays, 2); assert.equal(result[1].lastPracticeAt, null);
  rows[1] = [{ _id: id, at: new Date('2026-11-08') }];
  result = await reminderStudentActivity(students, now);
  assert.equal(result[0].inactiveDays, 0); assert.equal(result[0].lastPracticeAt, now.toISOString());
});

test('empty audiences avoid activity queries; data outages are reported rather than showing false inactivity', async () => {
  assert.deepEqual(await reminderStudentActivity([], now), []);
  assert.equal(Attempt.aggregate.mock.callCount(), 0);
  Attempt.aggregate.mock.restore(); mock.method(Attempt, 'aggregate', async () => { throw new Error('activity unavailable'); });
  await assert.rejects(reminderStudentActivity(students, now), /activity unavailable/);
});
