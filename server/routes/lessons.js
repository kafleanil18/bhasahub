const express = require('express');
const Lesson = require('../models/Lesson');
const Vocabulary = require('../models/Vocabulary');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();

// GET /api/lessons/course/:courseId — public: published lessons of a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId, published: true }).sort({ order: 1 });
    res.json(lessons);
  } catch {
    res.status(500).json({ error: 'Could not load lessons' });
  }
});

// GET /api/lessons/course/:courseId/all — admin: all lessons, drafts included
router.get('/course/:courseId/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ order: 1 });
    res.json(lessons);
  } catch {
    res.status(500).json({ error: 'Could not load lessons' });
  }
});

// POST /api/lessons — admin: create a lesson
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { course, title, category, dialogue, dialogueImage, dialogueLines, grammarExplanation, grammarImage, order, published } = req.body;
    if (!course || !title) {
      return res.status(400).json({ error: 'Course id and title are required' });
    }
    const lesson = await Lesson.create({
      course,
      title,
      category,
      dialogue,
      dialogueImage,
      dialogueLines,
      grammarExplanation,
      grammarImage,
      order,
      published,
    });
    logActivity(req, { action: 'create', resourceType: 'lesson', resourceId: lesson._id, label: lesson.title });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Could not create lesson' });
  }
});

// PUT /api/lessons/:id — admin: update a lesson
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    logActivity(req, { action: 'update', resourceType: 'lesson', resourceId: lesson._id, label: lesson.title });
    res.json(lesson);
  } catch {
    res.status(500).json({ error: 'Could not update lesson' });
  }
});

// DELETE /api/lessons/:id — admin: delete a lesson AND its vocabulary
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    await Vocabulary.deleteMany({ lesson: req.params.id });
    logActivity(req, { action: 'delete', resourceType: 'lesson', resourceId: lesson._id, label: lesson.title });
    res.json({ message: 'Lesson and its vocabulary deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete lesson' });
  }
});

// GET /api/lessons/:id/vocabulary — public: words in a lesson
router.get('/:id/vocabulary', async (req, res) => {
  try {
    const words = await Vocabulary.find({ lesson: req.params.id }).sort({ order: 1 });
    res.json(words);
  } catch {
    res.status(500).json({ error: 'Could not load vocabulary' });
  }
});

// POST /api/lessons/:id/vocabulary — admin: add a word to a lesson
router.post('/:id/vocabulary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { word, pronunciation, meaning, order } = req.body;
    if (!word || !pronunciation || !meaning) {
      return res.status(400).json({ error: 'Word, pronunciation and meaning are required' });
    }
    const item = await Vocabulary.create({ lesson: req.params.id, word, pronunciation, meaning, order });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Could not add word' });
  }
});

// POST /api/lessons/:id/vocabulary/bulk — admin: CSV import, many words at once
router.post('/:id/vocabulary/bulk', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'words must be a non-empty array' });
    }
    const invalidIndex = words.findIndex((w) => !w.word || !w.pronunciation || !w.meaning);
    if (invalidIndex !== -1) {
      return res.status(400).json({ error: `Row ${invalidIndex + 1} is missing word, pronunciation, or meaning` });
    }

    const existingCount = await Vocabulary.countDocuments({ lesson: req.params.id });
    const docs = words.map((w, i) => ({
      lesson: req.params.id,
      word: w.word,
      pronunciation: w.pronunciation,
      meaning: w.meaning,
      order: existingCount + i + 1,
    }));
    const inserted = await Vocabulary.insertMany(docs);

    const lesson = await Lesson.findById(req.params.id);
    logActivity(req, {
      action: 'create',
      resourceType: 'lesson',
      resourceId: req.params.id,
      label: `Imported ${inserted.length} words into "${lesson ? lesson.title : 'lesson'}"`,
    });

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Bulk import vocabulary error:', err);
    res.status(500).json({ error: err.message || 'Could not import words' });
  }
});

// PUT /api/lessons/vocabulary/:vocabId — admin: edit a word
router.put('/vocabulary/:vocabId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { word, pronunciation, meaning } = req.body;
    if (!word || !pronunciation || !meaning) {
      return res.status(400).json({ error: 'Word, pronunciation and meaning are required' });
    }
    const item = await Vocabulary.findByIdAndUpdate(
      req.params.vocabId,
      { word, pronunciation, meaning },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Word not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Could not update word' });
  }
});

// DELETE /api/lessons/vocabulary/:vocabId — admin: remove a word
router.delete('/vocabulary/:vocabId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await Vocabulary.findByIdAndDelete(req.params.vocabId);
    if (!item) return res.status(404).json({ error: 'Word not found' });
    res.json({ message: 'Word deleted' });
  } catch {
    res.status(500).json({ error: 'Could not delete word' });
  }
});

