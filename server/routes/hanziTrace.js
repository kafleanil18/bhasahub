const express = require('express');
const HanziTraceCharacter = require('../models/HanziTraceCharacter');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

const INITIAL_CHARACTERS = [
  { character: '你', pinyin: 'nǐ', meaning: 'you', category: 'Basic Strokes' },
  { character: '好', pinyin: 'hǎo', meaning: 'good', category: 'Basic Strokes' },
  { character: '人', pinyin: 'rén', meaning: 'person', category: 'Basic Strokes' },
  { character: '水', pinyin: 'shuǐ', meaning: 'water', category: 'Radicals' },
  { character: '永', pinyin: 'yǒng', meaning: 'forever', category: 'Radicals' },
  { character: '大', pinyin: 'dà', meaning: 'big', category: 'Basic Strokes' },
  { character: '小', pinyin: 'xiǎo', meaning: 'small', category: 'Basic Strokes' },
  { character: '中', pinyin: 'zhōng', meaning: 'middle', category: 'Common Hanzi' },
];

async function ensureSeeded() {
  try {
    const count = await HanziTraceCharacter.countDocuments();
    if (count === 0) {
      await HanziTraceCharacter.insertMany(INITIAL_CHARACTERS);
    }
  } catch (err) {
    console.error('Hanzi trace auto-seed error:', err);
  }
}

// GET /api/hanzi-trace — public: list all characters
router.get('/', async (req, res) => {
  try {
    const characters = await HanziTraceCharacter.find().sort({ createdAt: -1 });
    res.json(characters);
  } catch {
    res.status(500).json({ error: 'Could not load characters' });
  }
});

// POST /api/hanzi-trace — admin: create a character
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const character = await HanziTraceCharacter.create(req.body);
    logActivity(req, { action: 'create', resourceType: 'hanzi-trace-character', resourceId: character._id, label: character.character });
    res.status(201).json(character);
  } catch {
    res.status(500).json({ error: 'Could not create character' });
  }
});

// POST /api/hanzi-trace/bulk — admin: bulk-create characters from a CSV import
router.post('/bulk', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = Array.isArray(req.body.characters) ? req.body.characters : [];
    const toInsert = rows
      .map((r) => ({
        character: (r.character || '').toString().trim(),
        pinyin: (r.pinyin || '').toString().trim(),
        meaning: (r.meaning || '').toString().trim(),
        category: (r.category || '').toString().trim() || 'Basic Strokes',
      }))
      .filter((r) => r.character);

    if (toInsert.length === 0) {
      return res.status(400).json({ error: 'No valid character rows found' });
    }

    const created = await HanziTraceCharacter.insertMany(toInsert);
    logActivity(req, { action: 'create', resourceType: 'hanzi-trace-character', resourceId: null, label: `Bulk import (${created.length} characters)` });
    res.status(201).json({ count: created.length });
  } catch {
    res.status(500).json({ error: 'Could not import characters' });
  }
});

// PUT /api/hanzi-trace/:id — admin: update a character
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const character = await HanziTraceCharacter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!character) return res.status(404).json({ error: 'Character not found' });
    logActivity(req, { action: 'update', resourceType: 'hanzi-trace-character', resourceId: character._id, label: character.character });
    res.json(character);
  } catch {
    res.status(500).json({ error: 'Could not update character' });
  }
});

// DELETE /api/hanzi-trace/:id — admin: delete a character
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const character = await HanziTraceCharacter.findByIdAndDelete(req.params.id);
    if (character) logActivity(req, { action: 'delete', resourceType: 'hanzi-trace-character', resourceId: character._id, label: character.character });
    res.json({ message: 'Character deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete character' });
  }
});

module.exports = { router, ensureSeeded };
