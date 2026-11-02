import AdminSidebar from './components/AdminSidebar';
import SiteHeader from './components/SiteHeader';
import HomeFooter from './home/HomeFooter';
import HomeTeam from './home/HomeTeam';
import HomeTestimonials from './home/HomeTestimonials';
import WordOfTheDay from './home/WordOfTheDay';
import HomeFeatures from './home/HomeFeatures';
import HomeCourses from './home/HomeCourses';
import HomeHero from './home/HomeHero';
import wotdList from './data/wordsOfTheDay';
import renderTeamAvatar from './components/TeamAvatar';
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import './home.css';
import './flag-theme.css';

const Login = lazy(() => import('./auth/Login'));
const Register = lazy(() => import('./auth/Register'));
const ForgotPassword = lazy(() => import('./auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./auth/ResetPassword'));
const AdminPanel = lazy(() => import('./admin/AdminPanel'));
const CoursePage = lazy(() => import('./courses/CoursePage'));
const LessonManager = lazy(() => import('./admin/LessonManager'));
const ClassCalendarPage = lazy(() => import('./dashboard/ClassCalendar'));
const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const ProgressAnalytics = lazy(() => import('./dashboard/ProgressAnalytics'));
const LanguageChoice = lazy(() => import('./practice/LanguageChoice'));
const NepaliPage = lazy(() => import('./practice/NepaliPage'));
const PinyinPage = lazy(() => import('./practice/PinyinPage'));
const ChangePassword = lazy(() => import('./auth/ChangePassword'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const FeedbackInbox = lazy(() => import('./admin/FeedbackInbox'));
const TestManager = lazy(() => import('./admin/TestManager'));
const TestList = lazy(() => import('./tests/TestList'));
const TestTaker = lazy(() => import('./tests/TestTaker'));
const TestimonialModal = lazy(() => import('./components/TestimonialModal'));
const TestimonialManager = lazy(() => import('./admin/TestimonialManager'));
const SubscriptionManager = lazy(() => import('./admin/SubscriptionManager'));
const UserManager = lazy(() => import('./admin/UserManager'));
const TeamManager = lazy(() => import('./admin/TeamManager'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AuditLog = lazy(() => import('./admin/AuditLog'));
const HanziTracePage = lazy(() => import('./practice/HanziTracePage'));
const ConversationPracticePage = lazy(() => import('./practice/ConversationPractice'));
const ToneScorer = lazy(() => import('./practice/ToneScorer'));



function AppContent() {

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const wotd = wotdList[dayOfYear % wotdList.length];

  const [language, setLanguage] = useState(() => localStorage.getItem('bhasha_language') || 'chinese');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (lang) {
      localStorage.setItem('bhasha_language', lang);
    }
  };
  const [serverOk, setServerOk] = useState(null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [courses, setCourses] = useState([]);
  const [access, setAccess] = useState({});
  const [activeCourse, setActiveCourse] = useState(null);
  const [manageCourse, setManageCourse] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState('all');
  const [showPinyinPage, setShowPinyinPage] = useState(false);
  const [pinyinBackToAdmin, setPinyinBackToAdmin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showTestManager, setShowTestManager] = useState(false);
  const [activeTestId, setActiveTestId] = useState(null);
  const [testTakerBackToManager, setTestTakerBackToManager] = useState(false);
  const [showHanziTrace, setShowHanziTrace] = useState(false);
  const [showConversationPractice, setShowConversationPractice] = useState(false);
  const [showClassCalendar, setShowClassCalendar] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [showTestimonialManager, setShowTestimonialManager] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const testimonialsScrollRef = useRef(null);
  const scrollTestimonials = (direction) => {
    const el = testimonialsScrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.testimonial-card')?.offsetWidth || 280;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
  };
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [pendingTestimonialsCount, setPendingTestimonialsCount] = useState(0);
  const [pendingAccessRequestsCount, setPendingAccessRequestsCount] = useState(0);
  const [activeTeamMember, setActiveTeamMember] = useState(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [myAccessDays, setMyAccessDays] = useState(null);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [teamPhotos, setTeamPhotos] = useState([]);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState('');
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('reset'));
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);
  const [lockedNotice, setLockedNotice] = useState(null);
  const [showToneScorer, setShowToneScorer] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const heroVideoRef = useRef(null);

  const handleVideoToggle = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const playNihaoAudio = () => {
    try {
      setIsPlayingAudio(true);
      const audio = new Audio('/nihao.m4a');
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        const backup = new Audio('/nihao.webm');
        backup.onended = () => setIsPlayingAudio(false);
        backup.onerror = () => {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance('你好');
            u.lang = 'zh-CN';
            u.rate = 0.85;
            u.onend = () => setIsPlayingAudio(false);
            u.onerror = () => setIsPlayingAudio(false);
            window.speechSynthesis.speak(u);
          } else {
            setIsPlayingAudio(false);
          }
        };
        backup.play().catch(() => setIsPlayingAudio(false));
      };
      audio.play().catch(() => {
        const backup = new Audio('/nihao.webm');
        backup.onended = () => setIsPlayingAudio(false);
        backup.onerror = () => setIsPlayingAudio(false);
        backup.play().catch(() => setIsPlayingAudio(false));
      });
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const [isPlayingWotd, setIsPlayingWotd] = useState(false);
  const [isPlayingFeatureAudio, setIsPlayingFeatureAudio] = useState(false);

  const fallbackSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingWotd(false);
      utterance.onerror = () => setIsPlayingWotd(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingWotd(false);
    }
  };

  const playWotdAudio = (word) => {
    try {
      setIsPlayingWotd(true);
      const audioMap = {
        '你好': '/nihao.m4a',
        '谢谢': '/xiexie.m4a',
        '再见': '/zaijian.m4a',
        '不客气': '/bukeqi.m4a'
      };

      if (audioMap[word]) {
        const audio = new Audio(audioMap[word]);
        audio.onended = () => setIsPlayingWotd(false);
        audio.onerror = () => fallbackSpeech(word);
        audio.play().catch(() => fallbackSpeech(word));
      } else {
        fallbackSpeech(word);
      }
    } catch {
      setIsPlayingWotd(false);
    }
  };

  const playFeatureSample = () => {
    try {
      setIsPlayingFeatureAudio(true);
      const audio = new Audio('/xiexie.m4a');
      audio.onended = () => setIsPlayingFeatureAudio(false);
      audio.onerror = () => setIsPlayingFeatureAudio(false);
      audio.play().catch(() => setIsPlayingFeatureAudio(false));
    } catch {
      setIsPlayingFeatureAudio(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.nav-dropdown-wrapper')) {
        setShowPracticeMenu(false);
        setShowLangMenu(false);
      }
      if (!e.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // role helpers
  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  const loadCourses = () => {
    fetch(window.API_BASE_URL + '/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(() => setCourses([]));
  };

  const loadAccess = () => {
    const t = localStorage.getItem('token');
    if (!t) return;
    fetch(window.API_BASE_URL + '/api/enrollments/access', {
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

  const loadTestimonials = () => {
    fetch(window.API_BASE_URL + '/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]));
  };

  const loadTeamPhotos = () => {
    fetch(window.API_BASE_URL + '/api/team')
      .then(res => res.json())
      .then(data => {
        setTeamPhotos(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  };

  const loadSiteSettings = () => {
    fetch(window.API_BASE_URL + '/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.welcomeVideoUrl) setWelcomeVideoUrl(data.welcomeVideoUrl);
      })
      .catch(() => {});
  };

  const loadMyAccess = () => {
    const t = localStorage.getItem('token');
    if (!t) { setMyAccessDays(null); return; }
    fetch(window.API_BASE_URL + '/api/subscriptions/my', {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) { setMyAccessDays(null); return; }
        const now = new Date();
        const daysList = data
          .map(s => Math.ceil((new Date(s.expiresAt) - now) / (1000 * 60 * 60 * 24)))
          .filter(d => d > 0);
        setMyAccessDays(daysList.length ? Math.min(...daysList) : null);
      })
      .catch(() => setMyAccessDays(null));
  };

  const loadAdminNotificationCounts = useCallback(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);
    if (!token || !currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) return;

    // Load unread feedback
    fetch(window.API_BASE_URL + '/api/feedback', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const unread = data.filter(item => !item.read).length;
          setUnreadFeedbackCount(unread);
        }
      })
      .catch(() => {});

    // Load pending testimonials
    fetch(window.API_BASE_URL + '/api/testimonials/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const pending = data.filter(item => !item.approved).length;
          setPendingTestimonialsCount(pending);
        }
      })
      .catch(() => {});

    // Load pending access requests
    fetch(window.API_BASE_URL + '/api/access-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const pending = data.filter(item => item.status === 'pending').length;
          setPendingAccessRequestsCount(pending);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
      loadAdminNotificationCounts();
      const interval = setInterval(loadAdminNotificationCounts, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    } else {
      setUnreadFeedbackCount(0);
      setPendingTestimonialsCount(0);
      setPendingAccessRequestsCount(0);
    }
  }, [user, loadAdminNotificationCounts]);

  useEffect(() => {
    fetch(window.API_BASE_URL + '/api/health')
      .then(res => res.json())
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
    loadCourses();
    loadAccess();
    loadTestimonials();
    loadTeamPhotos();
    loadSiteSettings();
    loadMyAccess();
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAdmin(false);
    setShowAdminDashboard(false);
    setShowAuditLog(false);
    setManageCourse(null);
    setShowDashboard(false);
    setShowAnalytics(false);
    setShowInbox(false);
    setShowTests(false);
    setShowTestManager(false);
    setActiveTestId(null);
    setTestTakerBackToManager(false);
    setShowHanziTrace(false);
    setShowConversationPractice(false);
    setShowClassCalendar(false);
    setShowTestimonialManager(false);
    setShowSubscriptions(false);
    setShowUserManager(false);
    setShowTeamManager(false);
    setAdminSidebarOpen(false);
    setActiveCourse(null);
    setShowLogin(false);
    setMyAccessDays(null);
    setAccess({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setShowLogin(false);
    setShowAdmin(false);
    setShowAdminDashboard(false);
    setShowAuditLog(false);
    setShowPinyinPage(false);
    setPinyinBackToAdmin(false);
    setActiveCourse(null);
    setManageCourse(null);
    setShowDashboard(false);
    setShowAnalytics(false);
    setShowInbox(false);
    setShowTests(false);
    setShowTestManager(false);
    setActiveTestId(null);
    setTestTakerBackToManager(false);
    setShowHanziTrace(false);
    setShowConversationPractice(false);
    setShowClassCalendar(false);
    setShowTestimonialManager(false);
    setShowSubscriptions(false);
    setShowUserManager(false);
    setShowTeamManager(false);
    setAdminSidebarOpen(false);
    setShowPracticeMenu(false);
    setShowLangMenu(false);
    setShowToneScorer(false);
    loadCourses();
    loadAccess();
    loadTestimonials();
    loadTeamPhotos();
    loadMyAccess();
    loadAdminNotificationCounts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goAdminDashboard = () => {
    goHome();
    setShowAdminDashboard(true);
  };

  // open the sign-in screen from anywhere (clears other views first)
  const openLogin = () => {
    setMobileMenuOpen(false);
    setShowAdmin(false);
    setShowAdminDashboard(false);
    setShowAuditLog(false);
    setActiveCourse(null);
    setManageCourse(null);
    setShowDashboard(false);
    setShowAnalytics(false);
    setShowInbox(false);
    setShowTests(false);
    setShowTestManager(false);
    setActiveTestId(null);
    setTestTakerBackToManager(false);
    setShowTestimonialManager(false);
    setShowSubscriptions(false);
    setShowUserManager(false);
    setShowTeamManager(false);
    setAdminSidebarOpen(false);
    setAuthView('login');
    setShowLogin(true);
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

  // ---------- Password reset (reached via emailed link, before language/login) ----------
  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setResetToken(null);
          setLanguage('chinese');
          setAuthView('login');
          setShowLogin(true);
        }}
      />
    );
  }

  // ---------- Optional Language choice screen (if explicitly chosen) ----------
  if (language === 'choice') {
    return <LanguageChoice onChoose={(lang) => { changeLanguage(lang); goHome(); }} />;
  }

  // ---------- Nepali placeholder ----------
  if (language === 'nepali') {
    return (
      <>
        <div className="ambient-background" aria-hidden="true">
          <div className="ambient-orb orb-1"></div>
          <div className="ambient-orb orb-2"></div>
          <div className="ambient-orb orb-3"></div>
          <div className="ambient-orb orb-4"></div>
          <div className="ambient-mesh-grid"></div>

        </div>

        <header className="site-header">
          <div className="container header-row">
            <div className="header-left">
              <button className="logo brand-logo" onClick={() => { changeLanguage('chinese'); goHome(); }}>
                <span className="brand-seal brand-seal-ne" aria-hidden="true">ने</span>
                <span className="brand-title">
                  Learn Chinese with <span className="brand-accent">Anil</span>
                </span>
              </button>
            </div>
            <div className="header-right nav-actions">
              <button className="nav-btn-primary" onClick={() => { changeLanguage('chinese'); goHome(); }}>
                ← Switch to Chinese Courses
              </button>
            </div>
          </div>
        </header>
        <NepaliPage onBack={() => { changeLanguage('chinese'); goHome(); }} />
      </>
    );
  }

  // ---------- Chinese app ----------
  return (
    <>
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
        <div className="ambient-orb orb-4"></div>
        <div className="ambient-mesh-grid"></div>

      </div>


      {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
      {showFeedback && <FeedbackModal user={user} onClose={() => setShowFeedback(false)} />}
      {showTestimonial && <TestimonialModal user={user} onClose={() => { setShowTestimonial(false); loadTestimonials(); }} />}

      {lockedNotice && (
        <div className="locked-course-toast" role="alert">
          <div className="toast-content">
            <span className="toast-icon">🔒</span>
            <span>{lockedNotice}</span>
          </div>
          <button className="toast-close" onClick={() => setLockedNotice(null)} aria-label="Dismiss notice">✕</button>
        </div>
      )}

      {activeTeamMember && (
        <div className="modal-overlay" onClick={() => setActiveTeamMember(null)}>
          <div className="team-modal" onClick={(e) => e.stopPropagation()}>
            {renderTeamAvatar(activeTeamMember, true)}
            <h3 className="team-modal-name">{activeTeamMember.name}</h3>
            <p className="team-modal-role">{activeTeamMember.role}</p>
            <p className="team-modal-bio">{activeTeamMember.bio}</p>
            <button className="btn-primary" onClick={() => setActiveTeamMember(null)}>Close</button>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <>
          <div
            className={`admin-sidebar-backdrop ${adminSidebarOpen ? 'is-visible' : ''}`}
            onClick={() => setAdminSidebarOpen(false)}
            aria-hidden="true"
          />
      <AdminSidebar adminSidebarOpen={adminSidebarOpen} goHome={goHome} isSuperAdmin={isSuperAdmin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={setAdminSidebarOpen} setPinyinBackToAdmin={setPinyinBackToAdmin} setShowAdmin={setShowAdmin} setShowAdminDashboard={setShowAdminDashboard} setShowAuditLog={setShowAuditLog} setShowHanziTrace={setShowHanziTrace} setShowInbox={setShowInbox} setShowPinyinPage={setShowPinyinPage} setShowSubscriptions={setShowSubscriptions} setShowTeamManager={setShowTeamManager} setShowTestManager={setShowTestManager} setShowTestimonialManager={setShowTestimonialManager} setShowUserManager={setShowUserManager} setShowUserMenu={setShowUserMenu} unreadFeedbackCount={unreadFeedbackCount} user={user} />
        </>
      )}

      <SiteHeader adminSidebarOpen={adminSidebarOpen} changeLanguage={changeLanguage} darkMode={darkMode} goHome={goHome} handleLogout={handleLogout} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} language={language} mobileMenuOpen={mobileMenuOpen} myAccessDays={myAccessDays} openLogin={openLogin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={setAdminSidebarOpen} setDarkMode={setDarkMode} setMobileMenuOpen={setMobileMenuOpen} setShowAnalytics={setShowAnalytics} setShowChangePassword={setShowChangePassword} setShowClassCalendar={setShowClassCalendar} setShowConversationPractice={setShowConversationPractice} setShowDashboard={setShowDashboard} setShowFeedback={setShowFeedback} setShowHanziTrace={setShowHanziTrace} setShowLangMenu={setShowLangMenu} setShowPinyinPage={setShowPinyinPage} setShowPracticeMenu={setShowPracticeMenu} setShowSubscriptions={setShowSubscriptions} setShowTests={setShowTests} setShowToneScorer={setShowToneScorer} setShowUserMenu={setShowUserMenu} showLangMenu={showLangMenu} showPracticeMenu={showPracticeMenu} showUserMenu={showUserMenu} unreadFeedbackCount={unreadFeedbackCount} user={user} />

      {!user && showLogin ? (
        <div>
          {authView === 'login' ? (
            <Login
              onLogin={(u) => { setUser(u); setShowLogin(false); loadAccess(); loadMyAccess(); }}
              onBack={goHome}
              onSwitch={() => setAuthView('register')}
              onForgotPassword={() => setAuthView('forgot')}
            />
          ) : authView === 'forgot' ? (
            <ForgotPassword
              onBack={goHome}
              onSwitch={() => setAuthView('login')}
            />
          ) : (
            <Register
              onRegistered={() => setAuthView('login')}
              onLogin={(u) => { setUser(u); setShowLogin(false); loadAccess(); loadMyAccess(); }}
              onBack={goHome}
              onSwitch={() => setAuthView('login')}
            />
          )}
        </div>
      ) : isSuperAdmin && showUserManager ? (
        <UserManager onBack={goAdminDashboard} />
      ) : isSuperAdmin && showTeamManager ? (
        <TeamManager onBack={goAdminDashboard} />
      ) : isAdmin && showSubscriptions ? (
        <SubscriptionManager onBack={goAdminDashboard} />
      ) : isSuperAdmin && showTestimonialManager ? (
        <TestimonialManager onBack={goAdminDashboard} />
      ) : showHanziTrace ? (
        <HanziTracePage user={user} token={localStorage.getItem('token')} onBack={goHome} />
      ) : showToneScorer ? (
        <ToneScorer onBack={goHome} />
      ) : showPinyinPage ? (
        <PinyinPage
          onBack={pinyinBackToAdmin ? () => { setPinyinBackToAdmin(false); goAdminDashboard(); } : goHome}
          isSuperAdmin={isSuperAdmin || isAdmin}
          backLabel={pinyinBackToAdmin ? '← Back to Admin Dashboard' : '← Back to home'}
        />
      ) : showConversationPractice ? (
        <ConversationPracticePage onBack={goHome} />
      ) : showClassCalendar ? (
        <ClassCalendarPage onBack={goHome} user={user} />
      ) : isSuperAdmin && showTestManager ? (
        <TestManager
          onBack={goAdminDashboard}
          onPreviewTest={(testId) => {
            setActiveTestId(testId);
            setTestTakerBackToManager(true);
            setShowTestManager(false);
          }}
        />
      ) : activeTestId ? (
        <TestTaker
          testId={activeTestId}
          onBack={() => {
            setActiveTestId(null);
            if (testTakerBackToManager) {
              setShowTestManager(true);
              setTestTakerBackToManager(false);
            } else {
              setShowTests(true);
            }
          }}
        />
      ) : showTests ? (
        <TestList onOpenTest={(id) => { setShowTests(false); setActiveTestId(id); }} onBack={goHome} />
      ) : isSuperAdmin && manageCourse ? (
        <LessonManager course={manageCourse} onBack={() => setManageCourse(null)} />
      ) : isSuperAdmin && showInbox ? (
        <FeedbackInbox onBack={goAdminDashboard} />
      ) : isSuperAdmin && showAdmin ? (
        <AdminPanel
          onBack={goAdminDashboard}
          onManageLessons={(c) => setManageCourse(c)}
        />
      ) : isSuperAdmin && showAdminDashboard ? (
        <AdminDashboard
          onBack={goHome}
          onNavigate={(view) => {
            goHome();
            if (view === 'courses') setShowAdmin(true);
            else if (view === 'audit') setShowAuditLog(true);
            else if (view === 'tests') setShowTestManager(true);
            else if (view === 'testimonials') setShowTestimonialManager(true);
            else if (view === 'inbox') setShowInbox(true);
            else if (view === 'admins') setShowUserManager(true);
            else if (view === 'subscriptions') setShowSubscriptions(true);
            else if (view === 'team') setShowTeamManager(true);
            else if (view === 'pinyin') {
              setShowPinyinPage(true);
              setPinyinBackToAdmin(true);
            }
          }}
        />
      ) : isSuperAdmin && showAuditLog ? (
        <AuditLog onBack={goAdminDashboard} />
      ) : user && showDashboard ? (
        <Dashboard
          user={user}
          onOpenCourse={(c) => { setShowDashboard(false); setActiveCourse(c); }}
          onBrowse={goHome}
        />
      ) : user && showAnalytics ? (
        <ProgressAnalytics user={user} onBack={goHome} />
      ) : activeCourse ? (
        <CoursePage course={activeCourse} onBack={() => setActiveCourse(null)} user={user} />
      ) : (
        <main className="home-page">
          <HomeHero goHome={goHome} handleVideoToggle={handleVideoToggle} heroVideoRef={heroVideoRef} isPlayingAudio={isPlayingAudio} isVideoPlaying={isVideoPlaying} playNihaoAudio={playNihaoAudio} setIsVideoPlaying={setIsVideoPlaying} setShowDashboard={setShowDashboard} setShowPinyinPage={setShowPinyinPage} user={user} welcomeVideoUrl={welcomeVideoUrl} />

          <HomeCourses access={access} filteredCourses={filteredCourses} hskLevels={hskLevels} levelFilter={levelFilter} openLogin={openLogin} setActiveCourse={setActiveCourse} setLevelFilter={setLevelFilter} setLockedNotice={setLockedNotice} user={user} />

          <HomeFeatures isPlayingFeatureAudio={isPlayingFeatureAudio} playFeatureSample={playFeatureSample} />

          <WordOfTheDay isPlayingWotd={isPlayingWotd} playWotdAudio={playWotdAudio} wotd={wotd} />

          <HomeTestimonials scrollTestimonials={scrollTestimonials} setShowTestimonial={setShowTestimonial} testimonials={testimonials} testimonialsScrollRef={testimonialsScrollRef} user={user} />

          <HomeTeam setActiveTeamMember={setActiveTeamMember} teamPhotos={teamPhotos} />



          <HomeFooter goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk} />
        </main>
      )}
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="container" role="status">Loading...</div>}>
      <AppContent />
    </Suspense>
  );
}
