// Orders recorded syllables like the Pinyin Chart (by initial row, then final column) and groups them by initial.
export function chartGroups(questions, table) {
  const counts = new Map();
  for (const question of questions) counts.set(question.syllable, (counts.get(question.syllable) || 0) + 1);
  const cells = new Map((table?.syllables || []).map(cell => [cell.syllable, cell]));
  const initials = table?.initials || [];
  const finals = table?.finals || [];
  const rank = syllable => {
    const cell = cells.get(syllable);
    if (!cell) return [Infinity, Infinity];
    const row = initials.indexOf(cell.initial), column = finals.indexOf(cell.final);
    return [row < 0 ? Infinity : row, column < 0 ? Infinity : column];
  };
  const sorted = [...counts.keys()].sort((a, b) => {
    const [ra, ca] = rank(a), [rb, cb] = rank(b);
    return ra - rb || ca - cb || a.localeCompare(b);
  });
  const groups = [];
  for (const syllable of sorted) {
    const cell = cells.get(syllable);
    const key = cell ? cell.initial || 'none' : 'other';
    const label = !cell ? 'Other' : cell.initial ? cell.initial : 'No initial';
    let group = groups.find(item => item.key === key);
    if (!group) groups.push(group = { key, label, syllables: [] });
    group.syllables.push({ syllable, count: counts.get(syllable) });
  }
  return groups;
}
