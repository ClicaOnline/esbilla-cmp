// src/seo/schema.test.ts
import { describe, it, expect } from 'vitest';
import { getEsbillaSchema } from '../seo/schema';

describe('Validación de Metadata SEO (Schema.org)', () => {
  const schema = getEsbillaSchema('ast');

  it('debe tener el contexto y tipo correctos', () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("SoftwareApplication");
  });

  it('debe incluir la licencia oficial de GitHub', () => {
    expect(schema.license).toContain('github.com/ClicaOnline');
  });

  it('debe tener el nombre de marca correcto', () => {
    expect(schema.name).toBe("Esbilla CMP");
  });

  it('debe validar que el idioma coincide con el parámetro', () => {
    const esSchema = getEsbillaSchema('es');
    expect(esSchema.inLanguage).toBe('es');
  });
});