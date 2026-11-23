import { useEffect, useRef, useState } from 'react';
import { planLabel } from '../pricing/plans';
import './AdminNotifications.css';

// Each tag knows how to describe its items and where they are handled.
const ATTENTION_TAGS = [
  { key: 'plans', label: 'Plan requests', path: '/admin/subscriptions?view=plans', describe: item => ({ title: `${item.user?.name || 'A student'} chose the ${planLabel(item.plan)} plan`, detail: 'Waiting for payment' }) },
  { key: 'access', label: 'Course access requests', path: '/admin/subscriptions?view=requests', describe: item => ({ title: `${item.user?.name || 'A student'} asked for course access`, detail: item.course?.title || 'Deleted course' }) },
  { key: 'testimonials', label: 'Student testimonials', path: '/admin/testimonials', describe: item => ({ title: `${item.name || 'A student'} sent a testimonial`, detail: item.text }) },
  { key: 'feedback', label: 'Feedback inbox', path: '/admin/inbox', describe: item => ({ title: `New feedback from ${item.name || item.user?.name || 'a visitor'}`, detail: item.message }) },
];

const timeAgo = value => {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return 'just now';
  const [size, unit] = seconds < 3600 ? [seconds / 60, 'minute'] : seconds < 86400 ? [seconds / 3600, 'hour'] : [seconds / 86400, 'day'];
  const count = Math.floor(size);
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
};

export default function AdminNotifications({ attention, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const wrapRef = useRef(null);
  const total = ATTENTION_TAGS.reduce((sum, tag) => sum + (attention[tag.key]?.length || 0), 0);

  useEffect(() => {
    if (!open) return undefined;
    const close = event => { if (!wrapRef.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);

  const items = ATTENTION_TAGS
    .filter(tag => filter === 'all' || filter === tag.key)
    .flatMap(tag => (attention[tag.key] || []).map(item => ({ ...tag.describe(item), id: `${tag.key}-${item._id}`, tag, at: item.createdAt })))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  const go = path => { setOpen(false); onNavigate(path); };

  return (
    <div className="admin-notifications" ref={wrapRef}>
      <button
        className="admin-notifications-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="admin-notifications-panel"
        aria-label={total ? `Notifications, ${total} need attention` : 'Notifications, nothing needs attention'}
        title="Needs attention"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {total > 0 && <span className="admin-notifications-count" aria-hidden="true">{total > 99 ? '99+' : total}</span>}
      </button>
      {open && (
        <div className="admin-notifications-panel" id="admin-notifications-panel" role="dialog" aria-label="Needs attention">
          <div className="admin-notifications-head">
            <h2>Needs attention</h2>
            <span>{total ? `${total} ${total === 1 ? 'item' : 'items'}` : 'All clear'}</span>
          </div>
          <div className="admin-notifications-tags" role="group" aria-label="Filter by type">
            <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All <span>{total}</span></button>
            {ATTENTION_TAGS.map(tag => (
              <button key={tag.key} className={`is-${tag.key}`} aria-pressed={filter === tag.key} onClick={() => setFilter(tag.key)}>
                {tag.label} <span>{attention[tag.key]?.length || 0}</span>
              </button>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="admin-notifications-empty">{filter === 'all' ? 'Nothing needs your attention right now.' : 'Nothing new here.'}</p>
          ) : (
            <ul className="admin-notifications-list">
              {items.map(item => (
                <li key={item.id}>
                  <button onClick={() => go(item.tag.path)}>
                    <span className={`admin-notifications-tag is-${item.tag.key}`}>{item.tag.label}</span>
                    <strong>{item.title}</strong>
                    {item.detail && <span className="admin-notifications-detail">{item.detail}</span>}
                    {item.at && <time dateTime={item.at}>{timeAgo(item.at)}</time>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
