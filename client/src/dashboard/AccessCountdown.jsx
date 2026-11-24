import { useEffect, useState } from 'react';

const DAY = 86400000;
const formatDate = value => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const pad = value => String(value).padStart(2, '0');

function remaining(ms) {
  const days = Math.floor(ms / DAY);
  const hours = Math.floor(ms % DAY / 3600000);
  const minutes = Math.floor(ms % 3600000 / 60000);
  const seconds = Math.floor(ms % 60000 / 1000);
  return days > 0 ? `${days}d ${pad(hours)}h ${pad(minutes)}m` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Live countdown to the soonest end of the student's active course access (plan or per-course).
export default function AccessCountdown({ token }) {
  const [access, setAccess] = useState({ loading: true, error: false, entries: [] });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!token) { setAccess({ loading: false, error: false, entries: [] }); return; }
    const controller = new AbortController();
    const load = path => fetch(`${window.API_BASE_URL}/api${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => Array.isArray(data) ? data : []);
    // Paid access (plan or per course) plus a free week granted from an access request.
    Promise.all([load('/subscriptions/my'), load('/access-requests/my')])
      .then(([subs, requests]) => {
        const entries = [
          ...subs.map(sub => ({ expiresAt: new Date(sub.expiresAt).getTime(), title: sub.course?.title, plan: !!sub.plan })),
          ...requests.filter(row => row.scope === 'tests' && row.status === 'approved' && row.expiresAt).map(row => ({ expiresAt: new Date(row.expiresAt).getTime(), free: true })),
        ]
          .filter(entry => Number.isFinite(entry.expiresAt) && entry.expiresAt > Date.now())
          .sort((a, b) => a.expiresAt - b.expiresAt);
        setAccess({ loading: false, error: false, entries });
      })
      .catch(() => { if (!controller.signal.aborted) setAccess({ loading: false, error: true, entries: [] }); });
    return () => controller.abort();
  }, [token]);

  const next = access.entries.find(entry => entry.expiresAt > now);
  const left = next ? next.expiresAt - now : 0;
  // Tick every second in the final day, otherwise once a minute is enough.
  useEffect(() => {
    if (!next) return;
    const timer = window.setInterval(() => setNow(Date.now()), left < DAY ? 1000 : 30000);
    return () => window.clearInterval(timer);
  }, [next, left < DAY]); // eslint-disable-line react-hooks/exhaustive-deps

  const allPlan = access.entries.length > 0 && access.entries.every(entry => entry.plan);
  const allFree = access.entries.length > 0 && access.entries.every(entry => entry.free);
  const others = new Set(access.entries.filter(entry => entry.expiresAt > now).map(entry => entry.expiresAt)).size - 1;
  const tone = !next ? 'is-ended' : left <= 3 * DAY ? 'is-urgent' : left <= 7 * DAY ? 'is-soon' : '';
  const note = access.loading ? 'Checking your access…'
    : access.error ? 'Couldn’t check your access right now'
    : !next ? (access.entries.length ? 'Your access has ended' : 'No active course access')
    : `${allPlan ? 'Plan' : next.free ? 'Free access' : next.title ? `${next.title} access` : 'Access'} ends ${formatDate(next.expiresAt)}${!allPlan && !allFree && others > 0 ? ` · ${others} more ${others === 1 ? 'date' : 'dates'}` : ''}`;

  return <div className={`learning-overview-item learning-access-timer ${tone}`} role="timer" aria-live="off" aria-label={next ? `Course access ends ${formatDate(next.expiresAt)}` : 'Course access'}>
    <span>{next?.free ? <>Access expires in <span className="learning-free-tag">Free</span></> : 'Access expires in'}</span>
    <strong>{access.loading || access.error || !next ? '—' : remaining(left)}</strong>
    <small>{note}</small>
  </div>;
}
