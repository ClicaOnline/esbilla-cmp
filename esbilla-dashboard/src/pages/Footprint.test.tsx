import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FootprintPage } from './Footprint';

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

function renderWithRouter(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
}

describe('FootprintPage', () => {
  it('debería mostrar el título de la página', () => {
    renderWithRouter(<FootprintPage />);
    expect(screen.getByText('Buscar por Footprint')).toBeInTheDocument();
  });

  it('debería mostrar el campo de búsqueda', () => {
    renderWithRouter(<FootprintPage />);
    const searchInput = screen.getByPlaceholderText(/ESB-A7F3B2C1/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('debería mostrar el botón de buscar', () => {
    renderWithRouter(<FootprintPage />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('debería mostrar información sobre el Footprint ID', () => {
    renderWithRouter(<FootprintPage />);
    expect(screen.getByText(/¿Qué es el Footprint ID\?/i)).toBeInTheDocument();
    expect(screen.getByText(/derechos ARCO/i)).toBeInTheDocument();
  });

  it('debería mostrar la descripción de la funcionalidad', () => {
    renderWithRouter(<FootprintPage />);
    expect(screen.getByText(/historial de consentimiento/i)).toBeInTheDocument();
  });
});
