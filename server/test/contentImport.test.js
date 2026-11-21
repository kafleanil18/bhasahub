const { test } = require('node:test');
const assert = require('node:assert/strict');
const { collections, validateConnections, planContent } = require('../utils/contentImport');

test('cloud import requires a distinct source and a single loopback destination', () => {
  assert.doesNotThrow(() => validateConnections('mongodb+srv://cloud.example/content', 'mongodb://127.0.0.1:27017/language-lms'));
  for (const [source, target] of [[undefined, 'mongodb://localhost/content'], ['mongodb+srv://cloud/content', 'mongodb+srv://cloud/content'], ['mongodb://localhost/content', 'mongodb://localhost/other'], ['mongodb+srv://cloud/content', 'mongodb://localhost,remote/content']]) assert.throws(() => validateConnections(source, target));
});

test('content collection allowlist excludes users, subscriptions, attempts, messages and credentials', () => {
  const names = collections.map(([name]) => name);
  for (const name of ['users', 'subscriptions', 'enrollments', 'hskattempts', 'progresses', 'studioactivities', 'feedbacks', 'emailsettings', 'emailapisettings', 'testimonials']) assert.ok(!names.includes(name));
});

test('existing HSK 1 is reused and imported lessons and vocabulary keep valid local references', () => {
  const cloud = { courses: [{ _id: 'cloud-hsk1', title: 'HSK 1 Chinese', language: 'chinese', level: 'HSK 1' }, { _id: 'hsk2', title: 'HSK 2 Chinese', language: 'chinese', level: 'HSK 2' }], lessons: [{ _id: 'cloud-lesson', course: 'cloud-hsk1', title: 'Greetings' }, { _id: 'hsk2-lesson', course: 'hsk2', title: 'Travel' }], vocabularies: [{ _id: 'word', lesson: 'cloud-lesson', word: '你好', pronunciation: 'nǐ hǎo', meaning: 'Hello' }] };
  const local = { courses: [{ _id: 'local-hsk1', title: 'HSK 1 Chinese', language: 'chinese', level: 'HSK 1' }], lessons: [{ _id: 'local-lesson', course: 'local-hsk1', title: 'Greetings' }] };
  const unchanged = JSON.stringify(local);
  const plans = planContent(cloud, local);
  assert.equal(plans.find(p => p.name === 'courses').insert.length, 1);
  assert.equal(plans.find(p => p.name === 'lessons').insert.length, 1);
  assert.equal(plans.find(p => p.name === 'vocabularies').insert[0].lesson, 'local-lesson');
  assert.equal(JSON.stringify(local), unchanged);
});

test('existing content is preserved; repeating the import adds nothing', () => {
  const cloud = { courses: [{ _id: 'c', title: 'HSK 2', language: 'chinese', level: 'HSK 2' }], lessons: [{ _id: 'l', course: 'c', title: 'Travel' }] };
  const first = planContent(cloud, {});
  const local = Object.fromEntries(first.map(p => [p.name, p.insert]));
  const second = planContent(cloud, local);
  assert.ok(second.every(p => p.insert.length === 0));
});

test('missing source references and ambiguous local course matches stop the import', () => {
  assert.throws(() => planContent({ lessons: [{ _id: 'l', course: 'missing', title: 'Broken' }] }, {}));
  const course = { title: 'HSK 1', language: 'chinese', level: 'HSK 1' };
  assert.throws(() => planContent({ courses: [{ ...course, _id: 'cloud' }] }, { courses: [{ ...course, _id: 'one' }, { ...course, _id: 'two' }] }));
});

test('media URLs remain usable locally and user/credential fields are not imported', () => {
  const cloud = { sentenceaudios: [{ _id: 'audio', sentenceId: 'hsk1-1', audioUrl: '/uploads/voice.mp3', uploadedBy: 'cloud-user' }], sitesettings: [{ _id: 'settings', key: 'main', emailApiKey: 'secret', conversationLessons: [{ audioUrl: '/uploads/dialogue.mp3' }] }] };
  const plans = planContent(cloud, {});
  const audio = plans.find(p => p.name === 'sentenceaudios').insert[0];
  assert.equal(audio.audioUrl, 'https://bhasahub.onrender.com/uploads/voice.mp3');
  assert.equal(audio.uploadedBy, undefined);
  const settings = plans.find(p => p.name === 'sitesettings').insert[0];
  assert.equal(settings.emailApiKey, undefined);
  assert.equal(settings.conversationLessons[0].audioUrl, 'https://bhasahub.onrender.com/uploads/dialogue.mp3');
});
