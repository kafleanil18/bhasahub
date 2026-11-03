export function shuffleSentences(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function sentenceTiles(sentence, random = Math.random) {
  const tiles = shuffleSentences(sentence.tokens.map((text, id) => ({ id, text })), random);
  if (tiles.map(tile => tile.text).join('') === sentence.tokens.join('')) tiles.push(tiles.shift());
  return tiles;
}

export function isCorrectSentence(sentence, selectedTokens) {
  if (selectedTokens.length !== sentence.tokens.length) return false;
  const sorted = tokens => [...tokens].sort().join('\u0000');
  if (sorted(selectedTokens) !== sorted(sentence.tokens)) return false;
  const answer = selectedTokens.join('');
  return [sentence.tokens, ...(sentence.acceptedOrders || [])].some(tokens => tokens.join('') === answer);
}
