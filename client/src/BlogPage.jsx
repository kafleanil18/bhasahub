import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const API = window.API_BASE_URL + '/api';

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/images/')) return img;
  const base = window.API_BASE_URL || '';
  return img.startsWith('/') ? `${base}${img}` : `${base}/${img}`;
};

// Rich default articles to ensure the blog always looks vibrant and full
const FALLBACK_BLOGS = [
  {
    _id: 'fallback-tones-101',
    title: 'Mastering Mandarin Tones: The Complete Visual & Auditory Guide for Beginners',
    category: 'Phonetics & Tones',
    author: 'Anil BhasaHub',
    authorRole: 'Head Language Specialist',
    readTimeMin: 6,
    likes: 42,
    image: '/images/blog_tones.jpg',
    createdAt: new Date('2026-03-01').toISOString(),
    body: `
      <h2>Why Mandarin Tones Are the Foundation of Communication</h2>
      <p>Mandarin Chinese is a tonal language. The same syllable pronounced with different pitch contours carries completely distinct meanings. For example, <strong>mā (妈)</strong> means "mother," while <strong>mǎ (马)</strong> means "horse."</p>
      
      <blockquote class="blog-quote">
        "Tones are not an extra layer added on top of Chinese words—they are an intrinsic component of the word's pronunciation itself."
      </blockquote>

      <h3>The Four Main Tones + Neutral Tone</h3>
      <ul>
        <li><strong>First Tone (High Level - 55):</strong> High, steady pitch. Imagine singing a prolonged "ahhh" at a doctor's office.</li>
        <li><strong>Second Tone (Rising - 35):</strong> Starts at medium pitch and rises smoothly to high pitch. Similar to asking "What?" in English.</li>
        <li><strong>Third Tone (Low Dipping - 214):</strong> Dips down low before curving upward. Keep your vocal cords relaxed.</li>
        <li><strong>Fourth Tone (High Falling - 51):</strong> Starts very high and drops sharply down, like stating an emphatic "No!"</li>
        <li><strong>Neutral Tone (Light & Short):</strong> Pronounced softly without extra emphasis.</li>
      </ul>

      <div class="blog-callout info">
        <span class="callout-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
        </span>
        <div>
          <strong>Tone Pair Practice Tip:</strong>
          <p>Don't just practice single syllables! Master two-tone combinations (e.g., 1st + 4th tone like <em>jīn tiān</em> 今天 - today) to build natural speech rhythm.</p>
        </div>
      </div>
    `,
  },
  {
    _id: 'fallback-devanagari-phonetics',
    title: 'The Hidden Phonetic Bridge: Connecting Devanagari Sounds with Mandarin Pinyin',
    category: 'Grammar & Syntax',
    author: 'Anil BhasaHub',
    authorRole: 'Bilingual Curriculum Designer',
    readTimeMin: 8,
    likes: 38,
    image: '/images/blog_devanagari.jpg',
    createdAt: new Date('2026-03-05').toISOString(),
    body: `
      <h2>Why South Asian Learners Have an Advantage in Learning Chinese</h2>
      <p>Nepali and Hindi speakers using the Devanagari script possess a natural phonetic advantage when acquiring Mandarin Chinese. Devanagari's precise categorization of retroflex and aspirated sounds mirrors Pinyin initials closely.</p>
      
      <h3>Key Sound Mappings:</h3>
      <ul>
        <li><strong>Pinyin "zh" vs "ch":</strong> Pinyin <em>zh</em> maps directly to unvoiced retroflex (ट् / च्) while <em>ch</em> corresponds to aspirated retroflex (छ्).</li>
        <li><strong>Pinyin "b, p, m, f":</strong> Perfectly matches the Devanagari labial group (प, फ, म).</li>
        <li><strong>Nasal Vowels (an, ang, en, eng):</strong> Directly parallel the अनुस्वार (ं) sound in Devanagari phonetics.</li>
      </ul>

      <div class="blog-callout tip">
        <span class="callout-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </span>
        <div>
          <strong>Cognitive Mapping:</strong>
          <p>Leveraging familiar Devanagari mouth positions reduces accent hesitation and boosts listening comprehension speed by over 40%.</p>
        </div>
      </div>
    `,
  },
];

const CATEGORIES = [
  'All',
  'Phonetics & Tones',
  'Grammar & Syntax',
  'Character Mastery',
  'HSK 3.0 Prep',
  'Culture & Idioms',
];

