import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { usePracticeAccess } from './practiceAccess';
import './PracticeGate.css';

// Wraps the practice studio pages: students can look inside, but until an access
// request is approved the page is locked and they are asked to request access.
export default function PracticeGate({ user, onHome }) {
  const { status, request } = usePracticeAccess(user);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  if (status === 'approved') return <Outlet />;

  const send = async () => {
    setSending(true); setError('');
    try { await request(); } catch (err) { setError(err.message); } finally { setSending(false); }
  };
  const copy = {
    none: ['Request access to start practicing', 'You can look around, but practicing needs approval from an administrator. Send a request and you will be able to start once it is approved.'],
    denied: ['Request access to start practicing', 'Your earlier request was declined. You can send a new request to the administrator.'],
    pending: ['Waiting for approval', 'Your access request has been sent. You can start practicing as soon as an administrator approves it.'],
  }[status];

  return <div className="practice-gate">
    {/* inert keeps the page visible but stops every click, key press and focus inside it. */}
    <div className="practice-gate-content" inert aria-hidden="true"><Outlet /></div>
    {copy && <div className="practice-gate-panel" role="region" aria-labelledby="practice-gate-title">
      <span className="practice-gate-icon" aria-hidden="true">{status === 'pending' ? '⏳' : '🔒'}</span>
      <h2 id="practice-gate-title">{copy[0]}</h2>
      <p>{copy[1]}</p>
      {error && <p className="practice-gate-error" role="alert">{error}</p>}
      <div className="practice-gate-actions">
        <button className="practice-gate-secondary" onClick={onHome}>← Back to home</button>
        {(status === 'none' || status === 'denied') && <button className="practice-gate-primary" onClick={send} disabled={sending}>{sending ? 'Sending…' : error ? 'Try again' : 'Request access'}</button>}
      </div>
    </div>}
  </div>;
}
