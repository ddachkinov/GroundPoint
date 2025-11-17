import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'OPERATOR' | 'SITE_OWNER';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, getCurrentUser } = useAuthStore();

  useEffect(() => {
    // Try to get current user on mount if we have a token
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      getCurrentUser();
    }
  }, [isAuthenticated, getCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requireRole && user) {
    const userRole = user.role;
    const isSiteOwner = userRole === 'SITE_OWNER';
    const isOperator = userRole === 'OPERATOR_ADMIN' || userRole === 'OPERATOR_MEMBER';

    if (requireRole === 'OPERATOR' && !isOperator) {
      return <Navigate to="/client/dashboard" replace />;
    }

    if (requireRole === 'SITE_OWNER' && !isSiteOwner) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
