const express = require('express');
const { Types } = require('mongoose');
const PlanRequest = require('../models/PlanRequest');
const PlatformPass = require('../models/PlatformPass');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { isAdmin } = require('../middleware/courseAccess');
const { logActivity } = require('../utils/auditLog');
const { PLANS, findPlan } = require('../utils/plans');
const { notifyAndRecord } = require('../utils/planRequestEmail');

const router = express.Router();
const DAY_MS = 86400000;

// GET /api/plans — public: the plans on offer
router.get('/', (req, res) => res.json(PLANS));

// GET /api/plans/my — student: their active plan and any request under review
router.get('/my', requireAuth, async (req, res) => {
  try {
    const [pass, request] = await Promise.all([
      PlatformPass.findOne({ user: req.user.id }).select('expiresAt plan').lean(),
      PlanRequest.findOne({ user: req.user.id }).sort({ createdAt: -1 }).select('plan price days status createdAt reviewedAt').lean(),
    ]);
    const active = pass && new Date(pass.expiresAt) > new Date();
    res.json({ pass: active ? { expiresAt: pass.expiresAt, plan: pass.plan } : null, request: request || null });
  } catch {
    res.status(500).json({ error: 'Could not load your plan' });
  }
});

// POST /api/plans/requests — student: ask for a plan (changing plan updates the pending request)
router.post('/requests', requireAuth, async (req, res) => {
  try {
    if (isAdmin(req.user)) return res.status(403).json({ error: 'Admins already have full access' });
    const plan = findPlan(req.body && req.body.planId);
    if (!plan) return res.status(400).json({ error: 'Choose one of the available plans' });
    const activePass = await PlatformPass.findOne({ user: req.user.id, expiresAt: { $gt: new Date() } }).select('expiresAt').lean();
    if (activePass) return res.status(409).json({ error: `Your plan is already active until ${new Date(activePass.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. You can choose a new plan when it ends.` });
    const fields = { plan: plan.id, price: plan.price, days: plan.days };
    const previous = await PlanRequest.findOneAndUpdate({ user: req.user.id, status: 'pending' }, { $set: fields }, { new: false });
    const request = previous ? { ...(previous.toObject ? previous.toObject() : previous), ...fields } : await PlanRequest.create({ user: req.user.id, ...fields });
    res.status(previous ? 200 : 201).json(request);
    // Tell the super admins after responding; a failed email never blocks the student.
    if (!previous || previous.plan !== plan.id) {
      void notifyAndRecord(PlanRequest, { studentId: req.user.id, request, changedFrom: previous ? previous.plan : null });
    }
  } catch {
    res.status(500).json({ error: 'Could not send your plan request' });
  }
});

// DELETE /api/plans/requests/my — student: withdraw a pending request
router.delete('/requests/my', requireAuth, async (req, res) => {
  try {
    const removed = await PlanRequest.findOneAndDelete({ user: req.user.id, status: 'pending' });
    if (!removed) return res.status(404).json({ error: 'No plan request is waiting for review' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not cancel your plan request' });
  }
});

// GET /api/plans/requests — admin: every request, pending first, newest first
router.get('/requests', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await PlanRequest.find().populate('user', 'name email').sort({ status: 1, createdAt: -1 }).limit(500);
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Could not load plan requests' });
  }
});

// GET /api/plans/members — admin: students with a plan, latest expiry first
router.get('/members', requireAuth, requireAdmin, async (req, res) => {
  try {
    const passes = await PlatformPass.find().populate('user', 'name email').sort({ expiresAt: -1 }).limit(500);
    res.json(passes);
  } catch {
    res.status(500).json({ error: 'Could not load plan members' });
  }
});

// PUT /api/plans/requests/:id/approve — admin: payment received, start or extend the plan
router.put('/requests/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Request not found' });
    const request = await PlanRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() } },
      { new: true }
    );
    if (!request) {
      const exists = await PlanRequest.exists({ _id: req.params.id });
      return res.status(exists ? 409 : 404).json({ error: exists ? 'Request has already been processed' : 'Request not found' });
    }
    await PlatformPass.findOneAndUpdate(
      { user: request.user },
      { $setOnInsert: { user: request.user, expiresAt: new Date(0) } },
      { upsert: true }
    ).catch(err => { if (err.code !== 11000) throw err; });
    // Extends from the current expiry when a plan is still running; each request applies once.
    const pass = await PlatformPass.findOneAndUpdate(
      { user: request.user, appliedRequests: { $ne: request._id } },
      [{ $set: {
        expiresAt: { $add: [{ $max: ['$expiresAt', '$$NOW'] }, request.days * DAY_MS] },
        plan: request.plan,
        grantedBy: new Types.ObjectId(req.user.id),
        appliedRequests: { $concatArrays: [{ $ifNull: ['$appliedRequests', []] }, [request._id]] },
      } }],
      { new: true, updatePipeline: true }
    ) || await PlatformPass.findOne({ user: request.user });
    const student = await User.findById(request.user).select('name');
    logActivity(req, {
      action: 'approve', resourceType: 'plan-request', resourceId: request._id,
      label: `${student ? student.name : 'Unknown'} → ${findPlan(request.plan)?.label || request.plan} plan (Rs ${request.price})`,
    });
    res.json({ request, pass });
  } catch {
    res.status(500).json({ error: 'Could not approve the plan request' });
  }
});

// POST /api/plans/requests/:id/notify — admin: send the super admin email again and report the result
router.post('/requests/:id/notify', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Request not found' });
    const request = await PlanRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const adminEmail = await notifyAndRecord(PlanRequest, { studentId: request.user, request });
    res.status(adminEmail.sentTo.length ? 200 : 502).json({ adminEmail, ...(adminEmail.sentTo.length ? {} : { error: `Email not sent: ${adminEmail.error}` }) });
  } catch {
    res.status(500).json({ error: 'Could not send the email' });
  }
});

// PUT /api/plans/requests/:id/deny — admin
router.put('/requests/:id/deny', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Request not found' });
    const request = await PlanRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'denied', reviewedBy: req.user.id, reviewedAt: new Date() } },
      { new: true }
    ).populate('user', 'name');
    if (!request) {
      const exists = await PlanRequest.exists({ _id: req.params.id });
      return res.status(exists ? 409 : 404).json({ error: exists ? 'Request has already been processed' : 'Request not found' });
    }
    logActivity(req, { action: 'deny', resourceType: 'plan-request', resourceId: request._id, label: `${request.user ? request.user.name : 'Unknown'} → ${request.plan}` });
    res.json(request);
  } catch {
    res.status(500).json({ error: 'Could not decline the plan request' });
  }
});

module.exports = router;
