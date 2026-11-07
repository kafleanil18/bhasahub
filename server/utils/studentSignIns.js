const StudentSignIn = require('../models/StudentSignIn');
const User = require('../models/User');
const TIME_ZONE = 'Asia/Kathmandu';

function nepalDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
function dayRange(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const utc = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== day) return null;
  const start = new Date(utc.getTime() - 345 * 60000);
  return { start, end: new Date(start.getTime() + 86400000) };
}
async function recordStudentSignIn(user, method) {
  if (user.role !== 'student') return false;
  let isFirstLogin = false;
  try {
    // Check older audit history before recording this session, then atomically
    // claim the first sign-in so concurrent logins cannot both be first.
    const hasHistory = user.signInCount > 0 || !!await StudentSignIn.exists({ student: user._id });
    const previous = await User.findOneAndUpdate({ _id: user._id }, { $inc: { signInCount: 1 } }, { new: false });
    isFirstLogin = !!previous && !(previous.signInCount > 0) && !hasHistory;
  } catch (err) {
    console.error('Student welcome tracking failed:', err.message);
  }
  try {
    await StudentSignIn.create({ student: user._id, name: user.name, email: user.email, method });
  } catch (err) {
    // A reporting outage must not prevent an authenticated student signing in.
    console.error('Student sign-in logging failed:', err.message);
  }
  return isFirstLogin;
}
module.exports = { nepalDate, dayRange, recordStudentSignIn, TIME_ZONE };
