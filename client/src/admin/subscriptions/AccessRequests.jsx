import { formatDate, initials } from './accessDates';

export default function AccessRequests({ requests, requestDays, setRequestDays, busy, onApprove, onDeny }) {
  if (!requests.length) return <div className="access-empty"><span aria-hidden="true">✓</span><h3>You’re all caught up</h3><p>New course access requests will appear here for you to review.</p></div>;
  return <div className="access-request-list">{requests.map(request => {
    const valid = Number.isInteger(Number(requestDays[request._id] ?? 30)) && Number(requestDays[request._id] ?? 30) >= 1 && Number(requestDays[request._id] ?? 30) <= 3650;
    return <article className="access-request" key={request._id} aria-label={`Request from ${request.user?.name || 'deleted student'}`}>
      <div className="access-person"><span className="access-avatar" aria-hidden="true">{initials(request.user?.name)}</span><div><h3>{request.user?.name || 'Deleted student'}</h3><small>{request.user?.email || 'Account no longer available'}</small></div><span className="access-status is-pending">Needs review</span></div>
      <div className="access-request-course"><span className="access-help">Requested course</span><strong>{request.course?.title || 'Deleted course'}</strong><small>Requested {formatDate(request.createdAt)}</small></div>
      <div className="access-request-controls"><label htmlFor={`request-days-${request._id}`}>Days of access<input id={`request-days-${request._id}`} type="number" min="1" max="3650" step="1" value={requestDays[request._id] ?? 30} disabled={!!busy} onChange={event => setRequestDays(previous => ({ ...previous, [request._id]: event.target.value }))}/></label><div><button className="access-button is-primary" disabled={!!busy || !valid || !request.user || !request.course} onClick={() => onApprove(request)}>{busy === `approve-${request._id}` ? 'Approving…' : 'Approve & grant access'}</button><button className="access-link is-danger" disabled={!!busy} onClick={() => onDeny(request)}>Decline</button></div></div>
    </article>;
  })}</div>;
}
