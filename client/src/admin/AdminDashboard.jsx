import { useEffect, useState } from 'react';
import ControlIcon from './ControlIcon';
import ControlCharts from './ControlCharts';
import './AdminDashboard.css';

const API = window.API_BASE_URL + '/api';
const workspaces = [
  ['courses','courses','Course workspace','Shape the next lesson.','Build curricula and manage learning content.'],
  ['pinyin','audio','Pinyin voice studio','Give every sound a voice.','Record and replace pronunciation audio.'],
  ['sentence-audio','audio','Sentence audio studio','Bring sentences to life.','Record teacher audio for sentence practice.'],
];
export default function AdminDashboard({ onBack, onNavigate }) {
  const [stats, setStats] = useState(null), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0), [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking'), [updated, setUpdated] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setServerStatus('checking');
    fetch(`${API}/health`, { signal:controller.signal }).then(res => setServerStatus(res.ok ? 'online' : 'degraded')).catch(() => { if (!controller.signal.aborted) setServerStatus('offline'); });
    fetch(`${API}/admin-stats`, { signal:controller.signal, headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } })
      .then(async res => { const data = await res.json(); if (!res.ok || data.error) throw new Error(data.error || 'Could not load dashboard'); return data; })
      .then(data => { if (!controller.signal.aborted) { setStats(data); setUpdated(new Date()); } })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || 'Could not reach the server'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const queue = [
    ['subscriptions','subscriptions','Course access requests', stats?.accessRequests?.pending || 0,'Review requests'],
    ['testimonials','lessons','Student testimonials',stats?.testimonials?.pending || 0,'Review testimonials'],
    ['inbox','inbox','Support messages',stats?.feedback?.unread || 0,'Open inbox'],
  ];
  const pending = queue.reduce((sum,row) => sum+row[3],0);
  const metrics = stats ? [
    ['students','Total students',stats.students.total,`${stats.students.newLast7Days} new this week`,'subscriptions'],
    ['courses','Published courses',stats.courses.published,`${stats.courses.total} courses in the library`,'courses'],
    ['subscriptions','Active subscriptions',stats.subscriptions.active,`${stats.subscriptions.expiringSoon} expire within 7 days`,'subscriptions'],
    ['lessons','Completed lessons',stats.lessons.completed,'Learning milestones reached','courses'],
  ] : [];
  return <section className="container control-center" aria-labelledby="control-title">
    <div className="control-topline"><button className="control-back" onClick={onBack}>← Back to site</button><span>HANZIGO <span aria-hidden="true">/</span> ADMINISTRATION</span></div>
    <header className="control-hero">
      <div className="control-hero-copy"><p className="control-eyebrow">The space behind the learning</p><h1 id="control-title">LMS Control Center<span aria-hidden="true">.</span></h1><p>A clear view of your students, your content,<br className="control-desktop-break"/> and everything that needs your attention.</p><div className="control-hero-actions"><button onClick={() => onNavigate('courses')}>Manage courses <span aria-hidden="true">↗</span></button><button onClick={() => onNavigate('audit')}>View activity <ControlIcon name="audit"/></button></div></div>
      <div className="control-hero-mark" aria-hidden="true"><span>学</span><small>TEACH · GUIDE · GROW</small></div>
      <span className={`control-server ${serverStatus}`}><i aria-hidden="true"/>{serverStatus === 'online' ? 'Server online' : `Server ${serverStatus}`}</span>
    </header>
    <div className="control-section-heading"><div><p className="control-eyebrow">Platform overview</p><h2>Your learning community, at a glance.</h2></div><button className="control-refresh" disabled={loading} onClick={() => setAttempt(value => value+1)}><ControlIcon name="refresh"/>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
    {error && <div className="control-error" role="alert"><strong>Could not refresh the dashboard.</strong><p>{error}</p><button onClick={() => setAttempt(value => value+1)}>Try again</button></div>}
    {!stats && loading ? <div className="control-metrics control-loading" role="status" aria-label="Loading platform dashboard">{Array.from({length:4},(_,i)=><div key={i}><span/><span/><span/></div>)}</div> : stats && <>
      <div className="control-metrics">{metrics.map(([icon,label,value,note,target],index) => <button className={`control-metric metric-${index}`} key={label} onClick={() => onNavigate(target)}><span className="control-metric-top"><span className="control-icon"><ControlIcon name={icon}/></span><span aria-hidden="true">↗</span></span><span className="control-metric-value">{value.toLocaleString()}</span><strong>{label}</strong><small>{note}</small></button>)}</div>
      <div className="control-details-strip">{[['Total enrollments',stats.enrollments.total,'subscriptions'],['Published mock tests',`${stats.tests.published} / ${stats.tests.total}`,'tests'],['Admins & staff',stats.admins.total,'admins']].map(([label,value,target]) => <button key={label} onClick={() => onNavigate(target)}><span>{label}</span><strong>{value} <span aria-hidden="true">↗</span></strong></button>)}</div>
      <section className="control-queue" aria-labelledby="control-queue-title"><div className="control-queue-intro"><span className="control-queue-count">{pending}</span><div><p className="control-eyebrow">Your review queue</p><h2 id="control-queue-title">{pending ? 'A few things need you.' : 'You’re all caught up.'}</h2><p>{pending ? 'Keep your learners moving forward.' : 'New requests will appear here.'}</p></div></div><div className="control-queue-items">{queue.map(([target,icon,label,count,action]) => <button key={target} onClick={() => onNavigate(target)} aria-label={`${action}: ${count} pending`}><ControlIcon name={icon}/><span><strong>{label}</strong><small>{count ? `${count} awaiting review` : 'Nothing pending'}</small></span><span className={count ? 'control-count has-pending' : 'control-count'}>{count}</span></button>)}</div></section>
      <ControlCharts stats={stats}/>
    </>}
    <div className="control-section-heading"><div><p className="control-eyebrow">Create & curate</p><h2>Make the next lesson better.</h2></div></div>
    <div className="control-workspaces">{workspaces.map(([target,icon,label,title,description]) => <button key={target} onClick={() => onNavigate(target)}><span className="control-workspace-top"><ControlIcon name={icon}/><span aria-hidden="true">↗</span></span><small>{label}</small><strong>{title}</strong><p>{description}</p></button>)}</div>
    {updated && <p className="control-updated">Snapshot updated at {updated.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}. Refresh to see the latest activity.</p>}
  </section>;
}
