const jwt = require('jsonwebtoken');

// Checks: is there a valid token?
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // makes { id, role } available to the route
    next(); // all good — proceed to the route
  } catch {
    return res.status(401).json({ error: 'Session expired — please log in again' });
  }
}

// Checks: is the logged-in user an admin?
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };