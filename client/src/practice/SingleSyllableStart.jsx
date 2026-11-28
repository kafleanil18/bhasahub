import { useEffect, useMemo, useState } from 'react';
import { chartGroups } from './toneSyllables';
import { apiFetch } from '../lib/apiClient';

// Compact syllable chooser; `picked` is null when every recorded syllable is in play.
export default function SyllablePicker({ questions, picked, onChange }) {
  const [table, setTable] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`${window.API_BASE_URL}/api/pinyin-table`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted && data) setTable(data); })
      .catch(() => {}); // Without the chart, syllables fall back to alphabetical order.
    return () => controller.abort();
  }, []);
  const groups = useMemo(() => chartGroups(questions, table), [questions, table]);
  const all = groups.flatMap(group => group.syllables.map(item => item.syllable));
  const selected = picked || new Set(all);
  const toggle = syllable => {
    const next = new Set(selected);
    if (next.has(syllable)) next.delete(syllable); else next.add(syllable);
    onChange(next.size === all.length ? null : next);
  };
  const allPicked = selected.size === all.length;

  return <fieldset className="tone-syllable-picker">
    <legend>Choose syllables to practise</legend>
    <div className="tone-syllable-tools">
      <span>{allPicked ? 'All syllables' : `${selected.size} of ${all.length} selected`}</span>
      <button type="button" onClick={() => onChange(allPicked ? new Set() : null)}>{allPicked ? 'Clear all' : 'Select all'}</button>
    </div>
    <div className="tone-syllable-chips">{groups.flatMap(group => group.syllables).map(item => <label key={item.syllable} className="tone-syllable-chip">
      <input type="checkbox" checked={selected.has(item.syllable)} onChange={() => toggle(item.syllable)} aria-label={`${item.syllable}, ${item.count} ${item.count === 1 ? 'recording' : 'recordings'}`} />
      <span>{item.syllable}</span>
    </label>)}</div>
  </fieldset>;
}
