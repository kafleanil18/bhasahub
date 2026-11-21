// Content only: never include accounts, access, attempts, messages, or credentials.
const collections = [
  ['courses', ['title', 'language', 'level', 'description', 'glyph', 'image', 'published']],
  ['lessons', ['course', 'title', 'category', 'dialogue', 'dialogueImage', 'grammarExplanation', 'grammarImage', 'dialogueLines', 'order', 'published']],
  ['vocabularies', ['lesson', 'word', 'pronunciation', 'meaning', 'audioUrl', 'order']],
  ['tests', ['title', 'level', 'description', 'testType', 'audioUrl', 'pdfUrl', 'image', 'questions', 'published']],
  ['practicepapers', ['content', 'published']],
  ['slides', ['title', 'description', 'pdfUrl', 'embedUrl', 'published']],
  ['hanzitracecharacters', ['character', 'pinyin', 'meaning', 'category']],
  ['pinyintables', ['initials', 'finals', 'syllables']],
  ['pinyinrecordings', ['syllable', 'tone', 'audioUrl']],
  ['sentenceaudios', ['sentenceId', 'audioUrl']],
  ['sitesettings', ['key', 'welcomeVideoUrl', 'conversationLessons']],
];
const text = value => String(value || '').trim().toLowerCase();
const id = value => String(value);
const localUri = uri => /^mongodb:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/[^/?]+(?:\?.*)?$/.test(uri || '');
function validateConnections(source, destination) {
  if (!source) throw new Error('Set MONGO_URI_ATLAS in server/.env. A read-only cloud user is sufficient.');
  if (!/^mongodb(?:\+srv)?:\/\//.test(source)) throw new Error('Cloud connection must be a MongoDB connection string.');
  if (!localUri(destination)) throw new Error('Destination must be a single localhost MongoDB database.');
  if (source === destination || localUri(source)) throw new Error('Source must be the separate cloud database.');
}
function media(value, origin) {
  if (typeof value === 'string') return value.replace(/(^|["'(=\s])\/uploads\//g, `$1${origin}/uploads/`);
  if (Array.isArray(value)) return value.map(item => media(item, origin));
  if (value && typeof value === 'object' && !value._bsontype && !(value instanceof Date)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, media(item, origin)]));
  return value;
}
function planContent(source, local, origin = 'https://bhasahub.onrender.com') {
  const courseMap = new Map(), lessonMap = new Map();
  const plans = [];
  for (const [name, fields] of collections) {
    const before = local[name] || [];
    const working = [...before];
    const insert = [];
    let skipped = 0;
    for (const raw of source[name] || []) {
      const doc = media(Object.fromEntries(['_id', 'createdAt', 'updatedAt', ...fields].filter(field => raw[field] !== undefined).map(field => [field, raw[field]])), origin);
      if (name === 'lessons') {
        if (!courseMap.has(id(doc.course))) throw new Error('A cloud lesson references a missing course.');
        doc.course = courseMap.get(id(doc.course));
      }
      if (name === 'vocabularies') {
        if (!lessonMap.has(id(doc.lesson))) throw new Error('Cloud vocabulary references a missing lesson.');
        doc.lesson = lessonMap.get(id(doc.lesson));
      }
      let matches = working.filter(row => id(row._id) === id(doc._id));
      if (!matches.length) {
        if (name === 'courses') {
          matches = working.filter(row => text(row.language) === text(doc.language) && text(row.title) === text(doc.title));
          if (!matches.length && doc.level) matches = working.filter(row => text(row.language) === text(doc.language) && text(row.level) === text(doc.level));
        } else if (name === 'lessons') matches = working.filter(row => id(row.course) === id(doc.course) && text(row.title) === text(doc.title));
        else if (name === 'vocabularies') matches = working.filter(row => id(row.lesson) === id(doc.lesson) && text(row.word) === text(doc.word) && text(row.pronunciation) === text(doc.pronunciation));
        else if (name === 'hanzitracecharacters') matches = working.filter(row => row.character === doc.character);
        else if (name === 'pinyinrecordings') matches = working.filter(row => row.syllable === doc.syllable && row.tone === doc.tone);
        else if (name === 'sentenceaudios') matches = working.filter(row => row.sentenceId === doc.sentenceId);
        else if (name === 'sitesettings') matches = working.filter(row => row.key === doc.key);
        else if (name === 'pinyintables') matches = working;
        else if (name === 'tests' || name === 'slides') matches = working.filter(row => text(row.title) === text(doc.title));
      }
      if (matches.length > 1) throw new Error(`Ambiguous existing ${name} content; resolve duplicates before importing.`);
      if (name === 'courses') courseMap.set(id(raw._id), matches[0]?._id || doc._id);
      if (name === 'lessons') lessonMap.set(id(raw._id), matches[0]?._id || doc._id);
      if (matches.length) skipped++;
      else { insert.push(doc); working.push(doc); }
    }
    plans.push({ name, before, insert, skipped });
  }
  return plans;
}
module.exports = { collections, validateConnections, planContent };
