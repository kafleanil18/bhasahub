import { lazy, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AdminLayout, AuthLayout, PublicLayout, RequireSession, StudentLayout } from './Layouts';
import PracticeGate from '../access/PracticeGate';
import { useInitialLoad } from './pageLoad';
import { adminPaths, homePath, manageCoursePath, safeReturnPath, testPath } from './paths';
import RefreshButton from '../components/RefreshButton';
const Login = lazy(() => import('../auth/Login'));
const Register = lazy(() => import('../auth/Register'));
const ForgotPassword = lazy(() => import('../auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../auth/ResetPassword'));
const AdminPanel = lazy(() => import('../admin/AdminPanel'));
const loadCoursePage = () => import('../courses/CoursePage');
const CoursePage = lazy(loadCoursePage);
const ContinueLearning = lazy(() => import('../courses/ContinueLearning'));
const loadLessonManager = () => import('../admin/LessonManager');
const LessonManager = lazy(loadLessonManager);
const Dashboard = lazy(() => import('../dashboard/Dashboard'));
const ProgressAnalytics = lazy(() => import('../dashboard/ProgressAnalytics'));
const PinyinPage = lazy(() => import('../practice/PinyinPage'));
const TonePractice = lazy(() => import('../practice/TonePractice'));
const FeedbackInbox = lazy(() => import('../admin/FeedbackInbox'));
const TestManager = lazy(() => import('../admin/TestManager'));
const TestList = lazy(() => import('../tests/TestList'));
const TestTaker = lazy(() => import('../tests/TestTaker'));
const HskPortal = lazy(() => import('../tests/hsk1/HskPortal'));
const TestimonialManager = lazy(() => import('../admin/TestimonialManager'));
const SubscriptionManager = lazy(() => import('../admin/SubscriptionManager'));
const UserManager = lazy(() => import('../admin/UserManager'));
const StudentManager = lazy(() => import('../admin/StudentManager'));
const RecordedSessions = lazy(() => import('../recordings/RecordedSessions.jsx'));
const RecordedSessionManager = lazy(() => import('../recordings/RecordedSessionManager.jsx'));
const AdminDashboard = lazy(() => import('../admin/AdminDashboard'));
const AuditLog = lazy(() => import('../admin/AuditLog'));
const HanziTracePage = lazy(() => import('../practice/HanziTracePage'));
const ConversationPracticePage = lazy(() => import('../practice/ConversationPractice'));
const ListeningPractice = lazy(() => import('../practice/ListeningPractice'));
const SentencePractice = lazy(() => import('../practice/SentencePractice'));
const ListeningDictation = lazy(() => import('../practice/ListeningDictation'));
const NumberTrainer = lazy(() => import('../practice/NumberTrainer'));
const MeasureWordPractice = lazy(() => import('../practice/MeasureWordPractice'));
const SentenceAudioManager = lazy(() => import('../admin/SentenceAudioManager'));
const TonePairAudioManager = lazy(() => import('../admin/TonePairAudioManager'));
const ConversationManager = lazy(() => import('../admin/ConversationManager'));
const EmailSettings = lazy(() => import('../admin/EmailSettings'));
const PracticeReminders = lazy(() => import('../admin/PracticeReminders'));
const TeacherManager = lazy(() => import('../admin/TeacherManager'));
const ReminderUnsubscribe = lazy(() => import('../ReminderUnsubscribe'));
const PricingPage = lazy(() => import('../pricing/PricingPage'));
const AboutHsk = lazy(() => import('../hsk/AboutHsk'));
const FaqPage = lazy(() => import('../home/FaqPage'));
const AboutXiaoAo = lazy(() => import('../about/AboutXiaoAo'));
const AboutPagesManager = lazy(() => import('../admin/AboutPagesManager'));
const PaymentSettings = lazy(() => import('../admin/PaymentSettings'));
import NotFound from './NotFound';
import AccessLocked from './AccessLocked';
import { apiFetch } from '../lib/apiClient';
const PrivacyPolicy = lazy(() => import('../privacy/PrivacyPages').then(module => ({ default: module.PrivacyPolicy })));
const BrowserStoragePolicy = lazy(() => import('../privacy/PrivacyPages').then(module => ({ default: module.BrowserStoragePolicy })));
const TermsOfService = lazy(() => import('../privacy/PrivacyPages').then(module => ({ default: module.TermsOfService })));


function HomeRoute({ user, home }) {
  const [params] = useSearchParams();
  if (params.get('reset')) return <Navigate to={`/reset-password?token=${encodeURIComponent(params.get('reset'))}`} replace />;
  return user?.role === 'superadmin' ? <Navigate to="/admin" replace /> : home;
}

