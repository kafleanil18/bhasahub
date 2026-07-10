import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';

function TestList({ onOpenTest, onBack }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/tests`)
      .then(res => res.json())
      .then(data => { setTests(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">HSK Mock Tests</h1>

      {loading && <p className="courses-empty">Loading tests...</p>}
      {!loading && tests.length === 0 && <p className="courses-empty">No tests available yet.</p>}

      <div className="course-cards">
        {tests.map((t) => (
          <div className="course-card" key={t._id} onClick={() => onOpenTest(t._id)}>
            <div className="course-card-glyph"><span>📝</span></div>
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