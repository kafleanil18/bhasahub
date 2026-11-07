import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './admin/EmailSettings.css';

export default function ReminderUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const unsubscribe = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/practice-reminders/unsubscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update your preference. Please try again.');
      setDone(true);
    } catch (err) { setError(err.message || 'Could not reach the server. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="container email-settings" aria-labelledby="reminder-preference-title"><div className="email-heading"><h1 id="reminder-preference-title">Practice reminder emails</h1></div><div className="email-form">
    {done ? <p role="status">Practice reminder emails are turned off. Your course access and account emails are unchanged.</p> : <><p>Would you like to stop receiving Chinese practice reminder emails?</p><p>You will keep your course access and continue receiving important account emails.</p>{token ? <button className="email-button email-primary" disabled={busy} onClick={unsubscribe}>{busy ? 'Updating…' : 'Stop practice reminders'}</button> : <p role="alert">This link is incomplete. Open the unsubscribe link in your reminder email.</p>}</>}
    {error && <p role="alert">{error}</p>}<p><Link to="/">Back to home</Link></p>
  </div></section>;
}
