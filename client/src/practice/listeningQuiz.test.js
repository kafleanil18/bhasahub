import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createListeningQuiz, recordedVocabulary, shuffle } from './listeningQuiz.js';
const word = (id, meaning, audioUrl = '/recording.mp3') => ({ _id: id, word: `字${id}`, meaning, audioUrl, pronunciation: 'zì' });

test('skips incomplete, unrecorded and repeated vocabulary', () => {
  const first = word('1', 'one');
  assert.deepEqual(recordedVocabulary([first, first, word('2', 'two', ''), word('3', '  '), { ...word('4', 'four'), word: '' }]), [first]);
});
test('requires two distinct recorded meanings', () => {
  assert.deepEqual(createListeningQuiz([word('1', 'one'), word('2', ' ONE '), word('3', 'two', '')]), []);
});
test('each question has exactly one correct option and unique distractors', () => {
  const words = [word('1', 'one'), word('2', 'two'), word('3', 'three'), word('4', 'four'), word('5', 'five'), word('6', ' ONE ')];
  for (const question of createListeningQuiz(words, 10, () => 0.3)) {
    assert.equal(question.options.length, 4);
    assert.equal(question.options.filter(value => value === question.answer).length, 1);
    assert.equal(new Set(question.options.map(value => value.toLowerCase().trim())).size, 4);
  }
});
test('supports small lessons, limits sessions, and does not mutate source data', () => {
  const small = [word('1', 'one'), word('2', 'two')];
  assert.equal(createListeningQuiz(small)[0].options.length, 2);
  const words = Array.from({ length: 15 }, (_, index) => word(String(index), `Meaning ${index}`));
  const original = structuredClone(words);
  assert.equal(createListeningQuiz(words).length, 10);
  assert.deepEqual(words, original);
  assert.deepEqual(shuffle([], () => 0), []);
});
