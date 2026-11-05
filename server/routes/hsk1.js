const express = require('express');
const mongoose = require('mongoose');
const HskAttempt = require('../models/HskAttempt');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const PracticePaper = require('../models/PracticePaper');
const { logActivity } = require('../utils/auditLog');
const { createPaperTools } = require('../utils/hsk11226');
const { cleanContent, validateReady } = require('../utils/practicePaperContent');
const builtIn = require('../data/hsk11226');
const router = express.Router();
const staff = req => ['admin', 'superadmin'].includes(req.user.role);
const metadata = (id, content, published) => ({ id, title: content.title, code: content.code || id.toUpperCase(), published, custom: id !== 'h11226' });
router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', async (req, res) => {
  try {
    const records = await PracticePaper.find();
    const existing = records.find(row => row._id === 'h11226');
    const list = [metadata('h11226', builtIn, existing?.published ?? true), ...records.filter(row => row.content && /^paper-[a-f0-9]{24}$/.test(row._id)).map(row => metadata(row._id, row.content, row.published))];
    res.json(list.filter(row => staff(req) || row.published));
  } catch { res.status(500).json({ error: 'Could not load practice papers.' }); }
});
router.post('/', requireSuperAdmin, async (req, res) => {
  let content;
  try { content = cleanContent(req.body); }
  catch (err) { return res.status(400).json({ error: err.message }); }
  try {
    const id = `paper-${new mongoose.Types.ObjectId()}`;
    await PracticePaper.create({ _id: id, content, published: false });
    logActivity(req, { action: 'create', resourceType: 'test', resourceId: id, label: content.title });
    res.status(201).json(metadata(id, content, false));
  } catch { res.status(500).json({ error: 'Could not save the draft.' }); }
});
router.param('paperId', async (req, res, next, id) => {
  if (id !== 'h11226' && !/^paper-[a-f0-9]{24}$/.test(id)) return res.status(404).json({ error: 'Practice paper not found.' });
  try {
    const record = await PracticePaper.findById(id);
    if (id !== 'h11226' && !record?.content) return res.status(404).json({ error: 'Practice paper not found.' });
    req.paperId = id;
    req.paper = id === 'h11226' ? builtIn : { ...record.content, id };
    req.published = record?.published ?? true;
    req.paperTools = createPaperTools(req.paper);
    next();
  } catch { res.status(500).json({ error: 'Could not load the practice paper.' }); }
});
router.get('/:paperId/editor', requireSuperAdmin, (req, res) => {
  if (req.paperId === 'h11226') return res.status(400).json({ error: 'The reference paper cannot be edited. Create a new paper instead.' });
  res.json(req.paper);
});
router.put('/:paperId/content', requireSuperAdmin, async (req, res) => {
  if (req.paperId === 'h11226') return res.status(400).json({ error: 'The reference paper cannot be edited.' });
  let content;
  try { content = cleanContent(req.body); }
  catch (err) { return res.status(400).json({ error: err.message }); }
  try {
    // Every edit returns to draft. Existing attempts retain their original paper.
    await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { content, published: false } }, { runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: content.title });
    res.json(metadata(req.paperId, content, false));
  } catch { res.status(500).json({ error: 'Could not save the draft.' }); }
});
router.get('/:paperId/publication', (req, res) => res.json({ published: req.published }));
router.put('/:paperId/publication', requireAdmin, async (req, res) => {
  if (typeof req.body.published !== 'boolean') return res.status(400).json({ error: 'Published must be true or false.' });
  if (req.body.published && req.paperId !== 'h11226') {
    try { validateReady(req.paper); }
    catch (err) { return res.status(400).json({ error: err.message }); }
  }
  try {
    const saved = await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { published: req.body.published } }, { upsert: true, new: true, runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: `${req.paper.title} ${saved.published ? 'published' : 'hidden'}` });
    res.json({ published: saved.published });
  } catch { res.status(500).json({ error: 'Could not update paper visibility.' }); }
});
function requirePublishedPaper(req, res, next) {
  if (!staff(req) && !req.published) return res.status(404).json({ error: 'This practice paper is currently hidden.' });
  next();
}
const resultFor = (req, attempt) => createPaperTools(attempt.paperSnapshot || req.paper).result(attempt);
router.get('/:paperId', requirePublishedPaper, (req, res) => res.json(req.paperTools.publicPaper()));
router.get('/:paperId/attempts', async (req, res) => {
  try {
    const attempts = await HskAttempt.find({ user: req.user.id, paper: req.paperId, status: 'submitted' }).sort({ createdAt: -1 }).limit(20).select('score listening reading submittedAt');
    res.json(attempts);
  } catch { res.status(500).json({ error: 'Could not load your results.' }); }
});
router.post('/:paperId/attempts', requirePublishedPaper, async (req, res) => {
  if (req.paperId !== 'h11226') {
    try { validateReady(req.paper); }
    catch (err) { return res.status(400).json({ error: `Paper is not ready: ${err.message}` }); }
  }
  try { res.status(201).json(resultFor(req, await HskAttempt.create({ user: req.user.id, paper: req.paperId, paperSnapshot: req.paper }))); }
  catch { res.status(500).json({ error: 'Could not start the test. Please try again.' }); }
});
router.get('/:paperId/attempts/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid attempt.' });
  try {
    const attempt = await HskAttempt.findOne({ _id: req.params.id, user: req.user.id, paper: req.paperId });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    res.json(resultFor(req, attempt));
  } catch { res.status(500).json({ error: 'Could not load the attempt.' }); }
});
router.post('/:paperId/attempts/:id/submit', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid attempt.' });
  try {
    const filter = { _id: req.params.id, user: req.user.id, paper: req.paperId };
    const existing = await HskAttempt.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Attempt not found.' });
    let scores;
    try { scores = createPaperTools(existing.paperSnapshot || req.paper).grade(req.body.answers); }
    catch (err) { return res.status(400).json({ error: err.message }); }
    const attempt = await HskAttempt.findOneAndUpdate({ ...filter, status: 'started' }, { $set: { ...scores, answers: req.body.answers, status: 'submitted', submittedAt: new Date() } }, { new: true, runValidators: true });
    const saved = attempt || await HskAttempt.findOne(filter);
    res.json(resultFor(req, saved));
  } catch { res.status(500).json({ error: 'Could not save your result. Your answers are preserved; please retry.' }); }
});
module.exports = router;
