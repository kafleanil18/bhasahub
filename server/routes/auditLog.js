const express = require('express');
const AuditLog = require('../models/AuditLog');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const StudentSignIn = require('../models/StudentSignIn');
const { nepalDate, dayRange, TIME_ZONE } = require('../utils/studentSignIns');

const router = express.Router();

// GET /api/audit-log — super admin: most recent activity, newest first
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const entries = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(entries);
  } catch (err) {
    console.error('Load audit log error:', err);
    res.status(500).json({ error: 'Could not load the activity log' });
  }
});

router.get('/student-sign-ins', requireAuth, requireSuperAdmin, async (req, res) => {
  const date = req.query.date === undefined ? nepalDate() : req.query.date;
  const range = dayRange(date);
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  if (!range || !Number.isSafeInteger(page) || page < 1 || page > 100000) {
    return res.status(400).json({ error: 'Choose a valid date and page' });
  }
  try {
    const [result] = await StudentSignIn.aggregate([
      { $match: { signedInAt: { $gte: range.start, $lt: range.end } } },
      { $sort: { signedInAt: 1, _id: 1 } },
      { $group: { _id: '$student', name: { $last: '$name' }, email: { $last: '$email' }, count: { $sum: 1 }, firstSignIn: { $first: '$signedInAt' }, lastSignIn: { $last: '$signedInAt' } } },
      { $facet: {
        summary: [{ $group: { _id: null, uniqueStudents: { $sum: 1 }, totalSignIns: { $sum: '$count' } } }],
        students: [{ $sort: { lastSignIn: -1, _id: 1 } }, { $skip: (page - 1) * 50 }, { $limit: 50 }],
      } },
    ]);
    res.json({ date, timeZone: TIME_ZONE, page, pageSize: 50, uniqueStudents: result.summary[0]?.uniqueStudents || 0, totalSignIns: result.summary[0]?.totalSignIns || 0, students: result.students });
  } catch {
    res.status(500).json({ error: 'Could not load student sign-ins' });
  }
});

module.exports = router;
