export function normalizeDictation(text) {
  return String(text || '').normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu, '');
}

export function recordedSentences(sentences) {
  return sentences.filter(sentence => typeof sentence.audioUrl === 'string' && sentence.audioUrl.trim());
}

// Align characters so one missing character does not mark every later one wrong.
export function compareDictation(expectedText, typedText) {
  const expected = Array.from(normalizeDictation(expectedText));
  const actual = Array.from(normalizeDictation(typedText));
  const distance = Array.from({ length: expected.length + 1 }, () => Array(actual.length + 1).fill(0));
  for (let i = 0; i <= expected.length; i++) distance[i][0] = i;
  for (let j = 0; j <= actual.length; j++) distance[0][j] = j;
  for (let i = 1; i <= expected.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      distance[i][j] = Math.min(distance[i - 1][j] + 1, distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + (expected[i - 1] === actual[j - 1] ? 0 : 1));
    }
  }
  const characters = [];
  let i = expected.length;
  let j = actual.length;
  while (i || j) {
    const matches = i && j && expected[i - 1] === actual[j - 1];
    if (i && j && distance[i][j] === distance[i - 1][j - 1] + (matches ? 0 : 1)) {
      characters.push({ type: matches ? 'correct' : 'incorrect', expected: expected[i - 1], actual: actual[j - 1], expectedIndex: i - 1 });
      i--; j--;
    } else if (i && distance[i][j] === distance[i - 1][j] + 1) {
      characters.push({ type: 'missing', expected: expected[i - 1], actual: '', expectedIndex: i - 1 });
      i--;
    } else {
      characters.push({ type: 'extra', expected: '', actual: actual[j - 1], expectedIndex: null });
      j--;
    }
  }
  characters.reverse();
  const correctCharacters = characters.filter(character => character.type === 'correct').length;
  const totalCharacters = Math.max(expected.length, actual.length);
  return {
    correct: expected.join('') === actual.join(''), characters, correctCharacters, totalCharacters,
    accuracy: totalCharacters ? Math.round(correctCharacters / totalCharacters * 100) : 100,
  };
}
