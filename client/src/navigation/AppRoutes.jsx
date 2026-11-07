import { lazy, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AdminLayout, AuthLayout, PublicLayout, RequireSession, StudentLayout } from './Layouts';
import { adminPaths, homePath, manageCoursePath, safeReturnPath, testPath } from './paths';
const Login = lazy(() => import('../auth/Login'));
const Register = lazy(() => import('../auth/Register'));
const ForgotPassword = lazy(() => import('../auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../auth/ResetPassword'));
const AdminPanel = lazy(() => import('../admin/AdminPanel'));
const CoursePage = lazy(() => import('../courses/CoursePage'));
const LessonManager = lazy(() => import('../admin/LessonManager'));
const Dashboard = lazy(() => import('../dashboard/Dashboard'));
const ProgressAnalytics = lazy(() => import('../dashboard/ProgressAnalytics'));
const PinyinPage = lazy(() => import('../practice/PinyinPage'));
const FeedbackInbox = lazy(() => import('../admin/FeedbackInbox'));
const TestManager = lazy(() => import('../admin/TestManager'));
const TestList = lazy(() => import('../tests/TestList'));
const TestTaker = lazy(() => import('../tests/TestTaker'));
const HskPortal = lazy(() => import('../tests/hsk1/HskPortal'));
const TestimonialManager = lazy(() => import('../admin/TestimonialManager'));
const SubscriptionManager = lazy(() => import('../admin/SubscriptionManager'));
const UserManager = lazy(() => import('../admin/UserManager'));
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
const ConversationManager = lazy(() => import('../admin/ConversationManager'));
const EmailSettings = lazy(() => import('../admin/EmailSettings'));
const PracticeReminders = lazy(() => import('../admin/PracticeReminders'));
const ReminderUnsubscribe = lazy(() => import('../ReminderUnsubscribe'));


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
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    fetch(`${window.API_BASE_URL}/api/courses${staff ? '/all' : ''}`, {
      headers: staff ? { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } : {},
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
  if (state.loading) return <div className="container" role="status">Loading course…</div>;
  if (state.error) return <section className="container" role="alert"><p>{state.error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></section>;
  if (!state.course) return <section className="container"><h1>Course not found</h1><p>This course may no longer be available.</p><Link to={manage ? '/admin/courses' : '/'}>Browse courses</Link></section>;
  return manage
    ? <LessonManager key={courseId} course={state.course} focusLessonId={params.get('lesson')} onBack={() => navigate('/admin/courses')} />
    : <CoursePage key={courseId} course={state.course} user={user} onBack={onHome} />;
}

function TestRoute({ user, onHome }) {
  const { testId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preview = params.get('preview') === '1' && ['admin', 'superadmin'].includes(user?.role);
  const onBack = () => navigate(preview ? '/admin/tests' : '/tests');
  if (!testId) return <TestList user={user} onOpenTest={id => navigate(testPath(id))} onBack={onHome} />;
  const paper = ['h11226', 'h10901', 'h11556'].includes(testId) || /^paper-[a-f0-9]{24}$/.test(testId);
  return paper ? <HskPortal key={testId} paperId={testId} user={user} onBack={onBack} /> : <TestTaker key={testId} testId={testId} onBack={onBack} />;
}

function NotFound() {
  return <section className="container"><h1>Page not found</h1><p>The address may have changed.</p><Link to="/">Back to home</Link></section>;
}

export default function AppRoutes({ user, home, sidebar, onHome, onLogin, openLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');
  const authPath = path => `${path}${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  const staff = ['admin', 'superadmin'].includes(user?.role);
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/email/reminders/unsubscribe" element={<ReminderUnsubscribe />} />
      <Route path="/" element={<HomeRoute user={user} home={home} />} />
      <Route path="/practice/pinyin" element={<PinyinPage onBack={onHome} isSuperAdmin={staff} backLabel="← Back to home" />} />
    </Route>
    <Route element={<AuthLayout />}>
      <Route path="/sign-in" element={<AuthPage user={user}><Login onLogin={onLogin} onBack={onHome} onSwitch={() => navigate(authPath('/register'))} onForgotPassword={() => navigate(authPath('/forgot-password'))} /></AuthPage>} />
      <Route path="/register" element={<AuthPage user={user}><Register onRegistered={() => navigate(authPath('/sign-in'), { replace: true })} onLogin={onLogin} onBack={onHome} onSwitch={() => navigate(authPath('/sign-in'))} /></AuthPage>} />
      <Route path="/forgot-password" element={<ForgotPassword onBack={onHome} onSwitch={() => navigate(authPath('/sign-in'))} />} />
      <Route path="/reset-password" element={<PasswordResetRoute />} />
    </Route>
    <Route element={<RequireSession user={user} />}>
      <Route element={<StudentLayout />}>
        <Route path="/my-courses" element={<Dashboard user={user} onOpenCourse={course => navigate(`/courses/${encodeURIComponent(course._id)}`)} onBrowse={onHome} />} />
        <Route path="/progress" element={<ProgressAnalytics user={user} onBack={onHome} />} />
        <Route path="/courses/:courseId" element={<CourseRoute user={user} onHome={onHome} />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<CourseRoute user={user} onHome={onHome} />} />
        <Route path="/practice/characters" element={<HanziTracePage user={user} token={localStorage.getItem('token')} onBack={onHome} />} />
        <Route path="/practice/listening" element={<ListeningPractice user={user} onBack={onHome} onSignIn={openLogin} />} />
        <Route path="/practice/sentences" element={<SentencePractice user={user} onBack={onHome} />} />
        <Route path="/practice/measure-words" element={<MeasureWordPractice onBack={onHome} />} />
        <Route path="/practice/numbers" element={<NumberTrainer onBack={onHome} />} />
        <Route path="/practice/dictation" element={<ListeningDictation onBack={onHome} onRecordAudio={user?.role === 'superadmin' ? () => navigate('/admin/sentence-audio') : undefined} />} />
        <Route path="/practice/conversations" element={<ConversationPracticePage onBack={onHome} />} />
        <Route path="/tests" element={<TestRoute user={user} onHome={onHome} />} />
        <Route path="/tests/:testId" element={<TestRoute user={user} onHome={onHome} />} />
      </Route>
    </Route>
    <Route element={<RequireSession user={user} roles={['admin', 'superadmin']} />}>
      <Route path="/admin" element={<AdminLayout sidebar={sidebar} />}>
        <Route index element={user?.role === 'superadmin' ? <AdminDashboard user={user} onNavigate={view => navigate(adminPaths[view] || '/admin')} /> : <Navigate to="/admin/tests" replace />} />
        <Route path="tests" element={<TestManager user={user} onBack={onHome} onPreviewTest={id => navigate(testPath(id, true))} />} />
        <Route path="subscriptions" element={<SubscriptionManager onBack={onHome} />} />
        <Route element={<RequireSession user={user} roles={['superadmin']} />}>
          <Route path="courses" element={<AdminPanel onBack={onHome} onManageLessons={course => navigate(manageCoursePath(course._id))} />} />
          <Route path="courses/:courseId/lessons" element={<CourseRoute user={user} manage onHome={onHome} />} />
          <Route path="users" element={<UserManager onBack={onHome} />} />
          <Route path="conversations" element={<ConversationManager onBack={onHome} />} />
          <Route path="testimonials" element={<TestimonialManager onBack={onHome} />} />
          <Route path="sentence-audio" element={<SentenceAudioManager onBack={onHome} />} />
          <Route path="characters" element={<HanziTracePage user={user} token={localStorage.getItem('token')} onBack={onHome} />} />
          <Route path="pinyin" element={<PinyinPage isSuperAdmin onBack={onHome} backLabel="← Back to Admin Dashboard" />} />
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
