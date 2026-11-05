const express = require('express');
const mongoose = require('mongoose');
const HskAttempt = require('../models/HskAttempt');
const { requireAuth } = require('../middleware/auth');
const { publicPaper, grade, result } = require('../utils/hsk11226');
const router = express.Router();
router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/h11226', (req, res) => res.json(publicPaper()));
router.get('/h11226/attempts', async (req, res) => {
  try {
    const attempts = await HskAttempt.find({ user: req.user.id, paper: 'h11226', status: 'submitted' }).sort({ createdAt: -1 }).limit(20).select('score listening reading submittedAt');
    res.json(attempts);
  } catch { res.status(500).json({ error: 'Could not load your results.' }); }
});
router.post('/h11226/attempts', async (req, res) => {
  try { res.status(201).json(result(await HskAttempt.create({ user: req.user.id, paper: 'h11226' }))); }
  catch { res.status(500).json({ error: 'Could not start the test. Please try again.' }); }
});
router.get('/h11226/attempts/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid attempt.' });
  try {
    const attempt = await HskAttempt.findOne({ _id: req.params.id, user: req.user.id, paper: 'h11226' });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    res.json(result(attempt));
  } catch { res.status(500).json({ error: 'Could not load the attempt.' }); }
});
router.post('/h11226/attempts/:id/submit', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid attempt.' });
  let scores;
  try { scores = grade(req.body.answers); }
  catch (err) { return res.status(400).json({ error: err.message }); }
  try {
    // Atomic finalization makes retries safe and prevents changing a submitted score.
    const filter = { _id: req.params.id, user: req.user.id, paper: 'h11226' };
    const attempt = await HskAttempt.findOneAndUpdate({ ...filter, status: 'started' }, { $set: { ...scores, answers: req.body.answers, status: 'submitted', submittedAt: new Date() } }, { new: true, runValidators: true });
    const saved = attempt || await HskAttempt.findOne(filter);
    if (!saved) return res.status(404).json({ error: 'Attempt not found.' });
    res.json(result(saved));
  } catch { res.status(500).json({ error: 'Could not save your result. Your answers are preserved; please retry.' }); }
});
module.exports = router;
