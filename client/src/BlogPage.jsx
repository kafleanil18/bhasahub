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

  const stripTags = (html) => (html || '').replace(/<[^>]+>/g, '');

  const getReadTime = (bodyText) => {
    const raw = stripTags(bodyText);
    const words = raw ? raw.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  const getCategory = (title, body) => {
    const text = `${title} ${body}`.toLowerCase();
    if (text.includes('pinyin') || text.includes('pronounce') || text.includes('tone')) return 'Pronunciation';
    if (text.includes('character') || text.includes('stroke') || text.includes('write')) return 'Characters';
    if (text.includes('nepali') || text.includes('nepal') || text.includes('devanagari')) return 'Nepali';
    if (text.includes('hsk') || text.includes('exam') || text.includes('test')) return 'HSK Prep';
    if (text.includes('grammar') || text.includes('sentence') || text.includes('structure')) return 'Grammar';
    if (text.includes('culture') || text.includes('festival') || text.includes('food') || text.includes('history')) return 'Culture';
    return 'Language Tips';
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name[0].toUpperCase();
  };

  // Article Reader View
  if (active) {
    const category = getCategory(active.title, active.body);
    const readTime = getReadTime(active.body);
    const authorInitials = getInitials(active.author);

    return (
      <section className="blog-page-container container">
        <div className="blog-reader-view">
          <button className="back-btn" onClick={() => setActive(null)} style={{ marginBottom: 24 }}>
            ← Back to all posts
          </button>

          <span className="featured-label" style={{ background: 'var(--jade)', fontSize: 10, padding: '3px 8px' }}>
            {category}
          </span>
          <h1 className="blog-reader-title">{active.title}</h1>

          {/* Author Meta Row */}
          <div className="blog-reader-author-card">
            <div className="blog-meta-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>
              {authorInitials}
            </div>
            <div className="blog-meta-details">
              <span className="blog-meta-author" style={{ fontSize: 14 }}>{active.author || 'Educator'}</span>
              <span className="blog-meta-date" style={{ fontSize: 12, marginTop: 2 }}>
                {new Date(active.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · ⏱ {readTime} min read
              </span>
            </div>
          </div>

          {/* Banner Image */}
          {active.image && (
            <div className="blog-reader-img-wrapper">
              <img src={`${SERVER}${active.image}`} alt={active.title} className="blog-reader-img" />
            </div>
          )}

          {/* Body Content */}
          <div className="blog-reader-body" dangerouslySetInnerHTML={{ __html: active.body }} />
        </div>
      </section>
    );
  }

  const featuredPost = blogs[0];
  const regularPosts = blogs.slice(1);

  return (
    <section className="blog-page-container container">
      <button className="back-btn" onClick={onBack}>← Back to home</button>
      
      <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 48 }}>
        <h1 className="section-title" style={{ fontSize: 38, marginBottom: 8 }}>BhasaHub Insights</h1>
        <p style={{ color: 'var(--mist)', fontSize: 16 }}>
          Explore Chinese grammar guides, pronunciation walkthroughs, and language cultural heritage.
        </p>
      </div>

      {loading && <p className="courses-empty">Loading Insights...</p>}
      {!loading && blogs.length === 0 && <p className="courses-empty">No articles published yet.</p>}

      {!loading && blogs.length > 0 && (
        <>
          {/* 1. Featured Banner Post */}
          {featuredPost && (
            <div className="featured-blog-card" onClick={() => setActive(featuredPost)}>
              {featuredPost.image ? (
                <img className="featured-blog-img" src={`${SERVER}${featuredPost.image}`} alt={featuredPost.title} />
              ) : (
                <div className="blog-card-glyph" style={{ minHeight: 280 }}><span style={{ fontSize: 48 }}>📝</span></div>
              )}
              <div className="featured-blog-content">
                <span className="featured-label">Featured Article</span>
                <h2 className="featured-blog-title">{featuredPost.title}</h2>
                <p className="featured-blog-desc">
                  {stripTags(featuredPost.body).slice(0, 160)}…
                </p>
                <div className="blog-meta-flex">
                  <div className="blog-meta-avatar">
                    {getInitials(featuredPost.author)}
                  </div>
                  <div className="blog-meta-details">
                    <span className="blog-meta-author">{featuredPost.author || 'Educator'}</span>
                    <span className="blog-meta-date">
                      {new Date(featuredPost.createdAt).toLocaleDateString()} · ⏱ {getReadTime(featuredPost.body)} min read
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Regular Grid Posts */}
          {regularPosts.length > 0 && (
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, marginBottom: 24, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                More Articles
              </h3>
              <div className="blog-grid">
                {regularPosts.map((b) => {
                  const preview = stripTags(b.body);
                  const category = getCategory(b.title, b.body);
                  const readTime = getReadTime(b.body);
                  
                  return (
                    <div className="blog-card" key={b._id} onClick={() => setActive(b)}>
                      <div className="blog-card-img-wrapper">
                        {b.image ? (
                          <img className="blog-card-img" src={`${SERVER}${b.image}`} alt={b.title} />
                        ) : (
                          <div className="blog-card-glyph"><span>📝</span></div>
                        )}
                        <span className="blog-card-tag">{category}</span>
                      </div>
                      <div className="blog-card-body">
                        <h4 className="blog-card-title">{b.title}</h4>
                        <p className="blog-card-desc">
                          {preview.slice(0, 100)}{preview.length > 100 ? '…' : ''}
                        </p>
                        <div className="blog-meta-flex">
                          <div className="blog-meta-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                            {getInitials(b.author)}
                          </div>
                          <div className="blog-meta-details">
                            <span className="blog-meta-author" style={{ fontSize: 12 }}>{b.author || 'Educator'}</span>
                            <span className="blog-meta-date" style={{ fontSize: 10 }}>
                              {new Date(b.createdAt).toLocaleDateString()} · ⏱ {readTime} min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default BlogPage;