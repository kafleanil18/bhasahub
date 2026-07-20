import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/admin-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError('Could not reach the server'));
  }, []);

  const formatShortDate = (isoDate) => {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (error) {
    return (
      <section className="container" style={{ padding: '40px 0' }}>
        <button className="back-btn" onClick={onBack}>← Back to home</button>
        <p className="login-error" style={{ marginTop: 20 }}>{error}</p>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="container" style={{ padding: '40px 0' }}>
        <button className="back-btn" onClick={onBack}>← Back to home</button>
        <p className="courses-empty">Loading dashboard…</p>
      </section>
    );
  }

  // Fill in the full 30-day range (the API only returns days with at least one signup)
  // so the chart has a consistent, gap-free x-axis.
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = stats.students.signupsByDay.find((s) => s._id === key);
    days.push({ date: key, count: found ? found.count : 0 });
  }
  const maxDailySignups = Math.max(1, ...days.map((d) => d.count));
  const maxCourseCount = Math.max(1, ...stats.enrollments.topCourses.map((c) => c.count));

  return (
    <section className="container" style={{ padding: '32px 0 60px' }}>
      <button className="back-btn" onClick={onBack} style={{ marginBottom: 16 }}>← Back to home</button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title" style={{ marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: 'var(--mist)' }}>A snapshot of what's happening across the platform.</p>
      </div>

      <div className="subs-stats-grid">
        <div className="subs-stat-card">
          <div className="subs-stat-icon active">🎓</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.students.total}</span>
            <span className="subs-stat-label">Students · {stats.students.newLast7Days} new this week</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon courses">📖</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.courses.published}/{stats.courses.total}</span>
            <span className="subs-stat-label">Courses published</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon active">📝</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.enrollments.total}</span>
            <span className="subs-stat-label">Total enrollments</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon active">✅</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.lessons.completed}</span>
            <span className="subs-stat-label">Lessons completed</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon courses">🗞️</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.blog.published}/{stats.blog.total}</span>
            <span className="subs-stat-label">Blog posts published</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon courses">📋</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.tests.published}/{stats.tests.total}</span>
            <span className="subs-stat-label">Mock tests published</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon expired">⏳</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.subscriptions.active}</span>
            <span className="subs-stat-label">Active subscriptions · {stats.subscriptions.expiringSoon} expiring in 7d</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className={`subs-stat-icon ${stats.accessRequests.pending > 0 ? 'attention' : 'expired'}`}>🙋</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.accessRequests.pending}</span>
            <span className="subs-stat-label">Pending access requests</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className={`subs-stat-icon ${stats.testimonials.pending > 0 ? 'attention' : 'expired'}`}>💬</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.testimonials.pending}</span>
            <span className="subs-stat-label">Pending testimonials</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className={`subs-stat-icon ${stats.feedback.unread > 0 ? 'attention' : 'expired'}`}>📨</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.feedback.unread}</span>
            <span className="subs-stat-label">Unread feedback</span>
          </div>
        </div>

        <div className="subs-stat-card">
          <div className="subs-stat-icon courses">🛡️</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{stats.admins.total}</span>
            <span className="subs-stat-label">Admins & super admins</span>
          </div>
        </div>
      </div>

      <div className="dash-two-col">
        <div className="dash-section">
          <h3 className="dash-section-title">New signups — last 30 days</h3>
          <div className="dash-chart">
            <div className="dash-chart-max-label">{maxDailySignups} max/day</div>
            <div className="dash-chart-bars">
              {days.map((d, i) => (
                <div
                  key={d.date}
                  className="dash-bar-col"
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay((h) => (h === i ? null : h))}
                >
                  {hoveredDay === i && (
                    <div className="dash-tooltip">{formatShortDate(d.date)}: {d.count}</div>
                  )}
                  <div className="dash-bar-fill" style={{ height: `${(d.count / maxDailySignups) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="dash-chart-ticks">
              <span>{formatShortDate(days[0].date)}</span>
              <span>{formatShortDate(days[days.length - 1].date)}</span>
            </div>
          </div>
        </div>

        <div className="dash-section">
          <h3 className="dash-section-title">Top courses by enrollment</h3>
          {stats.enrollments.topCourses.length === 0 ? (
            <p className="dash-empty">No enrollments yet.</p>
          ) : (
            stats.enrollments.topCourses.map((c) => (
              <div className="dash-course-row" key={c.courseId}>
                <span className="dash-course-name">{c.title}</span>
                <span className="dash-course-count">{c.count}</span>
                <div className="dash-course-bar-track">
                  <div className="dash-course-bar-fill" style={{ width: `${(c.count / maxCourseCount) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
