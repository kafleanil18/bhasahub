import { useState, useEffect } from 'react';

const API = window.API_BASE_URL + '/api';
const SERVER = window.API_BASE_URL;

const resolveUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER}${url}`;
};

function SlidesPage({ onBack }) {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/slides`)
      .then(res => res.json())
      .then(data => { setSlides(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ---------- Single slide viewer ----------
  if (active) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={() => setActive(null)}>← Back to slides</button>
        <h1 className="section-title">{active.title}</h1>
        {active.description && <p className="course-desc">{active.description}</p>}

        <div
          className="slide-viewer"
          onContextMenu={(e) => e.preventDefault()}
        >
          <iframe
            src={resolveUrl(active.pdfUrl || active.embedUrl)}
            title={active.title}
            frameBorder="0"
            allowFullScreen
            className="slide-iframe"
          />
          {/* transparent shield reduces right-click / drag on the frame */}
          <div className="slide-shield" onContextMenu={(e) => e.preventDefault()} />
        </div>

        <p className="slide-note">📌 These slides are for viewing only.</p>
      </section>
    );
  }

  // ---------- Slides list ----------
  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Slides</h1>
      <p className="course-desc">PDF slide packs for your lessons.</p>

      {loading && <p className="courses-empty">Loading slides...</p>}
      {!loading && slides.length === 0 && <p className="courses-empty">No slides yet.</p>}

      <div className="course-cards">
        {slides.map((s) => (
          <div className="course-card" key={s._id} onClick={() => setActive(s)}>
            <div className="course-card-glyph"><span>📊</span></div>
            <div className="course-card-body">
              <h3 className="course-card-title">{s.title}</h3>
              {s.description && <p className="course-card-desc">{s.description}</p>}
              <span className="tag">View PDF →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SlidesPage;
