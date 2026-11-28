const express = require('express');
const mongoose = require('mongoose');
const HskAttempt = require('../models/HskAttempt');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const PracticePaper = require('../models/PracticePaper');
const { logActivity } = require('../utils/auditLog');
const { createPaperTools } = require('../utils/hsk11226');
const { cleanContent, validateReady } = require('../utils/practicePaperContent');
const { hasTestAccess } = require('../utils/testAccess');
const { freePaperId, setFreePaperId } = require('../utils/freePaper');
const builtIns = require('../data/hskPapers');
const router = express.Router();
const staff = req => ['admin', 'superadmin'].includes(req.user.role);
const isBuiltIn = id => Object.hasOwn(builtIns, id);
// `edited`: a built-in paper whose content a superadmin has replaced. `deleted`: soft-deleted, restorable.
// `free`: the paper every signed-in student can take (see utils/freePaper.js). `addedAt`: when it was
// added, for sorting in Manage tests (a bundled paper's own date, or a custom paper's creation time).
const metadata = (id, content, published, extra = {}) => ({ id, title: content.title, code: content.code || id.toUpperCase(), published, custom: !isBuiltIn(id), edited: false, deleted: false, free: false, addedAt: null, ...extra });

// GET /api/hsk1/free — public: which paper is free, so the home page can link straight to it.
router.get('/free', async (req, res) => {
  try {
    const id = await freePaperId();
    const record = await PracticePaper.findById(id);
    res.set('Cache-Control', 'no-store');
    res.json({ id, code: record?.content?.code || builtIns[id]?.code || id.toUpperCase() });
  } catch { res.status(500).json({ error: 'Could not load the free paper.' }); }
});

