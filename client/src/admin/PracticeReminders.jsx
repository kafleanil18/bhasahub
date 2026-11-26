import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import usePracticeReminders, { reminderRequest } from './usePracticeReminders';
import ReminderReview from './ReminderReview';
import ReminderStudentPicker from './ReminderStudentPicker';
import useReminderStudents from './useReminderStudents';
import { matchesActivity } from './reminderStudentFilters';
import { reminderTemplates } from './reminderTemplates';
import Icon from '../components/Icon';
import './EmailSettings.css';
import './PracticeReminders.css';
import { useInitialLoad } from '../navigation/pageLoad';

import RefreshButton from '../components/RefreshButton';
// Quick recipient groups shown in the send card. `custom` means students picked in the table below.
const groups = [
  { key: 'all', label: 'All eligible students' },
  { key: '7', label: 'Inactive 7+ days' },
  { key: 'unrecorded', label: 'Never practised' },
  { key: 'ending', label: 'Access ends in 14 days' },
];

export default function PracticeReminders({ onBack }) {
  const { audience, campaigns, loading, error: loadError, audienceError, refresh } = usePracticeReminders();
  const studentData = useReminderStudents();
  useInitialLoad(loading || studentData.loading, 'Loading students…');
  const [templateId, setTemplateId] = useState(reminderTemplates[0].id);
  const [group, setGroup] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState(reminderTemplates[0].subject);
  const [message, setMessage] = useState(reminderTemplates[0].message);
  const [preview, setPreview] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  const reviewButton = useRef(null);
  const subjectInput = useRef(null);
  const studentsSection = useRef(null);
  const selectedSet = new Set(selectedIds);
  const selectedCount = studentData.students.filter(student => selectedSet.has(student.user)).length;
  const unavailableSelections = selectedIds.length !== selectedCount;
  const groupCount = key => studentData.students.filter(student => matchesActivity(student, key, selectedSet)).length;
  const template = reminderTemplates.find(item => item.id === templateId);
  const edited = template && (subject !== template.subject || message !== template.message);
  const blockedReason = busy ? 'Please wait for the current request to finish.'
    : audienceError ? audienceError
      : loading || studentData.loading ? 'Loading students…'
        : studentData.error ? 'Refresh the student list before reviewing a reminder.'
          : !audience ? 'Refresh reminder data before reviewing.'
            : !audience.emailConfigured ? 'Turn on an email service in Email settings first.'
              : audience.count === 0 ? 'No students have active Chinese course access right now.'
                : unavailableSelections ? 'Some selected students are no longer eligible. Remove them in the student list below.'
                  : !selectedCount ? 'Choose who should receive this reminder.' : '';
  const composeDisabled = Boolean(busy) || !audience || !audience.emailConfigured || audience.count === 0 || Boolean(audienceError) || studentData.loading || Boolean(studentData.error);

  const chooseGroup = key => {
    setGroup(key); setNotice('');
    setSelectedIds(studentData.students.filter(student => matchesActivity(student, key, new Set())).map(student => student.user));
  };
  const chooseTemplate = item => {
    setTemplateId(item.id); setSubject(item.subject); setMessage(item.message); setNotice(''); setError('');
    if (!studentData.loading && !studentData.error) chooseGroup(item.audience);
  };
  const pickStudents = ids => { setSelectedIds(ids); setGroup('custom'); };

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
      setPreview(null); setNotice(`Reminder queued for ${result.total} ${result.total === 1 ? 'student' : 'students'}. You can follow it under Recent reminders.`); refresh(); studentData.refresh();
    } catch (err) { setError(err.message || 'Could not queue the reminder. Retry to check the same send request.'); }
    finally { setBusy(''); inFlight.current = false; }
  };

  return <section className="container email-settings practice-reminders" aria-labelledby="practice-reminders-title">
    <button className="email-back" disabled={Boolean(busy)} onClick={onBack}>← Back to control center</button>
    <div className="email-heading"><div><h1 id="practice-reminders-title">Practice reminders</h1><p>Pick a template, choose who gets it, and send.</p></div><Link to="/admin/settings/email">Email settings →</Link></div>
    {loadError && <div className="email-message email-error" role="alert">{loadError} <RefreshButton onClick={refresh}>Refresh</RefreshButton></div>}
    {audience && !audience.emailConfigured && <div className="email-message email-error" role="alert">Email isn’t set up yet, so reminders can’t be sent. <Link to="/admin/settings/email">Open Email settings</Link></div>}
    {error && !preview && <div className="email-message email-error" role="alert">{error}</div>}
    {notice && <div className="email-message" role="status">{notice}</div>}

    <form className="reminder-send" onSubmit={review} aria-labelledby="reminder-send-title">
      <h2 id="reminder-send-title" className="reminder-sr-only">Send a reminder</h2>
      <fieldset className="reminder-step" disabled={Boolean(busy)}>
        <legend><span>1</span> Choose a template</legend>
        <div className="reminder-templates" role="radiogroup" aria-label="Reminder template">{reminderTemplates.map(item => <button key={item.id} type="button" role="radio" aria-checked={templateId === item.id} className="reminder-template" onClick={() => chooseTemplate(item)}>
          <span className="reminder-template-icon"><Icon name={item.icon} size={22}/></span>
          <span><strong>{item.title}</strong><small>{item.hint}</small></span>
        </button>)}</div>
      </fieldset>

      <fieldset className="reminder-step" disabled={composeDisabled}>
        <legend><span>2</span> Choose who gets it</legend>
        <div className="reminder-groups" role="radiogroup" aria-label="Recipients">{groups.map(item => <button key={item.key} type="button" role="radio" aria-checked={group === item.key} className="reminder-group" onClick={() => chooseGroup(item.key)}>
          {item.label}<span>{studentData.loading ? '…' : groupCount(item.key)}</span>
        </button>)}
          <button type="button" className="reminder-group is-link" aria-pressed={group === 'custom'} onClick={() => { setGroup('custom'); studentsSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Pick students below ↓</button>
        </div>
        <p className="reminder-selected" role="status"><strong>{selectedCount}</strong> {selectedCount === 1 ? 'student' : 'students'} will receive this reminder{audience ? ` · ${audience.count} eligible in total` : ''}.</p>
      </fieldset>

      <fieldset className="reminder-step" disabled={composeDisabled}>
        <legend><span>3</span> Check the message</legend>
        <div className="email-field"><label htmlFor="reminder-subject">Subject</label><input ref={subjectInput} id="reminder-subject" required maxLength={160} value={subject} onChange={event => { setSubject(event.target.value); setNotice(''); }} /></div>
        <div className="email-field"><label htmlFor="reminder-message">Message</label><textarea id="reminder-message" required maxLength={5000} rows={6} value={message} onChange={event => { setMessage(event.target.value); setNotice(''); }} /><small>“Hi [name],” a link to their courses and an unsubscribe link are added automatically.{edited && <> <button type="button" className="reminder-reset" onClick={() => { setSubject(template.subject); setMessage(template.message); }}>Reset to template</button></>}</small></div>
      </fieldset>

      <div className="reminder-send-actions">
        <button ref={reviewButton} className="email-button email-primary" type="submit" disabled={Boolean(blockedReason)} aria-describedby="reminder-review-help">{busy === 'review' ? 'Preparing preview…' : `Review & send${selectedCount ? ` to ${selectedCount}` : ''}`}</button>
        <p id="reminder-review-help" role="status">{blockedReason || 'You’ll see the email before anything is sent.'}</p>
      </div>
    </form>

    <section className="reminder-history" aria-labelledby="reminder-history-title"><div className="reminder-history-heading"><h2 id="reminder-history-title">Recent reminders</h2><RefreshButton onClick={refresh}>Refresh progress</RefreshButton></div>
      {loading && <p role="status">Loading…</p>}
      {!loading && !campaigns.length && <p className="reminder-muted">No reminders sent yet.</p>}
      <ul>{(showAllHistory ? campaigns : campaigns.slice(0, 5)).map(campaign => <li className="reminder-campaign" key={campaign.id}><div><h3>{campaign.subject}</h3><span>{new Date(campaign.createdAt).toLocaleString()}</span></div><strong>{campaign.complete ? 'Finished' : 'Sending…'}</strong><p role="status">{campaign.counts.sent} sent · {campaign.counts.failed} failed · {campaign.counts.skipped} skipped · {campaign.counts.pending + campaign.counts.sending} remaining{campaign.counts.uncertain ? ` · ${campaign.counts.uncertain} unconfirmed` : ''}</p>{campaign.counts.failed > 0 && <p className="email-footnote">Some emails could not be sent. Check Email settings and your provider before sending another reminder.</p>}{campaign.counts.uncertain > 0 && <p className="email-footnote">Some sends were interrupted and could not be confirmed. They will not be sent again automatically.</p>}</li>)}</ul>
      {campaigns.length > 5 && <button className="email-button reminder-show-all" onClick={() => setShowAllHistory(value => !value)}>{showAllHistory ? 'Show latest 5' : `Show all ${campaigns.length}`}</button>}
      {campaigns.length > 0 && <p className="email-footnote">“Sent” means accepted by your email service; inbox delivery can vary. Sending continues if you leave this page.</p>}
    </section>

    <div ref={studentsSection} className="reminder-students-wrap">
      <ReminderStudentPicker {...studentData} selectedIds={selectedIds} onSelect={pickStudents} onRefresh={studentData.refresh} locked={Boolean(busy)} onRemind={student => {
        pickStudents([student.user]); setNotice(`Reminder prepared for ${student.name}. Check the message above, then review.`); setError('');
        requestAnimationFrame(() => { subjectInput.current?.focus({ preventScroll: true }); subjectInput.current?.scrollIntoView({ behavior: 'auto', block: 'center' }); });
      }} />
      <p className="email-footnote">Eligible students have active access to a published Chinese course and haven’t turned reminders off. Each student gets one email, even with several courses.</p>
    </div>
    {preview && <ReminderReview preview={preview} returnFocusRef={reviewButton} busy={busy === 'send'} error={error} onSend={send} onClose={() => { setPreview(null); setError(''); }} />}
  </section>;
}
