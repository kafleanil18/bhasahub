const express = require('express');
const { Types } = require('mongoose');
const RecordedSession = require('../models/RecordedSession');
const User = require('../models/User');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');
const { liveClassStatus } = require('../utils/liveClassAccess');

const router = express.Router();
router.use(requireAuth);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const validId = id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const studentFields = 'title description sessionDate';
const studentOnly = (req, res, next) => req.user.role === 'student' ? next() : res.status(403).json({ error: 'Student access required' });

// Recordings are for students in live classes (paid at checkout, or marked joined by a super admin).
const LOCKED = { error: 'Recorded sessions are for students in live classes.', code: 'RECORDED_LOCKED' };
const liveClassOnly = async (req, res, next) => {
  try { return (await liveClassStatus(req.user.id)).allowed ? next() : res.status(403).json(LOCKED); }
  catch { return res.status(500).json({ error: 'Could not check your access' }); }
};

// GET /api/recorded-sessions/access — student: whether Recorded sessions is open to them.
router.get('/access', studentOnly, async (req, res) => {
  try { res.json(await liveClassStatus(req.user.id)); }
  catch { res.status(500).json({ error: 'Could not check your access' }); }
});

router.get('/mine', studentOnly, liveClassOnly, async (req, res) => {
  if (req.query.date !== undefined && !validDate(req.query.date)) return res.status(400).json({ error: 'Choose a valid session date' });
  const filter = { allowedStudents: req.user.id };
  if (req.query.date) filter.sessionDate = req.query.date;
  const sessions = await RecordedSession.find(filter).select(studentFields).sort({ sessionDate: -1, createdAt: -1 }).lean();
  res.json(sessions);
});

// Fetch the playback URL only when opening a recording; access is checked again after revocation.
router.get('/:id/watch', studentOnly, liveClassOnly, async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Recording not found or no longer shared with you' });
  const session = await RecordedSession.findOne({ _id: req.params.id, allowedStudents: req.user.id })
    .select(`${studentFields} videoUrl`).lean();
  if (!session) return res.status(404).json({ error: 'Recording not found or no longer shared with you' });
  res.json(session);
});

router.use(requireSuperAdmin);
router.get('/students', async (_req, res) => {
  res.json(await User.find({ role: 'student' }).select('name email').sort({ name: 1 }).lean());
});
router.get('/', async (_req, res) => {
  res.json(await RecordedSession.find().sort({ sessionDate: -1, createdAt: -1 }).lean());
});

async function readInput(body) {
  const fail = message => { const error = new Error(message); error.status = 400; throw error; };
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 160) fail('Enter a title of up to 160 characters');
  if (!validDate(body.sessionDate)) fail('Choose a valid session date');
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 3000)) fail('Keep the description within 3,000 characters');
  let url;
  try { url = new URL(body.videoUrl); } catch { fail('Enter a valid HTTPS video link'); }
  if (typeof body.videoUrl !== 'string' || body.videoUrl.length > 2048 || url.protocol !== 'https:' || url.username || url.password) fail('Enter a valid HTTPS video link');
  if (!Array.isArray(body.allowedStudents) || body.allowedStudents.some(id => !validId(id))) fail('Choose valid student accounts');
  const allowedStudents = [...new Set(body.allowedStudents)];
  if (allowedStudents.length) {
    const count = await User.countDocuments({ _id: { $in: allowedStudents }, role: 'student' });
    if (count !== allowedStudents.length) fail('Some selected students are no longer available. Refresh the student list.');
  }
  return { title: body.title.trim(), description: (body.description || '').trim(), sessionDate: body.sessionDate, videoUrl: url.href, allowedStudents };
}

router.post('/', async (req, res) => {
  const input = await readInput(req.body || {});
  const session = await RecordedSession.create({ ...input, createdBy: req.user.id });
  logActivity(req, { action: 'create', resourceType: 'recorded-session', resourceId: session._id, label: `${session.title} (${input.allowedStudents.length} students)` });
  res.status(201).json(session);
});
router.put('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Recording not found' });
  const input = await readInput(req.body || {});
  const session = await RecordedSession.findByIdAndUpdate(req.params.id, { $set: input }, { new: true, runValidators: true });
  if (!session) return res.status(404).json({ error: 'Recording not found' });
  logActivity(req, { action: 'update', resourceType: 'recorded-session', resourceId: session._id, label: `${session.title} (${input.allowedStudents.length} students)` });
  res.json(session);
});
router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Recording not found' });
  const session = await RecordedSession.findByIdAndDelete(req.params.id);
  if (!session) return res.status(404).json({ error: 'Recording not found' });
  logActivity(req, { action: 'delete', resourceType: 'recorded-session', resourceId: session._id, label: session.title });
  res.json({ message: 'Recording removed' });
});
router.use((err, _req, res, _next) => {
  if (err.status === 400) return res.status(400).json({ error: err.message });
  console.error('Recorded sessions error:', err);
  res.status(500).json({ error: 'Could not load or save recorded sessions. Please try again.' });
});
module.exports = router;
