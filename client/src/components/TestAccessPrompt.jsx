import { useEffect, useRef, useState } from 'react';
import { usePracticeAccess } from '../access/practiceAccess';
import './TestAccessPrompt.css';

// Shown every time a student signs in until one of their access requests (course or
// mock tests) has been approved. "Request access" files a tests-scope request, which
// admins see in their notifications; a pending request is shown as waiting instead.
export default function TestAccessPrompt({ user, onClose, onOpenTests }) {
  const { status, request } = usePracticeAccess(user);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const primaryRef = useRef(null);

  useEffect(() => { if (status === 'approved' || status === 'signed-out') onClose(); }, [status, onClose]);

  const ready = ['none', 'denied', 'pending'].includes(status);
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
  return (
    <div className="modal-overlay test-access-prompt-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="test-access-prompt" role="dialog" aria-modal="true" aria-labelledby="test-access-prompt-title" aria-describedby="test-access-prompt-text">
        <span className="test-access-prompt-icon" aria-hidden="true">{sent ? '✓' : waiting ? '⏳' : '🔒'}</span>
        <h2 id="test-access-prompt-title">{sent ? 'Request sent' : waiting ? 'Waiting for approval' : status === 'denied' ? 'Ask again for practice access?' : 'Unlock practice'}</h2>
        <p id="test-access-prompt-text">{sent
          ? 'An administrator has been notified and will review your request. You can keep using the website meanwhile.'
          : waiting
            ? 'Your access request has been sent and is waiting for an administrator to approve it. You can keep using the website meanwhile — the H11226 test is free.'
            : status === 'denied'
              ? 'Your earlier request was declined. You can send a new request to the administrator, or continue without it for now.'
              : 'The practice studio and HSK mock tests need approval from an administrator. Send a request now, or skip it and continue — the H11226 test is free either way.'}</p>
        {error && <p className="test-access-prompt-error" role="alert">{error}</p>}
        <div className="test-access-prompt-actions">
          {waiting ? <>
            <button className="test-access-prompt-secondary" onClick={() => { onClose(); onOpenTests(); }}>See mock tests</button>
            <button ref={primaryRef} className="test-access-prompt-primary" onClick={onClose}>Continue</button>
          </> : <>
            <button className="test-access-prompt-secondary" onClick={onClose} disabled={sending}>Not now</button>
            <button ref={primaryRef} className="test-access-prompt-primary" onClick={send} disabled={sending}>{sending ? 'Sending…' : error ? 'Try again' : 'Request access'}</button>
          </>}
        </div>
      </div>
    </div>
  );
}
