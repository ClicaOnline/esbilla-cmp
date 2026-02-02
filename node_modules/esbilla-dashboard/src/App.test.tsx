import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock de todas las páginas para simplificar los tests
vi.mock('./pages/Login', () => ({
  LoginPage: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('./pages/Dashboard', () => ({
  DashboardPage: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

vi.mock('./pages/Footprint', () => ({
  FootprintPage: () => <div data-testid="footprint-page">Footprint Page</div>
}));

vi.mock('./pages/Users', () => ({
  UsersPage: () => <div data-testid="users-page">Users Page</div>
}));

// Variable para controlar el estado de autenticación en los tests
let mockAuthState = {
  user: null as { uid: string } | null,
  userData: null as { role: string } | null,
  loading: false,
  error: null,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  isAdmin: false,
  isAuthorized: false
};

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockAuthState
}));

describe('App - Routing', () => {
  beforeEach(() => {
    // Reset auth state antes de cada test
    mockAuthState = {
      user: null,
      userData: null,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      isAdmin: false,
      isAuthorized: false
    };
  });

  it('debería redirigir a login cuando no hay usuario autenticado', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('debería mostrar loading mientras se carga la autenticación', () => {
    mockAuthState.loading = true;
    window.history.pushState({}, '', '/');
    render(<App />);
    // El spinner de carga debería estar presente
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debería mostrar el dashboard cuando el usuario está autenticado', () => {
    mockAuthState.user = { uid: 'test-user' };
    mockAuthState.userData = { role: 'viewer' };
    mockAuthState.isAuthorized = true;

    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('debería mostrar la página de footprint para usuarios autorizados', () => {
    mockAuthState.user = { uid: 'test-user' };
    mockAuthState.userData = { role: 'viewer' };
    mockAuthState.isAuthorized = true;

    window.history.pushState({}, '', '/footprint');
    render(<App />);
    expect(screen.getByTestId('footprint-page')).toBeInTheDocument();
  });

  it('debería redirigir a / si un viewer intenta acceder a /users', () => {
    mockAuthState.user = { uid: 'test-user' };
    mockAuthState.userData = { role: 'viewer' };
    mockAuthState.isAuthorized = true;
    mockAuthState.isAdmin = false;

    window.history.pushState({}, '', '/users');
    render(<App />);
    // Debería redirigir al dashboard porque no es admin
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('debería mostrar la página de usuarios para admins', () => {
    mockAuthState.user = { uid: 'admin-user' };
    mockAuthState.userData = { role: 'admin' };
    mockAuthState.isAuthorized = true;
    mockAuthState.isAdmin = true;

    window.history.pushState({}, '', '/users');
    render(<App />);
    expect(screen.getByTestId('users-page')).toBeInTheDocument();
  });
});
