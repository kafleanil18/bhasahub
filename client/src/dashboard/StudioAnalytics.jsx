import { useState } from 'react';
import { Link } from 'react-router-dom';
import { practicePaths, testPath } from '../navigation/paths';
import { MEASURE_QUESTIONS } from '../practice/measureQuiz';
import { NUMBER_QUESTIONS } from '../practice/numberQuiz';
import { bookLessons } from '../practice/conversationLessons';
import './StudioAnalytics.css';

import RefreshButton from '../components/RefreshButton';
import { apiFetch } from '../lib/apiClient';
const studios = {
  pinyin: 'Pinyin & tones', tones: 'Tone listening', trace: 'Trace characters', listening: 'Listening practice', sentences: 'Sentence builder',
  measures: 'Measure words', numbers: 'Everyday numbers', dictation: 'Listening dictation', conversation: 'Conversation',
};
// These studios ship their questions with the app, so the server can't count them.
// Conversation keys match ConversationPractice: every line and word you can play.
const phrase = text => text.trim().replace(/\s+/g, ' ');
const clientTotals = {
  measures: MEASURE_QUESTIONS.length,
  numbers: NUMBER_QUESTIONS.length,
  conversation: new Set(bookLessons.flatMap(lesson => [
    ...lesson.exchanges.flatMap(exchange => exchange.turns.map(turn => phrase(turn.chinese))),
    ...lesson.words.map(word => phrase(word.chinese)),
  ])).size,
};
const RADIUS = 42, CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressDonut({ attempted, total, title }) {
  if (!total) return <p className="studio-donut-empty">No questions available yet.</p>;
  // Answers to questions that were later removed can push the count past the total.
  const done = Math.min(attempted, total);
  const percent = Math.round(done / total * 100);
  return <figure className="studio-donut">
    <svg viewBox="0 0 100 100" role="img" aria-label={`${title}: ${done} of ${total} questions attempted, ${percent}%`}>
      <circle className="studio-donut-track" cx="50" cy="50" r={RADIUS} />
      {done > 0 && <circle className="studio-donut-value" cx="50" cy="50" r={RADIUS} strokeDasharray={`${done / total * CIRCUMFERENCE} ${CIRCUMFERENCE}`} />}
      <text x="50" y="49" className="studio-donut-percent">{percent}%</text>
      <text x="50" y="63" className="studio-donut-caption">attempted</text>
    </svg>
    <figcaption>
      <span><i className="studio-donut-key is-done" aria-hidden="true" />Attempted <strong>{done}</strong></span>
      <span><i className="studio-donut-key" aria-hidden="true" />Not yet <strong>{total - done}</strong></span>
      <span className="studio-donut-total">{total} questions in total</span>
    </figcaption>
  </figure>;
}
const date = value => value ? new Date(value).toLocaleDateString() : 'Not yet';

// `activity` comes from useStudioActivity, called by My Progress so it loads alongside the rest of the page.
export default function StudioAnalytics({ activity }) {
  const { state, setState, retry } = activity;
  const [resetting, setResetting] = useState('');
  const [notice, setNotice] = useState('');
  const [resetError, setResetError] = useState('');
  const resetCount = async (studio, title) => {
    if (resetting) return;
    const confirmed = window.confirm(`Reset your ${title} count? This clears this studio’s unique count, answer accuracy, and last-practiced date. You can count the same questions again afterward. Course completion, HSK test results, and other studios are kept. This cannot be undone.`);
    if (!confirmed) return;
    setResetting(studio); setNotice(''); setResetError('');
    try {
      const response = await apiFetch(`${window.API_BASE_URL}/api/studio-activity/${studio}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Reset failed');
      setState(previous => ({ ...previous, data: { ...previous.data, studios: previous.data.studios.map(row => row.studio === studio ? { ...row, activities: 0, graded: 0, correct: 0, accuracy: null, lastPracticed: null } : row) } }));
      setNotice(`${title} count reset. New practice will count again.`);
    } catch { setResetError(`Could not confirm the reset for ${title}. Refresh My Progress to check the current count before trying again.`); }
    finally { setResetting(''); }
  };
  const data = state.data;
  return <section className="studio-analytics" aria-labelledby="studio-analytics-title">
    <div className="analytics-course-progress-heading"><div><span className="dash-eyebrow">YOUR PRACTICE STUDIO</span><h2 id="studio-analytics-title">Nine skills. Every practice counts.</h2></div></div>
    {state.loading ? <p role="status">Loading studio activity and test completions…</p> : state.error ? <div role="alert"><p>Studio analytics couldn’t load. Your saved work hasn’t changed.</p><RefreshButton onClick={retry}>Retry studio analytics</RefreshButton></div> : <>
      {notice && <p role="status">{notice}</p>}
      {resetError && <p role="alert">{resetError}</p>}
      <div className="studio-analytics-grid">{Object.entries(studios).map(([id, title]) => {
        const row = data.studios.find(item => item.studio === id);
        return <article className={`analytics-course-progress-card studio-skill-card studio-skill-${id}`} key={id}>
          <h3><Link to={practicePaths[id]}>{title}</Link></h3>
          <ProgressDonut attempted={row?.activities || 0} total={row?.total ?? clientTotals[id] ?? 0} title={title} />
          <dl>{id !== 'tones' && <div><dt>Answer accuracy</dt><dd>{row?.accuracy == null ? '—' : `${row.accuracy}%`}</dd></div>}<div><dt>Last practiced</dt><dd>{date(row?.lastPracticed)}</dd></div></dl>
          {id !== 'tones' && row?.graded > 0 && <p>{row.correct} of {row.graded} answers correct</p>}
          <button type="button" className="studio-reset-button" disabled={!!resetting || !row?.activities} onClick={() => resetCount(id, title)} aria-label={`Reset ${title} count`}>{resetting === id ? 'Resetting…' : 'Reset count'}</button>
        </article>;
      })}</div>
      <div className="studio-hsk-heading"><h2>HSK test completion</h2><Link to="/tests">Browse mock tests</Link></div>
      <p>{data.hsk.reduce((sum, row) => sum + row.completed, 0)} completed attempts, {data.hsk.filter(row => row.completed > 0).length} papers completed, {data.hsk.reduce((sum, row) => sum + row.unfinished, 0)} unfinished attempts</p>
      {!data.hsk.length ? <p>No HSK attempts yet. Take a mock test to see your results here.</p> : <div className="studio-analytics-grid">{data.hsk.map(row => <article className="analytics-course-progress-card" key={row.paper}>
        <h3><Link to={testPath(row.paper)}>{row.title || `HSK 1 ${row.paper.toUpperCase()}`}</Link></h3>
        <dl><div><dt>Completed attempts</dt><dd>{row.completed}</dd></div><div><dt>Unfinished attempts</dt><dd>{row.unfinished}</dd></div><div><dt>Best score</dt><dd>{row.bestPercent == null ? '—' : `${row.bestPercent}%`}</dd></div><div><dt>Average score</dt><dd>{row.averagePercent == null ? '—' : `${row.averagePercent}%`}</dd></div><div><dt>Last completed</dt><dd>{date(row.lastCompleted)}</dd></div></dl>
      </article>)}</div>}
      {data.otherTests.length > 0 && <><h3>Other completed mock tests</h3><ul className="studio-test-history">{data.otherTests.map(row => <li key={row.id}><strong>{row.title}</strong><span>{row.score} / {row.total}, {date(row.date)}</span></li>)}</ul></>}
    </>}
  </section>;
}
