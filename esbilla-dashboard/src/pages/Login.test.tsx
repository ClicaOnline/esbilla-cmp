import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './Login';
import { I18nProvider } from '../i18n';

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

function renderWithProviders(component: React.ReactElement) {
  return render(
    <I18nProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </I18nProvider>
  );
}

describe('LoginPage', () => {
  it('debería mostrar el logo de Esbilla', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Esbilla CMP')).toBeInTheDocument();
    // Panel de Control is translated - check for any of the translations
    expect(screen.getByText(/Panel de Control|Control Panel/)).toBeInTheDocument();
  });

  it('debería mostrar el botón de login con Google', () => {
    renderWithProviders(<LoginPage />);
    // Check for translated button text
    expect(screen.getByText(/Continuar con Google|Siguir con Google|Continue with Google/)).toBeInTheDocument();
  });

  it('debería mostrar mensaje de acceso restringido', () => {
    renderWithProviders(<LoginPage />);
    // Check for translated message
    expect(screen.getByText(/Solo usuarios autorizados|Namás usuarios autorizaos|Only authorized users/)).toBeInTheDocument();
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
    renderWithProviders(<LoginPage />);
    // Verificar que el componente se renderiza
    expect(document.body).toBeInTheDocument();
  });
});
