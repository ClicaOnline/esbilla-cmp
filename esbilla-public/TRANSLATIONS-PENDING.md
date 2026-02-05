# Traducciones Pendientes para la Landing

Este documento lista las nuevas claves añadidas al sistema de internacionalización que necesitan ser traducidas a todos los idiomas.

## Estado de Traducciones

- ✅ **es** (Español): Completo
- ⏳ **ast** (Asturianu): Pendiente
- ⏳ **gl** (Galego): Pendiente
- ⏳ **eu** (Euskara): Pendiente
- ⏳ **ca** (Català): Pendiente
- ⏳ **en** (English): Pendiente
- ⏳ **fr** (Français): Pendiente
- ⏳ **pt** (Português): Pendiente
- ⏳ **it** (Italiano): Pendiente
- ⏳ **de** (Deutsch): Pendiente

## Nuevas Secciones Añadidas

### 1. Navegación
- `nav.getstarted`: Enlace al menú "Cómo Empezar"

### 2. Página "Cómo Empezar" (Get Started)
- Hero section: `getstarted.hero.*`
- 3 pasos: `getstarted.step1.*`, `getstarted.step2.*`, `getstarted.step3.*`

### 3. Modos Detallados
- Título general: `modes.title`, `modes.subtitle`
- **Modo Manual**: `modes.manual.*` (7 claves)
- **Modo Simplificado**: `modes.simplified.*` (8 claves)
- **Modo GTM**: `modes.gtm.*` (7 claves)

### 4. Argumentación Legal del Modo GTM
Esta es la sección más extensa con ~50 claves:

- Introducción: `gtm.legal.intro`
- **Problema**: `gtm.legal.problem.*` (7 claves)
- **Solución de Esbilla**: `gtm.legal.solution.*` (10 claves)
- **Ventajas Legales**: `gtm.legal.advantages.*` + 5 ventajas detalladas (12 claves)
- **Comparación**: `gtm.legal.comparison.*` (12 claves)
- **Jurisprudencia**: `gtm.legal.jurisprudence.*` (5 claves)
- **Conclusión**: `gtm.legal.conclusion.*` (6 claves)
- Call to action: `gtm.legal.cta`

### 5. SaaS Expandido
- Hero actualizado: `saas.hero.new.*` (3 claves)
- **Planes**: `saas.plans.*`
  - Plan Comunidad: 5 claves
  - Plan Profesional: 6 claves
  - Plan Empresa: 7 claves
- **Por qué SaaS**: `saas.why.*` (6 claves)
- **CTA**: `saas.cta.*` (4 claves)

## Total de Nuevas Claves

**~120 claves nuevas** que necesitan traducción a 9 idiomas.

## Prioridad de Traducción

1. **Alta Prioridad** (idiomas principales):
   - ✅ es (Español) - HECHO
   - ast (Asturianu) - idioma por defecto del proyecto
   - en (English) - idioma internacional

2. **Media Prioridad** (idiomas ibéricos):
   - gl (Galego)
   - eu (Euskara)
   - ca (Català)
   - pt (Português)

3. **Baja Prioridad** (idiomas adicionales):
   - fr (Français)
   - it (Italiano)
   - de (Deutsch)

## Proceso de Traducción

1. Copiar las claves del archivo `es.ts` (líneas 109-250 aproximadamente)
2. Traducir manteniendo:
   - Formato Markdown en descripciones (ej: `<strong>`)
   - Nombres de artículos RGPD en el idioma correspondiente
   - Tono profesional pero accesible
   - Metáfora del "hórreo" adaptada culturalmente

3. Revisar terminología legal RGPD:
   - RGPD/GDPR/DSGVO según idioma
   - Consentimiento/Consent/Zustimmung
   - Datos personales/Personal data/Personenbezogene Daten

## Archivos a Modificar

```
esbilla-public/src/i18n/languages/
├── ast.ts  ⏳
├── es.ts   ✅
├── gl.ts   ⏳
├── eu.ts   ⏳
├── ca.ts   ⏳
├── en.ts   ⏳
├── fr.ts   ⏳
├── pt.ts   ⏳
├── it.ts   ⏳
└── de.ts   ⏳
```

## Notas para Traductores

### Terminología Clave

| Español | Asturianu | English | Français |
|---------|-----------|---------|----------|
| Modo | Mou | Mode | Mode |
| Hórreo | Hórreu | Granary | Grenier |
| Andecha | Andecha | Community work | Travail communautaire |
| Consentimiento | Consentimientu | Consent | Consentement |
| Gobernanza | Gobernanza | Governance | Gouvernance |

### Estilo

- **Tono**: Profesional pero cercano
- **Metáforas**: Adaptar referencias culturales (el hórreo es específico de Asturias)
- **Legal**: Mantener precisión en términos RGPD
- **Técnico**: No simplificar en exceso términos como "fingerprinting", "proxy", "script"

## Ayuda para Traducir

### Herramientas Recomendadas

1. **DeepL** (traducciones técnicas precisas): https://deepl.com
2. **IATE** (terminología EU/RGPD): https://iate.europa.eu
3. **Poedit** (editor de archivos .po si se convierten): https://poedit.net

### Contribuir

Si quieres contribuir con traducciones:

1. Fork el repositorio
2. Traduce un idioma completo
3. Crea un Pull Request
4. Tag: `i18n-{idioma}` (ej: `i18n-en`, `i18n-fr`)

---

**Última actualización**: 2026-02-05
**Versión**: 1.1.0 (nuevas secciones Get Started y GTM Legal)
