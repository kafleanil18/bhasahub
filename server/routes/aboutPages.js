const express = require('express');
const { verifySession, sessionIsCurrent } = require('../utils/sessionToken');
const AboutPage = require('../models/AboutPage');
const User = require('../models/User');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();
const PAGES = { 'xiao-ao': { label: 'About Xiao Ao', hideable: true }, hsk: { label: 'About HSK', hideable: false } };
const MAX_FIELDS = 80;
const MAX_LENGTH = 3000;

const isVisible = (slug, page) => !PAGES[slug].hideable || page?.visible === true;

// Public pages are read with or without a sign-in. A super admin may read a hidden page to preview
// it; a missing, expired or invalid token simply counts as a visitor.
async function isSuperAdmin(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return false;
  try {
    const payload = verifySession(header.slice(7));
    const user = await User.findById(payload.id).select('role tokenVersion');
    return Boolean(user) && sessionIsCurrent(payload, user) && user.role === 'superadmin';
  } catch {
    return false;
  }
}

// Saved text must be a flat object of short strings. Empty strings drop the override, so the
// page falls back to its default wording.
function cleanContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const entries = Object.entries(content);
  if (entries.length > MAX_FIELDS) return null;
  const clean = {};
  for (const [key, value] of entries) {
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(key) || typeof value !== 'string' || value.length > MAX_LENGTH) return null;
    const text = value.trim();
    if (text) clean[key] = text;
  }
  return clean;
}

// GET /api/about-pages — public: which About pages visitors can open (for footer and menu links).
router.get('/', async (req, res) => {
  try {
    const pages = await AboutPage.find({}, 'slug visible').lean();
    res.json(Object.keys(PAGES).map(slug => ({ slug, visible: isVisible(slug, pages.find(page => page.slug === slug)) })));
  } catch {
    res.status(500).json({ error: 'Could not load the About pages' });
  }
});

// GET /api/about-pages/:slug — public: a page's saved text. A hidden page is "not found" for
// everyone except a super admin.
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!PAGES[slug]) return res.status(404).json({ error: 'Page not found' });
  try {
    const page = await AboutPage.findOne({ slug }).lean();
    const visible = isVisible(slug, page);
    if (!visible && !await isSuperAdmin(req)) return res.status(404).json({ error: 'Page not found' });
    res.json({ slug, visible, hideable: PAGES[slug].hideable, content: page?.content || {}, updatedAt: page?.updatedAt || null });
  } catch {
    res.status(500).json({ error: 'Could not load this page' });
  }
});

// PUT /api/about-pages/:slug — super admin: save the page's text and, for About Xiao Ao, whether
// visitors can see it. Either part may be sent on its own.
router.put('/:slug', requireAuth, requireSuperAdmin, async (req, res) => {
  const { slug } = req.params;
  if (!PAGES[slug]) return res.status(404).json({ error: 'Page not found' });
  const update = {};
  if (req.body.content !== undefined) {
    const content = cleanContent(req.body.content);
    if (!content) return res.status(400).json({ error: `Page text must be up to ${MAX_FIELDS} fields of up to ${MAX_LENGTH} characters each.` });
    update.content = content;
  }
  if (req.body.visible !== undefined) {
    if (!PAGES[slug].hideable) return res.status(400).json({ error: `${PAGES[slug].label} is always visible.` });
    if (typeof req.body.visible !== 'boolean') return res.status(400).json({ error: 'Visibility must be true or false.' });
    update.visible = req.body.visible;
  }
  if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to save.' });
  try {
    const page = await AboutPage.findOneAndUpdate({ slug }, { $set: update, $setOnInsert: { slug } }, { returnDocument: 'after', upsert: true, runValidators: true }).lean();
    const label = update.visible === undefined ? `${PAGES[slug].label} text` : `${PAGES[slug].label} ${update.visible ? 'shown to visitors' : 'hidden from visitors'}`;
    logActivity(req, { action: 'update', resourceType: 'about-page', resourceId: page._id, label });
    res.json({ slug, visible: isVisible(slug, page), hideable: PAGES[slug].hideable, content: page.content || {}, updatedAt: page.updatedAt || null });
  } catch {
    res.status(500).json({ error: 'Could not save this page' });
  }
});

module.exports = router;
