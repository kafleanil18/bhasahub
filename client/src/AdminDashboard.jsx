import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';

function AdminDashboard({ onBack, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [hoveredSignup, setHoveredSignup] = useState(null);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check server status
    fetch(window.API_BASE_URL + '/api/health')
      .then((res) => {
        if (res.ok) setServerStatus('online');
        else setServerStatus('degraded');
      })
      .catch(() => setServerStatus('offline'));

    fetch(`${API}/admin-stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError('Could not reach the server'));

    fetch(window.API_BASE_URL + '/api/settings')
      .then((res) => res.json())
      .then((data) => setWelcomeVideoUrl(data.welcomeVideoUrl || ''))
      .catch(() => {});
  }, []);

  const uploadWelcomeVideo = async (file) => {
    if (!file) return;
    setVideoError('');
    setUploadingVideo(true);
    const token = localStorage.getItem('token');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(window.API_BASE_URL + '/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setVideoError(uploadData.error || 'Video upload failed');
        return;
      }
      const settingsRes = await fetch(window.API_BASE_URL + '/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ welcomeVideoUrl: uploadData.url }),
      });
      const settingsData = await settingsRes.json();
      if (!settingsRes.ok) {
        setVideoError(settingsData.error || 'Could not save the video');
        return;
      }
      setWelcomeVideoUrl(settingsData.welcomeVideoUrl);
    } catch {
      setVideoError('Could not reach the server');
    } finally {
      setUploadingVideo(false);
    }
  };

  const formatShortDate = (isoDate) => {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (error) {
    return (
      <section className="container" style={{ padding: '40px 0' }}>
        <button className="btn-back-pill" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to site
        </button>
        <p className="login-error" style={{ marginTop: 20 }}>{error}</p>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="container" style={{ padding: '40px 0' }}>
        <button className="btn-back-pill" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to site
        </button>
        <p className="courses-empty">Loading platform dashboard…</p>
      </section>
    );
  }

  // Action items check
  const pendingAccess = stats.accessRequests?.pending || 0;
  const pendingTestimonials = stats.testimonials?.pending || 0;
  const unreadFeedback = stats.feedback?.unread || 0;
  const totalActionsRequired = pendingAccess + pendingTestimonials + unreadFeedback;

  // Fill in the full 30-day range for signups
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

  // Custom SVG Chart calculations
  const chartHeight = 160;
  const chartWidth = 720;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const N = days.length;
  const barWidth = Math.max(4, Math.min(18, (graphWidth / N) * 0.6));

  return (
    <section className="container" style={{ padding: '32px 0 60px' }}>
      {/* Top dashboard header row */}
      <div className="admin-header-row">
        <div className="admin-header-title-group">
          <button className="btn-back-pill" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to site
          </button>
          <div className="admin-title-status-line" style={{ marginTop: 12 }}>
            <h1 className="section-title" style={{ margin: 0 }}>LMS Control Center</h1>
            <div className={`server-status-badge ${serverStatus}`}>
              <span className="status-pulse-dot"></span>
              Server: {serverStatus.toUpperCase()}
            </div>
          </div>
          <p className="analytics-subtitle">Administrative snapshot of BhashaHub LMS platform activities and metrics.</p>
        </div>
      </div>

      {/* Action Items Alert Banner */}
      {totalActionsRequired > 0 && (
        <div className="admin-actions-alert-banner">
          <div className="alert-banner-header">
            <span className="alert-banner-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            <div className="alert-banner-text-group">
              <h4 className="alert-banner-title">Administrative Actions Required</h4>
              <p className="alert-banner-desc">Review pending requests, testimonials, and support tickets.</p>
            </div>
          </div>
          <div className="alert-banner-actions-grid">
            {pendingAccess > 0 && (
              <div 
                role="button" 
                tabIndex={0} 
                className="alert-action-pill" 
                onClick={() => onNavigate('subscriptions')}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate('subscriptions')}
              >
                <span className="alert-action-label">Course Access requests</span>
                <span className="alert-action-count">{pendingAccess} pending</span>
                <span className="alert-action-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </div>
            )}
            {pendingTestimonials > 0 && (
              <div 
                role="button" 
                tabIndex={0} 
                className="alert-action-pill" 
                onClick={() => onNavigate('testimonials')}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate('testimonials')}
              >
                <span className="alert-action-label">Student Testimonials</span>
                <span className="alert-action-count">{pendingTestimonials} pending</span>
                <span className="alert-action-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </div>
            )}
            {unreadFeedback > 0 && (
              <div 
                role="button" 
                tabIndex={0} 
                className="alert-action-pill" 
                onClick={() => onNavigate('inbox')}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate('inbox')}
              >
                <span className="alert-action-label">Unread Support messages</span>
                <span className="alert-action-count">{unreadFeedback} new</span>
                <span className="alert-action-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Redesigned Metrics Grid with Vector SVG Icons */}
      <div className="admin-stats-overview-grid">
        {/* Total Students */}
        <div className="admin-stat-box" onClick={() => onNavigate('subscriptions')}>
          <div className="admin-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Total Students</span>
            <span className="admin-stat-number">{stats.students.total}</span>
            <span className="admin-stat-badge green">
              +{stats.students.newLast7Days} new this week
            </span>
          </div>
        </div>

        {/* Published Courses */}
        <div className="admin-stat-box" onClick={() => onNavigate('courses')}>
          <div className="admin-stat-icon courses">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"></path>
              <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"></path>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Courses Published</span>
            <span className="admin-stat-number">
              {stats.courses.published}<span className="admin-stat-number-divider">/</span>{stats.courses.total}
            </span>
            <span className="admin-stat-badge grey">
              Manage curricula
            </span>
          </div>
        </div>

        {/* Total Enrollments */}
        <div className="admin-stat-box" onClick={() => onNavigate('subscriptions')}>
          <div className="admin-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Total Enrollments</span>
            <span className="admin-stat-number">{stats.enrollments.total}</span>
            <span className="admin-stat-badge green">
              Course purchases
            </span>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="admin-stat-box" onClick={() => onNavigate('courses')}>
          <div className="admin-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Completed Lessons</span>
            <span className="admin-stat-number">{stats.lessons.completed}</span>
            <span className="admin-stat-badge grey">
              Student progress
            </span>
          </div>
        </div>

        {/* Blog Posts */}
        <div className="admin-stat-box" onClick={() => onNavigate('blog')}>
          <div className="admin-stat-icon courses">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
              <path d="M18 14h-8"></path>
              <path d="M18 18h-8"></path>
              <path d="M18 10h-8"></path>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Blog Articles</span>
            <span className="admin-stat-number">
              {stats.blog.published}<span className="admin-stat-number-divider">/</span>{stats.blog.total}
            </span>
            <span className="admin-stat-badge grey">
              Published posts
            </span>
          </div>
        </div>

        {/* Mock Tests */}
        <div className="admin-stat-box" onClick={() => onNavigate('tests')}>
          <div className="admin-stat-icon courses">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <path d="m9 14 2 2 4-4"></path>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Mock Tests</span>
            <span className="admin-stat-number">
              {stats.tests.published}<span className="admin-stat-number-divider">/</span>{stats.tests.total}
            </span>
            <span className="admin-stat-badge grey">
              Practice sets
            </span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="admin-stat-box" onClick={() => onNavigate('subscriptions')}>
          <div className="admin-stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Active Subscriptions</span>
            <span className="admin-stat-number">{stats.subscriptions.active}</span>
            <span className="admin-stat-badge gold">
              {stats.subscriptions.expiringSoon} expiring in 7d
            </span>
          </div>
        </div>

        {/* Platform Admins */}
        <div className="admin-stat-box" onClick={() => onNavigate('admins')}>
          <div className="admin-stat-icon courses">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className="admin-stat-details">
            <span className="admin-stat-label">Admins &amp; Staff</span>
            <span className="admin-stat-number">{stats.admins.total}</span>
            <span className="admin-stat-badge grey">
              Access permissions
            </span>
          </div>
        </div>
      </div>

      {/* Redesigned Welcome Video Card */}
      <div className="admin-welcome-video-card">
        <div className="admin-welcome-video-header">
          <h2 className="admin-welcome-video-title">Hero Section Welcome Video</h2>
          <p className="admin-welcome-video-desc">
            The teacher introduction clip loaded on the homepage hero block.
          </p>
        </div>

        <div className="admin-welcome-video-body">
          {welcomeVideoUrl ? (
            <div className="admin-welcome-video-preview-wrapper">
              <video
                key={welcomeVideoUrl}
                controls
                src={`${window.API_BASE_URL}${welcomeVideoUrl}`}
                className="admin-welcome-video-player"
              />
              <span className="admin-welcome-video-status-tag">Live on Site</span>
            </div>
          ) : (
            <div className="admin-welcome-video-empty-preview">
              <span>No intro video uploaded yet</span>
            </div>
          )}

          <div className="admin-welcome-video-controls">
            <label className="btn-upload-video-custom">
              {uploadingVideo ? (
                <>
                  <span className="status-spinner"></span> Uploading video…
                </>
              ) : welcomeVideoUrl ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Replace Video Clip
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload Intro Video
                </>
              )}
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={(e) => uploadWelcomeVideo(e.target.files[0])}
                disabled={uploadingVideo}
                style={{ display: 'none' }}
              />
            </label>
            <p className="admin-welcome-video-file-tip">Supports MP4 or MOV formats. Max size 200MB.</p>
            {videoError && <p className="login-error" style={{ marginTop: 10 }}>{videoError}</p>}
          </div>
        </div>
      </div>

      {/* Redesigned Charts & Analytics Columns */}
      <div className="dash-two-col">
        {/* Signups Chart Card */}
        <div className="dash-section relative-position-container">
          <div className="chart-header-row">
            <h3 className="dash-section-title" style={{ margin: 0 }}>New Signups (Last 30 Days)</h3>
            <span className="chart-info-pill">{maxDailySignups} max/day</span>
          </div>

          <div className="admin-chart-svg-wrapper">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="admin-chart-svg">
              {/* Y Axis Grid lines */}
              {[0, 25, 50, 75, 100].map((value) => {
                const yVal = paddingTop + graphHeight - (value / 100) * graphHeight;
                const displayVal = Math.round((value / 100) * maxDailySignups);
                return (
                  <g key={`signup-grid-${value}`}>
                    <line
                      x1={paddingLeft}
                      y1={yVal}
                      x2={chartWidth - paddingRight}
                      y2={yVal}
                      className="chart-grid-line"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yVal + 4}
                      textAnchor="end"
                      className="chart-axis-text"
                    >
                      {displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {days.map((d, i) => {
                const barHeight = maxDailySignups > 0 ? (d.count / maxDailySignups) * graphHeight : 0;
                const xVal = paddingLeft + i * (graphWidth / N) + (graphWidth / N - barWidth) / 2;
                const yVal = paddingTop + graphHeight - barHeight;
                const isHovered = hoveredSignup && hoveredSignup.index === i;

                return (
                  <g key={d.date}>
                    <rect
                      x={xVal}
                      y={yVal}
                      width={barWidth}
                      height={Math.max(2, barHeight)}
                      rx="2"
                      fill={isHovered ? 'var(--seal)' : 'var(--jade)'}
                      opacity={isHovered ? 1 : 0.8}
                      className="admin-bar-rect"
                    />
                    {/* Hover Zone */}
                    <rect
                      x={paddingLeft + i * (graphWidth / N)}
                      y={paddingTop}
                      width={graphWidth / N}
                      height={graphHeight}
                      className="chart-bar-hover-zone"
                      onMouseEnter={() => {
                        setHoveredSignup({
                          index: i,
                          x: xVal + barWidth / 2,
                          y: yVal,
                          date: d.date,
                          count: d.count,
                        });
                      }}
                      onMouseLeave={() => setHoveredSignup(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating custom tooltip */}
            {hoveredSignup && (
              <div
                className="chart-tooltip-portal"
                style={{
                  left: `${(hoveredSignup.x / chartWidth) * 100}%`,
                  top: `${(hoveredSignup.y / chartHeight) * 100}%`,
                }}
              >
                <div className="chart-tooltip-title" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <strong>{formatShortDate(hoveredSignup.date)}</strong>
                </div>
                <div className="chart-tooltip-row" style={{ marginTop: 2 }}>
                  <span>Signups:</span>
                  <strong>{hoveredSignup.count} students</strong>
                </div>
              </div>
            )}
          </div>

          <div className="dash-chart-ticks">
            <span>{formatShortDate(days[0].date)}</span>
            <span>{formatShortDate(days[days.length - 1].date)}</span>
          </div>
        </div>

        {/* Top Courses list */}
        <div className="dash-section">
          <h3 className="dash-section-title">Top Courses by Enrollment</h3>
          {stats.enrollments.topCourses.length === 0 ? (
            <p className="dash-empty">No enrollments yet.</p>
          ) : (
            <div className="admin-courses-breakdown-list">
              {stats.enrollments.topCourses.map((c) => {
                const percent = maxCourseCount > 0 ? Math.round((c.count / maxCourseCount) * 100) : 0;
                return (
                  <div className="admin-course-enrollment-row" key={c.courseId}>
                    <div className="admin-course-enrollment-header">
                      <span className="admin-course-enrollment-name" title={c.title}>
                        {c.title}
                      </span>
                      <span className="admin-course-enrollment-count">
                        <strong>{c.count}</strong> students
                      </span>
                    </div>
                    <div className="admin-course-enrollment-track">
                      <div 
                        className="admin-course-enrollment-fill" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
