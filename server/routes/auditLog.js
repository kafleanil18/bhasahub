const express = require('express');
const AuditLog = require('../models/AuditLog');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

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

module.exports = router;
