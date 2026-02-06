import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSaasMode } from '../utils/featureFlags';

interface RouteProps {
  children: ReactNode;
}

interface ProtectedRouteProps extends RouteProps {
  adminOnly?: boolean;
}

/**
 * PublicRoute - For auth pages (login, register, etc.)
 * Redirects to dashboard if already authenticated
 */
export function PublicRoute({ children }: RouteProps) {
  const { user, userData, loading, isEmailVerified, hasCompletedOnboarding, hasOrgAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // If authenticated and has completed setup, redirect to dashboard
  if (user && userData) {
    // Check if fully set up
    if (isEmailVerified && hasCompletedOnboarding && (hasOrgAccess || userData.globalRole === 'superadmin')) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * OnboardingRoute - For onboarding and pending pages
 * Requires: auth + email verified (but allows incomplete onboarding)
 */
export function OnboardingRoute({ children }: RouteProps) {
  const { user, userData, loading, isEmailVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Must be authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // For email/password users, must verify email first
  if (!isEmailVerified && userData?.authProvider === 'email') {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />;
  }

  return <>{children}</>;
}

/**
 * ProtectedRoute - For dashboard and app pages
 * Requires: auth + email verified + onboarding complete + org access (or superadmin)
 */
export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const {
    user,
    userData,
    loading,
    isEmailVerified,
    hasCompletedOnboarding,
    hasOrgAccess,
    isSuperAdmin,
    isAdmin,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // 1. Must be authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Email must be verified (for email/password users)
  if (!isEmailVerified && userData?.authProvider === 'email') {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />;
  }

  // 3. Onboarding must be completed
  if (!hasCompletedOnboarding) {
    // In SaaS mode, redirect to onboarding
    if (isSaasMode()) {
      return <Navigate to="/onboarding/setup" replace />;
    }
    // In self-hosted mode, first user becomes superadmin automatically
    // If not superadmin and no onboarding, something is wrong
    if (!isSuperAdmin) {
      return <Navigate to="/pending" replace />;
    }
  }

  // 4. Must have org access or be superadmin
  if (!hasOrgAccess && !isSuperAdmin) {
    return <Navigate to="/pending" replace />;
  }

  // 5. Check admin-only routes
  if (adminOnly && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
