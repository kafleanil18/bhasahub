import { useCallback, useEffect, useMemo, useState } from 'react';
import AccessDialog from './subscriptions/AccessDialog';
import { formatDate, initials } from './subscriptions/accessDates';
import StudentFormDialog from './students/StudentFormDialog';
import StudentAccessDialog from './students/StudentAccessDialog';
import { accessKind, activeCourses, daysUntil, studentRequest } from './students/studentApi';
import './SubscriptionManager.css';
import './StudentManager.css';
import { useInitialLoad } from '../navigation/pageLoad';

import RefreshButton from '../components/RefreshButton';
const filters = [
  { key: 'all', label: 'All students', hint: 'Every student account' },
  { key: 'trial', label: 'On free trial', hint: 'Free access running now' },
  { key: 'paid', label: 'Paid access', hint: 'A plan or course access' },
  { key: 'none', label: 'No access', hint: 'Nothing running right now' },
];

function AccessChips({ student }) {
  const courses = activeCourses(student);
  const trial = student.trial || {};
  const chips = [];
  if (student.plan) chips.push(<span key="plan" className="student-chip is-paid">{student.plan.label} plan, {daysUntil(student.plan.expiresAt)}d left</span>);
  if (courses.length) chips.push(<span key="courses" className="student-chip is-paid">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>);
  if (trial.status === 'active') chips.push(<span key="trial" className="student-chip is-trial">Free trial, {trial.expiresAt ? `${daysUntil(trial.expiresAt)}d left` : 'no end date'}</span>);
  if (trial.status === 'pending') chips.push(<span key="pending" className="student-chip is-pending">Free request waiting</span>);
  if (trial.status === 'expired' && !chips.length) chips.push(<span key="expired" className="student-chip is-muted">Free trial ended</span>);
  if (!chips.length) chips.push(<span key="none" className="student-chip is-muted">No access</span>);
  return <div className="student-chips">{chips}</div>;
}

