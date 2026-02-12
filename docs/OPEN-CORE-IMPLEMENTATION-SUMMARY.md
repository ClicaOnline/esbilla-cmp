# Implementación del Modelo Open Core - Resumen Completo

## 📋 Índice

1. [Visión General](#visión-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Feature Flags](#feature-flags)
4. [Sistema de Hooks](#sistema-de-hooks)
5. [Módulos SDK](#módulos-sdk)
6. [Scripts de Build](#scripts-de-build)
7. [Migración de Código](#migración-de-código)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Visión General

Esbilla CMP implementa un **modelo Open Core** con dos ediciones:

### Community Edition (CE) - Open Source
- **Licencia**: GPL v3
- **Repositorio**: Público en GitHub
- **Target**: Self-hosted, desarrolladores, pequeños proyectos
- **Features**: Gestión básica de consentimiento + 5 integraciones

### Enterprise Edition (EE) - Propietario
- **Licencia**: Propietaria
- **Repositorio**: Privado
- **Target**: SaaS multi-tenant, empresas
- **Features**: Todo CE + multi-tenancy + 14 integraciones extra + attribution + cross-domain + GTM Gateway

---

## 📁 Estructura de Carpetas

```
esbilla-cmp/  (Repositorio privado EE)
│
├── esbilla-api/
│   ├── src/
│   │   ├── config/
│   │   │   └── edition.js           ← Feature flags backend
│   │   ├── hooks.js                 ← Sistema de hooks (loader)
│   │   └── enterprise/              ← 🏢 CÓDIGO EE (no en CE)
│   │       ├── routes/
│   │       │   ├── invitations.js
│   │       │   └── invitations.test.js
│   │       ├── services/
│   │       │   └── email.js
│   │       ├── middleware/
│   │       │   └── index.js
│   │       └── README.md
│   │
│   ├── public/
│   │   └── modules/
│   │       ├── analytics/           ← CE + EE
│   │       ├── marketing/           ← CE + EE
│   │       ├── functional/          ← CE + EE
│   │       └── ee/                  ← 🏢 MÓDULOS EE (no en CE)
│   │           ├── attribution.js
│   │           ├── cross-domain.js
│   │           ├── gtm-gateway.js
│   │           └── README.md
│   │
│   └── docs/
│       └── HOOKS-SYSTEM.md          ← Documentación de hooks
│
├── esbilla-dashboard/
│   ├── src/
│   │   ├── config/
│   │   │   └── edition.ts           ← Feature flags frontend
│   │   └── enterprise/              ← 🏢 CÓDIGO EE (no en CE)
│   │       ├── pages/
│   │       │   ├── AcceptInvite.tsx
│   │       │   ├── OnboardingSetup.tsx
│   │       │   ├── Organizations.tsx
│   │       │   ├── PendingApproval.tsx
│   │       │   ├── Register.tsx
│   │       │   ├── Users.tsx
│   │       │   ├── WaitingList.tsx
│   │       │   └── Waitlist.tsx
│   │       ├── components/
│   │       ├── hooks/
│   │       └── README.md
│   │
│   └── App.tsx                      ← Imports desde /enterprise
│
├── scripts/
│   ├── build-ce.sh                  ← Build Community Edition
│   ├── build-ee.sh                  ← Build Enterprise Edition
│   └── prepare-ce-repo.sh           ← Preparar repo público CE
│
└── docs/
    ├── OPEN-CORE-ARCHITECTURE.md    ← Arquitectura general
    └── OPEN-CORE-IMPLEMENTATION-SUMMARY.md  ← Este documento
```

---

## 🏗️ Feature Flags

### Backend (esbilla-api/src/config/edition.js)

```javascript
const EDITION = process.env.ESBILLA_EDITION || 'enterprise';

const FEATURES = {
  community: {
    attribution: false,
    crossDomain: false,
    gtmGateway: false,
    multiTenancy: false,
    quotas: false,
    invitations: false,
    sync: false,
    emailAuth: false,
    onboarding: false,
    waitingList: false,
    advancedStats: false,
    plans: false,
  },
  enterprise: {
    // Todas en true
    ...
  }
};

function hasFeature(feature) {
  return FEATURES[EDITION][feature] || false;
}
```

**Uso:**
```javascript
const { hasFeature, featureMiddleware } = require('./config/edition.js');

// En lógica
if (hasFeature('invitations')) {
  // código EE
}

// Como middleware
router.post('/api/invitations', featureMiddleware('invitations'), handler);
```

### Frontend (esbilla-dashboard/src/config/edition.ts)

```typescript
export const EDITION: Edition =
  (import.meta.env.VITE_ESBILLA_EDITION as Edition) || 'enterprise';

export function hasFeature(feature: FeatureName): boolean {
  return FEATURES[EDITION][feature] || false;
}

export function useFeature(feature: FeatureName): boolean {
  return hasFeature(feature);
}
```

**Uso en componentes:**
```typescript
import { hasFeature, useFeature } from '@/config/edition';

function MyComponent() {
  const hasMultiTenancy = useFeature('multiTenancy');

  if (!hasMultiTenancy) {
    return <BasicView />;
  }

  return <EnterpriseView />;
}
```

---

## 🔌 Sistema de Hooks

Permite al código CE tener puntos de extensión donde se inyecta lógica EE.

### Arquitectura

```
┌─────────────────┐
│  app.js (CE)    │
│                 │
│  await hooks.   │
│  beforeCreate-  │
│  Site(...)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  hooks.js       │  ← Loader (carga condicional)
│  (CE compatible)│
│                 │
│  if (isEE) {    │
│    eeMiddleware │
│  }              │
└────────┬────────┘
         │ (si EE)
         ▼
┌──────────────────────┐
│  enterprise/         │
│  middleware/index.js │  ← Implementación EE
│                      │
│  async function      │
│  beforeCreateSite()  │
│  { ... lógica EE }   │
└──────────────────────┘
```

### Hooks Disponibles

**Validación (before):**
- `beforeCreateSite(req, res, siteData)` - Valida org, enriquece datos
- `beforeLogConsent(req, res, consentData)` - Añade organizationId
- `beforeDeleteSite(req, res, siteId)` - Valida permisos

**Acción (after):**
- `afterUserCreated(userData)` - Email bienvenida, auto-assign a org

**Middlewares:**
- `validateOrganizationAccess` - Verifica acceso a org
- `enforceQuotas` - Valida límites del plan
- `requireRole(...roles)` - Valida rol de usuario

### Ejemplo de Uso

```javascript
const hooks = require('./hooks');

app.post('/api/sites', async (req, res) => {
  // Hook: Validar y enriquecer
  const result = await hooks.beforeCreateSite(req, res, siteData);

  if (!result.valid) {
    return res.status(result.error.status).json(result.error);
  }

  // Usar datos enriquecidos
  await db.collection('sites').doc(id).set(result.data);

  res.status(201).json({ id });
});
```

**Comportamiento:**
- **CE**: `beforeCreateSite` retorna `{ valid: true, data: siteData }` sin cambios
- **EE**: Valida `organizationId`, verifica quotas, añade `organizationName` y `plan`

Ver documentación completa: [esbilla-api/docs/HOOKS-SYSTEM.md](../esbilla-api/docs/HOOKS-SYSTEM.md)

---

## 📦 Módulos SDK

### Módulos Compartidos (CE + EE)

**Analytics (CE: 3, EE: 7):**
- ✅ Google Analytics 4 (CE + EE)
- ✅ Hotjar (CE + EE)
- ✅ Microsoft Clarity (CE + EE)
- 🏢 Amplitude (EE)
- 🏢 Crazy Egg (EE)
- 🏢 VWO (EE)
- 🏢 Optimizely (EE)

**Marketing (CE: 2, EE: 10):**
- ✅ Facebook Pixel (CE + EE)
- ✅ LinkedIn Insight Tag (CE + EE)
- 🏢 TikTok Pixel (EE)
- 🏢 Google Ads (EE)
- 🏢 Microsoft Ads (EE)
- 🏢 Criteo (EE)
- 🏢 Pinterest (EE)
- 🏢 Twitter (EE)
- 🏢 Taboola (EE)
- 🏢 HubSpot (EE)

**Functional (CE: 0, EE: 2):**
- 🏢 Intercom (EE)
- 🏢 Zendesk (EE)

### Módulos Exclusivos EE

**`modules/ee/attribution.js`** - Marketing Attribution
- UTM parameters (source, medium, campaign, term, content)
- Click IDs (gclid, fbclid, msclkid, ttclid, etc.)
- First-touch y last-touch attribution
- Persistencia localStorage (30 días)

**`modules/ee/cross-domain.js`** - Cross-domain Sync
- Sincronización de footprint ID entre dominios
- Parámetro URL `?esbilla_fid=xxx`
- API sync endpoint
- Decoración de links salientes

**`modules/ee/gtm-gateway.js`** - GTM Gateway
- Carga GTM desde dominio personalizado
- Bypass de ad blockers
- Google Consent Mode v2
- dataLayer management

### Carga Dinámica

El Pegoyu (SDK principal) carga módulos EE bajo demanda:

```javascript
// En pegoyu.js
if (config.features.attribution) {
  await loadModule('/modules/ee/attribution.js');
}

if (config.features.crossDomain) {
  await loadModule('/modules/ee/cross-domain.js');
}
```

En CE, estos módulos **no existen** en el filesystem, por lo que nunca se cargan.

---

## 🛠️ Scripts de Build

### 1. `scripts/build-ce.sh` - Build Community Edition

**Acciones:**
1. ✅ Copia todo excepto `/enterprise`
2. ✅ Elimina `modules/ee/`
3. ✅ Configura `ESBILLA_EDITION=community`
4. ✅ Actualiza imports en `App.tsx` y `app.js`
5. ✅ Comenta rutas EE
6. ✅ Instala dependencias
7. ✅ Build de dashboard

**Uso:**
```bash
./scripts/build-ce.sh
cd build/ce
```

**Output:** Carpeta `build/ce/` lista para deploy

### 2. `scripts/build-ee.sh` - Build Enterprise Edition

**Acciones:**
1. ✅ Copia todo (incluye `/enterprise`)
2. ✅ Verifica módulos EE
3. ✅ Configura `ESBILLA_EDITION=enterprise`
4. ✅ Instala dependencias
5. ✅ Build de dashboard

**Uso:**
```bash
./scripts/build-ee.sh
cd build/ee
```

**Output:** Carpeta `build/ee/` lista para deploy

### 3. `scripts/prepare-ce-repo.sh` - Preparar Repo Público

**Acciones:**
1. ✅ Elimina TODO rastro de `/enterprise`
2. ✅ Elimina `modules/ee/`
3. ✅ Fuerza `EDITION = 'community'` en edition.js/ts
4. ✅ Crea README.md específico para CE
5. ✅ Crea CONTRIBUTING.md
6. ✅ Inicializa git con commit inicial
7. ✅ Prepara para push a GitHub público

**Uso:**
```bash
./scripts/prepare-ce-repo.sh ../esbilla-cmp-ce
cd ../esbilla-cmp-ce
git remote add origin https://github.com/tu-usuario/esbilla-cmp-ce.git
git push -u origin main
```

**Output:** Repositorio limpio listo para publicar

---

## 🔄 Migración de Código

### Archivos Movidos a `/enterprise`

**Backend (API):**
```
src/routes/invitations.js          → src/enterprise/routes/invitations.js
src/routes/invitations.test.js     → src/enterprise/routes/invitations.test.js
src/services/email.js              → src/enterprise/services/email.js
```

**Frontend (Dashboard):**
```
src/pages/AcceptInvite.tsx         → src/enterprise/pages/AcceptInvite.tsx
src/pages/OnboardingSetup.tsx      → src/enterprise/pages/OnboardingSetup.tsx
src/pages/Organizations.tsx        → src/enterprise/pages/Organizations.tsx
src/pages/PendingApproval.tsx      → src/enterprise/pages/PendingApproval.tsx
src/pages/Register.tsx             → src/enterprise/pages/Register.tsx
src/pages/Users.tsx                → src/enterprise/pages/Users.tsx
src/pages/WaitingList.tsx          → src/enterprise/pages/WaitingList.tsx
src/pages/Waitlist.tsx             → src/enterprise/pages/Waitlist.tsx
```

**SDK:**
```
NUEVO: public/modules/ee/attribution.js
NUEVO: public/modules/ee/cross-domain.js
NUEVO: public/modules/ee/gtm-gateway.js
```

### Imports Actualizados

**App.tsx:**
```typescript
// Antes
import { RegisterPage } from './pages/Register';

// Después
import { RegisterPage } from './enterprise/pages/Register';
```

**app.js:**
```javascript
// Antes
const invitationsRouter = require('./routes/invitations.js');

// Después
const invitationsRouter = require('./enterprise/routes/invitations.js');
```

---

## 🧪 Testing

### CE Build Test

```bash
# Build CE
./scripts/build-ce.sh

# Verificar que no existe /enterprise
find build/ce -type d -name "enterprise"  # Debe retornar vacío

# Verificar edition.js
cat build/ce/esbilla-api/src/config/edition.js | grep "EDITION"
# Debe mostrar: const EDITION = 'community';

# Ejecutar
cd build/ce/esbilla-api
npm start
# Console debe mostrar: "🌽 Esbilla CMP - Community Edition"
```

### EE Build Test

```bash
# Build EE
./scripts/build-ee.sh

# Verificar módulos EE
ls build/ee/esbilla-api/public/modules/ee/
# Debe mostrar: attribution.js, cross-domain.js, gtm-gateway.js

# Verificar enterprise folders
ls build/ee/esbilla-api/src/enterprise/
# Debe mostrar: routes/, services/, middleware/

# Ejecutar
cd build/ee/esbilla-api
npm start
# Console debe mostrar: "🏢 Esbilla CMP - Enterprise Edition"
```

### Test de Hooks

```javascript
// Test CE - hooks.test.js
const hooks = require('./hooks');

test('CE: beforeCreateSite should pass through data unchanged', async () => {
  const siteData = { name: 'Test Site' };
  const result = await hooks.beforeCreateSite({}, {}, siteData);

  expect(result.valid).toBe(true);
  expect(result.data).toEqual(siteData);
});

// Test EE
test('EE: beforeCreateSite should validate organizationId', async () => {
  const siteData = { name: 'Test Site' }; // Sin organizationId

  const result = await hooks.beforeCreateSite({}, {}, siteData);

  expect(result.valid).toBe(false);
  expect(result.error.code).toBe('MISSING_ORGANIZATION_ID');
});
```

---

## 🚀 Deployment

### CE Deployment

**Opción 1: Docker**
```bash
cd build/ce
docker build -t esbilla-cmp-ce .
docker run -p 3000:3000 esbilla-cmp-ce
```

**Opción 2: Cloud Run**
```bash
gcloud run deploy esbilla-ce \
  --source build/ce \
  --region europe-west4 \
  --allow-unauthenticated \
  --set-env-vars ESBILLA_EDITION=community
```

### EE Deployment

**Opción 1: Docker**
```bash
cd build/ee
docker build -t esbilla-cmp-ee .
docker run -p 3000:3000 \
  -e ESBILLA_EDITION=enterprise \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_USER=noreply@esbilla.com \
  -e SMTP_PASS=secret \
  esbilla-cmp-ee
```

**Opción 2: Cloud Run**
```bash
gcloud run deploy esbilla-ee \
  --source build/ee \
  --region europe-west4 \
  --allow-unauthenticated \
  --set-env-vars ESBILLA_EDITION=enterprise,SMTP_HOST=smtp.gmail.com
```

---

## ✅ Checklist de Implementación

### ✅ Completado

- [x] Diseñar sistema de feature flags
- [x] Crear `edition.js` (backend) y `edition.ts` (frontend)
- [x] Crear estructura `/enterprise` en API y Dashboard
- [x] Mover código EE a `/enterprise`
- [x] Actualizar imports en `App.tsx` y `app.js`
- [x] Implementar sistema de hooks en backend
- [x] Crear módulos EE del SDK (attribution, cross-domain, gtm-gateway)
- [x] Documentar hooks system
- [x] Crear READMEs en carpetas `/enterprise`
- [x] Crear script `build-ce.sh`
- [x] Crear script `build-ee.sh`
- [x] Crear script `prepare-ce-repo.sh`
- [x] Hacer scripts ejecutables

### ⏳ Próximos Pasos

- [ ] Ejecutar `prepare-ce-repo.sh` y crear repo público
- [ ] Configurar GitHub Actions para CI/CD en repo CE
- [ ] Publicar repo CE en GitHub con GPL v3
- [ ] Configurar branch protection en repo CE
- [ ] Añadir badges al README (license, build status, etc.)
- [ ] Crear documentación completa en docs/ para CE
- [ ] Añadir CONTRIBUTING.md y CODE_OF_CONDUCT.md
- [ ] Publicar en npm (opcional)
- [ ] Anunciar en comunidad (Reddit, Hacker News, etc.)

---

## 📖 Documentación Relacionada

- [OPEN-CORE-ARCHITECTURE.md](OPEN-CORE-ARCHITECTURE.md) - Arquitectura general
- [esbilla-api/docs/HOOKS-SYSTEM.md](../esbilla-api/docs/HOOKS-SYSTEM.md) - Sistema de hooks
- [esbilla-api/src/enterprise/README.md](../esbilla-api/src/enterprise/README.md) - Backend EE
- [esbilla-dashboard/src/enterprise/README.md](../esbilla-dashboard/src/enterprise/README.md) - Frontend EE
- [esbilla-api/public/modules/ee/README.md](../esbilla-api/public/modules/ee/README.md) - SDK EE

---

## 🎯 Conclusión

La implementación del modelo Open Core está **completa y funcional**. Ahora tienes:

✅ **Un solo codebase** para CE y EE
✅ **Feature flags** para control granular
✅ **Sistema de hooks** para extensibilidad sin duplicación
✅ **Módulos SDK separados** con carga dinámica
✅ **Scripts automatizados** para builds y repo público
✅ **Documentación completa** de la arquitectura

**Siguiente paso:** Ejecutar `prepare-ce-repo.sh` y publicar la Community Edition en GitHub público.

---

**Desarrollado con ❤️ en Asturias 🌽**
