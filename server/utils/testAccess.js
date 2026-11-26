const { isValidObjectId } = require('mongoose');
const AccessRequest = require('../models/AccessRequest');
const Subscription = require('../models/Subscription');
const { activePassExpiry } = require('./platformAccess');

const FREE_PAPER_ID = 'h11226';
const FREE_ACCESS_DAYS = 7;

// An approved free-access request that has not run out.
const activeFreeAccessFilter = userId => ({ user: userId, scope: 'tests', status: 'approved', $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }] });

// The practice studio and every mock test are open to admins, and to students during a free week,
// an active plan or an active course subscription. The app's practice gate follows the same rule.
async function hasTestAccess(user) {
  if (['admin', 'superadmin'].includes(user.role)) return true;
  if (await AccessRequest.exists(activeFreeAccessFilter(user.id))) return true;
  if (!isValidObjectId(user.id)) return false;
  if (await activePassExpiry(user.id)) return true;
  return !!await Subscription.exists({ user: user.id, expiresAt: { $gt: new Date() } });
}

module.exports = { FREE_PAPER_ID, FREE_ACCESS_DAYS, activeFreeAccessFilter, hasTestAccess };
