import { useState, useEffect, useMemo } from 'react';

const API = window.API_BASE_URL + '/api';
const LEVELS = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4'];

function TestList({ onOpenTest, onBack }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('All');

  useEffect(() => {
    fetch(`${API}/tests`)
      .then(res => res.json())
      .then(data => { setTests(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredTests = useMemo(() => {
    if (levelFilter === 'All') return tests;
    return tests.filter((t) => (t.level || '').toLowerCase().includes(levelFilter.toLowerCase()));
  }, [tests, levelFilter]);

  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">HSK Mock Tests</h1>

      {!loading && tests.length > 0 && (
        <div className="test-level-filter" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`nav-btn${levelFilter === 'All' ? ' active' : ''}`}
            onClick={() => setLevelFilter('All')}
            style={levelFilter === 'All' ? { backgroundColor: 'var(--jade)', color: '#fff' } : undefined}
          >
            All
          </button>
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`nav-btn${levelFilter === lvl ? ' active' : ''}`}
              onClick={() => setLevelFilter(lvl)}
              style={levelFilter === lvl ? { backgroundColor: 'var(--jade)', color: '#fff' } : undefined}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="courses-empty">Loading tests...</p>}
      {!loading && tests.length === 0 && <p className="courses-empty">No tests available yet.</p>}
      {!loading && tests.length > 0 && filteredTests.length === 0 && (
        <p className="courses-empty">No {levelFilter} tests found.</p>
      )}

      <div className="course-cards">
        {filteredTests.map((t) => (
          <div className="course-card" key={t._id} onClick={() => onOpenTest(t._id)}>
            {t.image ? (
              <img className="course-card-img" src={`${window.API_BASE_URL}${t.image}`} alt={t.title} />
            ) : (
              <div className="course-card-glyph">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
            )}
            <div className="course-card-body">
              <h3 className="course-card-title">{t.title}</h3>
              <p className="course-card-desc">{t.description}</p>
              <span className="tag">{t.level} · {t.questions?.length || 0} questions</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TestList;