// Super admin: create, edit and delete student accounts, and manage their trial, plan and course access.
export default function StudentManager({ onBack }) {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  useInitialLoad(loading, 'Loading students…');
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null); // { type: 'add' | 'edit' | 'access' | 'delete', id? }
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [list, planList, courseList] = await Promise.all([studentRequest('/students'), studentRequest('/plans'), studentRequest('/courses').catch(() => [])]);
      setStudents(Array.isArray(list) ? list : []);
      setPlans(Array.isArray(planList) ? planList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (err) { setLoadError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const result = { all: students.length, trial: 0, paid: 0, none: 0 };
    students.forEach(student => { result[accessKind(student)]++; });
    return result;
  }, [students]);
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return students.filter(student => (filter === 'all' || accessKind(student) === filter) && `${student.name} ${student.email}`.toLowerCase().includes(text));
  }, [students, query, filter]);
  const current = dialog?.id ? students.find(student => student._id === dialog.id) : null;
  const replace = updated => setStudents(list => list.map(student => student._id === updated._id ? updated : student));
  const open = (type, id) => { setActionError(''); setNotice(''); setDialog({ type, id }); };
  const close = () => { if (!busy) { setDialog(null); setActionError(''); } };

  const run = async (key, task, message) => {
    setBusy(key); setActionError('');
    try { await task(); if (message) setNotice(message); return true; }
    catch (err) { setActionError(err.message); return false; }
    finally { setBusy(''); }
  };
  const saveStudent = body => run('form', async () => {
    if (dialog.type === 'add') {
      const created = await studentRequest('/students', { method: 'POST', body: JSON.stringify(body) });
      setStudents(list => [created, ...list]);
    } else replace(await studentRequest(`/students/${current._id}`, { method: 'PUT', body: JSON.stringify(body) }));
    setDialog(null);
  }, dialog.type === 'add' ? `Created ${body.name}'s account. They can sign in with ${body.email}.` : `Saved ${body.name}'s details.`);
  const removeStudent = () => run('delete', async () => {
    await studentRequest(`/students/${current._id}`, { method: 'DELETE' });
    setStudents(list => list.filter(student => student._id !== current._id));
    setDialog(null);
  }, `Deleted ${current.name}'s account and all of their data.`);
  // Trial and plan endpoints return the updated student; course grants and revokes need a fresh list.
  const accessAction = (key, { path, method, body }, message) => run(key, async () => {
    const result = await studentRequest(path || `/students/${current._id}/${key}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (path) {
      const list = await studentRequest('/students');
      setStudents(Array.isArray(list) ? list : []);
    } else replace(result);
  }, `${current.name}: ${message}`);

  return <section className="container access-manager student-manager" aria-labelledby="students-title">
    <button className="back-btn" onClick={onBack}>Back to dashboard</button>
    <div className="access-page-heading"><div><p className="access-eyebrow">People & access</p><h1 id="students-title">Manage students</h1><p>Add, edit or remove student accounts, and grant or revoke their free trial, plan and course access.</p></div><button className="access-button is-primary" onClick={() => open('add')}><span aria-hidden="true">＋</span> Add student</button></div>
    {notice && <div className="access-feedback is-success" role="status"><span>{notice}</span><button className="access-link" onClick={() => setNotice('')}>Dismiss</button></div>}
    {loadError && <div className="access-feedback is-error" role="alert"><span>{loadError}</span><RefreshButton onClick={() => { setLoading(true); void load(); }}>Retry</RefreshButton></div>}
    {loading ? <div className="access-loading" role="status">Loading students…</div> : <>
      <div className="access-overview student-overview" aria-label="Student overview">{filters.map(item => <button type="button" key={item.key} onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}><span>{item.label}</span><strong>{counts[item.key]}</strong><small>{item.hint}</small></button>)}</div>
      <section className="access-list-panel" aria-labelledby="student-list-title">
        <div className="access-list-heading"><div><h2 id="student-list-title">{filters.find(item => item.key === filter).label}</h2><p>Open “Manage access” to grant, extend or revoke anything for a student.</p></div><RefreshButton onClick={() => void load()}>Refresh list</RefreshButton></div>
        <div className="access-filter-bar"><label className="access-search"><span>Search students</span><input type="search" placeholder="Name or email…" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
        <p className="access-result-count" role="status">{visible.length} of {students.length} students</p>
        {!visible.length ? <div className="access-empty"><h3>No students here</h3><p>{students.length ? 'Try another search or filter.' : 'Add your first student to get started.'}</p></div> : <ul className="student-list">{visible.map(student => <li key={student._id} className="student-row">
          <div className="access-person"><span className="access-avatar" aria-hidden="true">{initials(student.name)}</span><div><h3>{student.name}</h3><small>{student.email}</small><small>Joined {formatDate(student.createdAt)}{student.authProvider === 'google' ? ', Google sign-in' : ''}</small></div></div>
          <AccessChips student={student}/>
          <div className="student-actions"><button className="access-button is-primary" onClick={() => open('access', student._id)}>Manage access</button><button className="access-button" onClick={() => open('edit', student._id)}>Edit</button><button className="access-link is-danger" onClick={() => open('delete', student._id)}>Delete</button></div>
        </li>)}</ul>}
      </section>
    </>}
    {(dialog?.type === 'add' || (dialog?.type === 'edit' && current)) && <StudentFormDialog student={dialog.type === 'edit' ? current : null} busy={busy === 'form'} error={actionError} onSave={saveStudent} onClose={close}/>}
    {dialog?.type === 'access' && current && <StudentAccessDialog student={current} plans={plans} courses={courses} busy={busy} error={actionError} onAction={accessAction} onClose={close}/>}
    {dialog?.type === 'delete' && current && <AccessDialog title={`Delete ${current.name}?`} description="This permanently removes the account and everything that belongs to it. It can’t be undone." busy={busy === 'delete'} onClose={close}>
      <ul className="student-delete-list"><li>Sign-in for {current.email}</li><li>Free trial, plan and course access</li><li>Course progress, test results and practice history</li></ul>
      {actionError && <p className="access-feedback is-error" role="alert">{actionError}</p>}
      <div className="access-dialog-actions"><button className="access-button" disabled={busy === 'delete'} onClick={close}>Cancel</button><button className="access-button is-destructive" disabled={busy === 'delete'} onClick={removeStudent}>{busy === 'delete' ? 'Deleting…' : 'Delete student'}</button></div>
    </AccessDialog>}
  </section>;
}