function BlogPage({ onBack }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular' | 'readTime' | 'oldest'
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [likesMap, setLikesMap] = useState({});
  const [fontSize, setFontSize] = useState(17); // Reader font size in px
  const [scrollProgress, setScrollProgress] = useState(0);
  const [helpfulRating, setHelpfulRating] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchBlogs();
    loadStoredPreferences();
  }, []);

  useEffect(() => {
    if (!active) return;
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(100);
        return;
      }
      const currentScroll = window.scrollY;
      const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [active]);

  const loadStoredPreferences = () => {
    try {
      const savedBookmarks = localStorage.getItem('bhasahub_bookmarked_blogs');
      if (savedBookmarks) setBookmarkedIds(JSON.parse(savedBookmarks));

      const savedLikes = localStorage.getItem('bhasahub_blog_likes');
      if (savedLikes) setLikesMap(JSON.parse(savedLikes));
    } catch {
      // Fallback silently if storage unavailable
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/blogs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBlogs(data);
        } else {
          setBlogs(FALLBACK_BLOGS);
        }
      } else {
        setBlogs(FALLBACK_BLOGS);
      }
    } catch {
      setBlogs(FALLBACK_BLOGS);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const stripTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  const getReadTime = (text) => {
    const plain = stripTags(text);
    const words = plain.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 180));
  };

  const getCategory = (b) => b.category || 'General';

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Phonetics & Tones':
        return { bg: 'rgba(200, 54, 42, 0.1)', color: 'var(--seal)', border: 'rgba(200, 54, 42, 0.25)' };
      case 'Grammar & Syntax':
        return { bg: 'rgba(46, 107, 87, 0.1)', color: 'var(--jade)', border: 'rgba(46, 107, 87, 0.25)' };
      case 'Character Mastery':
        return { bg: 'rgba(201, 154, 60, 0.1)', color: 'var(--gold)', border: 'rgba(201, 154, 60, 0.25)' };
      case 'HSK 3.0 Prep':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)' };
      case 'Culture & Idioms':
        return { bg: 'rgba(147, 51, 234, 0.1)', color: '#7e22ce', border: 'rgba(147, 51, 234, 0.25)' };
      default:
        return { bg: 'var(--rice)', color: 'var(--mist)', border: 'var(--line)' };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BH';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0].toUpperCase();
  };

  const toggleBookmark = (e, blogId) => {
    e.stopPropagation();
    let updated;
    if (bookmarkedIds.includes(blogId)) {
      updated = bookmarkedIds.filter((id) => id !== blogId);
      showToast('Removed from saved bookmarks');
    } else {
      updated = [...bookmarkedIds, blogId];
      showToast('Saved to bookmarks!');
    }
    setBookmarkedIds(updated);
    localStorage.setItem('bhasahub_bookmarked_blogs', JSON.stringify(updated));
  };

  const handleLike = (e, blogId, initialLikes = 0) => {
    e.stopPropagation();
    const currentAdd = likesMap[blogId] || 0;
    const newAdd = currentAdd + 1;
    const updatedMap = { ...likesMap, [blogId]: newAdd };
    setLikesMap(updatedMap);
    localStorage.setItem('bhasahub_blog_likes', JSON.stringify(updatedMap));
    showToast(`Liked article (${(initialLikes || 0) + newAdd} total)`);
  };

  const handleShare = (blog) => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Link for "${blog?.title || 'Article'}" copied!`);
    } else {
      showToast('Share link: ' + url);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      showToast('Thank you for subscribing to BhasaHub Insights!');
    }
  };

  // Filtering and Sorting logic
  const filteredBlogs = blogs.filter((b) => {
    const cat = getCategory(b);
    const matchesCategory = selectedCategory === 'All' || cat === selectedCategory;
    const matchesBookmark = !onlyBookmarks || bookmarkedIds.includes(b._id);

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory && matchesBookmark;

    const titleMatch = (b.title || '').toLowerCase().includes(query);
    const bodyMatch = stripTags(b.body || '').toLowerCase().includes(query);
    const authorMatch = (b.author || '').toLowerCase().includes(query);
    const categoryMatch = cat.toLowerCase().includes(query);

    return matchesCategory && matchesBookmark && (titleMatch || bodyMatch || authorMatch || categoryMatch);
  });

  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === 'readTime') return getReadTime(b.body) - getReadTime(a.body);
    if (sortBy === 'popular') {
      const likesA = (a.likes || 0) + (likesMap[a._id] || 0);
      const likesB = (b.likes || 0) + (likesMap[b._id] || 0);
      return likesB - likesA;
    }
    return 0;
  });

  const featuredPost = sortedBlogs.length > 0 ? sortedBlogs[0] : null;
  const regularPosts = sortedBlogs.length > 1 ? sortedBlogs.slice(1) : [];

  // Count per category
  const getCategoryCount = (catName) => {
    if (catName === 'All') return blogs.length;
    return blogs.filter((b) => getCategory(b) === catName).length;
  };

  // -------------------------------------------------------------
  // ARTICLE READER VIEW
  // -------------------------------------------------------------
  if (active) {
    const category = getCategory(active);
    const catStyle = getCategoryColor(category);
    const readTime = active.readTimeMin || getReadTime(active.body);
    const authorInitials = getInitials(active.author);
    const isBookmarked = bookmarkedIds.includes(active._id);
    const currentLikes = (active.likes || 0) + (likesMap[active._id] || 0);

    const relatedArticles = blogs
      .filter((b) => b._id !== active._id && getCategory(b) === category)
      .slice(0, 2);

    return (
      <div className="blog-reader-page">
        {/* Top Reading Progress Bar */}
        <div className="blog-reading-progress-track">
          <div className="blog-reading-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>

        {/* Floating Top Navigation Header */}
        <div className="blog-sticky-bar">
          <div className="container blog-sticky-content">
            <button className="blog-back-pill" onClick={() => setActive(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Insights
            </button>

            <div className="blog-sticky-actions">
              {/* Font Size Adjusters */}
              <div className="font-size-controls">
                <button
                  className="font-size-btn"
                  title="Decrease font size"
                  onClick={() => setFontSize((prev) => Math.max(14, prev - 1))}
                  disabled={fontSize <= 14}
                >
                  A-
                </button>
                <span className="font-size-indicator">{fontSize}px</span>
                <button
                  className="font-size-btn"
                  title="Increase font size"
                  onClick={() => setFontSize((prev) => Math.min(23, prev + 1))}
                  disabled={fontSize >= 23}
                >
                  A+
                </button>
              </div>

              {/* Bookmark Action */}
              <button
                className={`sticky-action-btn ${isBookmarked ? 'active' : ''}`}
                onClick={(e) => toggleBookmark(e, active._id)}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                {isBookmarked ? 'Saved' : 'Save'}
              </button>

              {/* Like Action */}
              <button
                className="sticky-action-btn like-btn"
                onClick={(e) => handleLike(e, active._id, active.likes)}
                title="Appreciate this article"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 4 }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {currentLikes}
              </button>

              {/* Share Action */}
              <button className="sticky-action-btn" onClick={() => handleShare(active)} title="Share Article">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        <section className="blog-page-container container">
          {/* Toast Notification */}
          {toast && <div className="blog-toast">{toast}</div>}

          <div className="blog-reader-wrapper">
            {/* Article Meta Header */}
            <div className="blog-reader-header">
              <div className="blog-reader-tags">
                <span
                  className="blog-category-badge"
                  style={{
                    background: catStyle.bg,
                    borderColor: catStyle.border,
                    color: catStyle.color
                  }}
                >
                  {category}
                </span>
                <span className="blog-read-time-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {readTime} min read
                </span>
              </div>

              <h1 className="blog-reader-title">{active.title}</h1>

              {/* Author Info Card */}
              <div className="blog-reader-author-card">
                <div className="blog-meta-avatar-large">{authorInitials}</div>
                <div className="blog-meta-details-extended">
                  <span className="blog-meta-author-name">{active.author || 'BhasaHub Educator'}</span>
                  <span className="blog-meta-author-title">{active.authorRole || 'Language & Linguistics Specialist'}</span>
                  <span className="blog-meta-date-info">
                    Published on {new Date(active.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Cover Image */}
            {active.image ? (
              <div className="blog-reader-hero-img-box">
                <img
                  src={resolveImageUrl(active.image)}
                  alt={active.title}
                  className="blog-reader-hero-img"
                />
              </div>
            ) : (
              <div className="blog-reader-hero-glyph">
                <div className="glyph-pattern">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z"></path>
                    <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z"></path>
                  </svg>
                  <p>BhasaHub Insights Series</p>
                </div>
              </div>
            )}

            {/* Main Article Body with Custom Font Size */}
            <article
              className="blog-reader-body"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(active.body) }}
            />

            {/* Interactive End-of-Article Section */}
            <div className="blog-reader-footer-actions">
              {/* Helpfulness Rating */}
              <div className="blog-helpful-card">
                <h3>Was this article helpful?</h3>
                {helpfulRating ? (
                  <p className="helpful-thanks-msg">Thank you for your feedback!</p>
                ) : (
                  <div className="helpful-buttons">
                    <button className="helpful-btn" onClick={() => setHelpfulRating('yes')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                      Helpful
                    </button>
                    <button className="helpful-btn" onClick={() => setHelpfulRating('no')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                      </svg>
                      Needs improvement
                    </button>
                  </div>
                )}
              </div>

              {/* Share & Bookmark Bar */}
              <div className="blog-share-row">
                <button
                  className={`blog-large-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
                  onClick={(e) => toggleBookmark(e, active._id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {isBookmarked ? 'Article Saved in Bookmarks' : 'Bookmark this Article'}
                </button>
                <button
                  className="blog-large-action-btn like-btn"
                  onClick={(e) => handleLike(e, active._id, active.likes)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 6 }}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  Appreciate ({currentLikes})
                </button>
                <button className="blog-large-action-btn" onClick={() => handleShare(active)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Share Link
                </button>
              </div>
            </div>

            {/* Author Bio Box */}
            <div className="blog-author-bio-card">
              <div className="blog-meta-avatar-large">{authorInitials}</div>
              <div>
                <h4 className="author-bio-name">{active.author || 'BhasaHub Editorial Team'}</h4>
                <p className="author-bio-text">
                  {active.authorRole || 'Dedicated to crafting high-yield language learning guides, phonetics breakdowns, and cultural deep dives for Mandarin and Devanagari scholars.'}
                </p>
              </div>
            </div>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="related-articles-section">
                <h3 className="section-subheading">Related Articles in {category}</h3>
                <div className="related-grid">
                  {relatedArticles.map((rel) => {
                    const rCat = getCategory(rel);
                    const rStyle = getCategoryColor(rCat);
                    return (
                      <div key={rel._id} className="related-card" onClick={() => setActive(rel)}>
                        <div className="related-card-badge" style={{ background: rStyle.bg, color: rStyle.color }}>
                          {rCat}
                        </div>
                        <h4 className="related-card-title">{rel.title}</h4>
                        <p className="related-card-desc">{stripTags(rel.body).slice(0, 90)}…</p>
                        <span className="related-read-more">Read Story →</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // BLOG GRID & DISCOVERY MAIN VIEW
  // -------------------------------------------------------------
  return (
    <section className="blog-page-container container">
      {toast && <div className="blog-toast">{toast}</div>}

      {/* Top Header & Breadcrumb */}
      <div className="blog-header-top">
        <button className="back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to home
        </button>
        <span className="blog-badge-pill">MODERN LANGUAGE PERSPECTIVES</span>
      </div>

      {/* Hero Title Section */}
      <div className="blog-hero-section">
        <h1 className="blog-hero-title">
          BhasaHub <span>Journal &amp; Insights</span>
        </h1>
        <p className="blog-hero-subtitle">
          Master Mandarin phonetics, explore Devanagari linguistic connections, HSK 3.0 exam strategy, and Asian cultural heritage.
        </p>

        {/* Live Search & Sorting Control Bar */}
        <div className="blog-controls-bar">
          <div className="blog-search-box">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="blog-search-input"
              placeholder="Search articles by title, keyword, category, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="blog-sort-box">
            <label htmlFor="blog-sort-select">Sort by:</label>
            <select
              id="blog-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="blog-sort-select"
            >
              <option value="newest">Latest Articles</option>
              <option value="popular">Most Popular</option>
              <option value="readTime">Longest Read</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="blog-categories-wrapper">
          <div className="blog-categories-scroll">
            {CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat);
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span>{cat}</span>
                  <span className="category-pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Bookmarks Toggle Pill */}
          <button
            className={`bookmark-toggle-pill ${onlyBookmarks ? 'active' : ''}`}
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            title="Filter bookmarked articles"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={onlyBookmarks ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Bookmarks ({bookmarkedIds.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="blog-loading-state">
          <div className="spinner-ring" />
          <p>Loading curated insights...</p>
        </div>
      )}

      {!loading && sortedBlogs.length === 0 && (
        <div className="blog-empty-state">
          <span className="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <h3>No articles found</h3>
          <p>We couldn’t find any articles matching your search query or active category filters.</p>
          <button
            className="reset-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setOnlyBookmarks(false);
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {!loading && sortedBlogs.length > 0 && (
        <>
          {/* 1. Featured Banner Post */}
          {featuredPost && (
            <div className="featured-blog-card" onClick={() => setActive(featuredPost)}>
              <div className="featured-blog-media">
                {featuredPost.image ? (
                  <img
                    className="featured-blog-img"
                    src={resolveImageUrl(featuredPost.image)}
                    alt={featuredPost.title}
                  />
                ) : (
                  <div className="blog-card-glyph featured-glyph">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                    </svg>
                    <span className="glyph-sub">Featured Story</span>
                  </div>
                )}
                <span className="featured-ribbon">FEATURED ARTICLE</span>
              </div>

              <div className="featured-blog-content">
                <div className="featured-meta-header">
                  <span
                    className="blog-category-badge"
                    style={getCategoryColor(getCategory(featuredPost))}
                  >
                    {getCategory(featuredPost)}
                  </span>
                  <span className="featured-read-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {featuredPost.readTimeMin || getReadTime(featuredPost.body)} min read
                  </span>
                </div>

                <h2 className="featured-blog-title">{featuredPost.title}</h2>
                <p className="featured-blog-desc">
                  {stripTags(featuredPost.body).slice(0, 190)}…
                </p>

                <div className="blog-meta-flex">
                  <div className="blog-meta-avatar">{getInitials(featuredPost.author)}</div>
                  <div className="blog-meta-details">
                    <span className="blog-meta-author">{featuredPost.author || 'BhasaHub Educator'}</span>
                    <span className="blog-meta-date">
                      {new Date(featuredPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="featured-card-actions">
                    <button
                      className={`card-bookmark-btn ${bookmarkedIds.includes(featuredPost._id) ? 'bookmarked' : ''}`}
                      onClick={(e) => toggleBookmark(e, featuredPost._id)}
                      title="Bookmark story"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarkedIds.includes(featuredPost._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                    <span className="read-cta">Read Article →</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Regular Grid Posts */}
          {regularPosts.length > 0 && (
            <div className="blog-grid-section">
              <div className="blog-section-header">
                <h3 className="blog-grid-title">All Articles</h3>
                <span className="blog-results-counter">
                  Showing {regularPosts.length + 1} articles
                </span>
              </div>

              <div className="blog-grid">
                {regularPosts.map((b) => {
                  const preview = stripTags(b.body);
                  const category = getCategory(b);
                  const catStyle = getCategoryColor(category);
                  const readTime = b.readTimeMin || getReadTime(b.body);
                  const isBookmarked = bookmarkedIds.includes(b._id);
                  const likesCount = (b.likes || 0) + (likesMap[b._id] || 0);

                  return (
                    <div className="blog-card" key={b._id} onClick={() => setActive(b)}>
                      <div className="blog-card-img-wrapper">
                        {b.image ? (
                          <img
                            className="blog-card-img"
                            src={resolveImageUrl(b.image)}
                            alt={b.title}
                          />
                        ) : (
                          <div className="blog-card-glyph">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                          </div>
                        )}
                        <span
                          className="blog-card-tag"
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: catStyle.color,
                            borderColor: catStyle.border
                          }}
                        >
                          {category}
                        </span>

                        <button
                          className={`blog-card-bookmark-icon ${isBookmarked ? 'bookmarked' : ''}`}
                          onClick={(e) => toggleBookmark(e, b._id)}
                          title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                      </div>

                      <div className="blog-card-body">
                        <div className="blog-card-top-info">
                          <span className="blog-card-date">
                            {new Date(b.createdAt || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="blog-card-readtime">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 3 }}>
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {readTime} min
                          </span>
                        </div>

                        <h4 className="blog-card-title">{b.title}</h4>
                        <p className="blog-card-desc">
                          {preview.slice(0, 110)}
                          {preview.length > 110 ? '…' : ''}
                        </p>

                        <div className="blog-card-footer">
                          <div className="blog-meta-flex">
                            <div className="blog-meta-avatar small">{getInitials(b.author)}</div>
                            <span className="blog-meta-author small">{b.author || 'Educator'}</span>
                          </div>

                          <div className="blog-card-stats">
                            <span className="stat-item" onClick={(e) => handleLike(e, b._id, b.likes)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: 4 }}>
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                              {likesCount}
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

      {/* Newsletter Subscription Footer Card */}
      <div className="blog-newsletter-card">
        <div className="newsletter-content">
          <span className="newsletter-badge">BHASAHUB NEWSLETTER</span>
          <h2>Enhance Your Daily Language Mastery</h2>
          <p>Get weekly Mandarin grammar breakdowns, Devanagari root analysis, and HSK exam tips delivered to your inbox.</p>
        </div>

        {newsletterSubscribed ? (
          <div className="newsletter-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>You're subscribed! Check your inbox for our latest language guides.</p>
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              required
              placeholder="Enter your email address..."
              className="newsletter-input"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <button type="submit" className="newsletter-submit-btn">
              Subscribe Free
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default BlogPage;