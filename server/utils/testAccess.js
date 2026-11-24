const AccessRequest = require('../models/AccessRequest');

const FREE_PAPER_ID = 'h11226';
const FREE_ACCESS_DAYS = 7;

// An approved free-access request that has not run out.
const activeFreeAccessFilter = userId => ({ user: userId, scope: 'tests', status: 'approved', $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }] });

async function hasTestAccess(user) {
  if (['admin', 'superadmin'].includes(user.role)) return true;
  return !!await AccessRequest.exists(activeFreeAccessFilter(user.id));
}

module.exports = { FREE_PAPER_ID, FREE_ACCESS_DAYS, activeFreeAccessFilter, hasTestAccess };
