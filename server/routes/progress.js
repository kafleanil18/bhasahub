const express = require('express');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/progress/course/:courseId — my progress for a course
router.get('/course/:courseId', requireAuth, async (req, res) => {
  try {
    // total published lessons in the course
    const totalLessons = await Lesson.countDocuments({
      course: req.params.courseId,
      published: true,
    });
    // lessons I've completed in this course
    const done = await Progress.find({
      user: req.user.id,
      course: req.params.courseId,
      completed: true,
    });
    const completedLessonIds = done.map((p) => p.lesson.toString());
    res.json({
      total: totalLessons,
      completed: completedLessonIds.length,
      completedLessonIds,
    });
  } catch {
    res.status(500).json({ error: 'Could not load progress' });
  }
});

// POST /api/progress/lesson/:lessonId — mark a lesson complete
router.post('/lesson/:lessonId', requireAuth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    try {
      await Progress.create({
        user: req.user.id,
        course: lesson.course,
        lesson: lesson._id,
        completed: true,
      });
    } catch (e) {
      if (e.code === 11000) {
        // already exists — make sure it's marked completed
        await Progress.updateOne(
          { user: req.user.id, lesson: lesson._id },
          { completed: true }
        );
      } else throw e;
    }
    res.status(201).json({ message: 'Marked complete' });
  } catch {
    res.status(500).json({ error: 'Could not save progress' });
  }
});

// DELETE /api/progress/lesson/:lessonId — un-mark a lesson
router.delete('/lesson/:lessonId', requireAuth, async (req, res) => {
  try {
    await Progress.deleteOne({ user: req.user.id, lesson: req.params.lessonId });
    res.json({ message: 'Un-marked' });
  } catch {
    res.status(500).json({ error: 'Could not update progress' });
  }
});

module.exports = router;