router.use(requireAuth);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', async (req, res) => {
  try {
    const [records, freeId] = await Promise.all([PracticePaper.find(), freePaperId()]);
    const byId = new Map(records.map(row => [row._id, row]));
    const references = Object.entries(builtIns).map(([id, paper]) => {
      const record = byId.get(id);
      return metadata(id, record?.content || paper, !record?.deleted && (record?.published ?? paper.publishedByDefault !== false), { edited: Boolean(record?.content), deleted: Boolean(record?.deleted), free: id === freeId, addedAt: paper.addedAt || null });
    });
    const custom = records.filter(row => row.content && /^paper-[a-f0-9]{24}$/.test(row._id)).map(row => metadata(row._id, row.content, !row.deleted && row.published, { deleted: Boolean(row.deleted), free: row._id === freeId, addedAt: row.createdAt || null }));
    const list = [...references, ...custom];
    res.json(staff(req) ? list : list.filter(row => row.published && !row.deleted));
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
  if (!isBuiltIn(id) && !/^paper-[a-f0-9]{24}$/.test(id)) return res.status(404).json({ error: 'Practice paper not found.' });
  try {
    const record = await PracticePaper.findById(id);
    if (!isBuiltIn(id) && !record?.content) return res.status(404).json({ error: 'Practice paper not found.' });
    // Deleted papers disappear for students, including their past attempts; staff can still preview and restore them.
    if (record?.deleted && !staff(req)) return res.status(404).json({ error: 'Practice paper not found.' });
    req.paperId = id;
    req.record = record;
    req.deleted = Boolean(record?.deleted);
    // A built-in paper uses the bundled file unless a superadmin saved replacement content.
    req.paper = record?.content ? { ...record.content, id } : builtIns[id];
    // Bundled papers are visible unless a staff member hid them; a paper can opt to start hidden.
    req.published = !req.deleted && (record?.published ?? builtIns[id]?.publishedByDefault !== false);
    req.paperTools = createPaperTools(req.paper);
    next();
  } catch { res.status(500).json({ error: 'Could not load the practice paper.' }); }
});
router.get('/:paperId/editor', requireSuperAdmin, (req, res) => res.json(req.paper));
router.put('/:paperId/content', requireSuperAdmin, async (req, res) => {
  let content;
  try { content = cleanContent(req.body); }
  catch (err) { return res.status(400).json({ error: err.message }); }
  // A live paper stays live when the edited content is still complete; otherwise it returns to a hidden draft.
  // Existing attempts keep the paper version they started with.
  let published = false;
  let notice;
  if (req.published) {
    try { validateReady(content); published = true; }
    catch (err) { notice = `Saved as hidden because the paper is incomplete: ${err.message}`; }
  }
  try {
    await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { content, published } }, { upsert: true, runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: content.title });
    res.json({ ...metadata(req.paperId, content, published, { edited: isBuiltIn(req.paperId), deleted: req.deleted }), ...(notice ? { notice } : {}) });
  } catch { res.status(500).json({ error: 'Could not save the paper.' }); }
});
router.delete('/:paperId/content', requireSuperAdmin, async (req, res) => {
  if (!isBuiltIn(req.paperId)) return res.status(400).json({ error: 'Only built-in papers have an original version to restore.' });
  try {
    await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { content: null } }, { upsert: true, runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: `${builtIns[req.paperId].title} restored to original` });
    res.json(metadata(req.paperId, builtIns[req.paperId], req.published, { deleted: req.deleted }));
  } catch { res.status(500).json({ error: 'Could not restore the original paper.' }); }
});
router.delete('/:paperId', requireSuperAdmin, async (req, res) => {
  try {
    if (req.paperId === await freePaperId()) return res.status(409).json({ error: 'This is the free mock test. Make another paper free before deleting it.' });
    await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { deleted: true, published: false } }, { upsert: true, runValidators: true });
    logActivity(req, { action: 'delete', resourceType: 'test', resourceId: req.paperId, label: req.paper.title });
    res.json({ deleted: true, published: false });
  } catch { res.status(500).json({ error: 'Could not delete the paper.' }); }
});
router.post('/:paperId/restore', requireSuperAdmin, async (req, res) => {
  try {
    // Restored papers come back hidden so staff can check them before making them live.
    await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { deleted: false, published: false } }, { upsert: true, runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: `${req.paper.title} restored` });
    res.json({ deleted: false, published: false });
  } catch { res.status(500).json({ error: 'Could not restore the paper.' }); }
});
router.get('/:paperId/publication', (req, res) => res.json({ published: req.published }));
// PUT /api/hsk1/:paperId/free — super admin: make this the paper every signed-in student can take for
// free. It has to be live, so students can actually open it.
router.put('/:paperId/free', requireSuperAdmin, async (req, res) => {
  if (req.deleted || !req.published) return res.status(409).json({ error: 'Make this paper live before making it the free one.' });
  try {
    await setFreePaperId(req.paperId);
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: `${req.paper.title} is now the free mock test` });
    res.json({ free: req.paperId });
  } catch { res.status(500).json({ error: 'Could not change the free paper.' }); }
});
router.put('/:paperId/publication', requireAdmin, async (req, res) => {
  if (typeof req.body.published !== 'boolean') return res.status(400).json({ error: 'Published must be true or false.' });
  if (req.body.published && req.deleted) return res.status(400).json({ error: 'Restore this paper before making it live.' });
  // The free paper must stay live; choose another free paper first.
  try { if (!req.body.published && req.paperId === await freePaperId()) return res.status(409).json({ error: 'This is the free mock test. Make another paper free before hiding it.' }); }
  catch { return res.status(500).json({ error: 'Could not update paper visibility.' }); }
  if (req.body.published && (!isBuiltIn(req.paperId) || req.record?.content)) {
    try { validateReady(req.paper); }
    catch (err) { return res.status(400).json({ error: err.message }); }
  }
  try {
    const saved = await PracticePaper.findByIdAndUpdate(req.paperId, { $set: { published: req.body.published } }, { upsert: true, returnDocument: 'after', runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'test', resourceId: req.paperId, label: `${req.paper.title} ${saved.published ? 'published' : 'hidden'}` });
    res.json({ published: saved.published });
  } catch { res.status(500).json({ error: 'Could not update paper visibility.' }); }
});
function requirePublishedPaper(req, res, next) {
  if (!staff(req) && !req.published) return res.status(404).json({ error: 'This practice paper is currently hidden.' });
  next();
}
async function requireTestAccess(req, res, next) {
  try {
    if (req.paperId === await freePaperId()) return next();
    if (!await hasTestAccess(req.user)) return res.status(403).json({ error: 'This mock test is locked. Request access to unlock all tests.', code: 'TESTS_LOCKED' });
    next();
  } catch { res.status(500).json({ error: 'Could not check your test access.' }); }
}
function resultFor(req, attempt) {
  const value = attempt.toObject ? attempt.toObject() : attempt;
  let definition = value.paperSnapshot || req.paper;
  // Reference examples are unscored guidance. Older snapshots keep their exam
  // questions and timing, but receive the current reference's worked examples.
  if (value.paperSnapshot && Object.hasOwn(builtIns, req.paperId)) {
    const fields = ['example', 'exampleImage', 'exampleImageAlt', 'exampleImageCompact'];
    definition = { ...definition, groups: definition.groups.map(group => {
      const reference = req.paper.groups.find(current => current.id === group.id);
      const examples = Object.fromEntries(fields.filter(field => reference?.[field] !== undefined).map(field => [field, reference[field]]));
      return { ...group, ...examples };
    }) };
  }
  return createPaperTools(definition).result(value.paperSnapshot ? { ...value, paperSnapshot: definition } : value);
}
router.get('/:paperId', requirePublishedPaper, requireTestAccess, (req, res) => res.json(req.paperTools.publicPaper()));
router.get('/:paperId/attempts', async (req, res) => {
  try {
    const attempts = await HskAttempt.find({ user: req.user.id, paper: req.paperId, status: 'submitted' }).sort({ createdAt: -1 }).limit(20).select('score listening reading submittedAt');
    res.json(attempts);
  } catch { res.status(500).json({ error: 'Could not load your results.' }); }
});
router.post('/:paperId/attempts', requirePublishedPaper, requireTestAccess, async (req, res) => {
  if (!isBuiltIn(req.paperId) || req.record?.content) {
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
    const attempt = await HskAttempt.findOneAndUpdate({ ...filter, status: 'started' }, { $set: { ...scores, answers: req.body.answers, status: 'submitted', submittedAt: new Date() } }, { returnDocument: 'after', runValidators: true });
    const saved = attempt || await HskAttempt.findOne(filter);
    res.json(resultFor(req, saved));
  } catch { res.status(500).json({ error: 'Could not save your result. Your answers are preserved; please retry.' }); }
});
module.exports = router;
