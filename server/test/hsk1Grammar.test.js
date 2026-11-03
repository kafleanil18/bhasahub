const { test } = require('node:test');
const assert = require('node:assert/strict');
const { curriculum, renderUnit, title, planInstallation, validateCurriculum } = require('../utils/hsk1Grammar');

test('installation appends grammar after existing lessons and is idempotent', () => {
  const original = { _id: 'old', title: 'Teacher-authored grammar', category: 'grammar', grammarExplanation: '<p>Preserve this.</p>', order: 9 };
  const before = structuredClone(original);
  const plan = planInstallation([original]);
  assert.equal(plan.filter(item => item.action === 'insert').length, 15);
  assert.equal(plan[0].lesson.order, 10);
  assert.equal(plan.at(-1).lesson.order, 24);
  assert.deepEqual(original, before);
  const installed = plan.map((item, i) => ({ ...item.lesson, _id: `new-${i}` }));
  assert.ok(planInstallation([original, ...installed]).every(item => item.action === 'skip'));
});

test('installation refuses to replace edited content or a colliding teacher title', () => {
  const unit = curriculum.units[0];
  assert.throws(() => planInstallation([{ _id: 'teacher', title: title(unit), category: 'grammar', grammarExplanation: '<p>Teacher content.</p>' }]), /preserve it/);
  const generated = renderUnit(unit);
  assert.throws(() => planInstallation([{ _id: 'edited', title: title(unit), category: 'grammar', grammarExplanation: generated + '<p>Teacher edit.</p>' }]), /preserve it/);
});

test('curriculum includes complete core coverage, answer explanations, and checkpoints', () => {
  const stats = validateCurriculum();
  assert.equal(stats.corePoints, 45);
  assert.equal(stats.exercises, 140);
  for (const unit of curriculum.units) {
    const html = renderUnit(unit);
    for (const point of [...unit.foundations, ...unit.points]) assert.ok(html.includes(point.id));
    assert.ok(html.includes('<details>'));
    assert.ok(html.includes('<summary>Show model answers and explanations</summary>'));
    assert.ok(!html.includes('<script'));
  }
  assert.ok(renderUnit(curriculum.units[14]).includes(curriculum.finalAssessment.title));
});
