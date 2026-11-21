import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markSyllable, toneRuleNote, pairRound } from './tonePairs.js';

test('tone marks follow standard pinyin placement', () => {
  const cases = [['hao', 3, 'hǎo'], ['jie', 3, 'jiě'], ['shou', 2, 'shóu'], ['gui', 4, 'guì'], ['liu', 2, 'liú'], ['nü', 3, 'nǚ'], ['er', 2, 'ér'], ['xue', 2, 'xué'], ['zhong', 1, 'zhōng'], ['shi', 4, 'shì']];
  for (const [syllable, tone, expected] of cases) assert.equal(markSyllable(syllable, tone), expected);
  assert.equal(markSyllable('ma', 5), 'ma');
});

test('rule notes explain third-tone, 不 and 一 changes', () => {
  assert.match(toneRuleNote({ rule: 'third', writtenPinyin: 'nǐ hǎo', correctTones: [2, 3], toneChange: true }), /Written nǐ hǎo/);
  assert.match(toneRuleNote({ rule: 'bu', correctTones: [2, 4], toneChange: true }), /spoken bú/);
  assert.match(toneRuleNote({ rule: 'bu', correctTones: [4, 1], toneChange: false }), /keeps its 4th tone/);
  assert.match(toneRuleNote({ rule: 'yi', correctTones: [2, 4], toneChange: true }), /spoken yí/);
  assert.match(toneRuleNote({ rule: 'yi', correctTones: [4, 3], toneChange: true }), /spoken yì/);
  assert.equal(toneRuleNote({ rule: null, correctTones: [1, 1] }), '');
});

test('tone-change focus only uses words with a tone rule', () => {
  const pairs = [{ id: 'a', toneRule: false }, { id: 'b', toneRule: true }, { id: 'c', toneRule: true }];
  assert.deepEqual(pairRound(pairs, { focus: 'changes', shuffle: items => items }).map(pair => pair.id), ['b', 'c']);
  assert.equal(pairRound(pairs, { size: 2, shuffle: items => items }).length, 2);
});

test('rounds use recorded words before device-voice words', () => {
  const pairs = [{ id: 'v1' }, { id: 'r1', audioUrl: '/r1.mp3' }, { id: 'v2' }, { id: 'r2', audioUrl: '/r2.mp3', toneRule: true }, { id: 'v3', toneRule: true }];
  const reverse = items => [...items].reverse();
  assert.deepEqual(pairRound(pairs, { shuffle: reverse }).map(pair => pair.id), ['r2', 'r1', 'v3', 'v2', 'v1']);
  assert.deepEqual(pairRound(pairs, { size: 3, shuffle: reverse }).map(pair => pair.id), ['r2', 'r1', 'v3']);
  assert.deepEqual(pairRound(pairs, { size: 1, shuffle: reverse }).map(pair => pair.id), ['r2']);
  assert.deepEqual(pairRound(pairs, { focus: 'changes', shuffle: reverse }).map(pair => pair.id), ['r2', 'v3']);
});
