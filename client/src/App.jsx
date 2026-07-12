import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import AdminPanel from './AdminPanel';
import CoursePage from './CoursePage';
import LessonManager from './LessonManager';
import Dashboard from './Dashboard';
import LanguageChoice from './LanguageChoice';
import NepaliPage from './NepaliPage';
import PinyinModal from './PinyinModal';
import ChangePassword from './ChangePassword';
import FeedbackModal from './FeedbackModal';
import FeedbackInbox from './FeedbackInbox';
import TestManager from './TestManager';
import TestList from './TestList';
import TestTaker from './TestTaker';
import BlogManager from './BlogManager';
import BlogPage from './BlogPage';
import TestimonialModal from './TestimonialModal';
import TestimonialManager from './TestimonialManager';

function App() {
  const wotdList = [
    { zh: '谢谢', zhP: 'xiè xie', ne: 'धन्यवाद', neP: 'dhan·ya·bād', meaning: 'thank you' },
    { zh: '你好', zhP: 'nǐ hǎo', ne: 'नमस्ते', neP: 'na·mas·te', meaning: 'hello' },
    { zh: '再见', zhP: 'zài jiàn', ne: 'बिदा', neP: 'bi·dā', meaning: 'goodbye' },
    { zh: '朋友', zhP: 'péng you', ne: 'साथी', neP: 'sā·thi', meaning: 'friend' },
    { zh: '水', zhP: 'shuǐ', ne: 'पानी', neP: 'pā·ni', meaning: 'water' },
    { zh: '爱', zhP: 'ài', ne: 'माया', neP: 'mā·yā', meaning: 'love' },
    { zh: '家', zhP: 'jiā', ne: 'घर', neP: 'ghar', meaning: 'home' },
    { zh: '吃', zhP: 'chī', ne: 'खानु', neP: 'khā·nu', meaning: 'to eat' },
    { zh: '好', zhP: 'hǎo', ne: 'राम्रो', neP: 'rām·ro', meaning: 'good' },
    { zh: '学习', zhP: 'xué xí', ne: 'सिक्नु', neP: 'sik·nu', meaning: 'to learn' },
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const wotd = wotdList[dayOfYear % wotdList.length];

  const [language, setLanguage] = useState(null);
  const [serverOk, setServerOk] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [showAdmin, setShowAdmin] = useState(false);
  const [courses, setCourses] = useState([]);
  const [access, setAccess] = useState({});
  const [activeCourse, setActiveCourse] = useState(null);
  const [manageCourse, setManageCourse] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState('all');
  const [showPinyin, setShowPinyin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showTestManager, setShowTestManager] = useState(false);
  const [activeTestId, setActiveTestId] = useState(null);
  const [showBlog, setShowBlog] = useState(false);
  const [showBlogManager, setShowBlogManager] = useState(false);
  const [footerBlogs, setFooterBlogs] = useState([]);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [showTestimonialManager, setShowTestimonialManager] = useState(false);
  const [testimonials, setTestimonials] = useState([]);

  const loadCourses = () => {
    fetch('http://localhost:5001/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(() => setCourses([]));
  };

  const loadAccess = () => {
    const t = localStorage.getItem('token');
    if (!t) return;
    fetch('http://localhost:5001/api/enrollments/access', {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(res => res.json())
      .then(data => {
        const map = {};
        (Array.isArray(data) ? data : []).forEach(a => { map[a.courseId] = a; });
        setAccess(map);
      })
      .catch(() => {});
  };

  const loadFooterBlogs = () => {
    fetch('http://localhost:5001/api/blogs')
      .then(res => res.json())
      .then(data => setFooterBlogs(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setFooterBlogs([]));
  };

  const loadTestimonials = () => {
    fetch('http://localhost:5001/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]));
  };

  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then(res => res.json())
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
    loadCourses();
    loadAccess();
    loadFooterBlogs();
    loadTestimonials();
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAdmin(false);
    setManageCourse(null);
    setShowDashboard(false);
    setShowInbox(false);
    setShowTests(false);
    setShowTestManager(false);
    setActiveTestId(null);
    setShowBlog(false);
    setShowBlogManager(false);
    setShowTestimonialManager(false);
    setAccess({});
  };

  const goHome = () => {
    setShowLogin(false);
    setShowAdmin(false);
    setActiveCourse(null);
    setManageCourse(null);
    setShowDashboard(false);
    setShowInbox(false);
    setShowTests(false);
    setShowTestManager(false);
    setActiveTestId(null);
    setShowBlog(false);
    setShowBlogManager(false);
    setShowTestimonialManager(false);
    loadCourses();
    loadAccess();
    loadFooterBlogs();
    loadTestimonials();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getHskLevel = (course) => {
    const lvl = (course.level || '').toLowerCase();
    if (lvl.includes('1')) return 'HSK 1';
    if (lvl.includes('2')) return 'HSK 2';
    if (lvl.includes('3')) return 'HSK 3';
    if (lvl.includes('4')) return 'HSK 4';
    return 'Other';
  };

  const hskLevels = ['all', ...Array.from(new Set(courses.map(getHskLevel)))];
  const filteredCourses = levelFilter === 'all'
    ? courses
    : courses.filter((c) => getHskLevel(c) === levelFilter);

  // ---------- Language choice screen ----------
  if (!language) {
    return <LanguageChoice onChoose={(lang) => setLanguage(lang)} />;
  }

  // ---------- Nepali placeholder ----------
  if (language === 'nepali') {
    return (
      <>
        <header>
          <div className="container header-row">
            <button className="logo" onClick={() => setLanguage(null)}>
              Learn Chinese with <span>Anil</span>
            </button>
            <nav className="main-nav">
              <button className="nav-link" onClick={() => setLanguage(null)}>Switch language</button>
            </nav>
          </div>
        </header>
        <NepaliPage onBack={() => setLanguage(null)} />
      </>
    );
  }

  // ---------- Chinese app ----------
  return (
    <>
      {showPinyin && <PinyinModal onClose={() => setShowPinyin(false)} />}
      {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
      {showFeedback && <FeedbackModal user={user} onClose={() => setShowFeedback(false)} />}
      {showTestimonial && <TestimonialModal user={user} onClose={() => { setShowTestimonial(false); loadTestimonials(); }} />}

      <header>
        <div className="container header-row">
          <button className="logo" onClick={() => { setMobileMenuOpen(false); goHome(); }}>
            Learn Chinese with <span>Anil</span>
          </button>

          <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a className="nav-link" href="#courses" onClick={() => { setMobileMenuOpen(false); goHome(); }}>Courses</a>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowPinyin(true); }}>Pinyin</button>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); goHome(); setShowTests(true); }}>Mock Tests</button>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); goHome(); setShowBlog(true); }}>Blog</button>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowFeedback(true); }}>Message us</button>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setLanguage(null); }}>Switch language</button>

            {user && (
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); setShowDashboard(true); }}>
                My Courses
              </button>
            )}

            {user && user.role === 'admin' && (
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); setShowAdmin(true); }}>
                Manage courses
              </button>
            )}

            {user && user.role === 'admin' && (
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); setShowTestManager(true); }}>
                Manage tests
              </button>
            )}

            {user && user.role === 'admin' && (
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); setShowBlogManager(true); }}>
                Manage blog
              </button>
            )}

            {user && user.role === 'admin' && (
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); goHome(); setShowTestimonialManager(true); }}>
                Testimonials
              </button>
            )}

            {user && user.role === 'admin' && (
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); setShowInbox(true); }}>
                Feedback
              </button>
            )}

            {user ? (
              <div className="user-menu">
                <button className="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
                  {user.name} {user.role === 'admin' && <em>(admin)</em>} <span className="caret">▾</span>
                </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <button onClick={() => { setShowUserMenu(false); setMobileMenuOpen(false); setShowChangePassword(true); }}>
                      Change password
                    </button>
                    <button onClick={() => { setShowUserMenu(false); setMobileMenuOpen(false); handleLogout(); }}>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-btn" onClick={() => { setMobileMenuOpen(false); setShowLogin(true); }}>Sign in</button>
            )}
          </nav>
        </div>
      </header>

      {user && user.role === 'admin' && showTestimonialManager ? (
        <TestimonialManager onBack={goHome} />
      ) : user && user.role === 'admin' && showBlogManager ? (
        <BlogManager user={user} onBack={goHome} />
      ) : showBlog ? (
        <BlogPage onBack={goHome} />
      ) : user && user.role === 'admin' && showTestManager ? (
        <TestManager onBack={goHome} />
      ) : activeTestId ? (
        <TestTaker testId={activeTestId} onBack={() => { setActiveTestId(null); setShowTests(true); }} />
      ) : showTests ? (
        <TestList onOpenTest={(id) => { setShowTests(false); setActiveTestId(id); }} onBack={goHome} />
      ) : user && user.role === 'admin' && manageCourse ? (
        <LessonManager course={manageCourse} onBack={() => setManageCourse(null)} />
      ) : user && user.role === 'admin' && showInbox ? (
        <FeedbackInbox onBack={goHome} />
      ) : user && user.role === 'admin' && showAdmin ? (
        <AdminPanel onBack={goHome} onManageLessons={(c) => setManageCourse(c)} />
      ) : user && showDashboard ? (
        <Dashboard
          user={user}
          onOpenCourse={(c) => { setShowDashboard(false); setActiveCourse(c); }}
          onBrowse={goHome}
        />
      ) : activeCourse ? (
        <CoursePage course={activeCourse} onBack={() => setActiveCourse(null)} user={user} />
      ) : !user && showLogin ? (
        <div>
          {authView === 'login' ? (
            <>
              <Login
                onLogin={(u) => { setUser(u); setShowLogin(false); loadAccess(); }}
                onBack={() => setShowLogin(false)}
              />
              <p className="auth-switch">
                New here?{' '}
                <button onClick={() => setAuthView('register')}>Create an account</button>
              </p>
            </>
          ) : (
            <>
              <Register
                onRegistered={() => setAuthView('login')}
                onBack={() => setShowLogin(false)}
              />
              <p className="auth-switch">
                Already have an account?{' '}
                <button onClick={() => setAuthView('login')}>Sign in</button>
              </p>
            </>
          )}
        </div>
      ) : (
        <main>
          <section className="hero">
            <div className="container hero-grid">
              <div className="hero-text">
                <p className="eyebrow">Learn Mandarin Chinese!</p>
                <h1>
                  {user
                    ? `Welcome back, ${user.name}`
                    : 'Learn a language the way a teacher would show you'}
                </h1>
                <p className="hero-lead">
                  Learn structured lessons, PinYin, Tones, Vocabulary, and Spoken Chinese! One
                  small step at a time.
                </p>
                <div className="hero-actions">
                  {!user && (
                    <button className="btn-primary" onClick={() => { setAuthView('register'); setShowLogin(true); }}>
                      Start learning free
                    </button>
                  )}
                  <a className="btn-primary" href="#courses">Browse courses</a>
                </div>
              </div>

              <div className="hero-media">
                <div className="hero-cards">
                  <div className="script-card tilt-left">
                    <span className="annotation">nǐ&nbsp;hǎo</span>
                    <span className="word zh">你好</span>
                    <span className="meaning">hello · Chinese</span>
                  </div>
                  <div className="script-card tilt-right">
                    <span className="annotation">na·mas·te</span>
                    <span className="word ne">नमस्ते</span>
                    <span className="meaning">hello · Nepali</span>
                  </div>
                </div>

                <div className="hero-video">
                  <div
                    className="video-wrap"
                    onClick={(e) => {
                      const v = e.currentTarget.querySelector('video');
                      const btn = e.currentTarget.querySelector('.big-play');
                      if (v.paused) { v.play(); btn.style.display = 'none'; }
                    }}
                  >
                    <video
                      preload="metadata"
                      poster="/images/china1.jpg"
                      controls
                      onPlay={(e) => {
                        const btn = e.currentTarget.parentElement.querySelector('.big-play');
                        if (btn) btn.style.display = 'none';
                      }}
                      onPause={(e) => {
                        const btn = e.currentTarget.parentElement.querySelector('.big-play');
                        if (btn) btn.style.display = 'flex';
                      }}
                    >
                      <source src="/video/intro.mp4" type="video/mp4" />
                      Your browser doesn't support the video tag.
                    </video>
                    <button className="big-play" aria-label="Play intro video">
                      <span className="play-triangle">▶</span>
                    </button>
                  </div>
                  <p className="hero-video-caption">A quick welcome from your teacher</p>
                </div>
              </div>
            </div>
          </section>

          <section className="features">
            <div className="container">
              <div className="feature">
                <span className="feature-glyph zh">字</span>
                <h3>Read the script</h3>
                <p>
                  Start from zero with Pinyin and Devanagari — every character
                  introduced with pronunciation you can actually say.
                </p>
              </div>
              <div className="feature">
                <span className="feature-glyph ne">听</span>
                <h3>Hear it spoken</h3>
                <p>
                  Native audio on every word and phrase, recorded clearly —
                  listen, repeat, and compare until it sticks.
                </p>
              </div>
              <div className="feature">
                <span className="feature-glyph zh">步</span>
                <h3>Progress step by step</h3>
                <p>
                  Lessons build on each other like a real course — track what
                  you've mastered and what comes next.
                </p>
              </div>
            </div>
          </section>

          <section className="wotd">
            <div className="container wotd-inner">
              <span className="wotd-label">Word of the day</span>
              <span className="wotd-word zh">{wotd.zh}</span>
              <span className="wotd-detail">{wotd.zhP} — {wotd.meaning}</span>
              <span className="wotd-sep">·</span>
              <span className="wotd-word ne">{wotd.ne}</span>
              <span className="wotd-detail">{wotd.neP} — {wotd.meaning}</span>
            </div>
          </section>

          <section className="worlds">
            <div className="container">
              <h2 className="section-title">Real results from real learners</h2>
              {testimonials.length === 0 ? (
                <p className="courses-empty">Be the first to share your experience!</p>
              ) : (
                <div className="testimonials-grid">
                  {testimonials.map((t) => (
                    <div className="testimonial-card" key={t._id}>
                      <span className="testimonial-stars">{'★'.repeat(t.rating)}</span>
                      <p className="testimonial-text">"{t.text}"</p>
                      <div className="testimonial-person">
                        {t.photo ? (
                          <img className="testimonial-photo" src={`http://localhost:5001${t.photo}`} alt={t.name} />
                        ) : (
                          <span className="testimonial-photo-placeholder">{t.name.charAt(0)}</span>
                        )}
                        <span className="testimonial-name">{t.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {user && (
                <div className="testimonials-cta">
                  <button className="btn-primary" onClick={() => setShowTestimonial(true)}>
                    Share your experience
                  </button>
                </div>
              )}
            </div>
          </section>



<section className="team-section">
            <div className="container">
              <h2 className="section-title team-title">Meet Our Team</h2>
              <p className="team-intro">BhashaHub is brought to you by a team of passion and expertise.</p>
              <div className="team-grid">
                <div className="team-card">
                  <img src="/public/image.jpg" alt="Anil Kafle" className="team-photo" />
                  <h3 className="team-name">Anil Kafle</h3>
                  <p className="team-role">Founder & Teacher</p>
                </div>
                <div className="team-card">
                  <img src="/public/image.jpg" alt="Team member" className="team-photo" />
                  <h3 className="team-name">Name Here</h3>
                  <p className="team-role">Developer</p>
                </div>
                <div className="team-card">
                  <img src="/public/image.jpg" alt="Team member" className="team-photo" />
                  <h3 className="team-name">Name Here</h3>
                  <p className="team-role">Project Manager</p>
                </div>
              </div>
            </div>
          </section>






          <section className="courses-section" id="courses">
            <div className="container">
              <h2 className="section-title">Courses</h2>

              <div className="level-pills">
                {hskLevels.map((lvl, i) => (
                  <button
                    key={lvl}
                    className={`level-pill pill-color-${i % 4} ${levelFilter === lvl ? 'active' : ''}`}
                    onClick={() => setLevelFilter(lvl)}
                  >
                    {lvl === 'all' ? 'All Courses' : lvl}
                  </button>
                ))}
              </div>

              {filteredCourses.length === 0 ? (
                <p className="courses-empty">No courses in this level yet.</p>
              ) : (
                <div className="course-cards">
                  {filteredCourses.map((c) => {
                    const a = access[c._id];
                    const locked = user && a && !a.unlocked;
                    return (
                      <div
                        className={`course-card ${locked ? 'card-locked' : ''}`}
                        key={c._id}
                        onClick={() => {
                          if (locked) return;
                          if (!user) { setAuthView('login'); setShowLogin(true); return; }
                          setActiveCourse(c);
                        }}
                      >
                        {c.image ? (
                          <img className="course-card-img" src={`http://localhost:5001${c.image}`} alt={c.title} />
                        ) : (
                          <div className="course-card-glyph">
                            <span className={c.language === 'chinese' ? 'zh' : 'ne'}>{c.glyph}</span>
                          </div>
                        )}
                        <div className="course-card-body">
                          <h3 className="course-card-title">{c.title}</h3>
                          <p className="course-card-desc">{c.description}</p>
                          {locked ? (
                            <span className="tag tag-locked">🔒 Finish previous course</span>
                          ) : (
                            <span className="tag">{c.level}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

         <footer className="site-footer">
            <div className="container footer-inner">
        
              <button className="logo" onClick={goHome}>
                Learn Chinese with <span>Anil</span>
              </button>
              
              <p className="footer-tag">Speak Chinese ASAP!</p>
       

              <div className="footer-social">
                <a href="https://facebook.com/YOURPAGE" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-link">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z"/></svg>
                </a>
                <a href="https://youtube.com/@YOURCHANNEL" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="social-link">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.09 0 12 0 12s0 3.91.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.91 24 12 24 12s0-3.91-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>
                </a>
                <a href="https://instagram.com/YOURPROFILE" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.94 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>
                </a>
                <a href="https://linkedin.com/in/YOURPROFILE" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="social-link">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
                </a>
              </div>
              <div className="footer-links">
  <a
    href="https://www.hskcourse.com/tool/pinyin-chart.html"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    Pinyin Chart
  </a>
</div>

              {footerBlogs.length > 0 && (
                <div className="footer-blog">
                  <h3>From the blog</h3>
                  <div className="footer-blog-list">
                    {footerBlogs.map((b) => (
                      <button
                        className="footer-blog-item"
                        key={b._id}
                        onClick={() => { goHome(); setShowBlog(true); }}
                      >
                        <span className="footer-blog-title">{b.title}</span>
                        <span className="footer-blog-date">{new Date(b.createdAt).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="status">
                {serverOk === null && <span>Checking server...</span>}
                {serverOk === true && (
                  <span><span className="dot"></span>Server connected</span>
                )}
                {serverOk === false && (
                  <span><span className="dot offline"></span>Server offline</span>
                )}
              </p>
            </div>
          </footer>
        </main>
      )}
    </>
  );
}

export default App;