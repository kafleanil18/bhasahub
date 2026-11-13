import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { practicePaths, testPath } from '../navigation/paths';
import './StudioAnalytics.css';

const studios = {
  pinyin: ['Pinyin & tones', 'Pinyin syllables practiced'], tones: ['Tone listening', 'Unique recordings answered'], trace: ['Trace characters', 'Characters practiced'],
  listening: ['Listening practice', 'Unique questions answered'], sentences: ['Sentence builder', 'Unique questions answered'],
  measures: ['Measure words', 'Unique questions answered'], numbers: ['Everyday numbers', 'Unique questions answered'],
  dictation: ['Listening dictation', 'Unique questions answered'], conversation: ['Conversation', 'Unique phrases practiced'],
};
const date = value => value ? new Date(value).toLocaleDateString() : 'Not yet';

export default function StudioAnalytics({ refreshKey }) {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const [resetting, setResetting] = useState('');
  const [notice, setNotice] = useState('');
  const [resetError, setResetError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    fetch(`${window.API_BASE_URL}/api/studio-activity/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    }).then(async response => {
      if (!response.ok) throw new Error('Analytics unavailable');
      const data = await response.json();
      if (!Array.isArray(data.studios) || !Array.isArray(data.hsk) || !Array.isArray(data.otherTests)) throw new Error('Invalid analytics');
      if (!controller.signal.aborted) setState({ data });
    }).catch(() => { if (!controller.signal.aborted) setState({ error: true }); });
    return () => controller.abort();
  }, [refreshKey, attempt]);
  const resetCount = async (studio, title) => {
    if (resetting) return;
    const confirmed = window.confirm(`Reset your ${title} count? This clears this studio’s unique count, answer accuracy, and last-practiced date. You can count the same questions again afterward. Course completion, HSK test results, and other studios are kept. This cannot be undone.`);
    if (!confirmed) return;
    setResetting(studio); setNotice(''); setResetError('');
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/studio-activity/${studio}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ confirmed: true }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Reset failed');
      setState(previous => ({ ...previous, data: { ...previous.data, studios: previous.data.studios.map(row => row.studio === studio ? { ...row, activities: 0, graded: 0, correct: 0, accuracy: null, lastPracticed: null } : row), ...(studio === 'tones' ? { tonePerformance: [] } : {}) } }));
      setNotice(`${title} count reset. New practice will count again.`);
    } catch { setResetError(`Could not confirm the reset for ${title}. Refresh My Progress to check the current count before trying again.`); }
    finally { setResetting(''); }
  };
  const data = state.data;
  return <section className="studio-analytics" aria-labelledby="studio-analytics-title">
    <div className="analytics-course-progress-heading"><div><span className="dash-eyebrow">YOUR PRACTICE STUDIO</span><h2 id="studio-analytics-title">Nine skills. Every practice counts.</h2></div></div>
    {state.loading ? <p role="status">Loading studio activity and test completions…</p> : state.error ? <div role="alert"><p>Studio analytics couldn’t load. Your saved work hasn’t changed.</p><button className="btn-primary" onClick={() => setAttempt(value => value + 1)}>Retry studio analytics</button></div> : <>
      {notice && <p role="status">{notice}</p>}
      {resetError && <p role="alert">{resetError}</p>}
      <div className="studio-analytics-grid">{Object.entries(studios).map(([id, [title, unit]]) => {
        const row = data.studios.find(item => item.studio === id);
        return <article className={`analytics-course-progress-card studio-skill-card studio-skill-${id}`} key={id}>
          <h3><Link to={practicePaths[id]}>{title}</Link></h3>
          <dl><div><dt>{unit}</dt><dd>{row?.activities || 0}</dd></div><div><dt>Answer accuracy</dt><dd>{row?.accuracy == null ? '—' : `${row.accuracy}%`}</dd></div><div><dt>Last practiced</dt><dd>{date(row?.lastPracticed)}</dd></div></dl>
          {row?.graded > 0 && <p>{row.correct} of {row.graded} answers correct</p>}
          {id === 'tones' && <div className="studio-tone-breakdown" role="group" aria-label="Tone-by-tone accuracy">{[1, 2, 3, 4].map(tone => {
            const value = data.tonePerformance?.find(item => item.tone === tone);
            return <div key={tone}><span>Tone {tone}</span><strong>{value?.attempted ? `${value.accuracy}%` : '—'}</strong><small>{value?.correct || 0} of {value?.attempted || 0} correct</small></div>;
          })}<p>First checked answers per recording. Reset to start a new cycle.</p></div>}
          <button type="button" className="studio-reset-button" disabled={!!resetting || !row?.activities} onClick={() => resetCount(id, title)} aria-label={`Reset ${title} count`}>{resetting === id ? 'Resetting…' : 'Reset count'}</button>
        </article>;
      })}</div>
      <div className="studio-hsk-heading"><h2>HSK test completion</h2><Link to="/tests">Browse mock tests →</Link></div>
      <p>{data.hsk.reduce((sum, row) => sum + row.completed, 0)} completed attempts · {data.hsk.filter(row => row.completed > 0).length} papers completed · {data.hsk.reduce((sum, row) => sum + row.unfinished, 0)} unfinished attempts</p>
      {!data.hsk.length ? <p>No HSK attempts yet. Take a mock test to see your results here.</p> : <div className="studio-analytics-grid">{data.hsk.map(row => <article className="analytics-course-progress-card" key={row.paper}>
        <h3><Link to={testPath(row.paper)}>{row.title || `HSK 1 · ${row.paper.toUpperCase()}`}</Link></h3>
        <dl><div><dt>Completed attempts</dt><dd>{row.completed}</dd></div><div><dt>Unfinished attempts</dt><dd>{row.unfinished}</dd></div><div><dt>Best score</dt><dd>{row.bestPercent == null ? '—' : `${row.bestPercent}%`}</dd></div><div><dt>Average score</dt><dd>{row.averagePercent == null ? '—' : `${row.averagePercent}%`}</dd></div><div><dt>Last completed</dt><dd>{date(row.lastCompleted)}</dd></div></dl>
      </article>)}</div>}
      {data.otherTests.length > 0 && <><h3>Other completed mock tests</h3><ul className="studio-test-history">{data.otherTests.map(row => <li key={row.id}><strong>{row.title}</strong><span>{row.score} / {row.total} · {date(row.date)}</span></li>)}</ul></>}
    </>}
  </section>;
}
