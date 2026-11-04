import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareDictation, normalizeDictation, recordedSentences } from './dictationQuiz.js';

test('ignores spaces and punctuation while preserving characters and typed mistakes', () => {
  assert.equal(normalizeDictation(' 我 在学校，学习！\n'), '我在学校学习');
  assert.equal(normalizeDictation('ＡＢＣ １２３。'), 'ABC123');
  assert.equal(compareDictation('我在学校。', ' 我 在 学校! ').correct, true);
  assert.equal(compareDictation('我在学校。', 'wo zai xuexiao').correct, false);
  assert.equal(compareDictation('我明天去北京。', '明天我去北京。').correct, false);
});

test('an omitted middle character is marked missing without misgrading following characters', () => {
  const result = compareDictation('我喜欢学习汉语。', '我喜欢学汉语');
  assert.equal(result.correct, false);
  assert.deepEqual(result.characters.filter(character => character.type !== 'correct'), [
    { type: 'missing', expected: '习', actual: '', expectedIndex: 4 },
  ]);
  assert.equal(result.correctCharacters, 6);
  assert.equal(result.totalCharacters, 7);
});

test('extra characters lower accuracy even when all expected characters are present', () => {
  const result = compareDictation('我喝茶。', '我喝热茶');
  assert.equal(result.correct, false);
  assert.equal(result.accuracy, 75);
  assert.deepEqual(result.characters.filter(character => character.type === 'extra').map(character => character.actual), ['热']);
});

test('wrong characters show what was typed and the expected character', () => {
  const result = compareDictation('她是老师。', '他是老师');
  assert.equal(result.accuracy, 75);
  assert.deepEqual(result.characters[0], { type: 'incorrect', expected: '她', actual: '他', expectedIndex: 0 });
});

test('handles repeated characters, empty answers, and transposed order', () => {
  const repeated = compareDictation('妈妈喝水。', '妈喝水');
  assert.equal(repeated.characters.filter(character => character.type === 'missing').length, 1);
  assert.equal(repeated.correctCharacters, 3);
  const empty = compareDictation('你好。', '');
  assert.equal(empty.accuracy, 0);
  assert.equal(empty.characters.filter(character => character.type === 'missing').length, 2);
  assert.equal(compareDictation('我在学校。', '我学校在').correct, false);
});

test('only sentences with a teacher recording can enter dictation', () => {
  const ready = { id: 'recorded', audioUrl: 'https://example.test/audio.webm' };
  assert.deepEqual(recordedSentences([ready, { audioUrl: '' }, { audioUrl: '  ' }, {}, { audioUrl: null }]), [ready]);
});
