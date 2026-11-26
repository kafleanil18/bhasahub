const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { summarize, isPlausibleToday, isValidDate, addDays } = require('../utils/practiceStreak');

const day = (date, minutes) => ({ date, seconds: minutes * 60 });

test('dates are validated and shifted across month and year ends', () => {
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidDate('2026-1-05'), false);
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  const now = new Date('2026-11-25T12:00:00Z');
  assert.equal(isPlausibleToday('2026-11-25', now), true);
  assert.equal(isPlausibleToday('2026-11-26', now), true);
  assert.equal(isPlausibleToday('2026-11-24', now), true);
  assert.equal(isPlausibleToday('2026-11-27', now), false);
});

test('the streak counts back from today, or from yesterday until today is practised', () => {
  const rows = [day('2026-11-22', 3), day('2026-11-23', 12), day('2026-11-24', 1)];
  const waiting = summarize(rows, '2026-11-25', 10);
  assert.equal(waiting.streak, 3);
  assert.equal(waiting.today.practised, false);
  const done = summarize([...rows, day('2026-11-25', 10)], '2026-11-25', 10);
  assert.equal(done.streak, 4);
  assert.equal(done.today.goalMet, true);
  assert.equal(done.today.minutes, 10);
});

test('a missed day breaks the streak, under a minute does not count, and the best run is kept', () => {
  const rows = [day('2026-11-01', 5), day('2026-11-02', 5), day('2026-11-03', 5), day('2026-11-04', 5), { date: '2026-11-23', seconds: 30 }, day('2026-11-24', 2)];
  const result = summarize(rows, '2026-11-25', 10);
  assert.equal(result.streak, 1);
  assert.equal(result.bestStreak, 4);
  assert.equal(summarize([day('2026-11-20', 4)], '2026-11-25', 10).streak, 0);
});

test('the week runs oldest to today with goal flags, and unknown goals fall back to 10 minutes', () => {
  const result = summarize([day('2026-11-19', 15), day('2026-11-25', 6)], '2026-11-25', 7);
  assert.equal(result.goalMinutes, 10);
  assert.deepEqual(result.week.map(row => row.date), ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']);
  assert.deepEqual(result.week.map(row => row.goalMet), [true, false, false, false, false, false, false]);
  assert.equal(result.week[6].practised, true);
  assert.equal(summarize([day('2026-11-25', 6)], '2026-11-25', 5).today.goalMet, true);
});

test('practice time rejects bad input before touching the database', async () => {
  const original = User.findById;
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'practice-time-test';
  User.findById = id => ({ select: async () => ({ _id: id, role: 'student' }) });
  const app = express();
  app.use(express.json());
  app.use('/api/practice-time', require('../routes/practiceTime'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/practice-time`;
    const headers = { Authorization: `Bearer ${jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' };
    const today = new Date().toISOString().slice(0, 10);
    assert.equal((await fetch(base, { method: 'POST', body: '{}' })).status, 401);
    for (const body of [{ date: today, seconds: 0 }, { date: today, seconds: 500 }, { date: today, seconds: 1.5 }, { date: '2020-01-01', seconds: 30 }, { date: 'today', seconds: 30 }]) {
      assert.equal((await fetch(base, { method: 'POST', headers, body: JSON.stringify(body) })).status, 400, JSON.stringify(body));
    }
    assert.equal((await fetch(`${base}/me?today=2020-01-01`, { headers })).status, 400);
    assert.equal((await fetch(`${base}/goal`, { method: 'PUT', headers, body: JSON.stringify({ minutes: 7 }) })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    User.findById = original;
    if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
});
