import { active, daysLeft, formatDate, initials } from './accessDates';

export default function StudentAccessList({ subs, busy, onGrant, onRevoke }) {
  return <div className="access-records">{subs.map(sub => {
    const isActive = active(sub);
    const expiring = isActive && daysLeft(sub) <= 7;
    return <article className="access-record" key={sub._id} aria-label={`${sub.user?.name || 'Deleted student'} · ${sub.course?.title || 'Deleted course'}`}>
      <div className="access-person"><span className="access-avatar" aria-hidden="true">{initials(sub.user?.name)}</span><div><h3>{sub.user?.name || 'Deleted student'}</h3><small>{sub.user?.email || 'Account no longer available'}</small></div></div>
      <div className="access-record-course"><strong>{sub.course?.title || 'Deleted course'}</strong><small>{sub.course?.level || 'Course access'}</small></div>
      <div className="access-expiry"><span className={`access-status ${isActive ? expiring ? 'is-expiring' : 'is-active' : 'is-expired'}`}>{isActive ? expiring ? 'Expiring soon' : 'Active' : 'Expired'}</span><strong>{isActive ? `${daysLeft(sub)} ${daysLeft(sub) === 1 ? 'day' : 'days'} left` : 'Access has ended'}</strong><small>{isActive ? 'Ends' : 'Ended'} {formatDate(sub.expiresAt)}</small></div>
      <div className="access-record-actions"><button type="button" className="access-button" disabled={!!busy || !sub.user || !sub.course} onClick={() => onGrant(sub)}>{isActive ? 'Extend access' : 'Renew access'}</button><button type="button" className="access-link is-danger" disabled={!!busy} onClick={() => onRevoke(sub)}>Remove access</button></div>
    </article>;
  })}</div>;
}
