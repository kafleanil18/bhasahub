import { useState, useEffect } from 'react';
import { downloadCSV } from './csv';

const API = window.API_BASE_URL + '/api';

// Helper to determine if a word has Chinese characters
const isChineseWord = (word) => /[\u4e00-\u9fa5]/.test(word);

function AccuracyRows({ rows, labelKey }) {
  return (
    <div className="analytics-progress-cards-grid">
      {rows.map((r) => {
        const percent = r.percent || 0;
        // Determine status and style badge based on score range
        let badgeClass = 'progress-status-badge badge-review';
        let badgeLabel = 'Needs Review';
        if (percent >= 90) {
          badgeClass = 'progress-status-badge badge-mastered';
          badgeLabel = 'Mastered';
        } else if (percent >= 75) {
          badgeClass = 'progress-status-badge badge-proficient';
          badgeLabel = 'Proficient';
        } else if (percent >= 50) {
          badgeClass = 'progress-status-badge badge-developing';
          badgeLabel = 'Developing';
        }

        // Determine filling color based on score range
        let fillColor = 'var(--seal)';
        if (percent >= 90) fillColor = 'var(--jade)';
        else if (percent >= 75) fillColor = '#3a8f78';
        else if (percent >= 50) fillColor = 'var(--gold)';

        return (
          <div className="progress-row-card" key={r[labelKey] || r.title}>
            <div className="progress-row-header">
              <div className="progress-row-title-wrap">
                <span className="progress-row-title" title={r.title}>{r.title}</span>
              </div>
              <span className={badgeClass}>{badgeLabel}</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-track-g">
                <div 
                  className="progress-bar-fill-g" 
                  style={{ width: `${percent}%`, background: fillColor }} 
                />
              </div>
              <span className="progress-row-val">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressAnalytics({ user, onBack }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [revealedWords, setRevealedWords] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        // Set initial active tab based on available data
        const hasCourseData = resData.accuracyByCourse && resData.accuracyByCourse.length > 0;
        const hasLessonData = resData.accuracyByLesson && resData.accuracyByLesson.length > 0;
        const hasTestData = resData.accuracyByTest && resData.accuracyByTest.length > 0;
        if (hasCourseData) setActiveTab('courses');
        else if (hasLessonData) setActiveTab('lessons');
        else if (hasTestData) setActiveTab('tests');
      })
      .catch(() =>
        setData({
          streak: 0,
          overallAccuracy: 0,
          totalAttempts: 0,
          scoreTrend: [],
          accuracyByLesson: [],
          accuracyByCourse: [],
          accuracyByTest: [],
          weakestWords: [],
        })
      );
  }, [token]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Type', 'Label', 'Score', 'Total', 'Percent'],
      ...data.scoreTrend.map((a) => [
        new Date(a.date).toLocaleDateString(),
        a.type,
        a.label || '',
        a.score,
        a.total,
        a.percent,
      ]),
    ];
    downloadCSV('my-progress.csv', rows);
  };

  const toggleRevealWord = (vocabId) => {
    setRevealedWords((prev) => ({
      ...prev,
      [vocabId]: !prev[vocabId],
    }));
  };

  if (!data) {
    return (
      <section className="course-page container">
        <p className="courses-empty">Loading your progress...</p>
      </section>
    );
  }

  // Radial progress calculations
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((data.overallAccuracy || 0) / 100) * circumference;

  // Custom SVG Chart calculations
  const chartHeight = 180;
  const chartWidth = 720;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const N = data.scoreTrend.length;
  const barWidth = N > 0 ? Math.max(12, Math.min(42, (graphWidth / N) * 0.6)) : 0;

  const hasCourseData = data.accuracyByCourse && data.accuracyByCourse.length > 0;
  const hasLessonData = data.accuracyByLesson && data.accuracyByLesson.length > 0;
  const hasTestData = data.accuracyByTest && data.accuracyByTest.length > 0;
  const showTabs = hasCourseData || hasLessonData || hasTestData;

  return (
    <section className="course-page container">
      {/* Header and navigation */}
      <div className="analytics-header-section">
        <div className="analytics-title-group">
          <button className="btn-back-pill" onClick={onBack}>
            ← Back to dashboard
          </button>
          <p className="eyebrow" style={{ marginTop: 12 }}>My learning progress</p>
          <h1 className="section-title" style={{ margin: 0 }}>Your Learning Journey, {user.name}</h1>
          <p className="analytics-subtitle">Track your performance and master vocabulary through smart analytics.</p>
        </div>
        <div className="analytics-actions">
          {data.scoreTrend.length > 0 && (
            <button className="btn-export-csv" onClick={exportCsv}>
              ⬇ Export CSV Report
            </button>
          )}
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="analytics-overview-grid">
        {/* Streak card */}
        <div className="analytics-metric-card streak-card">
          <div className="metric-icon-wrap streak-card-glow">
            <span className="streak-icon-fire">🔥</span>
          </div>
          <div className="analytics-metric-content">
            <div className="metric-number-wrap">
              <span className="metric-number">{data.streak}</span>
              <span className="metric-unit">{data.streak === 1 ? 'day' : 'days'}</span>
            </div>
            <span className="metric-label">Active streak! Practice daily to protect your momentum.</span>
          </div>
        </div>

        {/* Overall Accuracy dial card */}
        <div className="analytics-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'transparent', padding: 0 }}>
            <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="88" height="88" className="radial-progress-svg">
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  className="radial-bg"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="radial-fill"
                />
              </svg>
              <span style={{ position: 'absolute', fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 'bold', color: 'var(--ink)' }}>
                {data.overallAccuracy}%
              </span>
            </div>
          </div>
          <div className="analytics-metric-content">
            <div className="metric-number-wrap">
              <span className="metric-number">{data.overallAccuracy}%</span>
            </div>
            <span className="metric-label">Average accuracy score across quizzes and tests.</span>
          </div>
        </div>

        {/* Quizzes taken card */}
        <div className="analytics-metric-card">
          <div className="metric-icon-wrap">
            <span>📝</span>
          </div>
          <div className="analytics-metric-content">
            <div className="metric-number-wrap">
              <span className="metric-number">{data.totalAttempts}</span>
              <span className="metric-unit">completed</span>
            </div>
            <span className="metric-label">Total vocabulary quizzes and mock tests attempts.</span>
          </div>
        </div>
      </div>

      {/* SVG score trend chart */}
      {data.scoreTrend.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Recent Performance Trend</h3>
            <span className="analytics-subtitle" style={{ margin: 0 }}>Hover bars to view score details</span>
          </div>
          <div className="chart-container-relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg-main">
              {/* Grid lines & axis labels */}
              {[0, 25, 50, 75, 100].map((value) => {
                const yVal = paddingTop + graphHeight - (value / 100) * graphHeight;
                return (
                  <g key={`grid-${value}`}>
                    <line
                      x1={paddingLeft}
                      y1={yVal}
                      x2={chartWidth - paddingRight}
                      y2={yVal}
                      className="chart-grid-line"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={yVal + 4}
                      textAnchor="end"
                      className="chart-axis-text"
                    >
                      {value}%
                    </text>
                  </g>
                );
              })}

              {/* Chart Bars */}
              {data.scoreTrend.map((a, i) => {
                const percent = Math.max(a.percent, 3); // min height of 3% for visibility
                const barHeightVal = (percent / 100) * graphHeight;
                const xVal =
                  paddingLeft +
                  i * (graphWidth / N) +
                  (graphWidth / N - barWidth) / 2;
                const yVal = paddingTop + graphHeight - barHeightVal;
                
                // Color based on performance
                let fill = 'var(--jade)';
                if (a.percent < 50) fill = 'var(--seal)';
                else if (a.percent < 75) fill = 'var(--gold)';

                const isActive = hoveredBar && hoveredBar.index === i;

                return (
                  <g key={a.id || i}>
                    {/* The visible bar */}
                    <rect
                      x={xVal}
                      y={yVal}
                      width={barWidth}
                      height={barHeightVal}
                      rx="4"
                      fill={fill}
                      opacity={isActive ? 1 : 0.8}
                      className={`chart-bar-rect ${isActive ? 'active' : ''}`}
                    />
                    
                    {/* The interactive invisible overlay for easy hovering */}
                    <rect
                      x={paddingLeft + i * (graphWidth / N)}
                      y={paddingTop}
                      width={graphWidth / N}
                      height={graphHeight}
                      className="chart-bar-hover-zone"
                      onMouseEnter={() => {
                        setHoveredBar({
                          index: i,
                          x: xVal + barWidth / 2,
                          y: yVal,
                          data: a,
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip */}
            {hoveredBar && (
              <div
                className="chart-tooltip-portal"
                style={{
                  left: `${(hoveredBar.x / chartWidth) * 100}%`,
                  top: `${(hoveredBar.y / chartHeight) * 100}%`,
                }}
              >
                <div className="chart-tooltip-title">
                  <span>{hoveredBar.data.type === 'test' ? 'Mock Test' : 'Quiz'}</span>
                  <span>{hoveredBar.data.percent}%</span>
                </div>
                <div className="chart-tooltip-row">
                  <span>Score:</span>
                  <strong>{hoveredBar.data.score}/{hoveredBar.data.total}</strong>
                </div>
                <div className="chart-tooltip-row">
                  <span>Topic:</span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 80 }}>
                    {hoveredBar.data.label || 'N/A'}
                  </span>
                </div>
                <div className="chart-tooltip-row">
                  <span>Date:</span>
                  <span>{new Date(hoveredBar.data.date).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs navigation for course/lesson/test breakdowns */}
      {showTabs && (
        <div className="analytics-section" style={{ marginTop: 40 }}>
          <div className="tabs-navigation">
            {hasCourseData && (
              <button
                className={`tab-btn-pill ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                Course Progress
              </button>
            )}
            {hasLessonData && (
              <button
                className={`tab-btn-pill ${activeTab === 'lessons' ? 'active' : ''}`}
                onClick={() => setActiveTab('lessons')}
              >
                📖 Lesson Performance
              </button>
            )}
            {hasTestData && (
              <button
                className={`tab-btn-pill ${activeTab === 'tests' ? 'active' : ''}`}
                onClick={() => setActiveTab('tests')}
              >
                🎯 Mock Tests
              </button>
            )}
          </div>

          <div className="tab-contents">
            {activeTab === 'courses' && hasCourseData && (
              <AccuracyRows rows={data.accuracyByCourse} labelKey="courseId" />
            )}
            {activeTab === 'lessons' && hasLessonData && (
              <AccuracyRows rows={data.accuracyByLesson} labelKey="lessonId" />
            )}
            {activeTab === 'tests' && hasTestData && (
              <AccuracyRows rows={data.accuracyByTest} labelKey="testId" />
            )}
          </div>
        </div>
      )}

      {/* Smart Review Vocabulary Deck */}
      {data.weakestWords.length > 0 && (
        <div className="analytics-section" style={{ marginTop: 44 }}>
          <h3 className="analytics-heading" style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', marginBottom: 6 }}>
            Vocabulary Focus Deck
          </h3>
          <p className="review-cards-intro">
            These words were missed during quizzes. Tap a card to test yourself and reveal its definition.
          </p>

          <div className="vocab-deck-grid">
            {data.weakestWords.map((w) => {
              const isZh = isChineseWord(w.word);
              const isRevealed = !!revealedWords[w.vocabularyId];

              return (
                <div
                  role="button"
                  tabIndex={0}
                  className="vocab-review-card"
                  key={w.vocabularyId}
                  onClick={() => toggleRevealWord(w.vocabularyId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleRevealWord(w.vocabularyId);
                    }
                  }}
                  title="Click to reveal/hide translation"
                >
                  <div className="vocab-card-header">
                    <span className={`vocab-word-text ${isZh ? 'zh' : 'ne'}`}>
                      {w.word}
                    </span>
                    <span className="vocab-misses-tag">
                      Missed {w.misses}×
                    </span>
                  </div>

                  <span className="vocab-pron-badge">
                    {w.pronunciation ? `[${w.pronunciation}]` : ''}
                  </span>

                  <div className="vocab-meaning-area">
                    {isRevealed ? (
                      <span className="vocab-meaning-text">
                        {w.meaning}
                      </span>
                    ) : (
                      <span className="vocab-reveal-btn">
                        Tap to reveal
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.totalAttempts === 0 && (
        <div className="dash-empty" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--mist)', marginBottom: 20 }}>
            No progress data found yet. Take a vocabulary quiz or complete a mock test to start building your learning profile!
          </p>
          <button className="btn-primary" onClick={onBack}>
            Get Started
          </button>
        </div>
      )}
    </section>
  );
}

export default ProgressAnalytics;

