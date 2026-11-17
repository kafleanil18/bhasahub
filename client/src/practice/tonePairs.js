const TONE_MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };

// Standard placement: a or e takes the mark, o in "ou", otherwise the last vowel.
export function markSyllable(syllable, tone) {
  if (![1, 2, 3, 4].includes(tone)) return syllable;
  const lower = syllable.toLowerCase();
  let index = lower.search(/[ae]/);
  if (index < 0) index = lower.indexOf('ou');
  if (index < 0) index = Math.max(...['i', 'o', 'u', 'ü'].map(vowel => lower.lastIndexOf(vowel)));
  if (index < 0) return syllable;
  const mark = TONE_MARKS[lower[index]][tone - 1];
  return syllable.slice(0, index) + mark + syllable.slice(index + 1);
}

export const toneNames = { 1: 'high and level', 2: 'rising', 3: 'low / dipping', 4: 'falling' };

// Short teaching note for words whose spoken tones follow a tone-change rule.
export function toneRuleNote(result) {
  const second = result.correctTones[1];
  if (result.rule === 'third') return `Written ${result.writtenPinyin}. When two 3rd tones meet, the first is spoken as a 2nd tone.`;
  if (result.rule === 'bu') return result.toneChange
    ? `不 is written bù, but before a 4th tone it is spoken bú.`
    : `不 keeps its 4th tone (bù) before tones 1, 2 and 3.`;
  if (result.rule === 'yi') return second === 4
    ? `一 is written yī. Before a 4th tone it is spoken yí.`
    : `一 is written yī. Before tones 1, 2 and 3 it is spoken yì.`;
  return '';
}

export function pairRound(pairs, { focus = 'all', size = 10, shuffle }) {
  const pool = focus === 'changes' ? pairs.filter(pair => pair.toneRule) : pairs;
  return shuffle(pool).slice(0, size);
}
