const express = require('express');
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Progress = require('../models/Progress');
const HskAttempt = require('../models/HskAttempt');
const Lesson = require('../models/Lesson');
const Subscription = require('../models/Subscription');
const Enrollment = require('../models/Enrollment');
const StudioActivity = require('../models/StudioActivity');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(d) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(d));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
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
      recentHskAttempts,
      hskTotals,
      completedLessons,
      activeCourseIds,
      enrolledCourseIds,
      completedCourseIds,
      recentAttemptDays,
      recentHskAttemptDays,
      recentProgressDays,
      recentCompletedLessons,
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
      HskAttempt.find({ user: userId, status: 'submitted' })
        .sort({ submittedAt: -1 })
        .limit(30)
        .select('paper score listening reading submittedAt createdAt'),
      HskAttempt.aggregate([
        { $match: { user: userId, status: 'submitted' } },
        { $group: { _id: null, score: { $sum: '$score' }, attempts: { $sum: 1 } } },
      ]),
      Progress.countDocuments({ user: userId, completed: true }),
      Subscription.distinct('course', { user: userId, expiresAt: { $gt: new Date() } }),
      Enrollment.distinct('course', { user: userId }),
      Progress.distinct('course', { user: userId, completed: true }),
      Attempt.find({ user: userId, createdAt: { $gte: ninetyDaysAgo } }).distinct('createdAt'),
      HskAttempt.find({ user: userId, status: 'submitted', submittedAt: { $gte: ninetyDaysAgo } }).distinct('submittedAt'),
      Progress.find({ user: userId, createdAt: { $gte: ninetyDaysAgo } }).distinct('createdAt'),
      Progress.find({ user: userId, completed: true })
        .sort({ updatedAt: -1 })
        .limit(30)
        .populate('lesson', 'title category')
        .populate('course', 'title'),
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

    const studioDays = await StudioActivity.find({ user: userId, createdAt: { $gte: ninetyDaysAgo } }).distinct('createdAt');
    const activityDayKeys = [...recentAttemptDays, ...recentHskAttemptDays, ...recentProgressDays, ...studioDays].map(dateKey);
    const streak = computeStreak(activityDayKeys);

    const visibleCourseIds = [...new Set([...activeCourseIds, ...enrolledCourseIds, ...completedCourseIds].map(String))]
      .map((id) => new mongoose.Types.ObjectId(id));
    const [publishedLessons, completedLessonIds] = await Promise.all([
      visibleCourseIds.length
        ? Lesson.find({ course: { $in: visibleCourseIds }, published: true }).select('course category').populate('course', 'title level')
        : Promise.resolve([]),
      Progress.distinct('lesson', { user: userId, completed: true }),
    ]);
    const completedLessonSet = new Set(completedLessonIds.map(String));
    const progressGroups = new Map();
    for (const lesson of publishedLessons) {
      if (!lesson.course) continue;
      const category = lesson.category || 'vocabulary';
      const key = `${lesson.course._id}:${category}`;
      const group = progressGroups.get(key) || {
        courseId: String(lesson.course._id), courseTitle: lesson.course.title,
        courseLevel: lesson.course.level, category, completed: 0, total: 0,
      };
      group.total += 1;
      if (completedLessonSet.has(String(lesson._id))) group.completed += 1;
      progressGroups.set(key, group);
    }
    const courseProgress = [...progressGroups.values()]
      .map((row) => ({ ...row, percent: row.total ? Math.round((row.completed / row.total) * 100) : 0 }))
      .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.category.localeCompare(b.category));

    const legacyTrend = recentAttempts.map((a) => ({
        id: a._id,
        type: a.type,
        label: a.type === 'test' ? a.test?.title : a.lesson?.title,
        score: a.score,
        total: a.total,
        percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
        date: a.createdAt,
      }));
    const hskTrend = recentHskAttempts.map((attempt) => ({
      id: attempt._id,
      type: 'hsk-mock-test',
      label: `HSK 1 · ${(attempt.paper || '').toUpperCase()}`,
      score: attempt.score || 0,
      total: 40,
      percent: Math.round(((attempt.score || 0) / 40) * 100),
      date: attempt.submittedAt || attempt.createdAt,
    }));
    const completionTrend = recentCompletedLessons
      .filter((progress) => progress.lesson)
      .map((progress) => ({
        id: `lesson-${progress._id}`,
        type: 'lesson-completion',
        label: progress.lesson.title,
        category: progress.lesson.category || 'vocabulary',
        course: progress.course?.title || '',
        score: null,
        total: null,
        percent: 0,
        date: progress.updatedAt || progress.createdAt,
      }));
    const scoreTrend = [...legacyTrend, ...hskTrend, ...completionTrend]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    const withPercent = (rows) =>
      rows.map((r) => ({ ...r, percent: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0 }));

    const overallRow = overall[0] || { score: 0, total: 0, attempts: 0 };
    const hskOverall = hskTotals[0] || { score: 0, attempts: 0 };
    const totalScoredItems = overallRow.total + hskOverall.attempts * 40;
    const totalScore = overallRow.score + hskOverall.score;
    const hskOverallByPaper = await HskAttempt.aggregate([
      { $match: { user: userId, status: 'submitted' } },
      { $group: { _id: '$paper', score: { $sum: '$score' }, attempts: { $sum: 1 } } },
      { $project: { _id: 0, testId: '$_id', title: { $concat: ['HSK 1 · ', { $toUpper: '$_id' }] }, score: 1, total: { $multiply: ['$attempts', 40] }, attempts: 1 } },
    ]);

    res.json({
      streak,
      totalAttempts: overallRow.attempts + hskOverall.attempts,
      completedLessons,
      courseProgress,
      overallAccuracy: totalScoredItems > 0 ? Math.round((totalScore / totalScoredItems) * 100) : 0,
      scoreTrend,
      accuracyByLesson: withPercent(accuracyByLesson),
      accuracyByCourse: withPercent(accuracyByCourse),
      accuracyByTest: [...withPercent(accuracyByTest), ...withPercent(hskOverallByPaper)],
      weakestWords,
    });
  } catch (err) {
    console.error('Load analytics error:', err);
    res.status(500).json({ error: 'Could not load progress analytics' });
  }
});

module.exports = router;
