const express = require('express');
const bcrypt = require('bcryptjs');
const { Types } = require('mongoose');
const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');
const PlatformPass = require('../models/PlatformPass');
const Subscription = require('../models/Subscription');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');
const { FREE_ACCESS_DAYS } = require('../utils/testAccess');
const { findPlan } = require('../utils/plans');

const router = express.Router();
router.use(requireAuth, requireSuperAdmin);

const DAY_MS = 86400000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// Every collection that belongs to a single student, cleared when the account is deleted.
const OWNED = [
  ['Subscription', 'user'], ['AccessRequest', 'user'], ['PlatformPass', 'user'], ['PlanRequest', 'user'],
  ['Enrollment', 'user'], ['Progress', 'user'], ['Attempt', 'user'], ['HskAttempt', 'user'],
  ['StudioActivity', 'user'], ['VocabSchedule', 'user'], ['PushSubscription', 'user'],
  ['PracticeReminderSetting', 'user'], ['PracticeReminder', 'user'], ['ConversationRecording', 'user'],
  ['StudentSignIn', 'student'],
];

const validDays = value => Number.isInteger(value) && value >= 1 && value <= 3650;
const readDays = (value, fallback) => value === undefined || value === null || value === '' ? fallback : Number(value);

// Load a student by id, or answer 404. Admin and super admin accounts are managed elsewhere.
async function findStudent(req, res) {
  if (!Types.ObjectId.isValid(req.params.id)) { res.status(404).json({ error: 'Student not found' }); return null; }
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') { res.status(404).json({ error: 'Student not found' }); return null; }
  return student;
}

// The latest free (tests-scope) request decides the student's trial state.
function trialSummary(request, now = Date.now()) {
  if (!request) return { status: 'none' };
  if (request.status === 'approved') {
    if (!request.expiresAt) return { status: 'active', expiresAt: null, requestId: request._id };
    const live = new Date(request.expiresAt).getTime() > now;
    return { status: live ? 'active' : 'expired', expiresAt: request.expiresAt, requestId: request._id };
  }
  return { status: request.status, requestId: request._id };
}

async function studentSummaries(filter = {}) {
  const students = await User.find({ ...filter, role: 'student' })
    .select('name email authProvider createdAt signInCount emailVerified')
    .sort({ createdAt: -1 }).lean();
  const ids = students.map(student => student._id);
  const [trials, passes, subs] = await Promise.all([
    AccessRequest.find({ user: { $in: ids }, scope: 'tests' }).sort({ updatedAt: -1 }).lean(),
    PlatformPass.find({ user: { $in: ids } }).select('user plan expiresAt').lean(),
    Subscription.find({ user: { $in: ids } }).populate('course', 'title level').select('user course expiresAt').sort({ expiresAt: -1 }).lean(),
  ]);
  const latestTrial = new Map();
  for (const request of trials) if (!latestTrial.has(String(request.user))) latestTrial.set(String(request.user), request);
  const passBy = new Map(passes.map(pass => [String(pass.user), pass]));
  const subsBy = new Map();
  for (const sub of subs) {
    const key = String(sub.user);
    if (!subsBy.has(key)) subsBy.set(key, []);
    subsBy.get(key).push({ _id: sub._id, course: sub.course, expiresAt: sub.expiresAt });
  }
  const now = Date.now();
  return students.map(student => {
    const key = String(student._id);
    const pass = passBy.get(key);
    return {
      ...student,
      trial: trialSummary(latestTrial.get(key), now),
      plan: pass && new Date(pass.expiresAt).getTime() > now ? { plan: pass.plan, label: findPlan(pass.plan)?.label || pass.plan || 'Plan', expiresAt: pass.expiresAt } : null,
      subscriptions: subsBy.get(key) || [],
    };
  });
}

const publicStudent = async id => (await studentSummaries({ _id: id }))[0] || null;

// GET /api/students — every student with their trial, plan and course access
router.get('/', async (req, res) => {
  try {
    res.json(await studentSummaries());
  } catch {
    res.status(500).json({ error: 'Could not load students' });
  }
});

// POST /api/students — create a student account (email/password sign-in, already verified)
router.post('/', async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!name) return res.status(400).json({ error: 'Enter the student’s name' });
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (password.length < MIN_PASSWORD) return res.status(400).json({ error: `The password needs at least ${MIN_PASSWORD} characters` });
    if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' });
    const student = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'student', authProvider: 'local', emailVerified: true });
    logActivity(req, { action: 'create', resourceType: 'user', resourceId: student._id, label: `${student.name} (student account created)` });
    res.status(201).json(await publicStudent(student._id));
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
    res.status(500).json({ error: 'Could not create the student' });
  }
});

