const { test } = require('node:test');
const assert = require('node:assert/strict');
const { curriculum, vocabulary, renderUnit, title, planCourse, validateCourse } = require('../utils/hsk2Course');

const installed = plan => plan.filter(item => item.action === 'insert').map((item, i) => ({ ...item.lesson, _id: `new-${i}` }));
const wordsFor = (plan, lessons) => new Map(plan.filter(item => item.action === 'insert' && item.words).map(item => [String(lessons.find(lesson => lesson.title === item.lesson.title)._id), item.words]));

test('a fresh HSK 2 course gets 8 vocabulary lessons then 15 grammar modules, and reinstalling is a no-op', () => {
  const plan = planCourse([]);
  assert.equal(plan.length, 23);
  assert.ok(plan.every(item => item.action === 'insert'));
  assert.deepEqual(plan.map(item => item.lesson.order), Array.from({ length: 23 }, (_, i) => i + 1));
  assert.deepEqual(plan.slice(0, 8).map(item => item.lesson.category), Array(8).fill('vocabulary'));
  assert.deepEqual(plan.slice(8).map(item => item.lesson.category), Array(15).fill('grammar'));
  const lessons = installed(plan);
  assert.ok(planCourse(lessons, wordsFor(plan, lessons)).every(item => item.action === 'skip'));
});

test('installation appends after teacher lessons without changing them', () => {
  const original = { _id: 'old', title: 'Teacher intro', category: 'vocabulary', order: 4 };
  const before = structuredClone(original);
  const plan = planCourse([original]);
  assert.equal(plan[0].lesson.order, 5);
  assert.equal(plan.at(-1).lesson.order, 27);
  assert.deepEqual(original, before);
});

test('installation refuses edited vocabulary or grammar instead of overwriting it', () => {
  const plan = planCourse([]);
  const lessons = installed(plan);
  const words = wordsFor(plan, lessons);
  const firstId = String(lessons[0]._id);
  words.set(firstId, words.get(firstId).slice(1));
  assert.throws(() => planCourse(lessons, words), /preserve it/);
  const unit = curriculum.units[0];
  assert.throws(() => planCourse([{ _id: 'edited', title: title(unit), category: 'grammar', grammarExplanation: renderUnit(unit) + '<p>Teacher edit.</p>' }]), /preserve it/);
});

test('curriculum covers all 44 textbook language points and all 147 syllabus words', () => {
  const stats = validateCourse();
  assert.equal(stats.corePoints, 44);
  assert.equal(stats.units, 15);
  assert.equal(stats.words, 147);
  assert.equal(stats.vocabularyLessons, 8);
  const lessonsWithWords = new Set(vocabulary.lessons.flatMap(lesson => lesson.words.map(item => item.lesson)));
  assert.equal(lessonsWithWords.size, 15);
  for (const unit of curriculum.units) {
    const html = renderUnit(unit);
    for (const point of [...unit.foundations, ...unit.points]) assert.ok(html.includes(point.id));
    assert.ok(html.includes('<summary>Show model answers and explanations</summary>'));
    assert.ok(html.includes(`Module ${unit.number} of 15`));
    assert.ok(!html.includes('<script'));
  }
  assert.ok(renderUnit(curriculum.units[14]).includes(curriculum.finalAssessment.title));
});
