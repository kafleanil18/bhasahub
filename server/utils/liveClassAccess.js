const PlanRequest = require('../models/PlanRequest');
const User = require('../models/User');

// Recorded sessions are for students in live classes: those who paid for live classes at checkout
// (a payment an admin approved, for as long as its plan length runs) and those a super admin
// marked as joined in Admin > Students.
const DAY_MS = 86400000;

// The latest end of live classes paid for in approved checkout payments, or null.
function paidLiveClassUntil(requests = []) {
  const ends = requests
    .filter(request => request.liveClass && request.status === 'approved' && request.reviewedAt && request.days)
    .map(request => new Date(new Date(request.reviewedAt).getTime() + request.days * DAY_MS));
  return ends.length ? new Date(Math.max(...ends.map(end => end.getTime()))) : null;
}

function liveClassSummary(granted, requests, now = Date.now()) {
  const paidUntil = paidLiveClassUntil(requests);
  const paid = !!paidUntil && paidUntil.getTime() > now;
  return { allowed: !!granted || paid, granted: !!granted, paidUntil: paid ? paidUntil : null };
}

async function liveClassStatus(userId) {
  const [user, requests] = await Promise.all([
    User.findById(userId).select('liveClassAccess').lean(),
    PlanRequest.find({ user: userId, status: 'approved', liveClass: true }).select('liveClass status reviewedAt days').lean(),
  ]);
  return liveClassSummary(user?.liveClassAccess, requests);
}

module.exports = { liveClassStatus, liveClassSummary, paidLiveClassUntil };
