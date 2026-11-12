import { useState, useEffect } from 'react';
import { downloadCSV } from '../utils/csv';
import StudioAnalytics from './StudioAnalytics';

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

function CourseLessonProgress({ rows }) {
  const courses = rows.reduce((groups, row) => {
    (groups[row.courseId] ||= { title: row.courseTitle, level: row.courseLevel, categories: [] }).categories.push(row);
    return groups;
  }, {});
  return (
    <section className="analytics-course-progress" aria-labelledby="analytics-course-progress-title">
      <div className="analytics-course-progress-heading"><div><span className="dash-eyebrow">COURSE COMPLETION</span><h2 id="analytics-course-progress-title">Vocabulary & grammar progress</h2><p>See how many published lessons you’ve completed in each part of your course.</p></div><span className="analytics-course-progress-symbol" aria-hidden="true">✓</span></div>
      <div className="analytics-course-progress-grid">
        {Object.entries(courses).map(([courseId, course]) => (
          <article className="analytics-course-progress-card" key={courseId}>
            <div className="analytics-course-progress-title"><div><h3>{course.title}</h3><span>{course.level || 'Course progress'}</span></div><span className="analytics-course-progress-total">{course.categories.reduce((sum, row) => sum + row.completed, 0)}<small> complete</small></span></div>
            <div className="analytics-category-progress-list">
              {course.categories.map((row) => (
                <div className="analytics-category-progress" key={`${courseId}-${row.category}`}>
                  <div className="analytics-category-progress-label"><span>{row.category}</span><strong>{row.completed} <small>of {row.total}</small></strong></div>
                  <progress value={row.completed} max={row.total || 1} aria-label={`${course.title} ${row.category}: ${row.completed} of ${row.total} lessons completed`}/>
                  <span className="analytics-category-progress-percent">{row.percent}% complete</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProgressAnalytics({ user, onBack }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [revealedWords, setRevealedWords] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Could not load your learning analytics.');
        return resData;
      })
      .then((resData) => {
        if (controller.signal.aborted) return;
        setData(resData);
        // Set initial active tab based on available data
        const hasCourseData = resData.accuracyByCourse && resData.accuracyByCourse.length > 0;
        const hasLessonData = resData.accuracyByLesson && resData.accuracyByLesson.length > 0;
        const hasTestData = resData.accuracyByTest && resData.accuracyByTest.length > 0;
        if (hasCourseData) setActiveTab('courses');
        else if (hasLessonData) setActiveTab('lessons');
        else if (hasTestData) setActiveTab('tests');
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message || 'Could not load your learning analytics. Check your connection and try again.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, refreshKey]);

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

  const playWordAudio = (e, wordObj) => {
    e.stopPropagation();
    if (wordObj.audioUrl) {
      const fullUrl = (wordObj.audioUrl.startsWith('http://') || wordObj.audioUrl.startsWith('https://'))
        ? wordObj.audioUrl
        : `${window.API_BASE_URL || ''}${wordObj.audioUrl.startsWith('/') ? '' : '/'}${wordObj.audioUrl}`;
      new Audio(fullUrl).play().catch(() => {});
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(wordObj.word);
      ut.lang = isChineseWord(wordObj.word) ? 'zh-CN' : 'en-US';
      window.speechSynthesis.speak(ut);
    }
  };

  if (loading && !data) {
    return (
      <section className="course-page container analytics-page">
        <div className="analytics-state"><span className="analytics-state-mark" aria-hidden="true">↗</span><p>Gathering your learning activity…</p></div>
      </section>
    );
  }
  if (error && !data) {
    return <section className="course-page container analytics-page"><div className="analytics-state analytics-error-state" role="alert"><span className="analytics-state-mark" aria-hidden="true">!</span><h1>We couldn’t load your progress</h1><p>{error}</p><div><button className="btn-primary" onClick={() => setRefreshKey(value => value + 1)}>Try again</button><button className="btn-back-pill" onClick={onBack}>← Back to dashboard</button></div></div></section>;
  }

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
    <section className="course-page container analytics-page">
      {/* Header Banner */}
      <div className="analytics-hero">
        <div className="analytics-hero-header">
          <button className="btn-back-pill" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <div className="analytics-hero-actions">
          <button className="btn-back-pill analytics-refresh" onClick={() => setRefreshKey(value => value + 1)} disabled={loading} aria-label="Refresh learning analytics">{loading ? 'Refreshing…' : '↻ Refresh'}</button>
          {data.scoreTrend.length > 0 && (
            <button className="btn-export-csv" onClick={exportCsv}>
              ⬇ Export CSV Report
            </button>
          )}
          </div>
        </div>
        <div className="analytics-hero-body">
          <span className="dash-eyebrow">Learning Analytics</span>
          <h1 className="analytics-hero-title">Your progress, at a glance</h1>
          <p className="analytics-hero-subtext">A clear picture of the lessons you’ve completed, your practice results, and what to review next.</p>
        </div>
      </div>

      {error && <div className="analytics-inline-error" role="alert"><span>{error}</span><button className="listening-secondary" onClick={() => setRefreshKey(value => value + 1)}>Try again</button></div>}

      {data.courseProgress?.length > 0 && <CourseLessonProgress rows={data.courseProgress} />}

      <StudioAnalytics refreshKey={refreshKey} />

      {/* SVG score trend chart */}
      {data.scoreTrend.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
              <h3 className="chart-title">Recent learning activity</h3>
              <span className="analytics-subtitle" style={{ margin: 0 }}>Quiz and mock test scores, plus completed lessons · latest {N} events</span>
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
                const isLessonCompletion = a.type === 'lesson-completion';
                const percent = Math.max(a.percent, 3);
                const barHeightVal = isLessonCompletion ? 0 : (percent / 100) * graphHeight;
                const xVal =
                  paddingLeft +
                  i * (graphWidth / N) +
                  (graphWidth / N - barWidth) / 2;
                const yVal = paddingTop + graphHeight - barHeightVal;
                
                let fill = isLessonCompletion ? 'var(--jade)' : 'var(--jade)';
                if (a.percent < 50) fill = 'var(--seal)';
                else if (a.percent < 75) fill = 'var(--gold)';

                const isActive = hoveredBar && hoveredBar.index === i;

                return (
                  <g key={a.id || i}>
                    {!isLessonCompletion && <rect
                      x={xVal}
                      y={yVal}
                      width={barWidth}
                      height={barHeightVal}
                      rx="4"
                      fill={fill}
                      opacity={isActive ? 1 : 0.85}
                      className={`chart-bar-rect ${isActive ? 'active' : ''}`}
                    />}
                    {isLessonCompletion && <g className="analytics-completion-marker" aria-hidden="true"><line x1={xVal + barWidth / 2} y1={paddingTop + graphHeight - 13} x2={xVal + barWidth / 2} y2={paddingTop + graphHeight} /><circle cx={xVal + barWidth / 2} cy={paddingTop + graphHeight - 13} r="5" /></g>}
                    <rect
                      x={paddingLeft + i * (graphWidth / N)}
                      y={paddingTop}
                      width={graphWidth / N}
                      height={graphHeight}
                      className="chart-bar-hover-zone"
                      role="button"
                      tabIndex={0}
                      aria-label={`${a.type === 'lesson-completion' ? `Completed ${a.category} lesson: ${a.label}` : `${a.type === 'hsk-mock-test' || a.type === 'test' ? 'Mock test' : 'Vocabulary quiz'}: ${a.score} of ${a.total}`} on ${new Date(a.date).toLocaleDateString()}`}
                      onClick={() => setHoveredBar({ index: i, x: xVal + barWidth / 2, y: isLessonCompletion ? paddingTop + graphHeight - 13 : yVal, data: a })}
                      onFocus={() => setHoveredBar({ index: i, x: xVal + barWidth / 2, y: isLessonCompletion ? paddingTop + graphHeight - 13 : yVal, data: a })}
                      onBlur={() => setHoveredBar(null)}
                      onMouseEnter={() => {
                        setHoveredBar({
                          index: i,
                          x: xVal + barWidth / 2,
                          y: isLessonCompletion ? paddingTop + graphHeight - 13 : yVal,
                          data: a,
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="analytics-chart-legend" aria-label="Chart legend"><span><i className="analytics-legend-score"/>Assessment score</span><span><i className="analytics-legend-completion"/>Lesson completed</span></div>

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
                  <span>{hoveredBar.data.type === 'lesson-completion' ? 'Lesson completed' : hoveredBar.data.type === 'test' || hoveredBar.data.type === 'hsk-mock-test' ? 'Mock test' : 'Vocabulary quiz'}</span>
                  {hoveredBar.data.type !== 'lesson-completion' && <span>{hoveredBar.data.percent}%</span>}
                </div>
                {hoveredBar.data.type !== 'lesson-completion' && <div className="chart-tooltip-row"><span>Score:</span><strong>{hoveredBar.data.score}/{hoveredBar.data.total}</strong></div>}
                <div className="chart-tooltip-row">
                  <span>{hoveredBar.data.type === 'lesson-completion' ? 'Lesson:' : 'Topic:'}</span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 130 }}>
                    {hoveredBar.data.label || 'N/A'}
                  </span>
                </div>
                {hoveredBar.data.type === 'lesson-completion' && <div className="chart-tooltip-row"><span>Type:</span><span>{hoveredBar.data.category}</span></div>}
                {hoveredBar.data.type === 'lesson-completion' && hoveredBar.data.course && <div className="chart-tooltip-row"><span>Course:</span><span>{hoveredBar.data.course}</span></div>}
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
          <h3 className="analytics-heading" style={{ fontSize: '20px', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
            Vocabulary Focus Deck 🎴
          </h3>
          <p className="review-cards-intro">
            These words were missed during recent quizzes. Tap a card to reveal its translation, or click the speaker button to hear native pronunciation.
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
                    <span className={`vocab-word-text ${isZh ? 'zh' : 'en'}`}>
                      {w.word}
                    </span>
                    <div className="vocab-action-group" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="vocab-audio-btn"
                        onClick={(e) => playWordAudio(e, w)}
                        title="Listen to native audio pronunciation"
                      >
                        🔊
                      </button>
                      <span className="vocab-misses-tag">
                        Missed {w.misses}×
                      </span>
                    </div>
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
                        Tap to reveal definition
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.totalAttempts === 0 && !data.completedLessons && (
        <div className="analytics-first-step">
          <span className="analytics-first-step-icon" aria-hidden="true">✦</span>
          <div><h2>Your learning record starts here</h2><p>Complete a lesson or a short vocabulary quiz and your progress will appear on this page.</p></div>
          <button className="btn-primary" onClick={onBack}>Explore my courses</button>
        </div>
      )}
    </section>
  );
}

export default ProgressAnalytics;
