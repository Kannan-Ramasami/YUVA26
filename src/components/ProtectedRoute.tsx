import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRole?: Role;
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to the appropriate login page based on the attempted URL
  if (!user || !profile) {
    const isStaffRoute = location.pathname.includes('/staff');
    return <Navigate to={isStaffRoute ? '/staff/login' : '/student/login'} state={{ from: location }} replace />;
  }

  // If authenticated but wrong role, redirect to their correct dashboard
  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  return <Outlet />;
}
