import { useEffect, useState } from 'react';
import ControlIcon from './ControlIcon';
import ControlCharts from './ControlCharts';
import './AdminDashboard.css';

const API = window.API_BASE_URL + '/api';
const shortcuts = [
  ['courses', 'courses', 'Courses'],
  ['tests', 'tests', 'Tests'],
  ['subscriptions', 'students', 'Students & access'],
];

export default function AdminDashboard({ onNavigate, user }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let statsPending = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError('');
    setServerStatus('checking');
    fetch(`${API}/health`, { signal: controller.signal })
      .then(res => { if (!controller.signal.aborted) setServerStatus(res.ok ? 'online' : 'degraded'); })
      .catch(() => { if (!controller.signal.aborted) setServerStatus('offline'); });
    fetch(`${API}/admin-stats`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Could not load dashboard');
        return data;
      })
      .then(data => { setStats(data); setUpdated(new Date()); })
      .catch(err => {
        if (!controller.signal.aborted) setError(err.message || 'Could not reach the server');
      })
      .finally(() => { statsPending = false; if (!controller.signal.aborted) setLoading(false); });
    // Report a stalled connection without leaving an endless loading state.
    const onTimeout = () => {
      setLoading(false);
      setServerStatus(status => status === 'checking' ? 'offline' : status);
      if (statsPending) setError('The connection took too long. Please try refreshing.');
    };
    controller.signal.addEventListener('abort', onTimeout);
    return () => {
      clearTimeout(timeout);
      controller.signal.removeEventListener('abort', onTimeout);
      controller.abort();
    };
  }, [attempt]);

  const queue = [
    { target: 'subscriptions', label: 'Course access requests', count: stats?.accessRequests?.pending || 0, description: 'Awaiting review' },
    { target: 'testimonials', label: 'Student testimonials', count: stats?.testimonials?.pending || 0, description: 'Awaiting review' },
    { target: 'inbox', label: 'Feedback inbox', count: stats?.feedback?.unread || 0, description: 'Unread messages' },
  ];
  if (stats?.subscriptions.expiringSoon > 0) {
    queue.push({ target: 'subscriptions', label: 'Expiring subscriptions', count: stats.subscriptions.expiringSoon, description: 'Access ends within 7 days' });
  }
  const pending = queue.reduce((sum, row) => sum + row.count, 0);
  const metrics = stats ? [
    ['Total students', stats.students.total, `${stats.students.newLast7Days} joined in the last 7 days`],
    ['Published courses', stats.courses.published, `${stats.courses.total} courses in your library`],
    ['Active subscriptions', stats.subscriptions.active, `${stats.subscriptions.expiringSoon} expire within 7 days`],
    ['Lessons completed', stats.lessons.completed, 'Across all students'],
  ] : [];

  return <section className="container control-center" aria-labelledby="control-title">
    <div className="control-page-heading">
      <div className="control-page-heading-copy">
        <h1 id="control-title">Dashboard</h1>
        <p>{user?.name ? `Welcome back, ${user.name}.` : 'Your teaching workspace'}</p>
        <div className="control-toolbar-status">
          <span className={`control-server ${serverStatus}`} role="status"><i aria-hidden="true"/>{serverStatus === 'online' ? 'Platform online' : serverStatus === 'checking' ? 'Checking connection…' : serverStatus === 'degraded' ? 'Connection needs attention' : 'Platform unreachable'}</span>
          <span className="control-updated" role="status">{updated ? `${error ? 'Last successful update' : 'Updated'} ${updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for dashboard data'}</span>
        </div>
      </div>
      <div className="control-page-heading-actions">
        <button className="control-heading-course" onClick={() => onNavigate('courses')}>Manage courses <span aria-hidden="true">↗</span></button>
        <button className="control-refresh" disabled={loading} onClick={() => setAttempt(value => value + 1)}><ControlIcon name="refresh"/>{loading ? 'Refreshing…' : 'Refresh data'}</button>
        <a className="control-text-link" href="#control-admin-tools">All tools <span aria-hidden="true">↓</span></a>
      </div>
    </div>
    {error && <div className="control-error" role="alert"><strong>{stats ? 'Showing the last available snapshot.' : 'Dashboard data is unavailable.'}</strong><p>{error}</p><button disabled={loading} onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    <section aria-labelledby="control-overview-title" aria-busy={loading}>
      <div className="control-section-heading"><h2 id="control-overview-title">Platform overview</h2><span>All-time totals</span></div>
      {!stats && loading ? <div className="control-metrics control-loading" role="status" aria-label="Loading platform overview">{Array.from({ length: 4 }, (_, i) => <div className="control-metric" key={i} aria-hidden="true"><span/><span/><span/></div>)}</div> : stats ? <>
        <dl className="control-metrics">{metrics.map(([label, value, note]) => <div className="control-metric" key={label}><dt>{label}</dt><dd className="control-metric-value">{value.toLocaleString()}</dd><dd className="control-metric-note">{note}</dd></div>)}</dl>
        <div className="control-details-strip">{[['Total enrollments', stats.enrollments.total, 'subscriptions'], ['Bundled HSK 1 mock tests', stats.tests.bundled, 'tests'], ['Admins & staff', stats.admins.total, 'admins']].map(([label, value, target]) => <button key={label} onClick={() => onNavigate(target)}><span>{label}</span><strong>{value} <span aria-hidden="true">→</span></strong></button>)}</div>
      </> : <p className="control-unavailable">Refresh to load your platform overview. You can still open the management tools below.</p>}
    </section>
    <section className="control-review-hub" id="control-review-queue" aria-labelledby="control-queue-title" aria-busy={loading}>
      <div className="control-review-heading">
        <h2 id="control-queue-title">Needs attention</h2>
        <p>{!stats ? loading ? 'Checking pending work…' : 'Pending counts are unavailable.' : pending ? `${pending} ${pending === 1 ? 'item needs' : 'items need'} your attention.` : 'All caught up. No pending work.'}</p>
      </div>
      <ul className="control-review-items">
        {queue.map(({ target, label, count, description }) => <li key={label}>
          <button className="control-review-item" onClick={() => onNavigate(target)}>
            <span className="control-review-copy">
              <strong>{label}</strong>
              <small>{stats ? count ? description : 'No pending items' : loading ? 'Checking…' : 'Count unavailable'}</small>
            </span>
            <span className={`control-review-number ${stats && count ? 'is-pending' : ''}`}>{stats ? count.toLocaleString() : '—'}</span>
            <span className="control-review-arrow" aria-hidden="true">→</span>
          </button>
        </li>)}
      </ul>
    </section>
    <section className="control-quick-access" id="control-admin-tools" aria-labelledby="control-tools-title">
      <div className="control-section-heading"><h2 id="control-tools-title">Quick access</h2></div>
      <div className="control-quick-links">
        {shortcuts.map(([target, icon, label]) => <button className="control-quick-link" key={target} onClick={() => onNavigate(target)}>
          <ControlIcon name={icon}/><span>{label}</span><span className="control-quick-arrow" aria-hidden="true">→</span>
        </button>)}
        <div className="control-quick-audio" role="group" aria-labelledby="control-audio-title">
          <span className="control-quick-audio-title" id="control-audio-title"><ControlIcon name="audio"/>Audio tools</span>
          <div className="control-quick-audio-links">
            <button onClick={() => onNavigate('pinyin')} aria-label="Pinyin audio">Pinyin <span aria-hidden="true">→</span></button>
            <button onClick={() => onNavigate('sentence-audio')} aria-label="Sentence audio">Sentences <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </div>
    </section>
    {stats && <section aria-labelledby="control-activity-title"><div className="control-section-heading"><h2 id="control-activity-title">Learning activity</h2><span>Growth & engagement</span></div><ControlCharts stats={stats}/></section>}
  </section>;
}
