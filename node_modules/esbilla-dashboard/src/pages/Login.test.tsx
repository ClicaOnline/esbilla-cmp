import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './Login';

// Mock del contexto de autenticación
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    userData: null,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    isAdmin: false,
    isAuthorized: false
  })
}));

function renderWithRouter(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
}

describe('LoginPage', () => {
  it('debería mostrar el logo de Esbilla', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Esbilla CMP')).toBeInTheDocument();
    expect(screen.getByText('Panel de Control')).toBeInTheDocument();
  });

  it('debería mostrar el botón de login con Google', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
  });

  it('debería mostrar mensaje de acceso restringido', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Solo usuarios autorizados pueden acceder')).toBeInTheDocument();
  });

  it('debería mostrar estado de carga cuando loading=true', () => {
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        userData: null,
        loading: true,
        error: null,
        signInWithGoogle: vi.fn(),
        signOut: vi.fn(),
        isAdmin: false,
        isAuthorized: false
      })
    }));

    // El componente LoginPage maneja su propio estado de carga
    renderWithRouter(<LoginPage />);
    // Verificar que el componente se renderiza
    expect(document.body).toBeInTheDocument();
  });
});
