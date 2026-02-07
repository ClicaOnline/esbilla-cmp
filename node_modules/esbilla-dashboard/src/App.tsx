import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, OnboardingRoute, ProtectedRoute } from './components/ProtectedRoute';

// Auth pages
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { VerifyEmailPage } from './pages/VerifyEmail';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { AuthActionPage } from './pages/AuthAction';
import { PendingApprovalPage } from './pages/PendingApproval';
import { OnboardingSetupPage } from './pages/OnboardingSetup';
import { AcceptInvitePage } from './pages/AcceptInvite';

// Dashboard pages
import { DashboardPage } from './pages/Dashboard';
import { SitesPage } from './pages/Sites';
import { FootprintPage } from './pages/Footprint';
import { UsersPage } from './pages/Users';
import { SettingsPage } from './pages/Settings';
import { UrlStatsPage } from './pages/UrlStats';
import { OrganizationsPage } from './pages/Organizations';
import { WaitingListPage } from './pages/WaitingList';

function AppRoutes() {
  return (
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
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
