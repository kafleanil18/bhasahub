const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Sign-in tokens carry the account's tokenVersion. Changing or resetting the password bumps
// that number, so every token issued before then stops working on every device.
const SESSION_LIFETIME = '7d';

function signSession(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role, v: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: SESSION_LIFETIME },
  );
}

// Returns the payload of a valid sign-in token, or throws.
function verifySession(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
}

// Tokens issued before versions existed carry no "v" and count as version 0.
function sessionIsCurrent(payload, user) {
  return (payload.v || 0) === (user.tokenVersion || 0);
}

// Constant-time comparison, so response timing never hints at how much of a secret matched.
function secretsMatch(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || !given || !expected) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = { signSession, verifySession, sessionIsCurrent, secretsMatch };
