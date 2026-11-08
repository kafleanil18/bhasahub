import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePath, signInPath } from './paths';

export function RequireSession({ user, roles }) {
  const location = useLocation();
  if (!user) return <Navigate to={signInPath(location.pathname + location.search + location.hash)} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}

export function PublicLayout() { return <div className="public-layout site-content"><Outlet /></div>; }
export function StudentLayout() { return <div className="student-layout site-content"><Outlet /></div>; }
export function AdminLayout({ sidebar }) { return <>{sidebar}<div className="admin-route-content site-content"><Outlet /></div></>; }
export function AuthLayout() { return <div className="auth-layout"><Outlet /></div>; }
