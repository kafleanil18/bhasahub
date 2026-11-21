import { formatDate, initials } from './accessDates';
import { formatRs, planLabel } from '../../pricing/plans';

export default function PlanRequests({ requests, members, busy, onApprove, onDecline }) {
  const now = Date.now();
  const activeMembers = members.filter(pass => new Date(pass.expiresAt).getTime() > now);
  return <div className="access-plan-panel">
    {!requests.length ? <div className="access-empty"><span aria-hidden="true">✓</span><h3>No plans waiting for payment</h3><p>When a student chooses a plan on the pricing page, it appears here. Approve it once you’ve received their payment.</p></div> :
      <div className="access-request-list">{requests.map(request => <article className="access-request" key={request._id} aria-label={`Plan request from ${request.user?.name || 'deleted student'}`}>
        <div className="access-person"><span className="access-avatar" aria-hidden="true">{initials(request.user?.name)}</span><div><h3>{request.user?.name || 'Deleted student'}</h3><small>{request.user?.email || 'Account no longer available'}</small></div><span className="access-status is-pending">Awaiting payment</span></div>
        <div className="access-request-course"><span className="access-help">Chosen plan</span><strong>{planLabel(request.plan)} · {formatRs(request.price)}</strong><small>{request.days} days of every course · Requested {formatDate(request.createdAt)}</small></div>
        <div className="access-request-controls"><div><button className="access-button is-primary" disabled={!!busy || !request.user} onClick={() => onApprove(request)}>{busy === `plan-approve-${request._id}` ? 'Starting plan…' : 'Payment received · Start plan'}</button><button className="access-link is-danger" disabled={!!busy} onClick={() => onDecline(request)}>Decline</button></div></div>
      </article>)}</div>}
    <div className="access-list-heading access-plan-members-heading"><div><h2>Active plans</h2><p>{activeMembers.length ? `${activeMembers.length} ${activeMembers.length === 1 ? 'student has' : 'students have'} every course unlocked.` : 'No student has an active plan yet.'}</p></div></div>
    {activeMembers.length > 0 && <ul className="access-plan-members">{activeMembers.map(pass => <li key={pass._id}><span className="access-avatar" aria-hidden="true">{initials(pass.user?.name)}</span><span><strong>{pass.user?.name || 'Deleted student'}</strong><small>{pass.user?.email || ''}</small></span><span className="access-plan-expiry"><small>{planLabel(pass.plan)} plan</small>Until {formatDate(pass.expiresAt)}</span></li>)}</ul>}
  </div>;
}
