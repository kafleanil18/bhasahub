import AdminSidebar from './components/AdminSidebar';
import SiteHeader from './components/SiteHeader';
import HomeFooter from './home/HomeFooter';
import HomeTestimonials from './home/HomeTestimonials';
import HomeCourses from './home/HomeCourses';
import HomeHero from './home/HomeHero';
import StudioSaveStatus from './practice/StudioSaveStatus';
import AppRoutes from './navigation/AppRoutes';
import { adminPaths, coursePath, homePath, practicePaths, safeReturnPath, signInPath } from './navigation/paths';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, lazy, startTransition, Suspense } from 'react';
import './home.css';
import './flag-theme.css';
import { forgetPushDevice } from './pwa/usePushReminders';
import InkLoader from './components/InkLoader';

const NO_ATTENTION = { feedback: [], testimonials: [], access: [], plans: [] };
const ChangePassword = lazy(() => import('./auth/ChangePassword'));
const TestimonialModal = lazy(() => import('./components/TestimonialModal'));
const TestAccessPrompt = lazy(() => import('./components/TestAccessPrompt'));
const StudioTour = lazy(() => import('./home/StudioTour'));

function readStoredUser() {
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
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [desktopAdminNavigation, setDesktopAdminNavigation] = useState(() => window.matchMedia('(min-width: 1100px)').matches);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const testimonialsScrollRef = useRef(null);
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
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setAdminSidebarOpen(false);
    setShowChangePassword(false);
    setShowTestimonial(false);
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search, location.hash]);
  useEffect(() => {
    if (!location.hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, courses]);

  const loadCourses = () => {
    fetch(window.API_BASE_URL + '/api/courses')
      .then(res => res.json())
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoaded(true));
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
      .catch(() => setTestimonials([]))
      .finally(() => setTestimonialsLoaded(true));
  };

  const loadMyAccess = () => {
    const t = localStorage.getItem('token');
    if (!t) { setMyAccessDays(null); return; }
    const load = path => fetch(window.API_BASE_URL + path, { headers: { Authorization: `Bearer ${t}` } })
      .then(res => res.json()).then(data => Array.isArray(data) ? data : []).catch(() => []);
    // Paid access plus a free week from an approved access request.
    Promise.all([load('/api/subscriptions/my'), load('/api/access-requests/my')])
      .then(([subs, requests]) => {
        const now = new Date();
        const ends = [...subs.map(s => s.expiresAt), ...requests.filter(r => r.scope === 'tests' && r.status === 'approved' && r.expiresAt).map(r => r.expiresAt)];
        const daysList = ends
          .map(end => Math.ceil((new Date(end) - now) / (1000 * 60 * 60 * 24)))
          .filter(d => d > 0);
        setMyAccessDays(daysList.length ? Math.min(...daysList) : null);
      })
      .catch(() => setMyAccessDays(null));
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
      fetch(window.API_BASE_URL + path, { headers: { Authorization: `Bearer ${token}` } })
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
    fetch(window.API_BASE_URL + '/api/health')
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
  const handleLogout = () => {
    void forgetPushDevice(localStorage.getItem('token'));
    localStorage.removeItem('token'); localStorage.removeItem('user');
    // Commit the session change and destination together so route guards never
    // see a signed-out user on the previous protected page.
    startTransition(() => {
      setUser(null); setMyAccessDays(null); setAccess({});
      setShowTestAccessPrompt(false);
      setShowStudioTour(false);
      setShowChangePassword(false);
      navigate('/', { replace: true });
    });
  };
  const handleLogin = loggedInUser => {
    const next = new URLSearchParams(location.search).get('next');
    startTransition(() => {
      setUser(loggedInUser);
      setShowTestAccessPrompt(!['admin', 'superadmin'].includes(loggedInUser?.role));
      navigate(safeReturnPath(next, homePath(loggedInUser)), { replace: true });
    });
  };
  const openLogin = destination => {
    const next = typeof destination === 'string' ? destination : location.pathname + location.search + location.hash;
    navigate(signInPath(safeReturnPath(next)));
  };
  const startStudioTour = () => { if (location.pathname !== '/') navigate('/'); setShowStudioTour(true); };
  const openPractice = id => { if (practicePaths[id]) navigate(practicePaths[id]); };
  const openCourse = course => navigate(coursePath(course._id));
  const scrollTestimonials = direction => {
    const el = testimonialsScrollRef.current;
    if (el) el.scrollBy({ left: direction * ((el.querySelector('.testimonial-card')?.offsetWidth || 280) + 24), behavior: 'smooth' });
  };
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
    <HomeTestimonials loaded={testimonialsLoaded} openLogin={openLogin} scrollTestimonials={scrollTestimonials} setShowTestimonial={setShowTestimonial} testimonials={testimonials} testimonialsScrollRef={testimonialsScrollRef} user={user} />
    <HomeFooter goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk} onStartTour={user?.role === 'student' ? startStudioTour : undefined} />
  </main>;
  const sidebar = isSuperAdmin ? <>
    <div className={`admin-sidebar-backdrop ${adminSidebarOpen ? 'is-visible' : ''}`} onClick={() => setAdminSidebarOpen(false)} aria-hidden="true" />
    <AdminSidebar activeView={activeAdminView} onNavigate={view => navigate(adminPaths[view] || '/admin')} adminSidebarOpen={desktopAdminNavigation || adminSidebarOpen} isSuperAdmin={isSuperAdmin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={setAdminSidebarOpen} unreadFeedbackCount={unreadFeedbackCount} />
  </> : null;

  return <div className={isSuperAdmin && adminArea ? 'super-admin-layout' : undefined}>
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-orb orb-1" /><div className="ambient-orb orb-2" /><div className="ambient-orb orb-3" /><div className="ambient-orb orb-4" /><div className="ambient-mesh-grid" />
    </div>
    {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
    {showTestAccessPrompt && user && <Suspense fallback={null}><TestAccessPrompt user={user} onClose={closeTestAccessPrompt} onStartTour={startStudioTour} /></Suspense>}
    {showStudioTour && <Suspense fallback={null}><StudioTour onClose={closeStudioTour} /></Suspense>}
    {showTestimonial && <TestimonialModal user={user} onClose={() => { setShowTestimonial(false); loadTestimonials(); }} />}
    <SiteHeader adminSidebarOpen={adminSidebarOpen} attention={attention} darkMode={darkMode} goHome={goHome} handleLogout={handleLogout} hideForAuth={['/sign-in', '/register', '/reset-password'].includes(location.pathname)} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} mobileMenuOpen={mobileMenuOpen} myAccessDays={myAccessDays} openLogin={openLogin} pendingAccessRequestsCount={pendingAccessRequestsCount} pendingTestimonialsCount={pendingTestimonialsCount} setAdminSidebarOpen={value => { if (!adminArea) navigate('/admin'); setAdminSidebarOpen(value); }} setDarkMode={setDarkMode} setMobileMenuOpen={setMobileMenuOpen} onNavigate={navigate} setShowChangePassword={setShowChangePassword} setShowUserMenu={setShowUserMenu} showUserMenu={showUserMenu} unreadFeedbackCount={unreadFeedbackCount} user={user} />
    <StudioSaveStatus />
    <Suspense fallback={<InkLoader />}><AppRoutes user={user} home={home} sidebar={sidebar} onHome={goHome} onLogin={handleLogin} openLogin={openLogin} /></Suspense>
    {location.pathname !== '/' && <div className="home-page"><HomeFooter goHome={goHome} isSuperAdmin={isSuperAdmin} serverOk={serverOk} onStartTour={user?.role === 'student' ? startStudioTour : undefined} /></div>}
  </div>;
}

export default function App() {
  return <Suspense fallback={<InkLoader fullscreen />}><AppContent /></Suspense>;
}
