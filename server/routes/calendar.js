const express = require('express');
const ClassUpdate = require('../models/ClassUpdate');
const Enrollment = require('../models/Enrollment');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

const isAdminUser = (user) => user.role === 'admin' || user.role === 'superadmin';

// GET /api/calendar — any enrolled student (or admin) sees the full feed of dated updates
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      const enrolled = await Enrollment.exists({ user: req.user.id });
      if (!enrolled) return res.status(403).json({ error: 'Enroll in a course to view the class calendar' });
    }
    const updates = await ClassUpdate.find().sort({ date: -1, time: 1 }).populate('course', 'title');
    res.json(updates);
  } catch {
    res.status(500).json({ error: 'Could not load the calendar' });
  }
});

// POST /api/calendar — admin: add a dated update, optionally tagged to a course
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { course, date, time, title, note } = req.body;
    if (!date || !title) {
      return res.status(400).json({ error: 'Date and title are required' });
    }
    const entry = await ClassUpdate.create({ course: course || null, date, time: time || '', title, note });
    await entry.populate('course', 'title');
    logActivity(req, { action: 'create', resourceType: 'classUpdate', resourceId: entry._id, label: entry.title });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: 'Could not save the update' });
  }
});

// PUT /api/calendar/:id — admin: edit an update
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { course, date, time, title, note } = req.body;
    if (!date || !title) {
      return res.status(400).json({ error: 'Date and title are required' });
    }
    const entry = await ClassUpdate.findByIdAndUpdate(
      req.params.id,
      { course: course || null, date, time: time || '', title, note },
      { new: true }
    ).populate('course', 'title');
    if (!entry) return res.status(404).json({ error: 'Update not found' });
    logActivity(req, { action: 'update', resourceType: 'classUpdate', resourceId: entry._id, label: entry.title });
    res.json(entry);
  } catch {
    res.status(500).json({ error: 'Could not update the entry' });
  }
});

// DELETE /api/calendar/:id — admin: remove an update
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const entry = await ClassUpdate.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Update not found' });
    logActivity(req, { action: 'delete', resourceType: 'classUpdate', resourceId: entry._id, label: entry.title });
    res.json({ message: 'Update deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete the entry' });
  }
});

module.exports = router;
