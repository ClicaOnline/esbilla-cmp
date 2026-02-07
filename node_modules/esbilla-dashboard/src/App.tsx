import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, OnboardingRoute, ProtectedRoute } from './components/ProtectedRoute';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-stone-600">Cargando...</div>
  </div>
);

// Auth pages - Solo LoginPage cargado inmediatamente (es la entrada principal)
import { LoginPage } from './pages/Login';
const RegisterPage = lazy(() => import('./pages/Register').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPasswordPage })));
const AuthActionPage = lazy(() => import('./pages/AuthAction').then(m => ({ default: m.AuthActionPage })));
const PendingApprovalPage = lazy(() => import('./pages/PendingApproval').then(m => ({ default: m.PendingApprovalPage })));
const OnboardingSetupPage = lazy(() => import('./pages/OnboardingSetup').then(m => ({ default: m.OnboardingSetupPage })));
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvite').then(m => ({ default: m.AcceptInvitePage })));

// Dashboard pages - Todos lazy loaded
const DashboardPage = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const SitesPage = lazy(() => import('./pages/Sites').then(m => ({ default: m.SitesPage })));
const FootprintPage = lazy(() => import('./pages/Footprint').then(m => ({ default: m.FootprintPage })));
const UsersPage = lazy(() => import('./pages/Users').then(m => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const UrlStatsPage = lazy(() => import('./pages/UrlStats').then(m => ({ default: m.UrlStatsPage })));
const OrganizationsPage = lazy(() => import('./pages/Organizations').then(m => ({ default: m.OrganizationsPage })));
const WaitingListPage = lazy(() => import('./pages/WaitingList').then(m => ({ default: m.WaitingListPage })));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
      {/* Public routes (auth pages) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/__/auth/action"
        element={
          <PublicRoute>
            <AuthActionPage />
          </PublicRoute>
        }
      />
      <Route
        path="/invite/:inviteId"
        element={
          <PublicRoute>
            <AcceptInvitePage />
          </PublicRoute>
        }
      />

      {/* Onboarding routes */}
      <Route
        path="/onboarding/setup"
        element={
          <OnboardingRoute>
            <OnboardingSetupPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/pending"
        element={
          <OnboardingRoute>
            <PendingApprovalPage />
          </OnboardingRoute>
        }
      />

      {/* Protected routes (dashboard) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites"
        element={
          <ProtectedRoute adminOnly>
            <SitesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/footprint"
        element={
          <ProtectedRoute>
            <FootprintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute adminOnly>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/url-stats"
        element={
          <ProtectedRoute>
            <UrlStatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizations"
        element={
          <ProtectedRoute adminOnly>
            <OrganizationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waiting-list"
        element={
          <ProtectedRoute adminOnly>
            <WaitingListPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
