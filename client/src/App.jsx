import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import AdminPanel from './AdminPanel';
import CoursePage from './CoursePage';

function App() {
  const [serverOk, setServerOk] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [showAdmin, setShowAdmin] = useState(false);
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);

  const loadCourses = () => {
    fetch('http://localhost:5001/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(() => setCourses([]));
  };

  useEffect(() => {
    fetch('http://localhost:5001/api/health')
      .then(res => res.json())
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));

    loadCourses();

    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAdmin(false);
  };

  const goHome = () => {
    setShowLogin(false);
    setShowAdmin(false);
    setActiveCourse(null);
    loadCourses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header>
        <div className="container">
          <button className="logo" onClick={goHome}>
            Bhasha<span>Hub</span>
          </button>
          <nav>
            {user ? (
              <span className="nav-user">
                {user.name} {user.role === 'admin' && <em>(admin)</em>}
                {user.role === 'admin' && (
                  <button className="nav-btn" onClick={() => setShowAdmin(true)}>
                    Manage courses
                  </button>
                )}
                <button className="nav-btn" onClick={handleLogout}>Log out</button>
              </span>
            ) : (
              <button className="nav-btn" onClick={() => setShowLogin(true)}>Sign in</button>
            )}
          </nav>
        </div>
      </header>

      {user && user.role === 'admin' && showAdmin ? (
        <AdminPanel onBack={goHome} />
      ) : activeCourse ? (
        <CoursePage course={activeCourse} onBack={() => setActiveCourse(null)} />
      ) : !user && showLogin ? (
        <div>
          {authView === 'login' ? (
            <>
              <Login
                onLogin={(u) => {
                  setUser(u);
                  setShowLogin(false);
                }}
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
          {/* ---------- Hero ---------- */}
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
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setAuthView('register');
                        setShowLogin(true);
                      }}
                    >
                      Start learning free
                    </button>
                  )}
                  <a className="btn-ghost" href="#courses">Browse courses</a>
                </div>
              </div>

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
            </div>
          </section>

          {/* ---------- How it works ---------- */}
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
                <span className="feature-glyph ne">श्र</span>
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

          {/* ---------- Word of the day ---------- */}
          <section className="wotd">
            <div className="container wotd-inner">
              <span className="wotd-label">Word of the day</span>
              <span className="wotd-word zh">谢谢</span>
              <span className="wotd-detail">xiè xie — thank you</span>
              <span className="wotd-sep">·</span>
              <span className="wotd-word ne">धन्यवाद</span>
              <span className="wotd-detail">dhan·ya·bād — thank you</span>
            </div>
          </section>

          {/* ---------- Courses (live from database) ---------- */}
          <section className="courses-section" id="courses">
            <div className="container">
              <h2 className="section-title">Courses</h2>
              {courses.length === 0 ? (
                <p className="courses-empty">
                  Courses are coming soon — check back shortly!
                </p>
              ) : (
                <div className="courses">
                  {courses.map((c) => (
                    <div className="card" key={c._id} onClick={() => setActiveCourse(c)}>
                      <span className={`glyph ${c.language === 'chinese' ? 'zh' : 'ne'}`}>
                        {c.glyph}
                      </span>
                      <h2>{c.title}</h2>
                      <p>{c.description}</p>
                      <span className="tag">{c.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ---------- Footer ---------- */}
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