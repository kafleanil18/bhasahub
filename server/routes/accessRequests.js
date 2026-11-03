const express = require('express');
const { Types } = require('mongoose');
const AccessRequest = require('../models/AccessRequest');
const Subscription = require('../models/Subscription');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
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
    if (!Types.ObjectId.isValid(courseId)) return res.status(400).json({ error: 'A valid courseId is required' });

    const course = await Course.findById(courseId);
    if (!course || !course.published) return res.status(404).json({ error: 'Course not found' });

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

    if (request.status !== 'pending') return res.status(409).json({ error: 'Request has already been processed' });
    const days = req.body.days === undefined ? 30 : Number(req.body.days);
    if (!Number.isInteger(days) || days <= 0 || days > 3650) return res.status(400).json({ error: 'Days must be an integer between 1 and 3650' });
    // Create a stable subscription first; the guarded update applies each request only once.
    let sub = await Subscription.findOne({ user: request.user, course: request.course });
    if (!sub) {
      sub = await Subscription.findOneAndUpdate(
        { user: request.user, course: request.course },
        { $setOnInsert: { user: request.user, course: request.course, expiresAt: new Date(0) } },
        { upsert: true, new: true }
      ).catch(async err => {
        if (err.code !== 11000) throw err;
        return Subscription.findOne({ user: request.user, course: request.course });
      });
    }
    const granted = await Subscription.findOneAndUpdate(
      { _id: sub._id, appliedRequests: { $ne: request._id } },
      [{ $set: {
        expiresAt: { $add: [{ $max: ['$expiresAt', '$$NOW'] }, days * 86400000] },
        grantedBy: new Types.ObjectId(req.user.id),
        appliedRequests: { $concatArrays: [{ $ifNull: ['$appliedRequests', []] }, [request._id]] },
      } }],
      { new: true, updatePipeline: true }
    );
    sub = granted || await Subscription.findById(sub._id);

    await Enrollment.updateOne(
      { user: request.user, course: request.course },
      { $setOnInsert: { user: request.user, course: request.course } },
      { upsert: true }
    ).catch(err => { if (err.code !== 11000) throw err; });

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
    const request = await AccessRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: 'denied' },
      { new: true }
    ).populate('user', 'name').populate('course', 'title');
    if (!request) return res.status(409).json({ error: 'Request is no longer pending' });
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
