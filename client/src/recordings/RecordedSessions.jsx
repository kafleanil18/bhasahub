import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiJson } from '../lib/apiClient';
import { useInitialLoad } from '../navigation/pageLoad';
import RecordingPlayer from './RecordingPlayer';
import AccessDialog from '../admin/subscriptions/AccessDialog';
import RecordingCalendar from './RecordingCalendar';
import { formatSessionDate, localDate } from './recordingMedia';
import '../admin/SubscriptionManager.css';
import './RecordedSessions.css';

export default function RecordedSessions() {
  const [params, setParams] = useSearchParams();
  const requestedDate = params.get('date');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') && Number.isFinite(Date.parse(`${requestedDate}T12:00:00`)) ? requestedDate : localDate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState('');
  const [watch, setWatch] = useState({});
  const [playerOpen, setPlayerOpen] = useState(false);
  const visible = sessions.filter(session => session.sessionDate === date);
  const activeId = visible.find(session => session._id === selected)?._id || visible[0]?._id || '';
  useInitialLoad(loading, 'Loading recorded sessions…');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected(''); setWatch({}); setPlayerOpen(false);
    apiJson('/api/recorded-sessions/mine', { signal: controller.signal, timeout: 15000 })
      .then(data => { if (!controller.signal.aborted) setSessions(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!activeId || !playerOpen) return undefined;
    const controller = new AbortController();
    const load = () => {
      setWatch({ loading: true });
      apiJson(`/api/recorded-sessions/${activeId}/watch`, { signal: controller.signal, timeout: 15000 })
        .then(session => { if (!controller.signal.aborted) setWatch({ session }); })
        .catch(err => { if (!controller.signal.aborted) setWatch({ error: err.message }); });
    };
    load();
    window.addEventListener('focus', load);
    return () => { controller.abort(); window.removeEventListener('focus', load); };
  }, [activeId, attempt, playerOpen]);

  return <main className="container access-manager recorded-sessions" aria-labelledby="recorded-sessions-title">
    <header className="access-page-heading"><div><p className="access-eyebrow">Your classroom, replayed</p><h1 id="recorded-sessions-title">Recorded sessions</h1><p>Click a day on the calendar to revisit the recordings shared with you.</p></div></header>
    <div className="recording-toolbar">
      <button className="access-button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>Refresh</button>
    </div>
    <RecordingCalendar key={date.slice(0, 7)} date={date} sessions={sessions} disabled={loading || !!error} onSelect={value => { setParams({ date: value }); setSelected(''); setWatch({ loading: true }); setPlayerOpen(sessions.some(session => session.sessionDate === value)); }} />
    <h2 className="recording-day-title">{formatSessionDate(date)}</h2>
    {error ? <div className="access-feedback is-error" role="alert">{error}<button className="access-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>
      : loading ? <p role="status">Loading recorded sessions…</p>
        : !visible.length ? <div className="recording-empty"><h2>{sessions.length ? 'No recordings for this date' : 'No recordings shared yet'}</h2><p>{sessions.length ? 'Choose a marked day on the calendar to watch a recording.' : 'Recordings will appear here when your teacher shares them with you.'}</p></div>
          : <section aria-label="Available recordings" className="recording-list"><p className="recording-count">{visible.length} {visible.length === 1 ? 'session' : 'sessions'}</p>{visible.map(session => <button className="recording-choice" key={session._id} onClick={() => { setSelected(session._id); setWatch({ loading: true }); setPlayerOpen(true); }}><strong>{session.title}</strong><span>Watch recording</span></button>)}</section>}
    {playerOpen && activeId && <AccessDialog title={visible.find(session => session._id === activeId)?.title || 'Recorded session'} description={formatSessionDate(date)} onClose={() => { setPlayerOpen(false); setWatch({}); }}>
      <div className="recording-watch-content">
        {visible.length > 1 && <label className="recording-watch-select">Recording for this day<select value={activeId} onChange={event => { setSelected(event.target.value); setWatch({ loading: true }); }}>{visible.map(session => <option key={session._id} value={session._id}>{session.title}</option>)}</select></label>}
        {watch.error ? <div role="alert"><p>{watch.error}</p><button className="access-button" onClick={() => setAttempt(value => value + 1)}>Refresh recordings</button></div> : !watch.session || watch.loading || watch.session._id !== activeId ? <p role="status">Opening your recording…</p> : <>
          <RecordingPlayer key={watch.session._id} session={watch.session} />
          {watch.session.description && <p className="recording-description">{watch.session.description}</p>}
        </>}
      </div>
    </AccessDialog>}
  </main>;
}
