const express = require('express');
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Progress = require('../models/Progress');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// walks backward one day at a time from today, counting a streak as long as
// every consecutive day has at least one activity day in the set
function computeStreak(activityDayKeys) {
  const days = new Set(activityDayKeys);
  let streak = 0;
  const cursor = new Date();
  // if nothing happened today yet, the streak can still count from yesterday
  if (!days.has(dateKey(cursor)) && !days.has(dateKey(new Date(cursor - DAY_MS)))) {
    return 0;
  }
  if (!days.has(dateKey(cursor))) cursor.setTime(cursor.getTime() - DAY_MS);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  return streak;
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const ninetyDaysAgo = new Date(Date.now() - 90 * DAY_MS);

    const [
      recentAttempts,
      recentAttemptDays,
      recentProgressDays,
      accuracyByLesson,
      accuracyByCourse,
      accuracyByTest,
      weakestWords,
      overall,
    ] = await Promise.all([
      Attempt.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('lesson', 'title')
        .populate('test', 'title'),
      Attempt.find({ user: userId, createdAt: { $gte: ninetyDaysAgo } }).distinct('createdAt'),
      Progress.find({ user: userId, createdAt: { $gte: ninetyDaysAgo } }).distinct('createdAt'),
      Attempt.aggregate([
        { $match: { user: userId, type: 'vocab-quiz' } },
        { $group: { _id: '$lesson', score: { $sum: '$score' }, total: { $sum: '$total' }, attempts: { $sum: 1 } } },
        { $lookup: { from: 'lessons', localField: '_id', foreignField: '_id', as: 'lesson' } },
        { $unwind: '$lesson' },
        { $project: { _id: 0, lessonId: '$_id', title: '$lesson.title', score: 1, total: 1, attempts: 1 } },
        { $sort: { title: 1 } },
      ]),
      Attempt.aggregate([
        { $match: { user: userId, type: 'vocab-quiz' } },
        { $group: { _id: '$course', score: { $sum: '$score' }, total: { $sum: '$total' }, attempts: { $sum: 1 } } },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: { _id: 0, courseId: '$_id', title: '$course.title', score: 1, total: 1, attempts: 1 } },
        { $sort: { title: 1 } },
      ]),
      Attempt.aggregate([
        { $match: { user: userId, type: 'test' } },
        { $group: { _id: '$test', score: { $sum: '$score' }, total: { $sum: '$total' }, attempts: { $sum: 1 } } },
        { $lookup: { from: 'tests', localField: '_id', foreignField: '_id', as: 'test' } },
        { $unwind: '$test' },
        { $project: { _id: 0, testId: '$_id', title: '$test.title', score: 1, total: 1, attempts: 1 } },
        { $sort: { title: 1 } },
      ]),
      Attempt.aggregate([
        { $match: { user: userId, type: 'vocab-quiz' } },
        { $unwind: '$missedVocabulary' },
        { $group: { _id: '$missedVocabulary', misses: { $sum: 1 } } },
        { $sort: { misses: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'vocabularies', localField: '_id', foreignField: '_id', as: 'vocab' } },
        { $unwind: '$vocab' },
        { $project: { _id: 0, vocabularyId: '$_id', word: '$vocab.word', pronunciation: '$vocab.pronunciation', meaning: '$vocab.meaning', misses: 1 } },
      ]),
      Attempt.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, score: { $sum: '$score' }, total: { $sum: '$total' }, attempts: { $sum: 1 } } },
      ]),
    ]);

    const activityDayKeys = [...recentAttemptDays, ...recentProgressDays].map(dateKey);
    const streak = computeStreak(activityDayKeys);

    const scoreTrend = recentAttempts
      .reverse()
      .map((a) => ({
        id: a._id,
        type: a.type,
        label: a.type === 'test' ? a.test?.title : a.lesson?.title,
        score: a.score,
        total: a.total,
        percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
        date: a.createdAt,
      }));

    const withPercent = (rows) =>
      rows.map((r) => ({ ...r, percent: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0 }));

    const overallRow = overall[0] || { score: 0, total: 0, attempts: 0 };

    res.json({
      streak,
      totalAttempts: overallRow.attempts,
      overallAccuracy: overallRow.total > 0 ? Math.round((overallRow.score / overallRow.total) * 100) : 0,
      scoreTrend,
      accuracyByLesson: withPercent(accuracyByLesson),
      accuracyByCourse: withPercent(accuracyByCourse),
      accuracyByTest: withPercent(accuracyByTest),
      weakestWords,
    });
  } catch (err) {
    console.error('Load analytics error:', err);
    res.status(500).json({ error: 'Could not load progress analytics' });
  }
});

module.exports = router;
