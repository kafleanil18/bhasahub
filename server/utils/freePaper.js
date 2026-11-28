const SiteSettings = require('../models/SiteSettings');
const { FREE_PAPER_ID } = require('./testAccess');

// The HSK 1 mock test every signed-in student can take without a free week or plan. A super admin
// chooses it in Manage tests; until then it is H11226.
async function freePaperId() {
  const settings = await SiteSettings.findOne({ key: 'main' }).select('freePaperId').lean();
  return settings?.freePaperId || FREE_PAPER_ID;
}

async function setFreePaperId(id) {
  await SiteSettings.findOneAndUpdate({ key: 'main' }, { $set: { freePaperId: id }, $setOnInsert: { key: 'main' } }, { upsert: true });
  return id;
}

module.exports = { freePaperId, setFreePaperId };
