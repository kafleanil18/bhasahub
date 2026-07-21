import { useState, useEffect } from 'react';
import { downloadCSV } from './csv';

const API = window.API_BASE_URL + '/api';

function AccuracyRows({ rows, labelKey }) {
  return (
    <div className="analytics-bar-rows">
      {rows.map((r) => (
        <div className="analytics-bar-row" key={r[labelKey] || r.title}>
          <span className="analytics-bar-label">{r.title}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${r.percent}%` }} />
          </div>
          <span className="analytics-bar-value">{r.percent}%</span>
        </div>
      ))}
    </div>
  );
}

function ProgressAnalytics({ user, onBack }) {
  const [data, setData] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API}/analytics/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setData)
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

  if (!data) {
    return (
      <section className="course-page container">
        <p className="courses-empty">Loading your progress...</p>
      </section>
    );
  }

  return (
    <section className="course-page container">
      <button className="back-btn" style={{ margin: 0, marginBottom: 16 }} onClick={onBack}>
        ← Back
      </button>
      <p className="eyebrow">My learning</p>
      <h1 className="section-title">Your progress, {user.name}</h1>

      <div className="subs-stats-grid">
        <div className="subs-stat-card">
          <div className="subs-stat-icon active">🔥</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{data.streak}</span>
            <span className="subs-stat-label">Day streak</span>
          </div>
        </div>
        <div className="subs-stat-card">
          <div className="subs-stat-icon courses">🎯</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{data.overallAccuracy}%</span>
            <span className="subs-stat-label">Overall accuracy</span>
          </div>
        </div>
        <div className="subs-stat-card">
          <div className="subs-stat-icon active">📝</div>
          <div className="subs-stat-info">
            <span className="subs-stat-number">{data.totalAttempts}</span>
            <span className="subs-stat-label">Quizzes &amp; tests taken</span>
          </div>
        </div>
      </div>

      {data.scoreTrend.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-heading">Recent activity</h3>
          <div className="analytics-trend-wrap">
            <div className="analytics-trend-axis">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="analytics-trend-chart">
              {data.scoreTrend.map((a) => (
                <div
                  className="analytics-trend-bar"
                  key={a.id}
                  style={{ height: `${Math.max(a.percent, 2)}%` }}
                  title={`${a.label || (a.type === 'test' ? 'Test' : 'Quiz')} · ${new Date(
                    a.date
                  ).toLocaleDateString()} · ${a.score}/${a.total} (${a.percent}%)`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {data.accuracyByCourse.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-heading">Accuracy by course</h3>
          <AccuracyRows rows={data.accuracyByCourse} labelKey="courseId" />
        </div>
      )}

      {data.accuracyByLesson.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-heading">Accuracy by lesson</h3>
          <AccuracyRows rows={data.accuracyByLesson} labelKey="lessonId" />
        </div>
      )}

      {data.accuracyByTest.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-heading">Accuracy by test</h3>
          <AccuracyRows rows={data.accuracyByTest} labelKey="testId" />
        </div>
      )}

      {data.weakestWords.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-heading">Words to review</h3>
          <ul className="analytics-weak-list">
            {data.weakestWords.map((w) => (
              <li key={w.vocabularyId} className="analytics-weak-item">
                <span className="analytics-weak-word">{w.word}</span>
                <span className="analytics-weak-pron">{w.pronunciation}</span>
                <span className="analytics-weak-meaning">{w.meaning}</span>
                <span className="analytics-weak-misses">missed {w.misses}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.totalAttempts === 0 && (
        <div className="dash-empty">
          <p>Take a vocabulary quiz or a mock test to start building your progress history.</p>
        </div>
      )}

      {data.scoreTrend.length > 0 && (
        <button className="nav-btn" onClick={exportCsv} style={{ marginTop: 24 }}>
          ⬇ Export CSV
        </button>
      )}
    </section>
  );
}

export default ProgressAnalytics;
