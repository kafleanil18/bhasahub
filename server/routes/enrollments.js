const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments/my — courses the logged-in user is enrolled in
router.get('/my', requireAuth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id }).populate('course');
    const courses = enrollments.map((e) => e.course).filter(Boolean);
    res.json(courses);
  } catch {
    res.status(500).json({ error: 'Could not load your courses' });
  }
});

// GET /api/enrollments/status/:courseId — am I enrolled in this course?
router.get('/status/:courseId', requireAuth, async (req, res) => {
  try {
    const existing = await Enrollment.findOne({ user: req.user.id, course: req.params.courseId });
    res.json({ enrolled: !!existing });
  } catch {
    res.status(500).json({ error: 'Could not check enrollment' });
  }
});

// GET /api/enrollments/access — which courses the user can access (unlock status)
router.get('/access', requireAuth, async (req, res) => {
  try {
    const courses = await Course.find({ published: true }).sort({ createdAt: 1 });

    const result = [];
    let previousComplete = true; // the first course is always unlocked

    for (const course of courses) {
      const unlocked = previousComplete;

      const totalLessons = await Lesson.countDocuments({ course: course._id, published: true });
      const doneCount = await Progress.countDocuments({
        user: req.user.id,
        course: course._id,
        completed: true,
      });
      const isComplete = totalLessons > 0 && doneCount >= totalLessons;

      result.push({
        courseId: course._id,
        unlocked,
        isComplete,
        total: totalLessons,
        completed: doneCount,
      });

      previousComplete = isComplete;
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Could not check access' });
  }
});

// POST /api/enrollments/:courseId — enroll (only if earlier courses are complete)
router.post('/:courseId', requireAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // check all earlier published courses are fully complete
    const earlier = await Course.find({
      published: true,
      createdAt: { $lt: course.createdAt },
    });
    for (const prev of earlier) {
      const total = await Lesson.countDocuments({ course: prev._id, published: true });
      const done = await Progress.countDocuments({ user: req.user.id, course: prev._id, completed: true });
      if (total > 0 && done < total) {
        return res.status(403).json({ error: 'Finish the previous course first' });
      }
    }

    try {
      await Enrollment.create({ user: req.user.id, course: req.params.courseId });
    } catch (e) {
      if (e.code === 11000) return res.json({ message: 'Already enrolled' });
      throw e;
    }
    res.status(201).json({ message: 'Enrolled' });
  } catch {
    res.status(500).json({ error: 'Could not enroll' });
  }
});

// DELETE /api/enrollments/:courseId — un-enroll
router.delete('/:courseId', requireAuth, async (req, res) => {
  try {
    await Enrollment.deleteOne({ user: req.user.id, course: req.params.courseId });
    res.json({ message: 'Un-enrolled' });
  } catch {
    res.status(500).json({ error: 'Could not un-enroll' });
  }
});

module.exports = router;