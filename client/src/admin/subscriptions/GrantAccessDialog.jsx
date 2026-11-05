import { useMemo, useState } from 'react';
import AccessDialog from './AccessDialog';
import { active, formatDate, initials } from './accessDates';

export default function GrantAccessDialog({ initial, students, courses, subs, busy, error, onSave, onClose }) {
  const [student, setStudent] = useState(initial?.user || null);
  const [courseId, setCourseId] = useState(initial?.course?._id || '');
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(30);
  const matching = useMemo(() => students.filter(person => `${person.name} ${person.email}`.toLowerCase().includes(query.trim().toLowerCase())), [students, query]);
  const course = courses.find(row => row._id === courseId);
  const existing = subs.find(sub => sub.user?._id === student?._id && sub.course?._id === courseId);
  const extending = existing && active(existing);
  const validDays = Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 3650;
  const endDate = new Date((extending ? new Date(existing.expiresAt).getTime() : Date.now()) + Number(days) * 86400000);
  const verb = extending ? 'Extend access' : existing ? 'Renew access' : 'Grant access';
  const canSave = !!student && !!course && validDays && !busy;
  return <AccessDialog title={initial ? verb : 'Grant course access'} description="Choose a student, a course, and how long they can learn." busy={busy} onClose={onClose}>
    <form className="access-grant-form" onSubmit={event => { event.preventDefault(); if (canSave) onSave({ userId: student._id, courseId, days: Number(days), studentName: student.name, courseTitle: course.title }); }}>
      <fieldset disabled={busy}><legend><span>1</span> Choose a student</legend>
        {student ? <div className="access-selected"><span className="access-avatar" aria-hidden="true">{initials(student.name)}</span><div><strong>{student.name}</strong><small>{student.email}</small></div><button type="button" className="access-link" onClick={() => { setStudent(null); setQuery(''); }}>Change</button></div> : <>
          <label className="access-visually-hidden" htmlFor="grant-student-search">Search students by name or email</label>
          <input id="grant-student-search" autoFocus type="search" placeholder="Search name or email…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off"/>
          <ul className="access-student-options" aria-label="Choose a student">{matching.slice(0, 6).map(person => <li key={person._id}><button type="button" onClick={() => setStudent(person)}><span className="access-avatar" aria-hidden="true">{initials(person.name)}</span><span><strong>{person.name}</strong><small>{person.email}</small></span><span aria-hidden="true">→</span></button></li>)}</ul>
          {!matching.length && <p className="access-help" role="status">{students.length ? 'No matching students. Try another name or email.' : 'No student accounts available yet.'}</p>}
          {matching.length > 6 && <p className="access-help">Showing 6 of {matching.length} students. Search to narrow the list.</p>}
        </>}
      </fieldset>
      <fieldset disabled={busy}><legend><span>2</span> Choose a course</legend><label className="access-visually-hidden" htmlFor="grant-course">Course</label><select id="grant-course" value={courseId} onChange={event => setCourseId(event.target.value)} required><option value="">Select a course…</option>{courses.map(row => <option key={row._id} value={row._id}>{row.title}{row.level ? ` · ${row.level}` : ''}</option>)}</select></fieldset>
      <fieldset disabled={busy}><legend><span>3</span> Set the duration</legend><div className="access-duration-presets" aria-label="Common access durations">{[7, 30, 90, 365].map(value => <button type="button" key={value} aria-pressed={Number(days) === value} onClick={() => setDays(value)}>{value} days</button>)}</div><label className="access-custom-days" htmlFor="grant-days">Days of access<input id="grant-days" type="number" min="1" max="3650" step="1" required value={days} onChange={event => setDays(event.target.value)}/></label></fieldset>
      <div className="access-grant-summary" aria-live="polite"><strong>{student && course && validDays ? `${student.name} · ${course.title}` : 'Your access summary'}</strong><p>{validDays ? <>{extending ? `Adds ${days} days to the current expiry of ${formatDate(existing.expiresAt)}.` : `${days} days, starting today.`} <b>Access ends {formatDate(endDate)}.</b></> : 'Enter a whole number of days between 1 and 3,650.'}</p></div>
      {error && <p className="access-feedback is-error" role="alert">{error}</p>}
      <div className="access-dialog-actions"><button type="button" className="access-button" disabled={busy} onClick={onClose}>Cancel</button><button className="access-button is-primary" type="submit" disabled={!canSave}>{busy ? 'Saving access…' : verb}</button></div>
    </form>
  </AccessDialog>;
}
