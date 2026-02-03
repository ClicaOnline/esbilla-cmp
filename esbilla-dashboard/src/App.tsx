import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { SitesPage } from './pages/Sites';
import { FootprintPage } from './pages/Footprint';
import { UsersPage } from './pages/Users';
import { SettingsPage } from './pages/Settings';
import { UrlStatsPage } from './pages/UrlStats';
import { OrganizationsPage } from './pages/Organizations';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, userData, loading, isAdmin, error } = useAuth();

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error de Firebase
  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // No hay usuario - ir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usuario existe pero userData no cargado aún - esperar
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // userData cargado pero rol es pending - ir a login (mostrará pantalla pending)
  if (userData.role === 'pending') {
    return <Navigate to="/login" replace />;
  }

  // Solo admin pero usuario no es admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Todo OK - mostrar contenido
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
