import AdminSidebar from './components/AdminSidebar';
import SiteHeader from './components/SiteHeader';
import LiveClassNotice from './components/LiveClassNotice';
import { FREE_PAPER_PATH } from './tests/mockTests';
import HomeFooter from './home/HomeFooter';
import HomeTestimonials from './home/HomeTestimonials';
import HomeCourses from './home/HomeCourses';
import HomeHero from './home/HomeHero';
import StudioSaveStatus from './practice/StudioSaveStatus';
import AppRoutes from './navigation/AppRoutes';
import { adminPaths, coursePath, homePath, practicePaths, safeReturnPath, signInPath } from './navigation/paths';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, lazy, startTransition, Suspense } from 'react';
import './home.css';
import './flag-theme.css';
import { forgetPushDevice } from './pwa/usePushReminders';
import InkLoader from './components/InkLoader';
import usePracticeTimer from './dashboard/practiceTimer';
import { clearIdleSession, markActive, clearIdleSignOutNotice, hasIdleSignOutNotice, rememberIdleSignOut, useIdleSignOut } from './auth/idleSession';
import { apiFetch, SESSION_EXPIRED_EVENT } from './lib/apiClient';

const NO_ATTENTION = { feedback: [], testimonials: [], access: [], plans: [] };
const ChangePassword = lazy(() => import('./auth/ChangePassword'));
const TestimonialModal = lazy(() => import('./components/TestimonialModal'));
const TestAccessPrompt = lazy(() => import('./components/TestAccessPrompt'));
const StudioTour = lazy(() => import('./home/StudioTour'));

