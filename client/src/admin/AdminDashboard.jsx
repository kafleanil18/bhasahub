import { useEffect, useState } from 'react';
import ControlIcon from './ControlIcon';
import ControlCharts from './ControlCharts';
import './AdminDashboard.css';

const API = window.API_BASE_URL + '/api';
const shortcuts = [
  ['courses', 'courses', 'Courses & lessons', 'Create, edit, and publish learning content.'],
  ['tests', 'tests', 'Mock tests', 'Build assessments and manage published tests.'],
  ['subscriptions', 'subscriptions', 'Students & access', 'Manage enrollments and subscriptions.'],
  ['pinyin', 'audio', 'Pinyin audio', 'Record pronunciation for individual sounds.'],
  ['sentence-audio', 'audio', 'Sentence audio', 'Add teacher recordings to sentence practice.'],
  ['audit', 'audit', 'Activity & sign-ins', 'Review recent platform activity.'],
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
      <div className="control-welcome-copy"><p className="control-eyebrow">{user?.name ? `Welcome back, ${user.name}.` : 'Your teaching workspace'}</p><h1 id="control-title">Great learning<br/>starts <em>here.</em></h1><p>Create a lesson, support a student, or prepare your next class. Everything you need to keep your community learning.</p><div className="control-welcome-actions"><button className="control-primary" onClick={() => onNavigate('courses')}>Manage courses <span aria-hidden="true">↗</span></button><a className="control-text-link" href="#control-admin-tools">Choose a tool <span aria-hidden="true">↓</span></a></div><p className="control-welcome-note">Your courses. Your community. One clear next step.</p></div>
      <aside className="control-hero-card" aria-label="Your teaching day"><div className="control-hero-image"><img src="/images/chinese-ink-landscape.jpg" width="1200" height="800" alt="" decoding="async" fetchPriority="high"/><span>Small steps. Meaningful progress.</span></div><div className="control-hero-summary"><span className="control-eyebrow">Your next step</span><strong>{stats ? pending ? `${pending} ${pending === 1 ? 'item needs' : 'items need'} your attention` : 'A little space to create.' : loading ? 'Preparing your teaching day…' : 'Your workspace is ready.'}</strong><p>{stats && pending ? 'Review student requests, testimonials, and messages below.' : 'Build a lesson or fine-tune the practice tools for your students.'}</p><a href={stats && pending ? '#control-review-queue' : '#control-admin-tools'}>{stats && pending ? 'See what needs review' : 'Explore teaching tools'} <span aria-hidden="true">→</span></a></div></aside>
    </div>
    <div className="control-toolbar">
      <div className="control-toolbar-status"><span className={`control-server ${serverStatus}`} role="status"><i aria-hidden="true"/>{serverStatus === 'online' ? 'Platform online' : serverStatus === 'checking' ? 'Checking connection…' : serverStatus === 'degraded' ? 'Connection needs attention' : 'Platform unreachable'}</span><span className="control-updated" role="status">{updated ? `${error ? 'Last successful update' : 'Updated'} ${updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for dashboard data'}</span></div>
      <button className="control-refresh" disabled={loading} onClick={() => setAttempt(value => value + 1)}><ControlIcon name="refresh"/>{loading ? 'Refreshing…' : 'Refresh data'}</button>
    </div>
    {error && <div className="control-error" role="alert"><strong>{stats ? 'Showing the last available snapshot.' : 'Dashboard data is unavailable.'}</strong><p>{error}</p><button disabled={loading} onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    <section aria-labelledby="control-overview-title" aria-busy={loading}>
      <div className="control-section-heading"><h2 id="control-overview-title">Platform overview</h2><span>All-time totals</span></div>
      {!stats && loading ? <div className="control-metrics control-loading" role="status" aria-label="Loading platform overview">{Array.from({ length: 4 }, (_, i) => <div key={i}><span/><span/><span/></div>)}</div> : stats ? <>
        <div className="control-metrics">{metrics.map(([icon, label, value, note], index) => <div className={`control-metric metric-${index}`} key={label}><span className="control-metric-top"><strong>{label}</strong><span className="control-icon"><ControlIcon name={icon}/></span></span><span className="control-metric-value">{value.toLocaleString()}</span><small>{note}</small></div>)}</div>
        <div className="control-details-strip">{[['Total enrollments', stats.enrollments.total, 'subscriptions'], ['Published mock tests', `${stats.tests.published} of ${stats.tests.total}`, 'tests'], ['Admins & staff', stats.admins.total, 'admins']].map(([label, value, target]) => <button key={label} onClick={() => onNavigate(target)}><span>{label}</span><strong>{value} <span aria-hidden="true">→</span></strong></button>)}</div>
      </> : <p className="control-unavailable">Refresh to load your platform overview. You can still open the management tools below.</p>}
    </section>
    <div className="control-work-grid">
      <section className="control-tools" id="control-admin-tools" aria-labelledby="control-tools-title"><div className="control-panel-heading"><div><p className="control-eyebrow">Your teaching studio</p><h2 id="control-tools-title">What will you work on today?</h2></div></div><p className="control-section-description">Choose a tool and make a little progress.</p><div className="control-shortcuts">{shortcuts.map(([target, icon, label, description]) => <button key={target} onClick={() => onNavigate(target)}><ControlIcon name={icon}/><span><strong>{label}</strong><small>{description}</small></span><span className="control-shortcut-arrow" aria-hidden="true">↗</span></button>)}</div></section>
      <section className="control-queue" id="control-review-queue" aria-labelledby="control-queue-title">
        <div className="control-panel-heading"><div><p className="control-eyebrow">Start here</p><h2 id="control-queue-title">Needs attention</h2></div>{stats && <span className={`control-count ${pending ? 'has-pending' : ''}`}>{pending}<span className="visually-hidden"> items to review</span></span>}</div>
        <p className="control-section-description">{!stats ? 'Review counts will appear when data is available.' : pending ? `${pending} ${pending === 1 ? 'item is' : 'items are'} waiting for your review.` : 'You’re all caught up. New requests will appear here.'}</p>
        <div className="control-queue-items">{queue.map(([target, icon, label, count, action]) => <button key={target} onClick={() => onNavigate(target)}><span className="control-icon"><ControlIcon name={icon}/></span><span><strong>{label}</strong><small>{stats ? count ? `${count} ${target === 'inbox' ? 'unread messages' : 'awaiting review'}` : 'Nothing pending' : 'Count unavailable'}</small></span><span className="control-queue-action">{action}<span aria-hidden="true"> →</span></span></button>)}</div>
        {stats?.subscriptions.expiringSoon > 0 && <button className="control-expiry" onClick={() => onNavigate('subscriptions')}><ControlIcon name="subscriptions"/><span><strong>{stats.subscriptions.expiringSoon} subscriptions expiring soon</strong><small>Review access ending within the next 7 days.</small></span><span aria-hidden="true">→</span></button>}
      </section>
    </div>
    {stats && <><div className="control-section-heading"><h2>Learning activity</h2><span>Growth & engagement</span></div><ControlCharts stats={stats}/></>}
    <nav className="control-footer" aria-label="More administration tools"><span>More tools</span><button onClick={() => onNavigate('admins')}>Manage admins <span aria-hidden="true">→</span></button><button onClick={() => onNavigate('team')}>Team profiles <span aria-hidden="true">→</span></button></nav>
  </section>;
}
