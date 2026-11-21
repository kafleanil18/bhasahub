const TONE_MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
const RULES = ['third', 'bu', 'yi'];
const CUSTOM_PREFIX = 'w-';

// Same placement as the client: a or e takes the mark, o in "ou", otherwise the last vowel.
function markSyllable(syllable, tone) {
  const lower = syllable.toLowerCase();
  let index = lower.search(/[ae]/);
  if (index < 0) index = lower.indexOf('ou');
  if (index < 0) index = Math.max(...['i', 'o', 'u', 'ü'].map(vowel => lower.lastIndexOf(vowel)));
  if (index < 0) return syllable;
  return syllable.slice(0, index) + TONE_MARKS[lower[index]][tone - 1] + syllable.slice(index + 1);
}

const validTone = tone => Number.isInteger(tone) && tone >= 1 && tone <= 4;
// Accepts "lv"/"lu:" for lü and strips any tone marks or numbers the admin typed.
function cleanSyllable(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/u:|v/g, 'ü').normalize('NFD').replace(/[̀-̂̄̌]/g, '').normalize('NFC').replace(/[1-5]$/, '');
}

// Returns { word } ready to save, or { error } describing the first problem.
function parseWord(body = {}) {
  const hanzi = typeof body.hanzi === 'string' ? body.hanzi.trim() : '';
  if (!/^\p{Script=Han}{2}$/u.test(hanzi)) return { error: 'Enter exactly two Chinese characters.' };
  const syllables = Array.isArray(body.syllables) ? body.syllables.map(cleanSyllable) : [];
  if (syllables.length !== 2 || !syllables.every(syllable => /^[a-zü]{1,6}$/.test(syllable) && /[aeiouü]/.test(syllable))) {
    return { error: 'Enter the pinyin for each syllable, like "ni" and "hao".' };
  }
  const tones = Array.isArray(body.tones) ? body.tones.map(Number) : [];
  if (tones.length !== 2 || !tones.every(validTone)) return { error: 'Choose the spoken tone (1–4) for both syllables.' };
  const writtenTones = Array.isArray(body.writtenTones) ? body.writtenTones.map(Number) : tones;
  if (writtenTones.length !== 2 || !writtenTones.every(validTone)) return { error: 'Choose the written tone (1–4) for both syllables.' };
  const english = typeof body.english === 'string' ? body.english.trim() : '';
  if (!english || english.length > 80) return { error: 'Add an English meaning (up to 80 characters).' };
  const rule = RULES.includes(body.rule) ? body.rule : null;
  return { word: { hanzi, syllables, tones, writtenTones, english, rule } };
}

// Shapes a saved word like an entry of data/tonePairs.json.
function toPair(doc) {
  const pinyin = doc.syllables.map((syllable, index) => markSyllable(syllable, doc.tones[index])).join(' ');
  const written = doc.syllables.map((syllable, index) => markSyllable(syllable, doc.writtenTones[index])).join(' ');
  return {
    id: `${CUSTOM_PREFIX}${doc._id}`, hanzi: doc.hanzi, syllables: [...doc.syllables], pinyin,
    tones: [...doc.tones], writtenTones: [...doc.writtenTones], english: doc.english, rule: doc.rule || null,
    ...(written !== pinyin ? { writtenPinyin: written } : {}), custom: true,
  };
}

const customId = id => typeof id === 'string' && id.startsWith(CUSTOM_PREFIX) && /^[a-f0-9]{24}$/.test(id.slice(CUSTOM_PREFIX.length)) ? id.slice(CUSTOM_PREFIX.length) : null;

module.exports = { markSyllable, cleanSyllable, parseWord, toPair, customId };
