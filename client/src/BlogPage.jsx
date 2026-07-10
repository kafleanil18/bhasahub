import { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';
const SERVER = 'http://localhost:5001';

function BlogPage({ onBack }) {
  const [blogs, setBlogs] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/blogs`)
      .then(res => res.json())
      .then(data => { setBlogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (active) {
    return (
      <section className="course-page container">
        <button className="back-btn" onClick={() => setActive(null)}>← Back to blog</button>
        <h1 className="section-title">{active.title}</h1>
        <p className="blog-meta">{active.author} · {new Date(active.createdAt).toLocaleDateString()}</p>
        {active.image && <img src={`${SERVER}${active.image}`} alt="" className="blog-full-image" />}
        <div className="blog-body">{active.body}</div>
      </section>
    );
  }

  return (
    <section className="course-page container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      <h1 className="section-title">Blog</h1>
      {loading && <p className="courses-empty">Loading...</p>}
      {!loading && blogs.length === 0 && <p className="courses-empty">No posts yet.</p>}
      <div className="course-cards">
        {blogs.map((b) => (
          <div className="course-card" key={b._id} onClick={() => setActive(b)}>
            {b.image ? (
              <img className="course-card-img" src={`${SERVER}${b.image}`} alt={b.title} />
            ) : (
              <div className="course-card-glyph"><span>📝</span></div>
            )}
            <div className="course-card-body">
              <h3 className="course-card-title">{b.title}</h3>
              <p className="course-card-desc">{b.body.slice(0, 100)}{b.body.length > 100 ? '…' : ''}</p>
              <span className="tag">{b.author} · {new Date(b.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BlogPage;