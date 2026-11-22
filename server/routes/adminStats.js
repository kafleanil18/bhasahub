const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const AccessRequest = require('../models/AccessRequest');
const Subscription = require('../models/Subscription');
const Testimonial = require('../models/Testimonial');
const Test = require('../models/Test');
const Feedback = require('../models/Feedback');
const PlanRequest = require('../models/PlanRequest');
const PlatformPass = require('../models/PlatformPass');
const bundledHskPapers = require('../data/hskPapers');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;

router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * DAY_MS);
    const thirtyDaysAgo = new Date(now - 30 * DAY_MS);

    const [
      totalStudents,
      totalAdmins,
      newSignups7d,
      newSignups30d,
      signupsByDay,
      publishedCourses,
      totalCourses,
      totalEnrollments,
      topCourses,
      enrollmentsByHskLevel,
      completedLessons,
      pendingAccessRequests,
      activeSubscriptions,
      expiringSoonSubscriptions,
      pendingTestimonials,
      publishedTests,
      totalTests,
      unreadFeedback,
      pendingPlanRequests,
      activePlanMembers,
      planIncome,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['admin', 'superadmin'] } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([
        { $match: { role: 'student', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Course.countDocuments({ published: true }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.aggregate([
        { $group: { _id: '$course', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: { _id: 0, courseId: '$course._id', title: '$course.title', count: 1 } },
      ]),
      Enrollment.aggregate([
        { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: {
          level: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: '$course.title', regex: /hsk\s*1/i } }, then: 'HSK 1' },
                { case: { $regexMatch: { input: '$course.title', regex: /hsk\s*2/i } }, then: 'HSK 2' },
                { case: { $regexMatch: { input: '$course.title', regex: /hsk\s*3/i } }, then: 'HSK 3' },
              ],
              default: null,
            },
          },
        } },
        { $match: { level: { $ne: null } } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $project: { _id: 0, level: '$_id', count: 1 } },
      ]),
      Progress.countDocuments({ completed: true }),
      AccessRequest.countDocuments({ status: 'pending' }),
      Subscription.countDocuments({ expiresAt: { $gt: now } }),
      Subscription.countDocuments({ expiresAt: { $gt: now, $lt: new Date(now.getTime() + 7 * DAY_MS) } }),
      Testimonial.countDocuments({ approved: false }),
      Test.countDocuments({ published: true }),
      Test.countDocuments(),
      Feedback.countDocuments({ read: false }),
      PlanRequest.countDocuments({ status: 'pending' }),
      PlatformPass.countDocuments({ expiresAt: { $gt: now } }),
      // Plans are approved once payment arrives, so approved prices are the income received.
      PlanRequest.aggregate([
        { $match: { status: 'approved' } },
        { $group: {
          _id: null,
          total: { $sum: '$price' },
          last30Days: { $sum: { $cond: [{ $gte: ['$reviewedAt', thirtyDaysAgo] }, '$price', 0] } },
          startedLast30Days: { $sum: { $cond: [{ $gte: ['$reviewedAt', thirtyDaysAgo] }, 1, 0] } },
        } },
      ]),
    ]);
    const income = planIncome[0] || { total: 0, last30Days: 0, startedLast30Days: 0 };

    res.json({
      students: { total: totalStudents, newLast7Days: newSignups7d, newLast30Days: newSignups30d, signupsByDay },
      admins: { total: totalAdmins },
      courses: { published: publishedCourses, total: totalCourses },
      enrollments: { total: totalEnrollments, topCourses, byHskLevel: enrollmentsByHskLevel },
      lessons: { completed: completedLessons },
      accessRequests: { pending: pendingAccessRequests },
      subscriptions: { active: activeSubscriptions, expiringSoon: expiringSoonSubscriptions },
      testimonials: { pending: pendingTestimonials },
      tests: {
        published: publishedTests,
        total: totalTests,
        bundled: Object.keys(bundledHskPapers).length,
      },
      feedback: { unread: unreadFeedback },
      plans: {
        pending: pendingPlanRequests,
        active: activePlanMembers,
        startedLast30Days: income.startedLast30Days,
        incomeLast30Days: income.last30Days,
        incomeTotal: income.total,
      },
    });
  } catch (err) {
    console.error('Load admin stats error:', err);
    res.status(500).json({ error: 'Could not load admin stats' });
  }
});

module.exports = router;
