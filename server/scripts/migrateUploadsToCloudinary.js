// One-time migration: upload every local server/uploads/* file referenced in
// the database to Cloudinary, then rewrite the referencing fields to the new
// secure_url. Run once against the production (Atlas) database after
// deploying the Cloudinary-based upload.js, since Render's filesystem is
// ephemeral and never had these files to begin with.
//
// Usage: node scripts/migrateUploadsToCloudinary.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Vocabulary = require('../models/Vocabulary');
const PinyinRecording = require('../models/PinyinRecording');
const Test = require('../models/Test');
const TeamMember = require('../models/TeamMember');
const SiteSettings = require('../models/SiteSettings');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const urlCache = new Map(); // local /uploads/xyz.png -> Cloudinary secure_url
const stats = { migrated: 0, missing: 0, skipped: 0 };

cloudinary.config({ secure: true });

async function migrateValue(value) {
  if (!value || typeof value !== 'string' || !value.startsWith('/uploads/')) {
    stats.skipped++;
    return value;
  }
  if (urlCache.has(value)) return urlCache.get(value);

  const filename = value.replace('/uploads/', '');
  const localPath = path.join(uploadsDir, filename);
  if (!fs.existsSync(localPath)) {
    console.warn(`  missing local file for ${value}`);
    stats.missing++;
    return value; // leave as-is; nothing to migrate
  }

  const result = await cloudinary.uploader.upload(localPath, {
    folder: 'bhashahub',
    resource_type: 'auto',
  });
  urlCache.set(value, result.secure_url);
  stats.migrated++;
  return result.secure_url;
}

async function migrateCourses() {
  const courses = await Course.find({ image: { $regex: '^/uploads/' } });
  for (const c of courses) {
    c.image = await migrateValue(c.image);
    await c.save();
  }
  console.log(`Courses: updated ${courses.length}`);
}

async function migrateLessons() {
  const lessons = await Lesson.find({
    $or: [
      { dialogueImage: { $regex: '^/uploads/' } },
      { grammarImage: { $regex: '^/uploads/' } },
      { 'dialogueLines.audioUrl': { $regex: '^/uploads/' } },
    ],
  });
  for (const l of lessons) {
    l.dialogueImage = await migrateValue(l.dialogueImage);
    l.grammarImage = await migrateValue(l.grammarImage);
    for (const line of l.dialogueLines) {
      line.audioUrl = await migrateValue(line.audioUrl);
    }
    await l.save();
  }
  console.log(`Lessons: updated ${lessons.length}`);
}

async function migrateVocabulary() {
  const words = await Vocabulary.find({ audioUrl: { $regex: '^/uploads/' } });
  for (const w of words) {
    w.audioUrl = await migrateValue(w.audioUrl);
    await w.save();
  }
  console.log(`Vocabulary: updated ${words.length}`);
}

async function migratePinyinRecordings() {
  const recs = await PinyinRecording.find({ audioUrl: { $regex: '^/uploads/' } });
  for (const r of recs) {
    r.audioUrl = await migrateValue(r.audioUrl);
    await r.save();
  }
  console.log(`PinyinRecordings: updated ${recs.length}`);
}

async function migrateTests() {
  const tests = await Test.find({
    $or: [
      { audioUrl: { $regex: '^/uploads/' } },
      { pdfUrl: { $regex: '^/uploads/' } },
      { image: { $regex: '^/uploads/' } },
      { 'questions.audioUrl': { $regex: '^/uploads/' } },
      { 'questions.image': { $regex: '^/uploads/' } },
    ],
  });
  for (const t of tests) {
    t.audioUrl = await migrateValue(t.audioUrl);
    t.pdfUrl = await migrateValue(t.pdfUrl);
    t.image = await migrateValue(t.image);
    for (const q of t.questions) {
      q.audioUrl = await migrateValue(q.audioUrl);
      q.image = await migrateValue(q.image);
    }
    await t.save();
  }
  console.log(`Tests: updated ${tests.length}`);
}

async function migrateTeamMembers() {
  const members = await TeamMember.find({ photo: { $regex: '^/uploads/' } });
  for (const m of members) {
    m.photo = await migrateValue(m.photo);
    await m.save();
  }
  console.log(`TeamMembers: updated ${members.length}`);
}

async function migrateSiteSettings() {
  const settings = await SiteSettings.find({ welcomeVideoUrl: { $regex: '^/uploads/' } });
  for (const s of settings) {
    s.welcomeVideoUrl = await migrateValue(s.welcomeVideoUrl);
    await s.save();
  }
  console.log(`SiteSettings: updated ${settings.length}`);
}

async function main() {
  const uri = process.env.MONGO_URI_ATLAS || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGO_URI_ATLAS or MONGO_URI in server/.env before running this.');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  await migrateCourses();
  await migrateLessons();
  await migrateVocabulary();
  await migratePinyinRecordings();
  await migrateTests();
  await migrateTeamMembers();
  await migrateSiteSettings();

  console.log('\nDone.');
  console.log(`  migrated: ${stats.migrated}`);
  console.log(`  missing locally (left unchanged): ${stats.missing}`);
  console.log(`  skipped (already non-local): ${stats.skipped}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
