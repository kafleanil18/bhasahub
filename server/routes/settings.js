const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

// GET /api/settings — public: site-wide settings (e.g. welcome video)
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      {},
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Could not load site settings' });
  }
});

// PUT /api/settings — super admin: update the welcome video
router.put('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const updateFields = {};
    if (req.body.welcomeVideoUrl !== undefined) updateFields.welcomeVideoUrl = req.body.welcomeVideoUrl;
    if (req.body.conversationLessons !== undefined) {
      if (!Array.isArray(req.body.conversationLessons) || req.body.conversationLessons.length > 12) {
        return res.status(400).json({ error: 'Conversation lessons must be a list of up to 12 lessons.' });
      }
      const valid = req.body.conversationLessons.every(lesson =>
        /^lesson-(?:[4-9]|1[0-5])$/.test(lesson?.id) &&
        typeof lesson.title === 'string' && Array.isArray(lesson.exchanges) && Array.isArray(lesson.words)
      );
      if (!valid) return res.status(400).json({ error: 'Conversation lesson content is invalid.' });
      updateFields.conversationLessons = req.body.conversationLessons;
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      updateFields,
      { new: true, upsert: true }
    );
    logActivity(req, { action: 'update', resourceType: 'site-settings', resourceId: settings._id, label: updateFields.conversationLessons ? 'Conversation lessons' : 'Welcome video' });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Could not update site settings' });
  }
});

module.exports = router;
