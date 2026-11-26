import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePath, signInPath } from './paths';
import PageLoadGate from './PageLoadGate';

export function RequireSession({ user, roles }) {
  const location = useLocation();
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
