export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function recordedVocabulary(words) {
  const seen = new Set();
  return words.filter(word => {
    if (!word.word?.trim() || !word.meaning?.trim() || !word.audioUrl?.trim()) return false;
    const key = word.word.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const meaningKey = text => text.trim().toLocaleLowerCase().replace(/\s+/g, ' ');

export function createListeningQuiz(words, limit = 10, random = Math.random) {
  const recorded = recordedVocabulary(words);
  const meanings = [...new Map(recorded.map(word => [meaningKey(word.meaning), word.meaning.trim()])).values()];
  if (meanings.length < 2) return [];
  return shuffle(recorded, random).slice(0, limit).map(word => {
    const answer = word.meaning.trim();
    const alternatives = shuffle(meanings.filter(meaning => meaningKey(meaning) !== meaningKey(answer)), random).slice(0, 3);
    return { ...word, answer, options: shuffle([answer, ...alternatives], random) };
  });
}
