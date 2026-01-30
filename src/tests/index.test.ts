import { describe, it, expect } from 'vitest';
import { languages } from '../i18n/ui';

describe('Configuración de Rutes Dinámiques', () => {
  it('debe tener configurados exactamente los idiomes soportaos', () => {
    const supportedLangs = Object.keys(languages);
    expect(supportedLangs).toContain('ast');
    expect(supportedLangs).toContain('es');
    expect(supportedLangs).toContain('en');
    expect(supportedLangs).toHaveLength(3);
  });
});