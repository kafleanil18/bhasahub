// Dry-run: node scripts/installHsk2Course.js --target local
// Install: node scripts/installHsk2Course.js --target hosted --apply
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { courseDefaults, planCourse, validateCourse } = require('../utils/hsk2Course');

async function main() {
  const args = process.argv.slice(2);
  if (args.some((value, i) => !['--target', '--apply', 'hosted', 'local'].includes(value) || (['hosted', 'local'].includes(value) && args[i - 1] !== '--target'))) throw new Error('Use --target local|hosted, optionally --apply');
  const target = args[args.indexOf('--target') + 1];
  if (!args.includes('--target') || !['local', 'hosted'].includes(target)) throw new Error('Choose --target local or --target hosted explicitly');
  const apply = args.includes('--apply');
  const uri = target === 'hosted' ? process.env.MONGO_URI_ATLAS : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/language-lms';
  if (!uri) throw new Error('The selected database is not configured');
  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await conn.asPromise();
    const courses = await conn.collection('courses').find({ language: 'chinese', $or: [{ title: /\bHSK\s*2\b/i }, { level: /\bHSK\s*2\b/i }] }).toArray();
    if (courses.length > 1) throw new Error('Expected at most one HSK 2 course');
    let course = courses[0];
    const before = course ? await conn.collection('lessons').find({ course: course._id }).toArray() : [];
    const beforeWords = before.length ? await conn.collection('vocabularies').find({ lesson: { $in: before.map(lesson => lesson._id) } }).toArray() : [];
    const wordsByLesson = new Map();
    for (const row of beforeWords) wordsByLesson.set(String(row.lesson), [...(wordsByLesson.get(String(row.lesson)) || []), row]);
    const plan = planCourse(before, wordsByLesson);
    const inserts = plan.filter(item => item.action === 'insert');
    console.log(JSON.stringify({ target, apply, course: course ? course.title : `${courseDefaults.title} (will be created)`, ...validateCourse(), insert: inserts.length, unchanged: plan.length - inserts.length }));
    if (!apply) return;

    const backupDir = path.join(os.tmpdir(), 'bhashahub-hsk2-course');
    fs.mkdirSync(backupDir, { recursive: true });
    const backup = path.join(backupDir, `${target}-before-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify({ course: course || null, lessons: before, vocabularies: beforeWords }, null, 2));

    if (!course) {
      const now = new Date();
      const { insertedId } = await conn.collection('courses').insertOne({ ...courseDefaults, createdAt: now, updatedAt: now });
      course = { _id: insertedId, ...courseDefaults };
    }
    for (const item of inserts) {
      // Recheck the title before each insert; never overwrite another editor's work.
      if (await conn.collection('lessons').findOne({ course: course._id, title: item.lesson.title })) throw new Error(`A matching lesson appeared during installation: ${item.lesson.title}`);
      const now = new Date();
      const { insertedId } = await conn.collection('lessons').insertOne({ ...item.lesson, course: course._id, createdAt: now, updatedAt: now });
      if (item.words) await conn.collection('vocabularies').insertMany(item.words.map(row => ({ ...row, lesson: insertedId, createdAt: now, updatedAt: now })));
    }

    const after = await conn.collection('lessons').find({ course: course._id }).toArray();
    const afterById = new Map(after.map(lesson => [String(lesson._id), lesson]));
    for (const original of before) if (JSON.stringify(afterById.get(String(original._id))) !== JSON.stringify(original)) throw new Error('An existing lesson changed during installation');
    const afterWords = await conn.collection('vocabularies').find({ lesson: { $in: after.map(lesson => lesson._id) } }).toArray();
    const afterWordsByLesson = new Map();
    for (const row of afterWords) afterWordsByLesson.set(String(row.lesson), [...(afterWordsByLesson.get(String(row.lesson)) || []), row]);
    if (planCourse(after, afterWordsByLesson).some(item => item.action !== 'skip')) throw new Error('Not all HSK 2 lessons were installed');
    console.log(JSON.stringify({ target, course: course.title, lessonsInstalled: inserts.length, originalLessonsPreserved: true, backup }));
  } finally {
    await conn.close();
  }
}
main().catch(error => { console.error(`${error.name}: ${String(error.message).replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[database address]')}`); process.exitCode = 1; });
