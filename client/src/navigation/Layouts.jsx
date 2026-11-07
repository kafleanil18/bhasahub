import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePath, signInPath } from './paths';

export function RequireSession({ user, roles }) {
  const location = useLocation();
  if (!user) return <Navigate to={signInPath(location.pathname + location.search + location.hash)} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}

export function PublicLayout() { return <Outlet />; }
export function StudentLayout() { return <div className="student-layout"><Outlet /></div>; }
export function AdminLayout({ sidebar }) { return <>{sidebar}<div className="admin-route-content"><Outlet /></div></>; }
export function AuthLayout() { return <Outlet />; }
