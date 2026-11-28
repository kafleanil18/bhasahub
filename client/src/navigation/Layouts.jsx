import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePath, signInPath } from './paths';
import PageLoadGate from './PageLoadGate';
import NotFound from './NotFound';

// hidden: visitors without access see the ordinary 404 page instead of a sign-in redirect,
// so the address does not reveal that a protected page exists there.
export function RequireSession({ user, roles, hidden = false }) {
  const location = useLocation();
  if (hidden && (!user || (roles && !roles.includes(user.role)))) return <NotFound />;
  if (!user) return <Navigate to={signInPath(location.pathname + location.search + location.hash)} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}

// Each layout wraps its page in a PageLoadGate: pages that wait for data show one ink loader
// until their first data arrives (see useInitialLoad); every other page renders instantly.
export function PublicLayout() { return <div className="public-layout site-content" style={{ position: 'relative' }}><PageLoadGate><Outlet /></PageLoadGate></div>; }
export function StudentLayout() { return <div className="student-layout site-content" style={{ position: 'relative' }}><PageLoadGate><Outlet /></PageLoadGate></div>; }
export function AdminLayout({ sidebar }) { return <>{sidebar}<div className="admin-route-content site-content" style={{ position: 'relative' }}><PageLoadGate><Outlet /></PageLoadGate></div></>; }
export function AuthLayout() { return <div className="auth-layout"><Outlet /></div>; }
