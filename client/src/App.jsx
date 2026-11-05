import AdminSidebar from './components/AdminSidebar';
import SiteHeader from './components/SiteHeader';
import HomeFooter from './home/HomeFooter';
import HomeTeam from './home/HomeTeam';
import HomeTestimonials from './home/HomeTestimonials';
import HomeCourses from './home/HomeCourses';
import HomeHero from './home/HomeHero';
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
const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const ProgressAnalytics = lazy(() => import('./dashboard/ProgressAnalytics'));
const PinyinPage = lazy(() => import('./practice/PinyinPage'));
const ChangePassword = lazy(() => import('./auth/ChangePassword'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const FeedbackInbox = lazy(() => import('./admin/FeedbackInbox'));
const TestManager = lazy(() => import('./admin/TestManager'));
const TestList = lazy(() => import('./tests/TestList'));
const TestTaker = lazy(() => import('./tests/TestTaker'));
const HskPortal = lazy(() => import('./tests/hsk1/HskPortal'));
const TestimonialModal = lazy(() => import('./components/TestimonialModal'));
const TestimonialManager = lazy(() => import('./admin/TestimonialManager'));
const SubscriptionManager = lazy(() => import('./admin/SubscriptionManager'));
const UserManager = lazy(() => import('./admin/UserManager'));
const TeamManager = lazy(() => import('./admin/TeamManager'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AuditLog = lazy(() => import('./admin/AuditLog'));
const HanziTracePage = lazy(() => import('./practice/HanziTracePage'));
const ConversationPracticePage = lazy(() => import('./practice/ConversationPractice'));
const ListeningPractice = lazy(() => import('./practice/ListeningPractice'));
const SentencePractice = lazy(() => import('./practice/SentencePractice'));
const ListeningDictation = lazy(() => import('./practice/ListeningDictation'));
const NumberTrainer = lazy(() => import('./practice/NumberTrainer'));
const MeasureWordPractice = lazy(() => import('./practice/MeasureWordPractice'));
const SentenceAudioManager = lazy(() => import('./admin/SentenceAudioManager'));



function AppContent() {

  const [serverOk, setServerOk] = useState(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [showAdmin, setShowAdmin] = useState(false);
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
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [desktopAdminNavigation, setDesktopAdminNavigation] = useState(() => window.matchMedia('(min-width: 1100px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1100px)');
    const updateNavigation = () => {
      setDesktopAdminNavigation(media.matches);
      setAdminSidebarOpen(false);
    };
    media.addEventListener('change', updateNavigation);
    return () => media.removeEventListener('change', updateNavigation);
  }, []);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('reset'));
  const [lockedNotice, setLockedNotice] = useState(null);
  const [showListeningPractice, setShowListeningPractice] = useState(false);
  const [showSentencePractice, setShowSentencePractice] = useState(false);
  const [showDictation, setShowDictation] = useState(false);
  const [showNumberTrainer, setShowNumberTrainer] = useState(false);
  const [showMeasureWords, setShowMeasureWords] = useState(false);
  const [showSentenceAudioManager, setShowSentenceAudioManager] = useState(false);

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
    loadMyAccess();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const restoredUser = JSON.parse(savedUser);
      setUser(restoredUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAdmin(false);
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
    setShowListeningPractice(false);
    setShowConversationPractice(false);
    setShowSentencePractice(false);
    setShowDictation(false);
    setShowNumberTrainer(false);
    setShowMeasureWords(false);
    setShowSentenceAudioManager(false);
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
    setShowSentencePractice(false);
    setShowDictation(false);
    setShowNumberTrainer(false);
    setShowMeasureWords(false);
    setShowSentenceAudioManager(false);
    setShowTestimonialManager(false);
    setShowSubscriptions(false);
    setShowUserManager(false);
    setShowTeamManager(false);
    setAdminSidebarOpen(false);
    setShowListeningPractice(false);
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
  };

  const handleLogin = (loggedInUser) => {
    goHome();
    setUser(loggedInUser);
  };

  // open the sign-in screen from anywhere (clears other views first)
  const openLogin = () => {
    setMobileMenuOpen(false);
    setShowPinyinPage(false);
    setShowHanziTrace(false);
    setShowListeningPractice(false);
    setShowConversationPractice(false);
    setShowAdmin(false);
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
    setShowSentencePractice(false);
    setShowDictation(false);
    setShowNumberTrainer(false);
    setShowMeasureWords(false);
    setShowSentenceAudioManager(false);
    setAuthView('login');
    setShowLogin(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPractice = id => {
    if (id !== 'pinyin' && !user) { openLogin(); return; }
    goHome();
    const open = { pinyin: setShowPinyinPage, trace: setShowHanziTrace, listening: setShowListeningPractice, sentences: setShowSentencePractice, measures: setShowMeasureWords, numbers: setShowNumberTrainer, dictation: setShowDictation, tests: setShowTests }[id];
    open?.(true);
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

  // ---------- Password reset (reached via emailed link, before login) ----------
  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setResetToken(null);
          setAuthView('login');
          setShowLogin(true);
        }}
      />
    );
  }

  // ---------- Chinese app ----------
  return (
    <div className={isSuperAdmin ? 'super-admin-layout' : undefined}>
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
      <AdminSidebar setShowSentenceAudioManager={setShowSentenceAudioManager} adminSidebarOpen={desktopAdminNavigation || adminSidebarOpen} goHome={goHome} isSuperAdmin={isSuperAdmin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={setAdminSidebarOpen} setPinyinBackToAdmin={setPinyinBackToAdmin} setShowAdmin={setShowAdmin} setShowAuditLog={setShowAuditLog} setShowHanziTrace={setShowHanziTrace} setShowInbox={setShowInbox} setShowPinyinPage={setShowPinyinPage} setShowSubscriptions={setShowSubscriptions} setShowTeamManager={setShowTeamManager} setShowTestManager={setShowTestManager} setShowTestimonialManager={setShowTestimonialManager} setShowUserManager={setShowUserManager} setShowUserMenu={setShowUserMenu} unreadFeedbackCount={unreadFeedbackCount} user={user} />
        </>
      )}

      <SiteHeader adminSidebarOpen={adminSidebarOpen} darkMode={darkMode} goHome={goHome} handleLogout={handleLogout} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} mobileMenuOpen={mobileMenuOpen} myAccessDays={myAccessDays} openLogin={openLogin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={setAdminSidebarOpen} setDarkMode={setDarkMode} setMobileMenuOpen={setMobileMenuOpen} setShowAnalytics={setShowAnalytics} setShowChangePassword={setShowChangePassword} setShowDashboard={setShowDashboard} setShowFeedback={setShowFeedback} setShowSubscriptions={setShowSubscriptions} setShowTestManager={setShowTestManager} setShowUserMenu={setShowUserMenu} showUserMenu={showUserMenu} unreadFeedbackCount={unreadFeedbackCount} user={user} />

      {!user && showLogin ? (
        <div>
          {authView === 'login' ? (
            <Login
              onLogin={handleLogin}
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
              onLogin={handleLogin}
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
      ) : user && showHanziTrace ? (
        <HanziTracePage user={user} token={localStorage.getItem('token')} onBack={goHome} />
      ) : isSuperAdmin && showSentenceAudioManager ? (
        <SentenceAudioManager onBack={goAdminDashboard} />
      ) : user && showMeasureWords ? (
        <MeasureWordPractice onBack={goHome} />
      ) : user && showNumberTrainer ? (
        <NumberTrainer onBack={goHome} />
      ) : user && showDictation ? (
        <ListeningDictation onBack={goHome} onRecordAudio={isSuperAdmin ? () => { goHome(); setShowSentenceAudioManager(true); } : undefined} />
      ) : user && showSentencePractice ? (
        <SentencePractice key={user?.id || 'guest'} user={user} onBack={goHome} />
      ) : user && showListeningPractice ? (
        <ListeningPractice user={user} onBack={goHome} onSignIn={openLogin} />
      ) : showPinyinPage ? (
        <PinyinPage
          onBack={pinyinBackToAdmin ? () => { setPinyinBackToAdmin(false); goAdminDashboard(); } : goHome}
          isSuperAdmin={isSuperAdmin || isAdmin}
          backLabel={pinyinBackToAdmin ? '← Back to Admin Dashboard' : '← Back to home'}
        />
      ) : user && showConversationPractice ? (
        <ConversationPracticePage onBack={goHome} />
      ) : isAdmin && showTestManager ? (
        <TestManager
          user={user}
          onBack={goAdminDashboard}
          onPreviewTest={(testId) => {
            setActiveTestId(testId);
            setTestTakerBackToManager(true);
            setShowTestManager(false);
          }}
        />
      ) : user && (['h11226', 'h10901'].includes(activeTestId) || /^paper-[a-f0-9]{24}$/.test(activeTestId || '')) ? (
        <HskPortal key={activeTestId} paperId={activeTestId} user={user} onBack={() => {
          setActiveTestId(null);
          if (testTakerBackToManager) {
            setShowTestManager(true);
            setTestTakerBackToManager(false);
          } else setShowTests(true);
        }} />
      ) : user && activeTestId ? (
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
      ) : user && showTests ? (
        <TestList user={user} onOpenTest={(id) => { setShowTests(false); setActiveTestId(id); }} onBack={goHome} />
      ) : isSuperAdmin && manageCourse ? (
        <LessonManager course={manageCourse} onBack={() => setManageCourse(null)} />
      ) : isSuperAdmin && showInbox ? (
        <FeedbackInbox onBack={goAdminDashboard} />
      ) : isSuperAdmin && showAdmin ? (
        <AdminPanel
          onBack={goAdminDashboard}
          onManageLessons={(c) => setManageCourse(c)}
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
      ) : isSuperAdmin ? (
        <AdminDashboard
          user={user}
          onNavigate={(view) => {
            goHome();
            if (view === 'courses') setShowAdmin(true);
            else if (view === 'audit') setShowAuditLog(true);
            else if (view === 'sentence-audio') setShowSentenceAudioManager(true);
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
      ) : user?.role === 'admin' ? (
        <main className="home-page">
          <HomeHero goHome={goHome} setShowDashboard={setShowDashboard} setShowPinyinPage={setShowPinyinPage} user={user} onOpenPractice={openPractice}/>
          <HomeCourses filteredCourses={filteredCourses} hskLevels={hskLevels} levelFilter={levelFilter} openLogin={openLogin} setActiveCourse={setActiveCourse} setLevelFilter={setLevelFilter} user={user} />
          <HomeFooter goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk}/>
        </main>
      ) : (
        <main className="home-page">
          <HomeHero goHome={goHome} setShowDashboard={setShowDashboard} setShowPinyinPage={setShowPinyinPage} user={user} hasStartedCourse={Object.values(access).some(course => course.completed > 0)} onOpenPractice={openPractice} />

          <HomeCourses access={access} filteredCourses={filteredCourses} hskLevels={hskLevels} levelFilter={levelFilter} openLogin={openLogin} setActiveCourse={setActiveCourse} setLevelFilter={setLevelFilter} setLockedNotice={setLockedNotice} user={user} />

          {!user && <HomeTestimonials scrollTestimonials={scrollTestimonials} setShowTestimonial={setShowTestimonial} testimonials={testimonials} testimonialsScrollRef={testimonialsScrollRef} user={user} />}

          {!user && <HomeTeam setActiveTeamMember={setActiveTeamMember} teamPhotos={teamPhotos} />}



          <HomeFooter goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk} />
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="container" role="status">Loading...</div>}>
      <AppContent />
    </Suspense>
  );
}
