const { isValidObjectId } = require('mongoose');
const Course = require('../models/Course');
const Subscription = require('../models/Subscription');
const PlatformPass = require('../models/PlatformPass');

// The expiry of the user's active whole-platform plan, or null.
async function activePassExpiry(userId) {
  if (!userId || !isValidObjectId(userId)) return null;
  const pass = await PlatformPass.findOne({ user: userId, expiresAt: { $gt: new Date() } }).select('expiresAt').lean();
  return pass ? pass.expiresAt : null;
}

// Course ids the user may open: every published course during a plan, otherwise their course subscriptions.
async function accessibleCourseIds(userId) {
  if (await activePassExpiry(userId)) return Course.find({ published: true }).distinct('_id');
  return Subscription.find({ user: userId, expiresAt: { $gt: new Date() } }).distinct('course');
}

module.exports = { activePassExpiry, accessibleCourseIds };
