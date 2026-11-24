import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FREE_ACCESS_DAYS, usePracticeAccess } from '../access/practiceAccess';
import FreeAccessNote from '../access/FreeAccessNote';
import './TestAccessPrompt.css';
import Icon from './Icon';

// Shown every time a student signs in until one of their access requests (course or
// mock tests) has been approved. "Request access" files a tests-scope request, which
// admins see in their notifications; a pending request is shown as waiting instead.
export default function TestAccessPrompt({ user, onClose, onStartTour }) {
  const { status, request } = usePracticeAccess(user);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const primaryRef = useRef(null);

  useEffect(() => { if (status === 'approved' || status === 'signed-out') onClose(); }, [status, onClose]);

  const ready = ['none', 'denied', 'pending', 'expired'].includes(status);
  useEffect(() => {
    if (!ready) return undefined;
    primaryRef.current?.focus();
    const escape = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [ready, onClose]);

  const send = async () => {
    setSending(true); setError('');
    try { await request(); setSent(true); } catch (err) { setError(err.message); } finally { setSending(false); }
  };

  if (!ready) return null;
  const waiting = sent || status === 'pending';
  const expired = !sent && status === 'expired';
  return (
    <div className="modal-overlay test-access-prompt-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="test-access-prompt" role="dialog" aria-modal="true" aria-labelledby="test-access-prompt-title" aria-describedby="test-access-prompt-text">
        <button className="test-access-prompt-close" onClick={onClose} disabled={sending} aria-label="Close">×</button>
        <span className="test-access-prompt-icon" aria-hidden="true">{sent ? '✓' : <Icon name={waiting ? 'hourglass' : expired ? 'hourglassDone' : 'lock'} size={26}/>}</span>
        <h2 id="test-access-prompt-title">{sent ? 'Request sent' : waiting ? 'Waiting for approval' : expired ? 'Your free week has ended' : status === 'denied' ? 'Ask again for practice access?' : 'Unlock practice for free'}</h2>
        <p id="test-access-prompt-text">{sent
          ? 'An administrator has been notified and will review your request. You can keep using the website meanwhile.'
          : expired
            ? `Thanks for trying the practice studio. Your ${FREE_ACCESS_DAYS}-day free access is over. Choose a plan to keep practising — the H11226 test stays free.`
          : waiting
            ? 'Your access request has been sent and is waiting for an administrator to approve it. You can keep using the website meanwhile — the H11226 test is free.'
            : status === 'denied'
              ? 'Your earlier request was declined. You can send a new request to the administrator, or continue without it for now.'
              : 'The practice studio and HSK mock tests need approval from an administrator. Send a free request now, or skip it and continue — the H11226 test is free either way.'}</p>
        {!waiting && !expired && <FreeAccessNote/>}
        {error && <p className="test-access-prompt-error" role="alert">{error}</p>}
        <div className="test-access-prompt-actions">
          <button ref={waiting && !expired ? primaryRef : undefined} className="test-access-prompt-secondary" onClick={() => { onClose(); onStartTour(); }} disabled={sending}>Take a quick tour</button>
          {expired
            ? <Link ref={primaryRef} className="test-access-prompt-primary test-access-prompt-link" to="/pricing" onClick={onClose}>See plans →</Link>
            : waiting
            ? <button className="test-access-prompt-primary is-sent" disabled><span aria-hidden="true">✓</span> Free request sent</button>
            : <button ref={primaryRef} className="test-access-prompt-primary" onClick={send} disabled={sending} aria-label={sending ? 'Sending your free request' : 'Request free access'}>{sending ? 'Sending…' : error ? 'Try again' : 'Request access'}{!sending && <span className="test-access-free-pill" aria-hidden="true">Free</span>}</button>}
        </div>
        <button className="test-access-prompt-later" onClick={onClose} disabled={sending}>{waiting || expired ? 'Close' : 'Not now'}</button>
      </div>
    </div>
  );
}
