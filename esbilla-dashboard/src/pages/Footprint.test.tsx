import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FootprintPage } from './Footprint';
import { I18nProvider } from '../i18n';

// Mock del contexto de autenticación
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', displayName: 'Test User', photoURL: null },
    userData: { role: 'admin' },
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    isAdmin: true,
    isAuthorized: true
  })
}));

// Mock de Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
  orderBy: vi.fn()
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

describe('FootprintPage', () => {
  it('debería mostrar el título de la página', () => {
    renderWithProviders(<FootprintPage />);
    // Check for translated title
    expect(screen.getByText(/Buscar por Footprint|Search by Footprint/)).toBeInTheDocument();
  });

  it('debería mostrar el campo de búsqueda', () => {
    renderWithProviders(<FootprintPage />);
    const searchInput = screen.getByPlaceholderText(/ESB-A7F3B2C1/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('debería mostrar el botón de buscar', () => {
    renderWithProviders(<FootprintPage />);
    expect(screen.getByRole('button', { name: /buscar|search/i })).toBeInTheDocument();
  });

  it('debería mostrar información sobre el Footprint ID', () => {
    renderWithProviders(<FootprintPage />);
    expect(screen.getByText(/¿Qué es el Footprint ID\?|¿Qué ye'l Footprint ID\?|What is the Footprint ID\?/i)).toBeInTheDocument();
    expect(screen.getByText(/derechos ARCO|ARCO rights/i)).toBeInTheDocument();
  });

  it('debería mostrar la descripción de la funcionalidad', () => {
    renderWithProviders(<FootprintPage />);
    expect(screen.getByText(/historial de consentimiento|historial de consentimientu|consent history/i)).toBeInTheDocument();
  });
});
