import { useState, useEffect, useCallback } from 'react';

const API = window.API_BASE_URL + '/api';

function CourseOverview({
  course,
  user,
  token,
  isAdmin,
  lessons,
  loading,
  completedIds,
  hasAccess,
  accessExpiry,
  accessChecked,
  canOpenLessons,
  showAccessMsg,
  onDismissAccessMsg,
  onBack,
  onLessonClick,
}) {
  const [catFilter, setCatFilter] = useState('all');

  const [enrolled, setEnrolled] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // null | 'pending' | 'denied'
  const [requestingAccess, setRequestingAccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/enrollments/status/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setEnrolled(data.enrolled))
      .catch(() => {});
  }, [course._id, token]);

  const loadRequestStatus = useCallback(() => {
    if (!token) return;
    fetch(`${API}/access-requests/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const mine = (Array.isArray(data) ? data : []).filter(r => r.course && r.course._id === course._id);
        const pending = mine.find(r => r.status === 'pending');
        if (pending) { setRequestStatus('pending'); return; }
        const latest = mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setRequestStatus(latest && latest.status === 'denied' ? 'denied' : null);
      })
      .catch(() => {});
  }, [course._id, token]);

  useEffect(() => { loadRequestStatus(); }, [loadRequestStatus]);

  const requestAccess = async () => {
    if (!token) return;
    setRequestingAccess(true);
    try {
      const res = await fetch(`${API}/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: course._id }),
      });
      if (res.ok) setRequestStatus('pending');
    } catch {
      // ignore
    } finally {
      setRequestingAccess(false);
    }
  };

  const toggleEnroll = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/enrollments/${course._id}`, {
        method: enrolled ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEnrolled(!enrolled);
    } catch {
      // silently ignore
    }
  };

  const visibleLessons = lessons.filter(
    (l) => catFilter === 'all' || (l.category || 'vocabulary') === catFilter
  );

  const currentCourseCompleted = completedIds.filter(id => lessons.some(l => l._id === id)).length;
  const progressPercent = lessons.length ? Math.round((currentCourseCompleted / lessons.length) * 100) : 0;
  const isBeginner = course.level && (course.level.toLowerCase().includes('hsk 1') || course.level.toLowerCase().includes('beginner'));

  return (
    <section className="course-page container">

      <button className="back-btn" onClick={onBack}>← Back to courses</button>

      <div className="course-head" style={{ marginTop: 16 }}>
        <div>
          {isBeginner && (
            <div className="course-welcome-badge">
              👋 你好 (Nǐ hǎo) — Start Learning Chinese!
            </div>
          )}
          <h1 className="section-title">{course.title}</h1>
          <p className="course-desc">{course.description}</p>
          <span className="tag" style={{ background: 'var(--jade)', color: '#fff', border: 'none' }}>
            {course.level}
          </span>
          {user && (
            <div className="enroll-wrap" style={{ marginTop: 14 }}>
              <button
                className={enrolled ? 'nav-btn' : 'btn-primary'}
                onClick={toggleEnroll}
              >
                {enrolled ? '✓ Enrolled' : 'Enroll in this course'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Access banner */}
      {user && !isAdmin && accessChecked && (
        hasAccess ? (
          <div className="access-banner access-ok" style={{ margin: '16px 0 0' }}>
            ✓ Active Subscription Access {accessExpiry && `until ${new Date(accessExpiry).toLocaleDateString()}`}
          </div>
        ) : (
          <div className="access-banner access-locked" style={{ margin: '16px 0 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {requestStatus === 'pending' ? (
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Access request sent — waiting for an admin to grant it.
              </span>
            ) : (
              <>
                <span>
                  🔒 You don't have access to this course yet.
                  {requestStatus === 'denied' && ' Your previous request was denied.'}
                </span>
                <button className="nav-btn" onClick={requestAccess} disabled={requestingAccess}>
                  {requestingAccess ? 'Sending...' : 'Request access'}
                </button>
              </>
            )}
          </div>
        )
      )}

      {/* Message shown when a locked lesson is clicked */}
      {showAccessMsg && !canOpenLessons && (
        <div className="access-msg" style={{ margin: '20px 0 0' }}>
          <p>
            🔒 This lesson is locked. You need active access to open lessons.
            Scroll up and click <strong>Request access</strong> to ask an admin to grant it.
          </p>
          <button className="nav-btn" onClick={onDismissAccessMsg}>Got it</button>
        </div>
      )}

      {/* Progress Dashboard */}
      {user && (
        <div className="course-progress-block">
          <div className="course-progress-header">
            <span className="course-progress-title">Your Course Progress</span>
            <span className="course-progress-value">{progressPercent}%</span>
          </div>
          <div className="course-progress-bar-bg">
            <div className="course-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="course-meta-grid">
            <div className="course-meta-item">
              <span className="course-meta-val">{currentCourseCompleted} of {lessons.length}</span>
              <span className="course-meta-lbl">Lessons Completed</span>
            </div>
            <div className="course-meta-item">
              <span className="course-meta-val">{(lessons.length * 15)} mins</span>
              <span className="course-meta-lbl">Estimated Study Time</span>
            </div>
            <div className="course-meta-item">
              <span className="course-meta-val">{enrolled ? 'Active Student' : 'Not Enrolled'}</span>
              <span className="course-meta-lbl">Enrolment Status</span>
            </div>
          </div>
        </div>
      )}

      <h2 className="lessons-heading" style={{ marginTop: 32 }}>Lessons</h2>

      <div className="category-tabs" style={{ marginBottom: 8 }}>
        <button className={`cat-tab ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>All</button>
        <button className={`cat-tab ${catFilter === 'vocabulary' ? 'active' : ''}`} onClick={() => setCatFilter('vocabulary')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Vocabulary
        </button>
        <button className={`cat-tab ${catFilter === 'conversation' ? 'active' : ''}`} onClick={() => setCatFilter('conversation')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Conversation
        </button>
        <button className={`cat-tab ${catFilter === 'grammar' ? 'active' : ''}`} onClick={() => setCatFilter('grammar')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
          </svg>
          Grammar
        </button>
      </div>

      {loading && <p className="courses-empty">Loading lessons...</p>}
      {!loading && visibleLessons.length === 0 && (
        <p className="courses-empty">No lessons in this category yet.</p>
      )}

      <div className="lesson-cards-grid">
        {visibleLessons.map((l) => {
          const isDone = completedIds.includes(l._id);
          const categoryLabel = l.category ? l.category : 'vocabulary';
          const categoryVectorIcon = categoryLabel === 'grammar' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          ) : categoryLabel === 'conversation' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          );

          return (
            <button
              className={`lesson-card-btn ${isDone ? 'completed-card' : ''} ${!canOpenLessons ? 'lesson-locked' : ''}`}
              key={l._id}
              onClick={() => onLessonClick(l)}
            >
              <div className="lesson-card-top">
                <span className="lesson-card-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {categoryVectorIcon} {categoryLabel}
                </span>
                <div className="lesson-card-order-circle">
                  {l.order}
                </div>
              </div>
              <h3 className="lesson-card-title">{l.title}</h3>
              <div className="lesson-card-footer">
                <span className="lesson-card-status-text">
                  {!canOpenLessons ? 'Locked' : isDone ? '✓ Completed' : 'Start Lesson'}
                </span>
                <span className="lesson-card-arrow">
                  {!canOpenLessons ? '🔒' : isDone ? '✓' : '→'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CourseOverview;
