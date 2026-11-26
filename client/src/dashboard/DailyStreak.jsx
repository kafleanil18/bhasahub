import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { PRACTICE_TIME_SAVED, localToday } from './practiceTimer';
import './DailyStreak.css';

const api = (path, options = {}) => fetch(`${window.API_BASE_URL}/api/practice-time${path}`, {
  ...options,
  headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json', ...options.headers },
}).then(async response => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
});

const weekday = date => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });
const longDay = date => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function GoalRing({ minutes, goal }) {
  const r = 34, c = 2 * Math.PI * r;
  const share = Math.min(1, minutes / goal);
  return <div className="streak-ring" role="img" aria-label={`${minutes} of ${goal} minutes practised today`}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r={r} className="streak-ring-track" />
      <circle cx="40" cy="40" r={r} className="streak-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - share)} />
    </svg>
    <span aria-hidden="true">{share >= 1 ? <Icon name="check" size={26} strokeWidth={2.6} /> : <><b>{minutes}</b><small>/{goal} min</small></>}</span>
  </div>;
}

// The student's daily goal ring, current streak and last 7 days.
export default function DailyStreak() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => api(`/me?today=${localToday()}`).then(result => {
    if (!result?.today || !Array.isArray(result.week) || !Array.isArray(result.goalChoices)) throw new Error('Unexpected streak data.');
    setData(result); setError('');
  }).catch(err => setError(err.message)), []);
  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener(PRACTICE_TIME_SAVED, refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener(PRACTICE_TIME_SAVED, refresh); window.removeEventListener('focus', refresh); };
  }, [load]);

  const changeGoal = async minutes => {
    setSaving(true);
    try { await api('/goal', { method: 'PUT', body: JSON.stringify({ minutes }) }); await load(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (!data) return <section className="streak-card is-loading" aria-label="Daily practice">
    {error ? <p role="alert">Couldn’t load your streak. <button type="button" className="streak-link" onClick={load}>Try again</button></p> : <p role="status">Loading your streak…</p>}
  </section>;

  const { today, goalMinutes, streak, bestStreak, week } = data;
  const left = Math.max(0, goalMinutes - today.minutes);
  const message = today.goalMet ? 'Goal reached for today. Great work, 加油!'
    : today.practised ? `${plural(left, 'more minute')} to reach today’s goal.`
      : streak > 0 ? `Practise today to keep your ${streak}-day streak going.`
        : 'Practise for a minute today to start a streak.';
  const atRisk = !today.practised && streak > 0;

  return <section className={`streak-card${atRisk ? ' is-at-risk' : ''}${today.goalMet ? ' is-done' : ''}`} aria-labelledby="streak-title">
    <div className="streak-main">
      <div className={`streak-flame${streak > 0 ? ' is-lit' : ''}`} aria-hidden="true"><Icon name="flame" size={30} strokeWidth={2} /></div>
      <div>
        <h2 id="streak-title"><span className="streak-count">{streak}</span>-day streak</h2>
        <p className="streak-message" role="status">{message}</p>
        <p className="streak-best">Best: {plural(bestStreak, 'day')}</p>
      </div>
    </div>

    <GoalRing minutes={today.minutes} goal={goalMinutes} />

    <div className="streak-side">
      <ol className="streak-week" aria-label="Last 7 days">
        {week.map(day => {
          const isToday = day.date === today.date;
          const state = day.goalMet ? 'goal reached' : day.practised ? `${day.minutes} min practised` : 'no practice';
          return <li key={day.date} className={`${day.practised ? 'is-practised' : ''}${day.goalMet ? ' is-goal' : ''}${isToday ? ' is-today' : ''}`}>
            <span className="streak-dot" aria-hidden="true">{day.goalMet && <Icon name="check" size={14} strokeWidth={3} />}</span>
            <span aria-hidden="true">{weekday(day.date)}</span>
            <span className="streak-sr">{isToday ? 'Today' : longDay(day.date)}: {state}</span>
          </li>;
        })}
      </ol>
      <div className="streak-actions">
        <label className="streak-goal">Daily goal
          <select value={goalMinutes} disabled={saving} onChange={event => changeGoal(Number(event.target.value))}>
            {data.goalChoices.map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}
          </select>
        </label>
        {!today.goalMet && <Link className="streak-go" to="/continue">Practise now</Link>}
      </div>
      {error && <p className="streak-error" role="alert">{error}</p>}
    </div>
  </section>;
}
