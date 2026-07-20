const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const Subscription = require('../models/Subscription');
const Course = require('../models/Course');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

// GET /api/access-requests — admin: all requests, pending first, newest first
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await AccessRequest.find()
      .populate('user', 'name email')
      .populate('course', 'title level')
      .sort({ status: 1, createdAt: -1 });
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Could not load access requests' });
  }
});

// GET /api/access-requests/my — logged-in student: their own requests
router.get('/my', requireAuth, async (req, res) => {
  try {
    const requests = await AccessRequest.find({ user: req.user.id })
      .populate('course', 'title level');
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Could not load your access requests' });
  }
});

// POST /api/access-requests — student: ask for access to a course
router.post('/', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const now = new Date();
    const activeSub = await Subscription.findOne({ user: req.user.id, course: courseId, expiresAt: { $gt: now } });
    if (activeSub) return res.status(400).json({ error: 'You already have access to this course' });

    const existingPending = await AccessRequest.findOne({ user: req.user.id, course: courseId, status: 'pending' });
    if (existingPending) return res.status(200).json(existingPending);

    const request = await AccessRequest.create({ user: req.user.id, course: courseId, status: 'pending' });
    res.status(201).json(request);
  } catch {
    res.status(500).json({ error: 'Could not submit access request' });
  }
});

// PUT /api/access-requests/:id/approve — admin: grant access and mark approved
// body: { days }
router.put('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const days = Number(req.body.days) || 30;
    const now = new Date();
    let sub = await Subscription.findOne({ user: request.user, course: request.course });
    const base = sub && sub.expiresAt > now ? sub.expiresAt : now;
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    if (sub) {
      sub.expiresAt = expiresAt;
      sub.grantedBy = req.user.id;
      await sub.save();
    } else {
      sub = await Subscription.create({
        user: request.user, course: request.course, expiresAt, grantedBy: req.user.id,
      });
    }

    request.status = 'approved';
    await request.save();

    const [reqUser, reqCourse] = await Promise.all([
      User.findById(request.user).select('name'),
      Course.findById(request.course).select('title'),
    ]);
    logActivity(req, {
      action: 'approve',
      resourceType: 'access-request',
      resourceId: request._id,
      label: `${reqUser ? reqUser.name : 'Unknown'} → ${reqCourse ? reqCourse.title : 'Unknown'} (${days}d)`,
    });

    res.json({ request, subscription: sub });
  } catch {
    res.status(500).json({ error: 'Could not approve access request' });
  }
});

// PUT /api/access-requests/:id/deny — admin: mark denied
router.put('/:id/deny', requireAuth, requireAdmin, async (req, res) => {
  try {
    const request = await AccessRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'denied' },
      { new: true }
    ).populate('user', 'name').populate('course', 'title');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    logActivity(req, {
      action: 'deny',
      resourceType: 'access-request',
      resourceId: request._id,
      label: `${request.user ? request.user.name : 'Unknown'} → ${request.course ? request.course.title : 'Unknown'}`,
    });
    res.json(request);
  } catch {
    res.status(500).json({ error: 'Could not deny access request' });
  }
});

// DELETE /api/access-requests/:id — student: cancel their own pending request
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const isOwner = request.user.toString() === req.user.id;
    const isAdminUser = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdminUser) return res.status(403).json({ error: 'Not allowed' });
    await AccessRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request cancelled' });
  } catch {
    res.status(500).json({ error: 'Could not cancel request' });
  }
});

module.exports = router;
