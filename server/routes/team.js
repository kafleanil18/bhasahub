const express = require('express');
const TeamMember = require('../models/TeamMember');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/team — public: photo overrides for the team section
router.get('/', async (req, res) => {
  try {
    const members = await TeamMember.find();
    res.json(members);
  } catch {
    res.status(500).json({ error: 'Could not load team members' });
  }
});

// PUT /api/team/:key — admin: set or replace a member's photo
router.put('/:key', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    if (!['founder', 'developer', 'pm'].includes(key)) {
      return res.status(400).json({ error: 'Unknown team member key' });
    }
    const member = await TeamMember.findOneAndUpdate(
      { key },
      { photo: req.body.photo || '' },
      { new: true, upsert: true }
    );
    res.json(member);
  } catch {
    res.status(500).json({ error: 'Could not update team member' });
  }
});

module.exports = router;
