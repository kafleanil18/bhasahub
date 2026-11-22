const express = require('express');
const Teacher = require('../models/Teacher');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

// GET /api/teachers — public: shown on the live classes enquiry form
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: 1 });
    res.json(teachers);
  } catch {
    res.status(500).json({ error: 'Could not load teachers' });
  }
});

// POST /api/teachers — super admin: add a new teacher slot
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.create({ name: 'New Teacher', title: 'Chinese Teacher', bio: '' });
    logActivity(req, { action: 'create', resourceType: 'teacher', resourceId: teacher._id, label: teacher.name });
    res.status(201).json(teacher);
  } catch {
    res.status(500).json({ error: 'Could not create teacher' });
  }
});

// PUT /api/teachers/:id — super admin: edit a teacher's details
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const updateFields = {};
    for (const field of ['name', 'title', 'bio', 'photo']) {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    }
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, updateFields, { returnDocument: 'after' });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    logActivity(req, { action: 'update', resourceType: 'teacher', resourceId: teacher._id, label: teacher.name });
    res.json(teacher);
  } catch {
    res.status(500).json({ error: 'Could not update teacher' });
  }
});

// DELETE /api/teachers/:id — super admin: remove a teacher
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (teacher) logActivity(req, { action: 'delete', resourceType: 'teacher', resourceId: teacher._id, label: teacher.name });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not delete teacher' });
  }
});

module.exports = router;
