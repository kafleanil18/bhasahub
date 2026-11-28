import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/apiClient';
import { useInitialLoad } from '../navigation/pageLoad';
import AccessDialog from '../admin/subscriptions/AccessDialog';
import RecordingForm from './RecordingForm';
import RecordingPlayer from './RecordingPlayer';
import RecordingCalendar from './RecordingCalendar';
import { formatSessionDate, localDate } from './recordingMedia';
import '../admin/SubscriptionManager.css';
import './RecordedSessions.css';

export default function RecordedSessionManager() {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(localDate);
  useInitialLoad(loading, 'Loading recorded sessions…');
  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [rows, people] = await Promise.all([apiJson('/api/recorded-sessions', { timeout: 15000 }), apiJson('/api/recorded-sessions/students', { timeout: 15000 })]);
      setSessions(rows); setStudents(people);
    } catch (err) { setLoadError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const open = (type, session = null, initialDate = date) => { setDialog({ type, session, initialDate }); setError(''); setNotice(''); };
  const close = () => { if (!busy) setDialog(null); };
  const save = async body => {
    setBusy(true); setError('');
    try {
      const id = dialog.session?._id;
      const saved = await apiJson(`/api/recorded-sessions${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', json: body, timeout: 20000 });
      setSessions(rows => [...rows.filter(row => row._id !== saved._id), saved].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)));
      setDate(saved.sessionDate);
      setNotice(`Saved “${saved.title}”. Shared with ${saved.allowedStudents.length} students.`); setDialog(null);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try {
      await apiJson(`/api/recorded-sessions/${dialog.session._id}`, { method: 'DELETE', timeout: 15000 });
      setSessions(rows => rows.filter(row => row._id !== dialog.session._id)); setNotice('Recording removed.'); setDialog(null);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const visible = sessions.filter(session => !date || session.sessionDate === date);
  return <section className="container access-manager recorded-sessions" aria-labelledby="manage-recordings-title">
    <header className="access-page-heading"><div><p className="access-eyebrow">Classroom library</p><h1 id="manage-recordings-title">Recorded sessions</h1><p>Add class recordings and choose exactly which students can watch each session.</p></div><button className="access-button is-primary" disabled={loading || !!loadError} onClick={() => open('edit')}>Add recording</button></header>
    {notice && <p className="access-feedback is-success" role="status">{notice}</p>}
    <div className="recording-toolbar"><button className="access-button" disabled={loading} onClick={() => void load()}>Refresh</button></div>
    <RecordingCalendar key={date.slice(0, 7)} date={date} sessions={sessions} disabled={loading || !!loadError} onSelect={value => { setDate(value); if (!sessions.some(session => session.sessionDate === value)) open('edit', null, value); }} onAdd={value => open('edit', null, value)} />
    <h2 className="recording-day-title">{formatSessionDate(date)}</h2>
    {loadError ? <div className="access-feedback is-error" role="alert">{loadError}<button className="access-button" onClick={() => void load()}>Try again</button></div> : loading ? <p role="status">Loading recordings…</p> : !visible.length ? <div className="recording-empty"><h2>No recordings for this date</h2><p>Click this day on the calendar to paste a video link and choose its viewers.</p></div> : <ul className="recording-admin-list">{visible.map(session => <li key={session._id}><div><time dateTime={session.sessionDate}>{formatSessionDate(session.sessionDate)}</time><h2>{session.title}</h2><p>{session.allowedStudents.length ? `Shared with ${session.allowedStudents.length} students` : 'Private · no students selected'}</p></div><div className="recording-row-actions"><button className="access-button" onClick={() => open('preview', session)}>Preview</button><button className="access-button is-primary" onClick={() => open('edit', session)} aria-label={`Edit ${session.title}`}>Edit & access</button><button className="access-link is-danger" onClick={() => open('delete', session)} aria-label={`Remove ${session.title}`}>Remove</button></div></li>)}</ul>}
    {dialog?.type === 'edit' && <RecordingForm session={dialog.session} initialDate={dialog.initialDate} students={students} busy={busy} error={error} onSave={save} onClose={close} />}
    {dialog?.type === 'preview' && <AccessDialog title={dialog.session.title} description={formatSessionDate(dialog.session.sessionDate)} onClose={close}><RecordingPlayer session={dialog.session} /></AccessDialog>}
    {dialog?.type === 'delete' && <AccessDialog title={`Remove ${dialog.session.title}?`} description="This removes the session from BhasaHub for every student. The original video stays on its video provider." busy={busy} onClose={close}>{error && <p role="alert">{error}</p>}<div className="access-dialog-actions"><button className="access-button" disabled={busy} onClick={close}>Cancel</button><button className="access-button is-destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'Removing…' : 'Remove recording'}</button></div></AccessDialog>}
  </section>;
}
