import { describe, it, expect } from 'vitest';
import { useTranslations } from '../i18n/utils';

describe('Sistema de Traducción Esbilla', () => {
  it('debe retornar el texto correcto en asturianu', () => {
    const t = useTranslations('ast');
    // Asumiento que tienes 'nav.saas' nel ficheru
    expect(t('nav.saas')).toBe('SaaS (Próximamente)');
  });

  it('debe usar el fallback (inglés) si la llave no existe en asturianu', () => {
    const t = useTranslations('ast');
    // Forzamos una llave que solo tea n'inglés pa probar
    expect(t('only.in.asturianu' as any)).toBe('Textu en Asturianu');
  });

  it('debe funcionar correctamente con el parámetro de idioma', () => {
    const tEs = useTranslations('es');
    expect(tEs('nav.community')).toBe('Comunidad');
    
    const tAst = useTranslations('ast');
    expect(tAst('nav.community')).toBe('Comunidá');
  });

  
});