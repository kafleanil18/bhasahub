import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCorrectSentence, sentenceTiles, shuffleSentences } from './sentenceQuiz.js';
const catalog = JSON.parse(readFileSync(new URL('../../../server/data/hsk1Sentences.json', import.meta.url)));

test('the bank contains 1,300 unique, complete sentences across 60 topics', () => {
  assert.equal(catalog.sentences.length, 1300);
  assert.equal(catalog.topics.length, 60);
  assert.equal(new Set(catalog.sentences.map(sentence => sentence.id)).size, 1300);
  assert.equal(new Set(catalog.sentences.map(sentence => sentence.chinese)).size, 1300);
  for (const [index, topic] of catalog.topics.entries()) assert.equal(catalog.sentences.filter(sentence => sentence.topicId === topic.id).length, index < 20 ? 15 : 25);
  for (const [index, sentence] of catalog.sentences.entries()) {
    assert.equal(sentence.id, `hsk1-${String(index + 1).padStart(3, '0')}`);
    assert.ok(sentence.tokens.length >= 3);
    assert.equal(sentence.tokens.join(''), sentence.chinese.slice(0, -1));
    assert.match(sentence.chinese, /[。？]$/);
    assert.ok(sentence.pinyin && sentence.english && sentence.explanation);
    assert.ok(catalog.topics.some(topic => topic.id === sentence.topicId));
    assert.equal(isCorrectSentence(sentence, sentence.tokens), true);
    for (const alternative of sentence.acceptedOrders || []) {
      assert.deepEqual([...alternative].sort(), [...sentence.tokens].sort());
      assert.equal(isCorrectSentence(sentence, alternative), true);
    }
  }
});

test('every shuffled question keeps all words and begins unsolved, even with deterministic randomness', () => {
  for (const sentence of catalog.sentences) {
    for (const random of [() => 0, () => 0.999999]) {
      const tiles = sentenceTiles(sentence, random);
      assert.equal(new Set(tiles.map(tile => tile.id)).size, sentence.tokens.length);
      assert.deepEqual(tiles.map(tile => tile.text).sort(), [...sentence.tokens].sort());
      assert.notEqual(tiles.map(tile => tile.text).join(''), sentence.tokens.join(''));
    }
  }
});

test('grading handles repeated words, omissions, foreign words, and correct alternative time orders', () => {
  const repeated = catalog.sentences.find(sentence => sentence.tokens.filter(token => token === '我').length > 1);
  assert.ok(repeated);
  assert.equal(isCorrectSentence(repeated, repeated.tokens.slice(1)), false);
  assert.equal(isCorrectSentence(repeated, [...repeated.tokens, '我']), false);
  assert.equal(isCorrectSentence(repeated, repeated.tokens.map((token, index) => index ? token : '你')), false);
  const timed = catalog.sentences.find(sentence => sentence.chinese === '我明天去北京。');
  assert.equal(isCorrectSentence(timed, ['明天', '我', '去', '北京']), true);
  assert.equal(isCorrectSentence(timed, ['我', '去', '北京', '明天']), false);
  const original = structuredClone(catalog.sentences);
  shuffleSentences(catalog.sentences, () => 0.3);
  assert.deepEqual(catalog.sentences, original);
});


test('all 1,300 sentences have an aligned pinyin reading for every Chinese character', () => {
  const letters = text => text.toLowerCase().replace(/[^\p{L}]/gu, '');
  for (const sentence of catalog.sentences) {
    assert.equal(sentence.tokenPinyin.length, sentence.tokens.length, sentence.id);
    for (const [index, token] of sentence.tokens.entries()) {
      assert.equal(sentence.tokenPinyin[index].length, Array.from(token).length, `${sentence.id}: ${token}`);
      for (const reading of sentence.tokenPinyin[index]) assert.match(reading, /^[\p{L}]+$/u);
    }
    assert.equal(letters(sentence.tokenPinyin.flat().join('')), letters(sentence.pinyin), sentence.id);
  }
  const student = catalog.sentences.find(sentence => sentence.chinese === '我 是 学生。'.replaceAll(' ', ''));
  assert.deepEqual(student.tokenPinyin, [['wǒ'], ['shì'], ['xué', 'sheng']]);
  const here = catalog.sentences.find(sentence => sentence.chinese === '我 的 书 在 这儿。'.replaceAll(' ', ''));
  assert.deepEqual(here.tokenPinyin.at(-1), ['zhè', 'r']);
});
