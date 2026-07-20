const express = require('express');
const User = require('../models/User');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

// GET /api/users — super admin: list all users
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Could not load users' });
  }
});

// PUT /api/users/:id/role — super admin: change a user's role
router.put('/:id/role', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or admin' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot change a super admin\'s role' });
    }
    const previousRole = target.role;
    target.role = role;
    await target.save();
    logActivity(req, {
      action: 'role-change',
      resourceType: 'user',
      resourceId: target._id,
      label: `${target.name}: ${previousRole} → ${role}`,
    });
    res.json({ message: 'Role updated', user: { id: target._id, name: target.name, role: target.role } });
  } catch {
    res.status(500).json({ error: 'Could not update role' });
  }
});

module.exports = router;