// Dry-run: node scripts/installHsk1Grammar.js --target local
// Install: node scripts/installHsk1Grammar.js --target hosted --apply
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { planInstallation, validateCurriculum } = require('../utils/hsk1Grammar');

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
    const courses = await conn.collection('courses').find({ language: 'chinese', $or: [{ title: /\bHSK\s*1\b/i }, { level: /\bHSK\s*1\b/i }] }).toArray();
    if (courses.length !== 1) throw new Error('Expected exactly one HSK 1 course');
    const course = courses[0];
    const before = await conn.collection('lessons').find({ course: course._id }).toArray();
    const plan = planInstallation(before);
    console.log(JSON.stringify({ target, apply, course: course.title, ...validateCurriculum(), insert: plan.filter(item => item.action === 'insert').length, unchanged: plan.filter(item => item.action === 'skip').length }));
    if (!apply) return;
    const backupDir = path.join(os.tmpdir(), 'bhashahub-hsk1-grammar');
    fs.mkdirSync(backupDir, { recursive: true });
    const backup = path.join(backupDir, `${target}-lessons-before-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify(before, null, 2));
    for (const item of plan.filter(item => item.action === 'insert')) {
      // Recheck the title before each insert; never overwrite another editor's work.
      if (await conn.collection('lessons').findOne({ course: course._id, title: item.lesson.title })) throw new Error(`A matching lesson appeared during installation: module ${item.number}`);
      await conn.collection('lessons').insertOne({ ...item.lesson, course: course._id, createdAt: new Date(), updatedAt: new Date() });
    }
    const after = await conn.collection('lessons').find({ course: course._id }).toArray();
    const afterById = new Map(after.map(lesson => [String(lesson._id), lesson]));
    for (const original of before) if (JSON.stringify(afterById.get(String(original._id))) !== JSON.stringify(original)) throw new Error('An existing lesson changed during installation');
    if (planInstallation(after).some(item => item.action !== 'skip')) throw new Error('Not all grammar modules were installed');
    console.log(JSON.stringify({ target, grammarModules: 15, originalLessonsPreserved: true, backup }));
  } finally {
    await conn.close();
  }
}
main().catch(error => { console.error(`${error.name}: ${String(error.message).replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[database address]')}`); process.exitCode = 1; });
