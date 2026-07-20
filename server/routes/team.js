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

// PUT /api/team/:key — admin: set or replace a member's details
router.put('/:key', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const updateFields = {};
    if (req.body.photo !== undefined) updateFields.photo = req.body.photo;
    if (req.body.offsetX !== undefined) updateFields.offsetX = req.body.offsetX;
    if (req.body.offsetY !== undefined) updateFields.offsetY = req.body.offsetY;
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    if (req.body.role !== undefined) updateFields.role = req.body.role;
    if (req.body.bio !== undefined) updateFields.bio = req.body.bio;
    if (req.body.scale !== undefined) updateFields.scale = req.body.scale;

    const member = await TeamMember.findOneAndUpdate(
      { key },
      updateFields,
      { new: true, upsert: true }
    );
    res.json(member);
  } catch {
    res.status(500).json({ error: 'Could not update team member' });
  }
});

// POST /api/team — admin: create a new team member slot
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const key = `member_${Date.now()}`;
    const member = new TeamMember({
      key,
      name: 'New Member',
      role: 'Team Role',
      bio: 'Bio details...',
    });
    await member.save();
    res.status(201).json(member);
  } catch {
    res.status(500).json({ error: 'Could not create team member' });
  }
});

// DELETE /api/team/:key — admin: delete a team member
router.delete('/:key', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    await TeamMember.findOneAndDelete({ key });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not delete team member' });
  }
});

module.exports = router;
