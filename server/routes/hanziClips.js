const express = require('express');
const HanziClip = require('../models/HanziClip');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

const INITIAL_CLIPS = [
  {
    character: '永',
    title: 'How to write 永 (Yǒng - Forever / Eternity)',
    pinyin: 'yǒng',
    meaning: 'Forever / Eternal',
    strokeCount: 5,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hand-drawing-chinese-calligraphy-characters-41484-large.mp4',
    tips: 'The character 永 contains all 8 fundamental strokes of Chinese calligraphy (永字八法): 点, 横, 竖, 钩, 提, 撇, 短撇, 捺.',
    category: 'Basic Strokes',
  },
  {
    character: '水',
    title: 'How to write 水 (Shuǐ - Water)',
    pinyin: 'shuǐ',
    meaning: 'Water',
    strokeCount: 4,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-calligraphy-brush-writing-41483-large.mp4',
    tips: 'Rule: Center first, then sides! Start with the center vertical hook (竖钩), followed by the left sweeping stroke (横撇) and right falling stroke (撇/捺).',
    category: 'HSK 1',
  },
  {
    character: '人',
    title: 'How to write 人 (Rén - Person / Human)',
    pinyin: 'rén',
    meaning: 'Person / Human',
    strokeCount: 2,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-artist-writing-chinese-calligraphy-symbols-41485-large.mp4',
    tips: 'Start with the left falling stroke (撇 - Piě) from top to bottom-left, followed by the right falling stroke (捺 - Nà) balancing from the center.',
    category: 'Basic Strokes',
  },
  {
    character: '国',
    title: 'How to write 国 (Guó - Country / Nation)',
    pinyin: 'guó',
    meaning: 'Country / Nation',
    strokeCount: 8,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hand-drawing-chinese-calligraphy-characters-41484-large.mp4',
    tips: 'Enclosure Rule: Enter before closing! Draw the outer box frame 囗, write the inner 玉 (Jade) character, and finally seal the bottom line.',
    category: 'Common Hanzi',
  },
  {
    character: '好',
    title: 'How to write 好 (Hǎo - Good / Well)',
    pinyin: 'hǎo',
    meaning: 'Good / Well',
    strokeCount: 6,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-calligraphy-brush-writing-41483-large.mp4',
    tips: 'Left-to-Right structure! Write the woman radical (女 - nǚ) on the left side first, then the child radical (子 - zǐ) on the right.',
    category: 'HSK 1',
  },
];

async function ensureSeeded() {
  try {
    const count = await HanziClip.countDocuments();
    if (count === 0) {
      await HanziClip.insertMany(INITIAL_CLIPS);
    }
  } catch (err) {
    console.error('HanziClip seed error:', err);
  }
}

// GET /api/hanzi-clips — Public list
router.get('/', async (req, res) => {
  try {
    await ensureSeeded();
    const clips = await HanziClip.find().sort({ createdAt: -1 });
    res.json(clips);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch Hanzi clips' });
  }
});

// POST /api/hanzi-clips — Super Admin only
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const clip = await HanziClip.create(req.body);
    logActivity(req, {
      action: 'create',
      resourceType: 'hanziClip',
      resourceId: clip._id,
      label: clip.title,
    });
    res.status(201).json(clip);
  } catch (err) {
    res.status(500).json({ error: 'Could not create Hanzi clip' });
  }
});

// PUT /api/hanzi-clips/:id — Super Admin only
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const clip = await HanziClip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clip) return res.status(404).json({ error: 'Clip not found' });
    logActivity(req, {
      action: 'update',
      resourceType: 'hanziClip',
      resourceId: clip._id,
      label: clip.title,
    });
    res.json(clip);
  } catch (err) {
    res.status(500).json({ error: 'Could not update Hanzi clip' });
  }
});

// DELETE /api/hanzi-clips/:id — Super Admin only
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const clip = await HanziClip.findByIdAndDelete(req.params.id);
    if (clip) {
      logActivity(req, {
        action: 'delete',
        resourceType: 'hanziClip',
        resourceId: clip._id,
        label: clip.title,
      });
    }
    res.json({ message: 'Clip deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete Hanzi clip' });
  }
});

module.exports = router;
