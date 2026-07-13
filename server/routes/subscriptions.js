const express = require('express');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/subscriptions/students — admin: list all registered students
router.get('/students', requireAuth, requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email createdAt')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch {
    res.status(500).json({ error: 'Could not load students' });
  }
});

// GET /api/subscriptions/all — admin: every subscription, with user + course populated
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const subs = await Subscription.find()
      .populate('user', 'name email')
      .populate('course', 'title level')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch {
    res.status(500).json({ error: 'Could not load subscriptions' });
  }
});

// POST /api/subscriptions — admin: grant access
// body: { userId, courseId, days }
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, courseId, days } = req.body;
    if (!userId || !courseId || !days) {
      return res.status(400).json({ error: 'userId, courseId and days are required' });
    }
    const now = new Date();
    // if an active sub exists, extend from its expiry; else from now
    let existing = await Subscription.findOne({ user: userId, course: courseId });
    const base = existing && existing.expiresAt > now ? existing.expiresAt : now;
    const expiresAt = new Date(base.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    if (existing) {
      existing.expiresAt = expiresAt;
      existing.grantedBy = req.user.id;
      await existing.save();
    } else {
      existing = await Subscription.create({
        user: userId, course: courseId, expiresAt, grantedBy: req.user.id,
      });
    }
    res.status(201).json(existing);
  } catch {
    res.status(500).json({ error: 'Could not grant access' });
  }
});

// DELETE /api/subscriptions/:id — admin: revoke
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ message: 'Access revoked' });
  } catch {
    res.status(500).json({ error: 'Could not revoke access' });
  }
});

// GET /api/subscriptions/my — logged-in student: their active subscriptions
router.get('/my', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const subs = await Subscription.find({ user: req.user.id, expiresAt: { $gt: now } })
      .populate('course', 'title level');
    res.json(subs);
  } catch {
    res.status(500).json({ error: 'Could not load your access' });
  }
});

// GET /api/subscriptions/check/:courseId — does the logged-in user have active access?
router.get('/check/:courseId', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const sub = await Subscription.findOne({
      user: req.user.id,
      course: req.params.courseId,
      expiresAt: { $gt: now },
    });
    res.json({ hasAccess: !!sub, expiresAt: sub ? sub.expiresAt : null });
  } catch {
    res.status(500).json({ error: 'Could not check access' });
  }
});

module.exports = router;