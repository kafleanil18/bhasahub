import { useEffect, useMemo, useState } from 'react';
import { ToneContour } from './ToneVisuals';
import { chartGroups } from './toneSyllables';

const toneMarks = [{ value: 1, mark: 'ā' }, { value: 2, mark: 'á' }, { value: 3, mark: 'ǎ' }, { value: 4, mark: 'à' }];

export default function SingleSyllableStart({ questions, onStart }) {
  const [table, setTable] = useState(null);
  const [picked, setPicked] = useState(null); // null = every recorded syllable
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${window.API_BASE_URL}/api/pinyin-table`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted && data) setTable(data); })
      .catch(() => {}); // Without the chart, syllables fall back to alphabetical order.
    return () => controller.abort();
  }, []);
  const groups = useMemo(() => chartGroups(questions, table), [questions, table]);
  const all = groups.flatMap(group => group.syllables.map(item => item.syllable));
  const selected = picked || new Set(all);
  const pool = questions.filter(question => selected.has(question.syllable));
  const toggle = syllable => {
    const next = new Set(selected);
    if (next.has(syllable)) next.delete(syllable); else next.add(syllable);
    setPicked(next);
  };
  const allPicked = selected.size === all.length;

  return <section className="sentence-card tone-mode-card tone-mode-single" aria-labelledby="tone-single-title">
    <div className="tone-mode-art" aria-hidden="true">{toneMarks.map(tone => <span key={tone.value} className="tone-mode-tone" data-tone={tone.value}><ToneContour tone={tone.value} size={52} /><b>{tone.mark}</b></span>)}</div>
    <p className="sentence-eyebrow">Single syllables · From the Pinyin Chart</p><h2 id="tone-single-title">Train your ear for the four tones</h2>
    <p>Practise the syllables your teacher has recorded in the Pinyin Chart. Hear one, then match its pitch to one of four tone shapes.</p>
    <ul className="tone-mode-stats">
      <li><strong>{all.length}</strong><span>syllables</span></li>
      <li><strong>{questions.length}</strong><span>recordings</span></li>
      <li><strong>{Math.min(10, pool.length)}</strong><span>per round</span></li>
    </ul>
    <fieldset className="tone-syllable-picker">
      <legend>Choose syllables to practise</legend>
      <div className="tone-syllable-tools">
        <span>{allPicked ? 'All syllables selected' : `${selected.size} of ${all.length} selected · ${pool.length} recordings`}</span>
        <button type="button" onClick={() => setPicked(allPicked ? new Set() : null)}>{allPicked ? 'Clear all' : 'Select all'}</button>
      </div>
      <div className="tone-syllable-groups">{groups.map(group => <div key={group.key} className="tone-syllable-group">
        <span className="tone-syllable-initial" aria-hidden="true">{group.label}</span>
        <div className="tone-syllable-chips">{group.syllables.map(item => <label key={item.syllable} className="tone-syllable-chip">
          <input type="checkbox" checked={selected.has(item.syllable)} onChange={() => toggle(item.syllable)} aria-label={`${item.syllable}, ${item.count} ${item.count === 1 ? 'recording' : 'recordings'}`} />
          <span>{item.syllable}</span><small aria-hidden="true">{item.count}</small>
        </label>)}</div>
      </div>)}</div>
    </fieldset>
    <p className="tone-mode-meta">🎧 Recorded by your teacher · only recorded tones are asked · up to 10 per round.</p>
    <button className="sentence-primary tone-start" disabled={!pool.length} onClick={() => onStart(pool)}>Start tone practice <span aria-hidden="true">→</span></button>
  </section>;
}
