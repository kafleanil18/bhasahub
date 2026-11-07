import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import usePracticeReminders, { reminderRequest } from './usePracticeReminders';
import ReminderReview from './ReminderReview';
import ReminderStudentPicker from './ReminderStudentPicker';
import useReminderStudents from './useReminderStudents';
import './EmailSettings.css';
import './PracticeReminders.css';

const defaultMessage = 'A little Chinese practice every day makes a big difference. Take 10 minutes today to review your vocabulary, listen to a conversation, or practice speaking aloud.\n\nKeep going — one small step at a time. We look forward to seeing your progress!';

export default function PracticeReminders({ onBack }) {
  const { audience, campaigns, loading, error: loadError, refresh } = usePracticeReminders();
  const studentData = useReminderStudents();
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState('Don’t forget your Chinese practice today');
  const [message, setMessage] = useState(defaultMessage);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  const reviewButton = useRef(null);
  const subjectInput = useRef(null);
  const selectedSet = new Set(selectedIds);
  const selectedCount = studentData.students.filter(student => selectedSet.has(student.user)).length;
  const unavailableSelections = selectedIds.length !== selectedCount;

  const review = async event => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy('review'); setError(''); setNotice('');
    try {
      const data = await reminderRequest('/preview', { method: 'POST', body: JSON.stringify({ subject, message, studentIds: selectedIds }) });
      setPreview({ ...data, requestId: crypto.randomUUID() });
    } catch (err) { setError(err.message || 'Could not prepare the reminder.'); }
    finally { setBusy(''); inFlight.current = false; }
  };

  const send = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy('send'); setError('');
    try {
      const result = await reminderRequest('/campaigns', { method: 'POST', body: JSON.stringify({ subject: preview.subject, message: preview.message, studentIds: preview.studentIds, previewToken: preview.previewToken, requestId: preview.requestId }) });
      setPreview(null); setNotice(`Reminder queued for ${result.total} ${result.total === 1 ? 'student' : 'students'}. Follow the progress below.`); refresh();
    } catch (err) { setError(err.message || 'Could not queue the reminder. Retry to check the same send request.'); }
    finally { setBusy(''); inFlight.current = false; }
  };

  return <section className="container email-settings practice-reminders" aria-labelledby="practice-reminders-title">
    <button className="email-back" disabled={Boolean(busy)} onClick={onBack}>← Back to control center</button>
    <div className="email-heading"><div><h1 id="practice-reminders-title">Practice reminders</h1><p>Encourage your subscribed students to keep learning Chinese.</p></div><Link to="/admin/settings/email">Email settings →</Link></div>
    {loadError && <div className="email-message email-error" role="alert">{loadError} <button className="email-button" onClick={refresh}>Refresh</button></div>}
    {error && !preview && <div className="email-message email-error" role="alert">{error}</div>}
    {notice && <div className="email-message" role="status">{notice}</div>}
    {loading && <p role="status">Loading subscribed students…</p>}
    {audience && <>
      <div className="reminder-audience"><strong>{audience.count}</strong><div><h2>Eligible students</h2><p>Active subscriptions to published Chinese courses. Students receive one email each, even when subscribed to several courses. Students who stopped reminders are excluded.</p></div></div>
      {!audience.emailConfigured && <div className="email-message" role="status">Connect your email service before sending. <Link to="/admin/settings/email">Open Email settings</Link></div>}
      {audience.count === 0 && <p className="email-message">There are no eligible subscribed students to remind right now.</p>}
    </>}
    <ReminderStudentPicker {...studentData} selectedIds={selectedIds} onSelect={setSelectedIds} onRefresh={studentData.refresh} locked={Boolean(busy)} onRemind={student => {
      setSelectedIds([student.user]); setNotice(`Reminder prepared for ${student.name}. Review your message below.`); setError('');
      requestAnimationFrame(() => { subjectInput.current?.focus({ preventScroll: true }); subjectInput.current?.scrollIntoView({ behavior: 'auto', block: 'center' }); });
    }} />
    <form className="email-form reminder-compose" onSubmit={review}>
      <fieldset disabled={Boolean(busy) || !audience || !audience.emailConfigured || audience.count === 0 || Boolean(loadError) || studentData.loading || Boolean(studentData.error)}>
        <legend>Write a reminder</legend>
        <p className="reminder-compose-selection" role="status">{selectedCount} {selectedCount === 1 ? 'student' : 'students'} selected to receive this reminder.</p>
        <div className="email-field"><label htmlFor="reminder-subject">Subject</label><input ref={subjectInput} id="reminder-subject" required maxLength={160} value={subject} onChange={event => { setSubject(event.target.value); setNotice(''); }} /></div>
        <div className="email-field"><label htmlFor="reminder-message">Message</label><textarea id="reminder-message" required maxLength={5000} rows={8} value={message} onChange={event => { setMessage(event.target.value); setNotice(''); }} /><small>A personal greeting, a link to the student’s courses, and an unsubscribe link are added automatically.</small></div>
        <button ref={reviewButton} className="email-button email-primary" type="submit" disabled={!selectedCount || unavailableSelections}>{busy === 'review' ? 'Preparing preview…' : 'Review reminder'}</button>
      </fieldset>
    </form>
    <section className="reminder-history" aria-labelledby="reminder-history-title"><div className="reminder-history-heading"><h2 id="reminder-history-title">Recent reminders</h2><button className="email-button" onClick={refresh}>Refresh progress</button></div>
      {!loading && !campaigns.length && <p>No reminders have been sent yet. Review your first message above.</p>}
      <ul>{campaigns.map(campaign => <li className="reminder-campaign" key={campaign.id}><div><h3>{campaign.subject}</h3><span>{new Date(campaign.createdAt).toLocaleString()}</span></div><strong>{campaign.complete ? 'Finished' : 'Sending…'}</strong><p role="status">{campaign.counts.sent} sent · {campaign.counts.failed} failed · {campaign.counts.skipped} skipped · {campaign.counts.pending + campaign.counts.sending} remaining{campaign.counts.uncertain ? ` · ${campaign.counts.uncertain} unconfirmed` : ''}</p>{campaign.counts.failed > 0 && <p className="email-footnote">Some emails could not be sent. Check Email settings and your provider before sending another reminder.</p>}{campaign.counts.uncertain > 0 && <p className="email-footnote">Some sends were interrupted and could not be confirmed. They will not be sent again automatically.</p>}</li>)}</ul>
      <p className="email-footnote">“Sent” means accepted by your email service. Inbox delivery can vary. Progress continues if you leave this page.</p>
    </section>
    {preview && <ReminderReview preview={preview} returnFocusRef={reviewButton} busy={busy === 'send'} error={error} onSend={send} onClose={() => { setPreview(null); setError(''); }} />}
  </section>;
}
