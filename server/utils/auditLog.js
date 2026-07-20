const AuditLog = require('../models/AuditLog');

// Fire-and-forget: a logging failure must never break the admin action that
// triggered it, so every error is swallowed here rather than bubbled up.
function logActivity(req, { action, resourceType, resourceId, label }) {
  AuditLog.create({
    actor: req.user ? req.user.id : null,
    action,
    resourceType,
    resourceId: resourceId ? String(resourceId) : '',
    label: label || '',
  }).catch((err) => console.error('Audit log error:', err));
}

module.exports = { logActivity };
