import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartGroups } from './toneSyllables.js';

const table = { initials: ['', 'b', 'm'], finals: ['a', 'o', 'ai'], syllables: [
  { initial: '', final: 'a', syllable: 'a' }, { initial: 'b', final: 'a', syllable: 'ba' },
  { initial: 'b', final: 'ai', syllable: 'bai' }, { initial: 'm', final: 'a', syllable: 'ma' }, { initial: 'm', final: 'o', syllable: 'mo' },
] };
const q = syllable => ({ syllable });

test('recorded syllables follow chart order, grouped by initial, with recording counts', () => {
  const groups = chartGroups([q('mo'), q('ba'), q('ma'), q('ma'), q('bai'), q('a')], table);
  assert.deepEqual(groups.map(g => g.label), ['No initial', 'b', 'm']);
  assert.deepEqual(groups[1].syllables, [{ syllable: 'ba', count: 1 }, { syllable: 'bai', count: 1 }]);
  assert.deepEqual(groups[2].syllables, [{ syllable: 'ma', count: 2 }, { syllable: 'mo', count: 1 }]);
});

test('only recorded syllables are listed and unknown ones go last', () => {
  const groups = chartGroups([q('xyz'), q('ba')], table);
  assert.deepEqual(groups.map(g => g.label), ['b', 'Other']);
  assert.ok(!groups.flatMap(g => g.syllables.map(s => s.syllable)).includes('ma'));
});

test('without the chart, syllables are alphabetical', () => {
  assert.deepEqual(chartGroups([q('mo'), q('ba')], null)[0].syllables.map(s => s.syllable), ['ba', 'mo']);
});
