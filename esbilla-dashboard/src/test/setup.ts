import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Limpieza después de cada test
afterEach(() => {
  cleanup();
});

// Mock de Firebase para tests
vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {}
}));

// Mock de ResizeObserver (necesario para Recharts)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
