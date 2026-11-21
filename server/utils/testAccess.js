const AccessRequest = require('../models/AccessRequest');

const FREE_PAPER_ID = 'h11226';

async function hasTestAccess(user) {
  if (['admin', 'superadmin'].includes(user.role)) return true;
  return !!await AccessRequest.exists({ user: user.id, scope: 'tests', status: 'approved' });
}

module.exports = { FREE_PAPER_ID, hasTestAccess };
