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
    const isSuperAdmin = userData.globalRole === 'superadmin' || userData.role === 'superadmin';

    // Superadmin → siempre al dashboard (no requiere onboarding)
    if (isEmailVerified && isSuperAdmin) {
      return <Navigate to="/" replace />;
    }

    // Usuario con acceso y onboarding completado → dashboard
    if (isEmailVerified && hasCompletedOnboarding && hasOrgAccess) {
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

  // 3. Superadmin tiene acceso total (no requiere onboarding ni orgAccess)
  if (isSuperAdmin) {
    // Superadmin puede acceder a todo
    if (adminOnly && !isAdmin) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // 4. Para usuarios normales: onboarding debe estar completado
  if (!hasCompletedOnboarding) {
    // In SaaS mode, redirect to onboarding
    if (isSaasMode()) {
      return <Navigate to="/onboarding/setup" replace />;
    }
    // In self-hosted mode, if not superadmin and no onboarding → no account page
    return <Navigate to="/no-account" replace />;
  }

  // 5. Must have org access
  if (!hasOrgAccess) {
    // User completed onboarding but has no org access → waiting for approval
    return <Navigate to="/pending" replace />;
  }

  // 6. Check admin-only routes (para usuarios normales con orgAccess)
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
