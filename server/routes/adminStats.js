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
      completedLessons,
      pendingAccessRequests,
      activeSubscriptions,
      expiringSoonSubscriptions,
      pendingTestimonials,
      publishedTests,
      totalTests,
      unreadFeedback,
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
      Progress.countDocuments({ completed: true }),
      AccessRequest.countDocuments({ status: 'pending' }),
      Subscription.countDocuments({ expiresAt: { $gt: now } }),
      Subscription.countDocuments({ expiresAt: { $gt: now, $lt: new Date(now.getTime() + 7 * DAY_MS) } }),
      Testimonial.countDocuments({ approved: false }),
      Test.countDocuments({ published: true }),
      Test.countDocuments(),
      Feedback.countDocuments({ read: false }),
    ]);

    res.json({
      students: { total: totalStudents, newLast7Days: newSignups7d, newLast30Days: newSignups30d, signupsByDay },
      admins: { total: totalAdmins },
      courses: { published: publishedCourses, total: totalCourses },
      enrollments: { total: totalEnrollments, topCourses },
      lessons: { completed: completedLessons },
      accessRequests: { pending: pendingAccessRequests },
      subscriptions: { active: activeSubscriptions, expiringSoon: expiringSoonSubscriptions },
      testimonials: { pending: pendingTestimonials },
      tests: { published: publishedTests, total: totalTests },
      feedback: { unread: unreadFeedback },
    });
  } catch (err) {
    console.error('Load admin stats error:', err);
    res.status(500).json({ error: 'Could not load admin stats' });
  }
});

module.exports = router;
