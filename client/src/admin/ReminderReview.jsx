import { useEffect, useRef } from 'react';

export default function ReminderReview({ preview, returnFocusRef, busy, error, onSend, onClose }) {
  const ref = useRef(null);
  const heading = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = returnFocusRef.current;
    dialog.showModal();
    heading.current?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    return () => { dialog.close(); requestAnimationFrame(() => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); }); };
  }, [returnFocusRef]);
  return <dialog className="reminder-review email-settings" ref={ref} aria-labelledby="reminder-review-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 ref={heading} tabIndex={-1} id="reminder-review-title">Review your practice reminder</h2>
    <p>Send one individual email to each of <strong>{preview.audience.count} subscribed {preview.audience.count === 1 ? 'student' : 'students'}</strong>.</p>
    <div className="reminder-email-preview"><strong>{preview.subject}</strong><p>Hi [student name],</p><p>{preview.message}</p><p>Continue your Chinese practice:<br />{preview.practiceUrl}</p><p>Xiao Ao · Chinese Made Simple</p><small>Each email includes a link to stop practice reminders.</small></div>
    <details className="reminder-recipient-list"><summary>Review recipients{preview.audience.count > preview.audience.students.length ? ` (first ${preview.audience.students.length})` : ''}</summary><ul>{preview.audience.students.map(student => <li key={student.email}><strong>{student.name}</strong><span>{student.email}</span></li>)}</ul></details>
    {error && <div className="email-message email-error" role="alert">{error}</div>}
    <div className="email-actions"><button className="email-button email-primary" disabled={busy} onClick={onSend}>{busy ? 'Queuing reminder…' : `Send to ${preview.audience.count} ${preview.audience.count === 1 ? 'student' : 'students'}`}</button><button className="email-button" disabled={busy} onClick={onClose}>Back to editing</button></div>
  </dialog>;
}
