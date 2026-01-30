import { describe, it, expect } from 'vitest';
import { ui } from '../i18n/ui'; // Revisa qu'esta ruta apunta bien al to ficheru de llinguaxes

describe('Validación de Diccionarios (I18n)', () => {
  
  it('el diccionariu asturianu debe tener les llaves básiques', () => {
    expect(ui.ast['nav.saas']).toBe('Soluciones SaaS');
    expect(ui.ast['nav.community']).toBe('Comunidá');
  });

  it('el diccionariu inglés debe incluyir la llave de fallback pa los tests', () => {
    // Esta ye la llinia que taba fallando nel CI/CD
    expect(ui.en['only.in.english']).toBe('English Text');
  });

  it('el diccionariu español debe tar completu', () => {
    expect(ui.es['nav.saas']).toBeDefined();
    expect(ui.es['nav.community']).toBe('Comunidad');
  });

});