// PUT /api/students/:id — edit name, email, or set a new password
router.put('/:id', async (req, res) => {
  try {
    const student = await findStudent(req, res);
    if (!student) return;
    const changes = [];
    if (req.body.name !== undefined) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (!name) return res.status(400).json({ error: 'Enter the student’s name' });
      if (name !== student.name) { student.name = name; changes.push('name'); }
    }
    if (req.body.email !== undefined) {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
      if (email !== student.email) {
        if (await User.exists({ email, _id: { $ne: student._id } })) return res.status(409).json({ error: 'Another account already uses this email' });
        student.email = email; changes.push('email');
      }
    }
    if (req.body.password) {
      if (typeof req.body.password !== 'string' || req.body.password.length < MIN_PASSWORD) return res.status(400).json({ error: `The password needs at least ${MIN_PASSWORD} characters` });
      student.password = await bcrypt.hash(req.body.password, 10);
      student.resetPasswordTokenHash = undefined; student.resetPasswordExpires = undefined;
      student.resetPasswordOtpHash = undefined; student.resetPasswordOtpExpires = undefined;
      changes.push('password');
    }
    if (changes.length) {
      await student.save();
      logActivity(req, { action: 'update', resourceType: 'user', resourceId: student._id, label: `${student.name}: changed ${changes.join(', ')}` });
    }
    res.json(await publicStudent(student._id));
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: 'Another account already uses this email' });
    res.status(500).json({ error: 'Could not update the student' });
  }
});

// DELETE /api/students/:id — delete the account and everything that belongs to it
router.delete('/:id', async (req, res) => {
  try {
    const student = await findStudent(req, res);
    if (!student) return;
    await Promise.all(OWNED.map(([model, field]) => require(`../models/${model}`).deleteMany({ [field]: student._id })));
    await User.deleteOne({ _id: student._id });
    logActivity(req, { action: 'delete', resourceType: 'user', resourceId: student._id, label: `${student.name} <${student.email}> (student account deleted)` });
    res.json({ message: 'Student deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete the student' });
  }
});

// PUT /api/students/:id/trial — { days } grant free access, or extend a running one
router.put('/:id/trial', async (req, res) => {
  try {
    const student = await findStudent(req, res);
    if (!student) return;
    const days = readDays(req.body.days, FREE_ACCESS_DAYS);
    if (!validDays(days)) return res.status(400).json({ error: 'Days must be a whole number between 1 and 3650' });
    const now = Date.now();
    const request = await AccessRequest.findOne({ user: student._id, scope: 'tests' }).sort({ updatedAt: -1 });
    const running = request && request.status === 'approved' && request.expiresAt && request.expiresAt.getTime() > now;
    const expiresAt = new Date((running ? request.expiresAt.getTime() : now) + days * DAY_MS);
    if (request) {
      request.status = 'approved'; request.expiresAt = expiresAt;
      await request.save();
    } else {
      await AccessRequest.create({ user: student._id, scope: 'tests', status: 'approved', expiresAt });
    }
    // Any other open free requests are settled by this grant.
    await AccessRequest.updateMany({ user: student._id, scope: 'tests', status: 'pending' }, { $set: { status: 'approved', expiresAt } });
    logActivity(req, { action: 'grant', resourceType: 'access-request', resourceId: student._id, label: `${student.name} → Free access ${running ? 'extended' : 'granted'} (${days}d)` });
    res.json(await publicStudent(student._id));
  } catch {
    res.status(500).json({ error: 'Could not grant free access' });
  }
});

// DELETE /api/students/:id/trial — end free access now
router.delete('/:id/trial', async (req, res) => {
  try {
    const student = await findStudent(req, res);
    if (!student) return;
    const now = new Date();
    await Promise.all([
      AccessRequest.updateMany({ user: student._id, scope: 'tests', status: 'approved' }, { $set: { expiresAt: now } }),
      AccessRequest.updateMany({ user: student._id, scope: 'tests', status: 'pending' }, { $set: { status: 'denied' } }),
    ]);
    logActivity(req, { action: 'revoke', resourceType: 'access-request', resourceId: student._id, label: `${student.name} → Free access revoked` });
    res.json(await publicStudent(student._id));
  } catch {
    res.status(500).json({ error: 'Could not revoke free access' });
  }
});

// PUT /api/students/:id/plan — { planId, days? } grant a whole-platform plan, extending one that is running
router.put('/:id/plan', async (req, res) => {
  try {
    const student = await findStudent(req, res);
    if (!student) return;
    const plan = findPlan(req.body.planId);
    if (!plan) return res.status(400).json({ error: 'Choose one of the available plans' });
    const days = readDays(req.body.days, plan.days);
    if (!validDays(days)) return res.status(400).json({ error: 'Days must be a whole number between 1 and 3650' });
    const now = Date.now();
    const existing = await PlatformPass.findOne({ user: student._id });
    const base = existing && existing.expiresAt.getTime() > now ? existing.expiresAt.getTime() : now;
    const expiresAt = new Date(base + days * DAY_MS);
    await PlatformPass.findOneAndUpdate(
      { user: student._id },
      { $set: { expiresAt, plan: plan.id, grantedBy: req.user.id }, $setOnInsert: { user: student._id } },
      { upsert: true }
    );
    logActivity(req, { action: 'grant', resourceType: 'plan', resourceId: student._id, label: `${student.name} → ${plan.label} plan (${days}d)` });
    res.json(await publicStudent(student._id));
  } catch {
    res.status(500).json({ error: 'Could not grant the plan' });
  }
});

// DELETE /api/students/:id/plan — end the student's plan now
router.delete('/:id/plan', async (req, res) => {
  try {
    const student = await findStudent(req, res);
    if (!student) return;
    await PlatformPass.updateOne({ user: student._id }, { $set: { expiresAt: new Date() } });
    logActivity(req, { action: 'revoke', resourceType: 'plan', resourceId: student._id, label: `${student.name} → Plan revoked` });
    res.json(await publicStudent(student._id));
  } catch {
    res.status(500).json({ error: 'Could not revoke the plan' });
  }
});

module.exports = router;