function AuthPage({ user, children }) {
  const [params] = useSearchParams();
  return user ? <Navigate to={safeReturnPath(params.get('next'), homePath(user))} replace /> : children;
}

function PasswordResetRoute() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  return token ? <ResetPassword token={token} onDone={() => navigate('/sign-in', { replace: true })} /> : <Navigate to="/forgot-password" replace />;
}

function CourseRoute({ user, manage = false, onHome }) {
  const { courseId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  const staff = ['admin', 'superadmin'].includes(user?.role);
  useInitialLoad(!!state.loading, 'Loading your course…');
  // Download the course page's code while the course loads, so one loader covers both.
  useEffect(() => { void (manage ? loadLessonManager() : loadCoursePage()); }, [manage]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    apiFetch(`${window.API_BASE_URL}/api/courses${staff ? '/all' : ''}`, {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    }).then(async res => {
      if (!res.ok) throw new Error('Could not load the course.');
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('Could not load the course.');
      const course = rows.find(row => row._id === courseId);
      if (!controller.signal.aborted) setState({ course });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ error: 'Could not load the course. Please try again.' });
    });
    return () => controller.abort();
  }, [courseId, staff, retry]);
  if (state.error) return <section className="container" role="alert"><p>{state.error}</p><RefreshButton onClick={() => setRetry(value => value + 1)}>Try again</RefreshButton></section>;
  if (!state.loading && !state.course) return <section className="container"><h1>Course not found</h1><p>This course may no longer be available.</p><Link to={manage ? '/admin/courses' : '/'}>Browse courses</Link></section>;
  // While the course record loads, the page already starts (hidden behind the loader) with just the
  // id from the URL, so its lessons, access and progress load at the same time. Same key, so it
  // carries on rather than reloading once the full record arrives.
  const course = state.course || { _id: courseId };
  return manage
    ? <LessonManager key={courseId} course={course} focusLessonId={params.get('lesson')} onBack={() => navigate('/admin/courses')} />
    : <CoursePage key={courseId} course={course} user={user} onBack={onHome} />;
}