function readStoredUser() {
  // A sign-in left unused for two hours ends before anything renders.
  clearIdleSession();
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch { return null; }
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverOk, setServerOk] = useState(null);
  const [user, setUser] = useState(readStoredUser);
  const [idleNotice, setIdleNotice] = useState(hasIdleSignOutNotice);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [courses, setCourses] = useState([]);
  const [access, setAccess] = useState({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState('all');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  // Reminder to request mock-test access, shown once per sign-in to students only.
  const [showTestAccessPrompt, setShowTestAccessPrompt] = useState(false);
  const closeTestAccessPrompt = useCallback(() => setShowTestAccessPrompt(false), []);
  const [showStudioTour, setShowStudioTour] = useState(false);
  const closeStudioTour = useCallback(() => setShowStudioTour(false), []);
  const [testimonials, setTestimonials] = useState([]);
  // The home page shows placeholders, not "no courses / no reviews", until these first arrive.
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);
  // Items that need a staff member's attention, grouped by type.
  const [attention, setAttention] = useState(NO_ATTENTION);
  const unreadFeedbackCount = attention.feedback.length;
  const pendingTestimonialsCount = attention.testimonials.length;
  const pendingAccessRequestsCount = attention.access.length + attention.plans.length;
  const [myAccessDays, setMyAccessDays] = useState(null);
  // A student with an active plan already has everything Pricing offers, so the header leaves it out.
  const [hasActivePlan, setHasActivePlan] = useState(false);
  // What a student can open: My Courses needs course access (an active plan or course subscription);
  // My Progress needs practice access (that, or a free week). Unknown until the check finishes.
  const NO_ACCESS = { loaded: false, courses: false, practice: false, recorded: false };
  const [studentAccess, setStudentAccess] = useState(NO_ACCESS);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [desktopAdminNavigation, setDesktopAdminNavigation] = useState(() => window.matchMedia('(min-width: 1100px)').matches);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const adminArea = location.pathname.startsWith('/admin');
  const activeAdminView = Object.entries(adminPaths).sort((a, b) => b[1].length - a[1].length)
    .find(([, path]) => location.pathname === path || location.pathname.startsWith(path + '/'))?.[0] || 'dashboard';

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1100px)');
    const updateNavigation = () => { setDesktopAdminNavigation(media.matches); setAdminSidebarOpen(false); };
    media.addEventListener('change', updateNavigation);
    return () => media.removeEventListener('change', updateNavigation);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  useEffect(() => {
    const handleClick = event => { if (!event.target.closest('.user-menu')) setShowUserMenu(false); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  // The browser keeps the account details it was given at sign-in. Ask again when the site opens
  // and when the tab regains focus, so a superadmin's change applies without signing in again,
  // for example a promotion to admin, which unlocks every course, practice tool and mock test.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    const refresh = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      apiFetch(`${window.API_BASE_URL}/api/auth/me`)
        .then(res => (res.ok ? res.json() : null))
        .then(fresh => {
          const stored = readStoredUser();
          if (!active || !fresh || !stored || String(stored.id) !== String(fresh.id)) return;
          if (stored.role === fresh.role && stored.name === fresh.name && stored.email === fresh.email) return;
          const next = { ...stored, role: fresh.role, name: fresh.name, email: fresh.email };
          localStorage.setItem('user', JSON.stringify(next));
          setUser(next);
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [userId]);
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setAdminSidebarOpen(false);
    setShowChangePassword(false);
    setShowTestimonial(false);
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search, location.hash]);
  // Links like /?level=HSK%202#courses (from the learning roadmap) open the course list on that level.
  const requestedLevel = new URLSearchParams(location.search).get('level');
  useEffect(() => {
    if (!requestedLevel) return;
    const level = (requestedLevel.match(/\d/) || [])[0];
    if (level && courses.some(course => (course.level || '').includes(level))) setLevelFilter(`HSK ${level}`);
  }, [requestedLevel, courses]);
  // location.key changes on every navigation, so following a section link again (from the header,
  // say, after scrolling away) scrolls back to that section even though the URL is the same.
  useEffect(() => {
    if (!location.hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key, courses]);

  const loadCourses = () => {
    apiFetch(window.API_BASE_URL + '/api/courses')
      .then(res => res.json())
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoaded(true));
  };

  const loadAccess = () => {
    const t = localStorage.getItem('token');
    if (!t) return;
    apiFetch(window.API_BASE_URL + '/api/enrollments/access')
      .then(res => res.json())
      .then(data => {
        const map = {};
        (Array.isArray(data) ? data : []).forEach(a => { map[a.courseId] = a; });
        setAccess(map);
      })
      .catch(() => {});
  };

  // About Xiao Ao is hidden until a super admin shows it; its footer and menu links follow that choice.
  const [aboutUsVisible, setAboutUsVisible] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => apiFetch(window.API_BASE_URL + '/api/about-pages')
      .then(res => res.ok ? res.json() : [])
      .then(pages => { if (active) setAboutUsVisible(Array.isArray(pages) && pages.some(page => page.slug === 'xiao-ao' && page.visible)); })
      .catch(() => {});
    load();
    window.addEventListener('about-pages-changed', load);
    return () => { active = false; window.removeEventListener('about-pages-changed', load); };
  }, []);
  const loadTestimonials = () => {
    apiFetch(window.API_BASE_URL + '/api/testimonials')
      .then(res => res.json())
      .then(data => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]))
      .finally(() => setTestimonialsLoaded(true));
  };

  const loadMyAccess = () => {
    const t = localStorage.getItem('token');
    if (!t) { setMyAccessDays(null); setHasActivePlan(false); setStudentAccess(NO_ACCESS); return; }
    // null when a list couldn't load, so a failed check never locks a student out.
    const load = path => apiFetch(window.API_BASE_URL + path)
      .then(res => (res.ok ? res.json() : null)).then(data => (Array.isArray(data) ? data : null)).catch(() => null);
    // Paid access plus a free week from an approved access request.
    // Recorded sessions: only for students in live classes (paid at checkout, or marked joined).
    const recordedAccess = user?.role === 'student' ? apiFetch(window.API_BASE_URL + '/api/recorded-sessions/access').then(res => (res.ok ? res.json() : null)).then(data => (data ? !!data.allowed : false)).catch(() => false) : Promise.resolve(false);
    Promise.all([load('/api/subscriptions/my'), load('/api/access-requests/my'), recordedAccess])
      .then(([subsOrNull, requestsOrNull, recorded]) => {
        const subs = subsOrNull || [];
        const requests = requestsOrNull || [];
        const now = new Date();
        const ends = [...subs.map(s => s.expiresAt), ...requests.filter(r => r.scope === 'tests' && r.status === 'approved' && r.expiresAt).map(r => r.expiresAt)];
        const daysList = ends
          .map(end => Math.ceil((new Date(end) - now) / (1000 * 60 * 60 * 24)))
          .filter(d => d > 0);
        setMyAccessDays(daysList.length ? Math.min(...daysList) : null);
        // Plan entries are marked `plan: true` (see GET /api/subscriptions/my).
        setHasActivePlan(subs.some(sub => sub.plan && new Date(sub.expiresAt) > now));
        const courses = subsOrNull === null || subs.some(sub => new Date(sub.expiresAt) > now);
        const freeWeek = requests.some(r => r.scope === 'tests' && r.status === 'approved' && (!r.expiresAt || new Date(r.expiresAt) > now));
        setStudentAccess({ loaded: true, courses, practice: courses || freeWeek || requestsOrNull === null, recorded });
      })
      .catch(() => { setMyAccessDays(null); setHasActivePlan(false); setStudentAccess({ loaded: true, courses: true, practice: true, recorded: false }); });
  };

  const loadAdminNotificationCounts = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user || (user.role !== 'admin' && user.role !== 'superadmin')) return;
    // Each list keeps its last value if its request fails.
    const sources = {
      feedback: ['/api/feedback', item => !item.read],
      testimonials: ['/api/testimonials/all', item => !item.approved],
      access: ['/api/access-requests', item => item.status === 'pending'],
      plans: ['/api/plans/requests', item => item.status === 'pending'],
    };
    for (const [key, [path, needsAttention]] of Object.entries(sources)) {
      apiFetch(window.API_BASE_URL + path)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAttention(previous => ({ ...previous, [key]: data.filter(needsAttention) })); })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      loadAdminNotificationCounts();
      const interval = setInterval(loadAdminNotificationCounts, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    }
    setAttention(NO_ATTENTION);
  }, [user, loadAdminNotificationCounts]);

  useEffect(() => {
    apiFetch(window.API_BASE_URL + '/api/health')
      .then(res => {
        if (!res.ok) throw new Error('Server is unavailable');
        return res.json();
      })
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
    loadCourses();
    loadAccess();
    loadTestimonials();
    loadMyAccess();
  }, []);


  useEffect(() => {
    if (user) { loadAccess(); loadMyAccess(); }
  }, [user]);

  const goHome = () => {
    navigate(homePath(user));
    loadCourses(); loadAccess(); loadTestimonials(); loadMyAccess(); loadAdminNotificationCounts();
  };
  // idle: no activity for two hours. expired: the server no longer accepts the sign-in
  // (the password changed on another device, or the account's session ended).
  // Both return to the same page after signing in again.
  const handleLogout = ({ idle = false, expired = false } = {}) => {
    void forgetPushDevice(localStorage.getItem('token'));
    localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('lastActivityAt');
    if (idle) rememberIdleSignOut();
    setIdleNotice(idle);
    setExpiredNotice(expired);
    // Commit the session change and destination together so route guards never
    // see a signed-out user on the previous protected page.
    startTransition(() => {
      setUser(null); setMyAccessDays(null); setHasActivePlan(false); setStudentAccess(NO_ACCESS); setAccess({});
      setShowTestAccessPrompt(false);
      setShowStudioTour(false);
      setShowChangePassword(false);
      navigate(idle || expired ? signInPath(safeReturnPath(location.pathname + location.search)) : '/', { replace: true });
    });
  };
  useIdleSignOut(!!user, () => handleLogout({ idle: true }));
  const logoutRef = useRef(handleLogout);
  logoutRef.current = handleLogout;
  useEffect(() => {
    const onExpired = () => logoutRef.current({ expired: true });
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);
  usePracticeTimer(user?.role === 'student', location.pathname);
  const handleLogin = loggedInUser => {
    markActive(); setIdleNotice(false); setExpiredNotice(false); clearIdleSignOutNotice();
    const next = new URLSearchParams(location.search).get('next');
    const destination = safeReturnPath(next, homePath(loggedInUser));
    startTransition(() => {
      setUser(loggedInUser);
      // Someone signing in to take the free mock test goes straight to it, without the access prompt.
      setShowTestAccessPrompt(!['admin', 'superadmin'].includes(loggedInUser?.role) && destination !== FREE_PAPER_PATH);
      navigate(destination, { replace: true });
    });
  };
  const openLogin = destination => {
    const next = typeof destination === 'string' ? destination : location.pathname + location.search + location.hash;
    navigate(signInPath(safeReturnPath(next)));
  };
  const startStudioTour = () => { if (location.pathname !== '/') navigate('/'); setShowStudioTour(true); };
  const openPractice = id => { if (practicePaths[id]) navigate(practicePaths[id]); };
  const openCourse = course => navigate(coursePath(course._id));
  const getHskLevel = course => {
    const level = (course.level || '').toLowerCase();
    for (const number of [1, 2, 3, 4]) if (level.includes(String(number))) return `HSK ${number}`;
    return 'Other';
  };
  const hskLevels = ['all', ...new Set(courses.map(getHskLevel))];
  const filteredCourses = levelFilter === 'all' ? courses : courses.filter(course => getHskLevel(course) === levelFilter);
  const home = <main className="home-page">
    <HomeHero onContinueLearning={() => navigate('/continue')} onPinyinPractice={() => navigate('/practice/pinyin')} user={user} hasStartedCourse={Object.values(access).some(course => course.completed > 0)} onOpenPractice={openPractice} />
    <HomeCourses loaded={coursesLoaded} filteredCourses={filteredCourses} hskLevels={hskLevels} levelFilter={levelFilter} onOpenCourse={openCourse} setLevelFilter={setLevelFilter} />
    <HomeTestimonials loaded={testimonialsLoaded} setShowTestimonial={setShowTestimonial} testimonials={testimonials} user={user} />
    <HomeFooter showAboutUs={aboutUsVisible} goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk} onStartTour={user?.role === 'student' ? startStudioTour : undefined} />
  </main>;
  const sidebar = isSuperAdmin ? <>
    <div className={`admin-sidebar-backdrop ${adminSidebarOpen ? 'is-visible' : ''}`} onClick={() => setAdminSidebarOpen(false)} aria-hidden="true" />
    <AdminSidebar activeView={activeAdminView} onNavigate={view => navigate(adminPaths[view] || '/admin')} adminSidebarOpen={desktopAdminNavigation || adminSidebarOpen} isSuperAdmin={isSuperAdmin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={setAdminSidebarOpen} unreadFeedbackCount={unreadFeedbackCount} />
  </> : null;

  return <div className={isSuperAdmin && adminArea ? 'app-shell super-admin-layout' : 'app-shell'}>
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-orb orb-1" /><div className="ambient-orb orb-2" /><div className="ambient-orb orb-3" /><div className="ambient-orb orb-4" /><div className="ambient-mesh-grid" />
    </div>
    {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
    {showTestAccessPrompt && user && <Suspense fallback={null}><TestAccessPrompt user={user} onClose={closeTestAccessPrompt} onStartTour={startStudioTour} /></Suspense>}
    {showStudioTour && <Suspense fallback={null}><StudioTour onClose={closeStudioTour} user={user} /></Suspense>}
    {showTestimonial && <TestimonialModal user={user} onClose={() => { setShowTestimonial(false); loadTestimonials(); }} />}
    <SiteHeader showAboutUs={aboutUsVisible} hidePricing={user?.role === 'student' && hasActivePlan} studentAccess={studentAccess} adminSidebarOpen={adminSidebarOpen} attention={attention} darkMode={darkMode} goHome={goHome} handleLogout={handleLogout} hideForAuth={['/sign-in', '/register', '/reset-password'].includes(location.pathname)} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} mobileMenuOpen={mobileMenuOpen} myAccessDays={myAccessDays} openLogin={openLogin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={value => { if (!adminArea) navigate('/admin'); setAdminSidebarOpen(value); }} setDarkMode={setDarkMode} setMobileMenuOpen={setMobileMenuOpen} onNavigate={navigate} setShowChangePassword={setShowChangePassword} setShowUserMenu={setShowUserMenu} showUserMenu={showUserMenu} unreadFeedbackCount={unreadFeedbackCount} user={user} />
    <StudioSaveStatus />
    {expiredNotice && !user && <div className="idle-notice" role="status">
      <span>Your sign-in has ended, for example because the password was changed. Please sign in again.</span>
      <button type="button" aria-label="Dismiss" onClick={() => setExpiredNotice(false)}>×</button>
    </div>}
    {idleNotice && !user && <div className="idle-notice" role="status">
      <span>You were signed out after 2 hours without activity. Please sign in again.</span>
      <button type="button" aria-label="Dismiss" onClick={() => { setIdleNotice(false); clearIdleSignOutNotice(); }}>×</button>
    </div>}
    <Suspense fallback={<InkLoader />}><AppRoutes user={user} studentAccess={studentAccess} home={home} sidebar={sidebar} onHome={goHome} onLogin={handleLogin} openLogin={openLogin} /></Suspense>
    {location.pathname !== '/' && <div className="home-page app-footer"><HomeFooter showAboutUs={aboutUsVisible} goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk} onStartTour={user?.role === 'student' ? startStudioTour : undefined} /></div>}
    <LiveClassNotice user={user} blocked={showChangePassword || showTestAccessPrompt || showStudioTour || showTestimonial} />
  </div>;
}

export default function App() {
  return <Suspense fallback={<InkLoader fullscreen />}><AppContent /></Suspense>;
}
