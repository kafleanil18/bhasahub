const express = require('express');
const rateLimit = require('express-rate-limit');
const PracticeDay = require('../models/PracticeDay');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const streak = require('../utils/practiceStreak');

const router = express.Router();
// The client reports about once a minute; this leaves room for several open tabs.
const limiter = rateLimit({ windowMs: 60000, max: 30, standardHeaders: true, legacyHeaders: false });
const HISTORY_DAYS = 400;

// POST { date, seconds }: add active learning time to the student's day.
router.post('/', requireAuth, limiter, async (req, res) => {
  const { date, seconds } = req.body || {};
  if (!streak.isPlausibleToday(date) || !Number.isInteger(seconds) || seconds < 1 || seconds > 120) {
    return res.status(400).json({ error: 'Invalid practice time' });
  }
  try {
    const day = await PracticeDay.findOneAndUpdate(
      { user: req.user.id, date },
      { $inc: { seconds } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).select('seconds').lean();
    res.json({ date, minutes: Math.floor(Math.min(day.seconds, streak.MAX_DAY_SECONDS) / 60) });
  } catch (err) {
    // Two tabs creating the same day at once: the second insert retries as an update.
    if (err.code === 11000) {
      await PracticeDay.updateOne({ user: req.user.id, date }, { $inc: { seconds } }).catch(() => {});
      return res.json({ date });
    }
    res.status(500).json({ error: 'Could not save practice time' });
  }
});

// GET ?today=YYYY-MM-DD: daily goal progress, streaks and the last 7 days.
router.get('/me', requireAuth, async (req, res) => {
  const today = req.query.today;
  if (!streak.isPlausibleToday(today)) return res.status(400).json({ error: 'Send today’s date as YYYY-MM-DD.' });
  try {
    const [rows, user] = await Promise.all([
      PracticeDay.find({ user: req.user.id, date: { $gte: streak.addDays(today, -HISTORY_DAYS), $lte: today } }).select('date seconds -_id').lean(),
      User.findById(req.user.id).select('dailyGoalMinutes').lean(),
    ]);
    res.json(streak.summarize(rows, today, user?.dailyGoalMinutes));
  } catch {
    res.status(500).json({ error: 'Could not load your streak' });
  }
});

// PUT { minutes }: choose the daily goal.
router.put('/goal', requireAuth, async (req, res) => {
  const minutes = req.body?.minutes;
  if (!streak.GOAL_CHOICES.includes(minutes)) return res.status(400).json({ error: `Choose ${streak.GOAL_CHOICES.join(', ')} minutes.` });
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { dailyGoalMinutes: minutes } });
    res.json({ goalMinutes: minutes });
  } catch {
    res.status(500).json({ error: 'Could not save your goal' });
  }
});

module.exports = router;