function TestRoute({ user, onHome }) {
  const { testId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preview = params.get('preview') === '1' && ['admin', 'superadmin'].includes(user?.role);
  const onBack = () => navigate(preview ? '/admin/tests' : '/tests');
  if (!testId) return <TestList user={user} onOpenTest={id => navigate(testPath(id))} onBack={onHome} />;
  const paper = ['h11226', 'h10901', 'h11556', 'h11221', 'h11112', 'h11009', 'h11332', 'h11440', 'h11552'].includes(testId) || /^paper-[a-f0-9]{24}$/.test(testId);
  return paper ? <HskPortal key={testId} paperId={testId} user={user} onBack={onBack} /> : <TestTaker key={testId} testId={testId} onBack={onBack} />;
}

export default function AppRoutes({ user, studentAccess = { loaded: true, courses: true, practice: true, recorded: true }, home, sidebar, onHome, onLogin, openLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');
  const authPath = path => `${path}${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  const staff = ['admin', 'superadmin'].includes(user?.role);
  // Students need course access for My Courses and practice access for My Progress; staff always
  // have both. Nothing shows until the check finishes, so a page never flashes before it locks.
  const gate = (need, page) => user?.role !== 'student' ? page : !studentAccess.loaded ? null : studentAccess[need] ? page : <AccessLocked need={need} />;
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/privacy" element={<PrivacyPolicy user={user} />} />
      <Route path="/cookies" element={<BrowserStoragePolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/pricing" element={<PricingPage user={user} />} />
      <Route path="/about-hsk" element={<AboutHsk />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/about" element={<AboutXiaoAo user={user} />} />
      <Route path="/email/reminders/unsubscribe" element={<ReminderUnsubscribe />} />
      <Route path="/" element={<HomeRoute user={user} home={home} />} />
      {/* The pinyin chart stays open to everyone; the other practice tools need approved access. */}
      <Route path="/practice/pinyin" element={<PinyinPage onBack={onHome} isSuperAdmin={staff} backLabel="Back to home" />} />
    </Route>
    <Route element={<AuthLayout />}>
      <Route path="/sign-in" element={<AuthPage user={user}><Login onLogin={onLogin} onBack={onHome} onSwitch={() => navigate(authPath('/register'))} onForgotPassword={() => navigate(authPath('/forgot-password'))} /></AuthPage>} />
      <Route path="/register" element={<AuthPage user={user}><Register onRegistered={() => navigate(authPath('/sign-in'), { replace: true })} onLogin={onLogin} onBack={onHome} onSwitch={() => navigate(authPath('/sign-in'))} /></AuthPage>} />
      <Route path="/forgot-password" element={<ForgotPassword onBack={onHome} onSwitch={() => navigate(authPath('/sign-in'))} />} />
      <Route path="/reset-password" element={<PasswordResetRoute />} />
    </Route>
    <Route element={<RequireSession user={user} />}>
      <Route element={<StudentLayout />}>
        <Route element={<RequireSession user={user} roles={['student']} hidden />}><Route path="/recorded-sessions" element={gate('recorded', <RecordedSessions />)} /></Route>
        <Route path="/continue" element={<ContinueLearning />} />
        <Route path="/my-courses" element={gate('courses', <Dashboard user={user} showRecordedSessions={studentAccess.recorded} onOpenCourse={(course, resume) => navigate(resume ? `/continue?course=${encodeURIComponent(course._id)}` : `/courses/${encodeURIComponent(course._id)}`)} onBrowse={() => navigate('/#courses')} />)} />
        <Route path="/progress" element={gate('practice', <ProgressAnalytics user={user} onBack={onHome} />)} />
        <Route path="/courses/:courseId" element={<CourseRoute user={user} onHome={onHome} />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<CourseRoute user={user} onHome={onHome} />} />
        <Route element={<PracticeGate user={user} onHome={onHome} />}>
          <Route path="/practice/tones" element={<TonePractice onBack={onHome} />} />
          <Route path="/practice/characters" element={<HanziTracePage user={user} onBack={onHome} />} />
          <Route path="/practice/listening" element={<ListeningPractice user={user} onBack={onHome} onSignIn={openLogin} />} />
          <Route path="/practice/sentences" element={<SentencePractice user={user} onBack={onHome} />} />
          <Route path="/practice/measure-words" element={<MeasureWordPractice onBack={onHome} />} />
          <Route path="/practice/numbers" element={<NumberTrainer onBack={onHome} />} />
          <Route path="/practice/dictation" element={<ListeningDictation onBack={onHome} onRecordAudio={user?.role === 'superadmin' ? () => navigate('/admin/sentence-audio') : undefined} />} />
          <Route path="/practice/conversations" element={<ConversationPracticePage onBack={onHome} />} />
        </Route>
        <Route path="/tests" element={<TestRoute user={user} onHome={onHome} />} />
        <Route path="/tests/:testId" element={<TestRoute user={user} onHome={onHome} />} />
      </Route>
    </Route>
    <Route element={<RequireSession user={user} roles={['admin', 'superadmin']} hidden />}>
      <Route path="/admin" element={<AdminLayout sidebar={sidebar} />}>
        <Route index element={user?.role === 'superadmin' ? <AdminDashboard user={user} onNavigate={view => navigate(adminPaths[view] || '/admin')} /> : <Navigate to="/admin/tests" replace />} />
        <Route path="tests" element={<TestManager user={user} onBack={onHome} onPreviewTest={id => navigate(testPath(id, true))} />} />
        <Route path="subscriptions" element={<SubscriptionManager onBack={onHome} />} />
        <Route element={<RequireSession user={user} roles={['superadmin']} hidden />}>
          <Route path="courses" element={<AdminPanel onBack={onHome} onManageLessons={course => navigate(manageCoursePath(course._id))} />} />
          <Route path="courses/:courseId/lessons" element={<CourseRoute user={user} manage onHome={onHome} />} />
          <Route path="users" element={<UserManager onBack={onHome} />} />
          <Route path="recorded-sessions" element={<RecordedSessionManager />} />
          <Route path="students" element={<StudentManager onBack={onHome} />} />
          <Route path="conversations" element={<ConversationManager onBack={onHome} />} />
          <Route path="testimonials" element={<TestimonialManager onBack={onHome} />} />
          <Route path="teachers" element={<TeacherManager onBack={onHome} />} />
          <Route path="about-pages" element={<AboutPagesManager />} />
          <Route path="payment-details" element={<PaymentSettings />} />
          <Route path="sentence-audio" element={<SentenceAudioManager onBack={onHome} />} />
          <Route path="tone-pair-audio" element={<TonePairAudioManager onBack={onHome} />} />
          <Route path="characters" element={<HanziTracePage user={user} onBack={onHome} />} />
          <Route path="pinyin" element={<PinyinPage isSuperAdmin onBack={onHome} backLabel="Back to admin dashboard" />} />
          <Route path="inbox" element={<FeedbackInbox onBack={onHome} />} />
          <Route path="audit" element={<AuditLog onBack={onHome} />} />
          <Route path="settings/email" element={<EmailSettings onBack={onHome} />} />
          <Route path="reminders" element={<PracticeReminders onBack={onHome} />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
