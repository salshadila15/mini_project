import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts/AuthContext';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
  redirectTo?: string;
};

function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
        Memuat...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/profile';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
