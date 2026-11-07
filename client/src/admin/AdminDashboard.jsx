import { useEffect, useState } from 'react';
import ControlIcon from './ControlIcon';
import ControlCharts from './ControlCharts';
import './AdminDashboard.css';

const API = window.API_BASE_URL + '/api';
const shortcuts = [
  ['courses', 'courses', 'Courses & lessons', 'Create, edit, and publish learning content.'],
  ['conversations', 'lessons', 'Conversation lessons', 'Edit the HSK 1 conversation practice content.'],
  ['tests', 'tests', 'Mock tests', 'Build assessments and manage published tests.'],
  ['subscriptions', 'subscriptions', 'Students & access', 'Manage enrollments and subscriptions.'],
  ['pinyin', 'audio', 'Pinyin audio', 'Record pronunciation for individual sounds.'],
  ['sentence-audio', 'audio', 'Sentence audio', 'Add teacher recordings to sentence practice.'],
  ['audit', 'audit', 'Activity & sign-ins', 'Review recent platform activity.'],
  ['settings', 'inbox', 'Email settings', 'Connect Google SMTP for system emails.'],
  ['reminders', 'inbox', 'Practice reminders', 'Encourage subscribed students to practice Chinese.'],
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
    ['subscriptions', 'subscriptions', 'Course access requests', stats?.accessRequests?.pending || 0, 'Review requests'],
    ['testimonials', 'lessons', 'Student testimonials', stats?.testimonials?.pending || 0, 'Review testimonials'],
    ['inbox', 'inbox', 'Feedback inbox', stats?.feedback?.unread || 0, 'Read messages'],
  ];
  const pending = queue.reduce((sum, row) => sum + row[3], 0);
  const metrics = stats ? [
    ['students', 'Total students', stats.students.total, `${stats.students.newLast7Days} joined in the last 7 days`],
    ['courses', 'Published courses', stats.courses.published, `${stats.courses.total} courses in your library`],
    ['subscriptions', 'Active subscriptions', stats.subscriptions.active, `${stats.subscriptions.expiringSoon} expire within 7 days`],
    ['lessons', 'Lessons completed', stats.lessons.completed, 'Across all students'],
  ] : [];

  return <section className="container control-center" aria-labelledby="control-title">
    <div className="control-welcome">
      <div className="control-welcome-copy"><p className="control-eyebrow">{user?.name ? `Welcome back, ${user.name}.` : 'Your teaching workspace'}</p><h1 id="control-title">Great learning<br/>starts <em>here.</em></h1><p>Manage courses, support students, and prepare learning materials from one place.</p><div className="control-welcome-actions"><button className="control-primary" onClick={() => onNavigate('courses')}>Manage courses <span aria-hidden="true">↗</span></button><a className="control-text-link" href="#control-admin-tools">Choose a tool <span aria-hidden="true">↓</span></a></div></div>
    </div>
    <div className="control-toolbar">
      <div className="control-toolbar-status"><span className={`control-server ${serverStatus}`} role="status"><i aria-hidden="true"/>{serverStatus === 'online' ? 'Platform online' : serverStatus === 'checking' ? 'Checking connection…' : serverStatus === 'degraded' ? 'Connection needs attention' : 'Platform unreachable'}</span><span className="control-updated" role="status">{updated ? `${error ? 'Last successful update' : 'Updated'} ${updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for dashboard data'}</span></div>
      <button className="control-refresh" disabled={loading} onClick={() => setAttempt(value => value + 1)}><ControlIcon name="refresh"/>{loading ? 'Refreshing…' : 'Refresh data'}</button>
    </div>
    {error && <div className="control-error" role="alert"><strong>{stats ? 'Showing the last available snapshot.' : 'Dashboard data is unavailable.'}</strong><p>{error}</p><button disabled={loading} onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    <section className={`control-review-hub ${pending ? 'has-pending' : ''}`} id="control-review-queue" aria-labelledby="control-queue-title" aria-busy={loading}>
      <div className="control-review-heading"><div><p className="control-eyebrow">Admin follow-up</p><h2 id="control-queue-title">Review tasks</h2><p>{!stats ? 'Pending items will appear when dashboard data is available.' : pending ? `${pending} ${pending === 1 ? 'item needs' : 'items need'} your attention.` : 'You’re all caught up. New requests will appear here.'}</p></div>{stats && <span className={`control-count ${pending ? 'has-pending' : ''}`}>{pending}<span className="visually-hidden"> pending tasks</span></span>}</div>
      <div className="control-review-items">{queue.map(([target, icon, label, count, action]) => <button className={`control-review-item review-${target}`} key={target} onClick={() => onNavigate(target)}><span className="control-review-icon"><ControlIcon name={icon}/></span><span className="control-review-copy"><strong>{label}</strong><small>{stats ? count ? `${count} ${target === 'inbox' ? 'unread messages' : 'awaiting review'}` : 'No pending items' : 'Count unavailable'}</small></span><span className={`control-review-number ${count ? 'is-pending' : ''}`}>{stats ? count : '—'}</span><span className="control-review-action">{count ? action : 'Open'} <span aria-hidden="true">→</span></span></button>)}</div>
      {stats?.subscriptions.expiringSoon > 0 && <button className="control-expiry" onClick={() => onNavigate('subscriptions')}><ControlIcon name="subscriptions"/><span><strong>{stats.subscriptions.expiringSoon} subscriptions expiring soon</strong><small>Review access ending within the next 7 days.</small></span><span aria-hidden="true">→</span></button>}
    </section>
    <section aria-labelledby="control-overview-title" aria-busy={loading}>
      <div className="control-section-heading"><h2 id="control-overview-title">Platform overview</h2><span>All-time totals</span></div>
      {!stats && loading ? <div className="control-metrics control-loading" role="status" aria-label="Loading platform overview">{Array.from({ length: 4 }, (_, i) => <div key={i}><span/><span/><span/></div>)}</div> : stats ? <>
        <div className="control-metrics">{metrics.map(([icon, label, value, note], index) => <div className={`control-metric metric-${index}`} key={label}><span className="control-metric-top"><strong>{label}</strong><span className="control-icon"><ControlIcon name={icon}/></span></span><span className="control-metric-value">{value.toLocaleString()}</span><small>{note}</small></div>)}</div>
        <div className="control-details-strip">{[['Total enrollments', stats.enrollments.total, 'subscriptions'], ['Bundled HSK 1 mock tests', stats.tests.bundled, 'tests'], ['Admins & staff', stats.admins.total, 'admins']].map(([label, value, target]) => <button key={label} onClick={() => onNavigate(target)}><span>{label}</span><strong>{value} <span aria-hidden="true">→</span></strong></button>)}</div>
      </> : <p className="control-unavailable">Refresh to load your platform overview. You can still open the management tools below.</p>}
    </section>
    <div className="control-work-grid">
      <section className="control-tools" id="control-admin-tools" aria-labelledby="control-tools-title"><div className="control-panel-heading"><div><p className="control-eyebrow">Your teaching studio</p><h2 id="control-tools-title">What will you work on today?</h2></div></div><p className="control-section-description">Choose a tool and make a little progress.</p><div className="control-shortcuts">{shortcuts.map(([target, icon, label, description]) => <button key={target} onClick={() => onNavigate(target)}><ControlIcon name={icon}/><span><strong>{label}</strong><small>{description}</small></span><span className="control-shortcut-arrow" aria-hidden="true">↗</span></button>)}</div></section>
    </div>
    {stats && <><div className="control-section-heading"><h2>Learning activity</h2><span>Growth & engagement</span></div><ControlCharts stats={stats}/></>}
    <nav className="control-footer" aria-label="More administration tools"><span>More tools</span><button onClick={() => onNavigate('admins')}>Manage admins <span aria-hidden="true">→</span></button></nav>
  </section>;
}
