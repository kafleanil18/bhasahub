import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

function Dashboard({ user, onOpenCourse, onBrowse }) {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({}); // { courseId: { total, completed } }
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API}/enrollments/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        const entries = await Promise.all(
          list.map(async (c) => {
            try {
              const r = await fetch(`${API}/progress/course/${c._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const p = await r.json();
              return [c._id, p];
            } catch {
              return [c._id, { total: 0, completed: 0 }];
            }
          })
        );
        setProgress(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Aggregate metrics
  let totalLessons = 0;
  let totalCompleted = 0;
  let latestActiveCourse = null;
  let maxPercent = -1;

  courses.forEach(c => {
    const p = progress[c._id] || { total: 0, completed: 0 };
    totalLessons += (p.total || 0);
    totalCompleted += (p.completed || 0);
    const percent = p.total > 0 ? (p.completed / p.total) * 100 : 0;
    if (percent < 100 && percent >= maxPercent) {
      maxPercent = percent;
      latestActiveCourse = c;
    }
  });
  if (!latestActiveCourse && courses.length > 0) {
    latestActiveCourse = courses[0];
  }

  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <section className="dashboard-container container">
      {/* Dashboard Banner */}
      <div className="dash-hero">
        <div className="dash-hero-content">
          <span className="dash-eyebrow">My Learning Space</span>
          <h1 className="dash-greeting">Welcome back, {user ? user.name : 'Learner'} 👋</h1>
          <p className="dash-subtext">Track your progress, practice vocabulary, and resume your active lessons.</p>
          
          {latestActiveCourse && (
            <div className="dash-resume-box">
              <button className="dash-resume-btn" onClick={() => onOpenCourse(latestActiveCourse)}>
                <span className="dash-play-icon">▶</span>
                <span>Continue: <strong>{latestActiveCourse.title}</strong></span>
                <span className="dash-arrow">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="dash-stats-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-icon streak-icon">⚡</div>
            <div className="dash-stat-info">
              <span className="dash-stat-val">Active</span>
              <span className="dash-stat-lbl">Learning Streak</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon lessons-icon">📚</div>
            <div className="dash-stat-info">
              <span className="dash-stat-val">{totalCompleted} / {totalLessons}</span>
              <span className="dash-stat-lbl">Lessons Completed</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon progress-icon">🎯</div>
            <div className="dash-stat-info">
              <span className="dash-stat-val">{overallPercent}%</span>
              <span className="dash-stat-lbl">Overall Mastery</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon courses-icon">🎓</div>
            <div className="dash-stat-info">
              <span className="dash-stat-val">{courses.length}</span>
              <span className="dash-stat-lbl">Enrolled Courses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-section-header">
        <h2>My Enrolled Courses</h2>
        <button className="btn-secondary-sm" onClick={onBrowse}>+ Explore All Courses</button>
      </div>

      {loading && <p className="courses-empty">Loading your learning workspace...</p>}

      {!loading && courses.length === 0 && (
        <div className="dash-empty-card">
          <div className="dash-empty-icon">📖</div>
          <h3>Start Your Language Journey Today</h3>
          <p>You haven't enrolled in any courses yet. Browse our structured Mandarin and Nepali courses to begin learning.</p>
          <button className="btn-primary" onClick={onBrowse}>Browse Available Courses</button>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="dash-course-grid">
          {courses.map((c) => {
            const p = progress[c._id] || { total: 0, completed: 0 };
            const percent = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            const isCompleted = percent === 100 && p.total > 0;
            const isStarted = p.completed > 0;

            return (
              <div className="dash-course-card" key={c._id} onClick={() => onOpenCourse(c)}>
                <div className="dash-card-banner">
                  <span className={`dash-glyph-badge ${c.language === 'chinese' ? 'zh' : 'ne'}`}>
                    {c.glyph && c.glyph.trim().length > 0 && c.glyph.trim().length <= 2 
                      ? c.glyph 
                      : (c.language === 'chinese' ? '中' : 'ने')}
                  </span>
                  <div className="dash-badge-group">
                    <span className="dash-level-pill">{c.level || 'HSK'}</span>
                    {isCompleted ? (
                      <span className="dash-status-pill done-pill">✓ Completed</span>
                    ) : isStarted ? (
                      <span className="dash-status-pill active-pill">In Progress</span>
                    ) : (
                      <span className="dash-status-pill new-pill">Not Started</span>
                    )}
                  </div>
                </div>

                <div className="dash-card-body">
                  <h3 className="dash-card-title">{c.title}</h3>
                  <p className="dash-card-desc">{c.description}</p>

                  <div className="dash-progress-wrap">
                    <div className="dash-progress-meta">
                      <span>{p.completed} of {p.total} lessons</span>
                      <span className="dash-percent-val">{percent}%</span>
                    </div>
                    <div className="dash-progress-bar-bg">
                      <div className="dash-progress-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <button className="dash-card-cta">
                    {isCompleted ? 'Review Course →' : isStarted ? 'Continue Learning →' : 'Start Course →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Dashboard;