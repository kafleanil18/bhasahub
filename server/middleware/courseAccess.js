const Course = require('../models/Course');
const Subscription = require('../models/Subscription');

function isAdmin(user) {
  return user && ['admin', 'superadmin'].includes(user.role);
}

async function canAccessCourse(user, courseId) {
  if (isAdmin(user)) return true;
  if (!user) return false;
  const course = await Course.findById(courseId);
  if (!course || !course.published) return false;
  return !!await Subscription.exists({ user: user.id, course: courseId, expiresAt: { $gt: new Date() } });
}

module.exports = { isAdmin, canAccessCourse };
