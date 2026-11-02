const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Checks: is there a valid token?
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  const token = header.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id).select('role');
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    req.user = { id: String(user._id), role: user.role };
    next(); // all good — proceed to the route
  } catch {
    return res.status(401).json({ error: 'Session expired — please log in again' });
  }
}

// Checks: is the logged-in user an admin OR super admin?
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Checks: is the logged-in user a super admin?
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireSuperAdmin };
function optionalAuth(req, res, next) {
  return req.headers.authorization ? requireAuth(req, res, next) : next();
}
module.exports.optionalAuth = optionalAuth;
