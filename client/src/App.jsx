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

  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then(res => res.json())
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
    loadCourses();
    loadAccess();
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
    loadCourses();
    loadAccess();
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
              Bhasha<span>Hub</span>
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

      <header>
        <div className="container header-row">
          <button className="logo" onClick={() => { setMobileMenuOpen(false); goHome(); }}>
            Bhasha<span>Hub</span>
          </button>

          <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a className="nav-link" href="#courses" onClick={() => { setMobileMenuOpen(false); goHome(); }}>Courses</a>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); setShowPinyin(true); }}>Pinyin</button>

            <button className="nav-link" onClick={() => { setMobileMenuOpen(false); goHome(); setShowTests(true); }}>Mock Tests</button>

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

      {user && user.role === 'admin' && showTestManager ? (
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
                <p className="eyebrow">Chinese · Nepali</p>
                <h1>
                  {user
                    ? `Welcome back, ${user.name}`
                    : 'Learn a language the way a teacher would show you'}
                </h1>
                <p className="hero-lead">
                  Structured lessons built by a real language teacher — script,
                  pronunciation, and vocabulary that build on each other, one
                  small step at a time.
                </p>
                <div className="hero-actions">
                  {!user && (
                    <button className="btn-primary" onClick={() => { setAuthView('register'); setShowLogin(true); }}>
                      Start learning free
                    </button>
                  )}
                  <a className="btn-ghost" href="#courses">Browse courses</a>
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
              <h2 className="section-title">Two worlds to explore</h2>
              <div className="worlds-grid">
                <figure className="world-photo">
                  <img src="/images/china1.jpg" alt="The Great Wall of China" />
                  <figcaption>
                    <span className="cap-word zh">长城</span>
                    <span className="cap-detail">cháng chéng · The Great Wall</span>
                  </figcaption>
                </figure>
                <figure className="world-photo">
                  <img src="/images/nepal1.jpg" alt="Boudhanath Stupa in Kathmandu" />
                  <figcaption>
                    <span className="cap-word ne">बौद्धनाथ</span>
                    <span className="cap-detail">bau·ddha·nāth · Boudhanath Stupa</span>
                  </figcaption>
                </figure>
                <figure className="world-photo">
                  <img src="/images/china2.jpg" alt="Chinese tea being poured" />
                  <figcaption>
                    <span className="cap-word zh">茶</span>
                    <span className="cap-detail">chá · tea</span>
                  </figcaption>
                </figure>
                <figure className="world-photo">
                  <img src="/images/nepal2.jpg" alt="A plate of Nepali momos" />
                  <figcaption>
                    <span className="cap-word ne">मम</span>
                    <span className="cap-detail">ma·ma · momo dumplings</span>
                  </figcaption>
                </figure>
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
                        onClick={() => { if (!locked) setActiveCourse(c); }}
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
                Bhasha<span>Hub</span>
              </button>
              <p className="footer-tag">语言 · भाषा — two languages, one journey</p>
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