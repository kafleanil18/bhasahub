import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FREE_ACCESS_DAYS, usePracticeAccess } from './practiceAccess';
import FreeAccessNote from './FreeAccessNote';
import './PracticeGate.css';
import Icon from '../components/Icon';

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
    none: ['Unlock practice for free', 'You can look around, but practicing needs approval from an administrator. Send a free request and you can start as soon as it is approved.'],
    denied: ['Unlock practice for free', 'Your earlier request was declined. You can send a new free request to the administrator.'],
    expired: ['Your free week has ended', `Thanks for trying the practice studio. Your ${FREE_ACCESS_DAYS}-day free access is over. Choose a plan to keep practising.`],
    pending: ['Waiting for approval', 'Your access request has been sent. You can start practicing as soon as an administrator approves it.'],
  }[status];

  return <div className="practice-gate">
    {/* inert keeps the page visible but stops every click, key press and focus inside it. */}
    <div className="practice-gate-content" inert aria-hidden="true"><Outlet /></div>
    {copy && <div className="practice-gate-panel" role="region" aria-labelledby="practice-gate-title">
      <span className="practice-gate-icon" aria-hidden="true"><Icon name={status === 'pending' ? 'hourglass' : status === 'expired' ? 'hourglassDone' : 'lock'} size={26}/></span>
      <h2 id="practice-gate-title">{copy[0]}</h2>
      <p>{copy[1]}</p>
      {(status === 'none' || status === 'denied') && <FreeAccessNote/>}
      {error && <p className="practice-gate-error" role="alert">{error}</p>}
      <div className="practice-gate-actions">
        <button className="practice-gate-secondary" onClick={onHome}>← Back to home</button>
        {status === 'expired' && <Link className="practice-gate-primary practice-gate-link" to="/pricing">See plans →</Link>}
        {(status === 'none' || status === 'denied') && <button className="practice-gate-primary" onClick={send} disabled={sending}>{sending ? 'Sending…' : error ? 'Try again' : 'Request free access'}</button>}
      </div>
    </div>}
  </div>;
}
