import { useState } from 'react';
import { filterStudents, inactivityFilters, matchesActivity, practiceLabel, studentDate } from './reminderStudentFilters';
import './ReminderStudentPicker.css';

const pageSize = 25;

export default function ReminderStudentPicker({ students, selectedIds, onSelect, onRemind, loading, error, asOf, onRefresh, locked }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('inactive');
  const [page, setPage] = useState(1);
  const selected = new Set(selectedIds);
  const eligibleIds = new Set(students.map(student => student.user));
  const unavailable = selectedIds.filter(id => !eligibleIds.has(id));
  const matches = filterStudents(students, filter, query, selected, sort);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedVisible = matches.filter(student => selected.has(student.user)).length;
  const disabled = locked || loading || Boolean(error);
  const toggle = id => onSelect(selected.has(id) ? selectedIds.filter(value => value !== id) : [...selectedIds, id]);
  const chooseFilter = value => { setFilter(value); setPage(1); };

  return <section className="reminder-student-picker" aria-labelledby="reminder-students-title" aria-busy={loading}>
    <div className="reminder-students-heading"><div><h2 id="reminder-students-title">Choose students</h2><p>Find students who may need encouragement, then choose who receives your reminder.</p></div><button className="email-button" disabled={locked || loading} onClick={onRefresh}>{loading ? 'Refreshing students…' : 'Refresh students'}</button></div>
    <p className="reminder-activity-note">Last recorded practice includes saved lesson completions, quizzes, submitted mock tests, vocabulary reviews, and speaking recordings.{asOf && <> Updated {studentDate(asOf)} · Nepal time.</>}</p>
    {error && <div className="email-message email-error" role="alert">{error}</div>}
    <fieldset disabled={disabled} className="reminder-picker-controls"><legend className="reminder-sr-only">Filter and select students</legend>
      <div className="reminder-student-search"><label className="email-field"><span>Search students</span><input type="search" placeholder="Name or email address" maxLength={100} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label><label className="email-field"><span>Sort students</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="inactive">Least recent practice</option><option value="name">Student name</option><option value="reminder">Least recent reminder</option></select></label></div>
      <div className="reminder-activity-filters" role="group" aria-label="Filter by recorded practice">{inactivityFilters.map(([value, label]) => <button key={value} className="email-button" aria-pressed={filter === value} onClick={() => chooseFilter(value)}>{label}<span>{students.filter(student => matchesActivity(student, value, selected)).length}</span></button>)}</div>
      <div className="reminder-selection-bar"><p role="status"><strong>{selectedIds.length} selected</strong> · {matches.length} matching {matches.length === 1 ? 'student' : 'students'}{selectedIds.length > selectedVisible && <> · {selectedIds.length - selectedVisible} outside this view</>}</p><div><button className="email-button" disabled={!matches.length} onClick={() => onSelect([...new Set([...selectedIds, ...matches.map(student => student.user)])])}>Select all matching</button><button className="email-button" disabled={!selectedIds.length} onClick={() => onSelect([])}>Clear selection</button>{selectedIds.length > 0 && filter !== 'selected' && <button className="email-button" onClick={() => { chooseFilter('selected'); setQuery(''); }}>Show selected</button>}</div></div>
      {unavailable.length > 0 && <div className="email-message email-error" role="alert">{unavailable.length} selected {unavailable.length === 1 ? 'student is' : 'students are'} no longer eligible. <button className="email-button" onClick={() => onSelect(selectedIds.filter(id => eligibleIds.has(id)))}>Remove unavailable selections</button></div>}
      {loading ? <p role="status">Loading recorded practice activity…</p> : !matches.length ? <div className="reminder-students-empty"><h3>No students match this view</h3><p>Try another activity filter or search. Only subscribed students who can receive reminders appear here.</p></div> : <>
        <div className="reminder-students-table" role="region" aria-label="Subscribed student activity" tabIndex={0}><table><caption className="reminder-sr-only">Eligible subscribed students and their recorded practice activity</caption><thead><tr><th scope="col">Select</th><th scope="col">Student</th><th scope="col">Last recorded practice</th><th scope="col">Last sent reminder</th><th scope="col"><span className="reminder-sr-only">Action</span></th></tr></thead><tbody>{visible.map(student => <tr key={student.user} className={selected.has(student.user) ? 'is-selected' : undefined}>
          <td><label className="reminder-student-checkbox"><input type="checkbox" checked={selected.has(student.user)} onChange={() => toggle(student.user)} aria-label={`Select ${student.name} (${student.email})`} /></label></td>
          <th scope="row"><strong>{student.name}</strong><span>{student.email}</span></th>
          <td><strong>{practiceLabel(student)}</strong>{student.lastPracticeAt && <span>{studentDate(student.lastPracticeAt)}</span>}</td>
          <td>{student.lastReminderAt ? studentDate(student.lastReminderAt) : 'No sent reminder'}</td>
          <td><button className="email-button" onClick={() => onRemind(student)} aria-label={`Prepare reminder for ${student.name}`}>Remind</button></td>
        </tr>)}</tbody></table></div>
        <div className="reminder-students-pagination"><p>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, matches.length)} of {matches.length}</p><div><button className="email-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous students</button><span>Page {currentPage} of {pages}</span><button className="email-button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next students</button></div></div>
      </>}
    </fieldset>
  </section>;
}