// PUT /api/lessons/vocabulary/:vocabId/audio — admin: attach audio to a word
router.put('/vocabulary/:vocabId/audio', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await Vocabulary.findByIdAndUpdate(
      req.params.vocabId,
      { audioUrl: req.body.audioUrl },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Word not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Could not save audio' });
  }
});

// PUT /api/lessons/:id/vocabulary/reorder — admin: save new word order
router.put('/:id/vocabulary/reorder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }
    await Promise.all(
      orderedIds.map((id, index) =>
        Vocabulary.findByIdAndUpdate(id, { order: index + 1 })
      )
    );
    res.json({ message: 'Order saved' });
  } catch {
    res.status(500).json({ error: 'Could not save order' });
  }
});

// ---------- conversation lines ----------
// Structured the same way vocabulary is: each line is added/edited/deleted
// immediately (not bundled into the whole-lesson save), with its own audio
// and drag-to-reorder, instead of one freeform text blob per line.

function sortLines(lesson) {
  if (lesson && Array.isArray(lesson.dialogueLines)) {
    lesson.dialogueLines.sort((a, b) => a.order - b.order);
  }
  return lesson;
}

// POST /api/lessons/:id/dialogue-lines — admin: add a conversation line
router.post('/:id/dialogue-lines', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { speaker, text, pinyin, meaning } = req.body;
    if (!text || !pinyin || !meaning) {
      return res.status(400).json({ error: 'Sentence, pinyin, and meaning are required' });
    }
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const nextOrder = lesson.dialogueLines.reduce((max, l) => Math.max(max, l.order), 0) + 1;
    lesson.dialogueLines.push({ speaker: speaker || '', text, pinyin, meaning, order: nextOrder });
    await lesson.save();
    res.status(201).json(sortLines(lesson.toObject()));
  } catch (err) {
    console.error('Add dialogue line error:', err);
    res.status(500).json({ error: err.message || 'Could not add the line' });
  }
});

// PUT /api/lessons/:lessonId/dialogue-lines/:lineId — admin: edit a line's text fields
router.put('/:lessonId/dialogue-lines/:lineId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { speaker, text, pinyin, meaning } = req.body;
    if (!text || !pinyin || !meaning) {
      return res.status(400).json({ error: 'Sentence, pinyin, and meaning are required' });
    }
    const lesson = await Lesson.findOneAndUpdate(
      { _id: req.params.lessonId, 'dialogueLines._id': req.params.lineId },
      {
        $set: {
          'dialogueLines.$.speaker': speaker || '',
          'dialogueLines.$.text': text,
          'dialogueLines.$.pinyin': pinyin,
          'dialogueLines.$.meaning': meaning,
        },
      },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ error: 'Line not found' });
    res.json(sortLines(lesson.toObject()));
  } catch (err) {
    console.error('Update dialogue line error:', err);
    res.status(500).json({ error: err.message || 'Could not update the line' });
  }
});

// PUT /api/lessons/:lessonId/dialogue-lines/:lineId/audio — admin: attach audio to a line
router.put('/:lessonId/dialogue-lines/:lineId/audio', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findOneAndUpdate(
      { _id: req.params.lessonId, 'dialogueLines._id': req.params.lineId },
      { $set: { 'dialogueLines.$.audioUrl': req.body.audioUrl || '' } },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ error: 'Line not found' });
    res.json(sortLines(lesson.toObject()));
  } catch (err) {
    console.error('Attach dialogue line audio error:', err);
    res.status(500).json({ error: err.message || 'Could not save audio' });
  }
});

// DELETE /api/lessons/:lessonId/dialogue-lines/:lineId — admin: remove a line
router.delete('/:lessonId/dialogue-lines/:lineId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.lessonId,
      { $pull: { dialogueLines: { _id: req.params.lineId } } },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(sortLines(lesson.toObject()));
  } catch (err) {
    console.error('Delete dialogue line error:', err);
    res.status(500).json({ error: err.message || 'Could not delete the line' });
  }
});

// PUT /api/lessons/:id/dialogue-lines/reorder — admin: save new line order
router.put('/:id/dialogue-lines/reorder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }
    await Promise.all(
      orderedIds.map((lineId, index) =>
        Lesson.updateOne(
          { _id: req.params.id, 'dialogueLines._id': lineId },
          { $set: { 'dialogueLines.$.order': index + 1 } }
        )
      )
    );
    const lesson = await Lesson.findById(req.params.id);
    res.json(sortLines(lesson.toObject()));
  } catch (err) {
    console.error('Reorder dialogue lines error:', err);
    res.status(500).json({ error: 'Could not save order' });
  }
});

module.exports = router;