import { useMemo, useRef, useState } from 'react';
import useSubscriptionData, { accessRequest } from './subscriptions/useSubscriptionData';
import GrantAccessDialog from './subscriptions/GrantAccessDialog';
import AccessDialog from './subscriptions/AccessDialog';
import AccessRequests from './subscriptions/AccessRequests';
import StudentAccessList from './subscriptions/StudentAccessList';
import { active, daysLeft } from './subscriptions/accessDates';
import './SubscriptionManager.css';

export default function SubscriptionManager({ onBack }) {
  const { students, courses, subs, requests, errors, loading, refreshing, updatedAt, reload } = useSubscriptionData();
  const [view, setView] = useState('access');
  const [status, setStatus] = useState('active');
  const [query, setQuery] = useState('');
  const [requestDays, setRequestDays] = useState({});
  const [grantForm, setGrantForm] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const saving = useRef(false);
  const contentRef = useRef(null);
  const pending = requests.filter(request => request.status === 'pending');
  const counts = { active: subs.filter(active).length, expiring: subs.filter(sub => active(sub) && daysLeft(sub) <= 7).length, expired: subs.filter(sub => !active(sub)).length };
  const matchesQuery = row => `${row.user?.name || ''} ${row.user?.email || ''} ${row.course?.title || ''}`.toLowerCase().includes(query.trim().toLowerCase());
  const filteredSubs = subs.filter(sub => matchesQuery(sub) && (status === 'all' || (status === 'active' && active(sub)) || (status === 'expired' && !active(sub)) || (status === 'expiring' && active(sub) && daysLeft(sub) <= 7)));
  const filteredRequests = pending.filter(matchesQuery);
  const grantUnavailable = loading || !!errors.students || !!errors.courses || !!errors.subs;
  const failedResources = useMemo(() => Object.keys(errors), [errors]);
  const openGrant = (sub = {}) => { setActionError(''); setGrantForm(sub); };
  const openConfirmation = action => { setActionError(''); setConfirmation(action); };
  const chooseView = next => { setView(next); setQuery(''); if (next === 'access') { setStatus('active'); void reload(['subs']); } };
  const filterByStatus = next => { setView('access'); setStatus(next); setQuery(''); void reload(['subs']); contentRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); };

  const mutate = async (key, path, options, success, refresh) => {
    if (saving.current) return false;
    saving.current = true; setBusy(key); setActionError(''); setNotice('');
    try {
      await accessRequest(path, options);
      setNotice(success);
      await reload(refresh);
      return true;
    } catch (error) { setActionError(error.message); return false; }
    finally { saving.current = false; setBusy(''); }
  };
  const grant = async ({ userId, courseId, days, studentName, courseTitle }) => {
    const success = await mutate('grant', '/subscriptions', { method: 'POST', body: JSON.stringify({ userId, courseId, days }) }, `${days} days of access saved for ${studentName} · ${courseTitle}.`, ['subs']);
    if (success) setGrantForm(null);
  };
  const approve = async request => {
    const days = Number(requestDays[request._id] ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 3650) return;
    await mutate(`approve-${request._id}`, `/access-requests/${request._id}/approve`, { method: 'PUT', body: JSON.stringify({ days }) }, `Request approved. ${days} days added for ${request.user.name} · ${request.course.title}.`, ['requests', 'subs']);
  };
  const confirmAction = async () => {
    const { type, record } = confirmation;
    const declining = type === 'decline';
    const success = await mutate(`${type}-${record._id}`, declining ? `/access-requests/${record._id}/deny` : `/subscriptions/${record._id}`, { method: declining ? 'PUT' : 'DELETE' }, declining ? `Request from ${record.user?.name || 'deleted student'} declined.` : `Access removed for ${record.user?.name || 'deleted student'} · ${record.course?.title || 'deleted course'}.`, declining ? ['requests'] : ['subs']);
    if (success) setConfirmation(null);
  };
  const showingRequests = view === 'requests';
  const hasListError = !!errors[showingRequests ? 'requests' : 'subs'];
  const listCount = showingRequests ? filteredRequests.length : filteredSubs.length;

  return <section className="container access-manager" aria-labelledby="access-page-title">
    <button className="back-btn" onClick={onBack}>← Back to dashboard</button>
    <div className="access-page-heading"><div><p className="access-eyebrow">Student management</p><h1 id="access-page-title">Subscriptions & access</h1><p>Give students course access, review requests, and manage expiry dates.</p></div><button className="access-button is-primary" disabled={grantUnavailable || !!busy} onClick={() => openGrant()}><span aria-hidden="true">＋</span> Grant access</button></div>
    {notice && <div className="access-feedback is-success" role="status"><span>{notice}</span><button className="access-link" aria-label="Dismiss success message" onClick={() => setNotice('')}>Dismiss</button></div>}
    {failedResources.length > 0 && <div className="access-feedback is-error" role="alert"><div>{failedResources.map(key => <p key={key}>{errors[key]}</p>)}</div><button className="access-button" onClick={() => reload(failedResources)}>Retry loading</button></div>}
    {actionError && !grantForm && !confirmation && <p className="access-feedback is-error" role="alert">{actionError}</p>}
    {loading ? <div className="access-loading" role="status">Loading student access and requests…</div> : <>
      {!errors.requests && pending.length > 0 && <div className="access-review-banner"><span className="access-banner-icon" aria-hidden="true">{pending.length}</span><div><strong>{pending.length === 1 ? 'A course access request needs your review' : `${pending.length} course access requests need your review`}</strong><p>Review the requested course and choose how many days to grant.</p></div><button className="access-button" onClick={() => { chooseView('requests'); contentRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); }}>Review requests <span aria-hidden="true">→</span></button></div>}
      <div className="access-overview" aria-label="Access overview">{[{ key: 'active', label: 'Active access', hint: 'Currently able to learn' }, { key: 'expiring', label: 'Expiring soon', hint: 'Within the next 7 days' }, { key: 'expired', label: 'Expired access', hint: 'Ready to renew' }].map(item => <button type="button" key={item.key} disabled={!!errors.subs} onClick={() => filterByStatus(item.key)} aria-pressed={!showingRequests && status === item.key}><span>{item.label}</span><strong>{errors.subs ? '—' : counts[item.key]}</strong><small>{item.hint}<span aria-hidden="true">↗</span></small></button>)}</div>
      <section className="access-workspace" ref={contentRef} aria-labelledby="access-list-title">
        <div className="access-view-switch" aria-label="Choose what to manage"><button aria-pressed={!showingRequests} onClick={() => chooseView('access')}>Student access <span>{errors.subs ? '—' : subs.length}</span></button><button aria-pressed={showingRequests} onClick={() => chooseView('requests')}>Pending requests <span>{errors.requests ? '—' : pending.length}</span></button></div>
        <div className="access-list-heading"><div><h2 id="access-list-title">{showingRequests ? 'Review access requests' : 'Manage student access'}</h2><p>{showingRequests ? 'Approve a request to give the student access to that course.' : 'All active course access is shown by default, including access expiring soon.'}</p></div><button className="access-button" disabled={refreshing} onClick={() => reload(['subs', 'requests'])}>{refreshing ? 'Refreshing…' : 'Refresh list'}</button></div>
        <div className="access-filter-bar"><label className="access-search"><span>Search {showingRequests ? 'requests' : 'access'}</span><input type="search" placeholder="Student name, email, or course…" value={query} onChange={event => setQuery(event.target.value)}/></label>{!showingRequests && <label><span>Access status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="expiring">Expiring within 7 days</option><option value="expired">Expired</option></select></label>}</div>
        {!hasListError && <div className="access-list-summary"><p className="access-result-count" role="status">{listCount} {showingRequests ? listCount === 1 ? 'request' : 'requests' : listCount === 1 ? 'course access record' : 'course access records'}{!showingRequests && status !== 'all' ? ` · ${status === 'expiring' ? 'expiring soon' : status}` : ''}{query ? ` matching “${query}”` : ''}{!showingRequests && <span>{counts.active} active in total{updatedAt ? ` · Updated ${updatedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}</span>}</p>{!showingRequests && (status !== 'active' || query.trim()) && <button className="access-link" onClick={() => filterByStatus('active')}>Show all active access</button>}</div>}
        {hasListError ? <div className="access-empty"><h3>This list couldn’t be loaded</h3><p>Your records haven’t changed. Retry loading to see the latest access.</p><button className="access-button" onClick={() => reload([showingRequests ? 'requests' : 'subs'])}>Try again</button></div> : showingRequests ? (query && !filteredRequests.length ? <div className="access-empty"><h3>No matching requests</h3><p>Try another student name, email, or course.</p><button className="access-button" onClick={() => setQuery('')}>Clear search</button></div> : <AccessRequests requests={filteredRequests} requestDays={requestDays} setRequestDays={setRequestDays} busy={busy} onApprove={approve} onDeny={record => openConfirmation({ type: 'decline', record })}/>) : !filteredSubs.length ? <div className="access-empty"><h3>{subs.length ? 'No access matches these filters' : 'Give your first student access'}</h3><p>{subs.length ? 'Try a different name, course, or access status.' : 'Choose a student and course, then set how long they can learn.'}</p><button className="access-button" disabled={!subs.length && grantUnavailable} onClick={() => subs.length ? (setQuery(''), setStatus('all')) : openGrant()}>{subs.length ? 'Clear filters' : 'Grant access'}</button></div> : <StudentAccessList subs={filteredSubs} busy={busy || (grantUnavailable ? 'unavailable' : '')} onGrant={openGrant} onRevoke={record => openConfirmation({ type: 'remove', record })}/>}
      </section>
    </>}
    {grantForm && <GrantAccessDialog initial={grantForm} students={students} courses={courses} subs={subs} busy={!!busy} error={actionError} onSave={grant} onClose={() => { setGrantForm(null); setActionError(''); }}/>}
    {confirmation && <AccessDialog title={confirmation.type === 'decline' ? 'Decline this request?' : 'Remove course access?'} description={confirmation.type === 'decline' ? 'The student can request access again later.' : 'The student will lose access to this course immediately. Their learning progress is kept.'} busy={!!busy} onClose={() => { setConfirmation(null); setActionError(''); }}><div className="access-confirm-details"><strong>{confirmation.record.user?.name || 'Deleted student'}</strong><span>{confirmation.record.course?.title || 'Deleted course'}</span></div>{actionError && <p className="access-feedback is-error" role="alert">{actionError}</p>}<div className="access-dialog-actions"><button className="access-button" disabled={!!busy} onClick={() => { setConfirmation(null); setActionError(''); }}>Keep {confirmation.type === 'decline' ? 'request' : 'access'}</button><button className="access-button is-destructive" disabled={!!busy} onClick={confirmAction}>{busy ? 'Saving…' : confirmation.type === 'decline' ? 'Decline request' : 'Remove access'}</button></div></AccessDialog>}
  </section>;
}
