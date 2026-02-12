# Open Core Architecture - Esbilla CMP

**Modelo:** Community Edition (CE) Open Source + Enterprise Edition (EE) Premium

## 🎯 Objetivo

Separar el código en dos ediciones:
- **Community Edition (CE)**: Open Source (GPL v3), funcionalidad básica
- **Enterprise Edition (EE)**: Premium (privado), features avanzadas

## 📦 Features por Edición

### Community Edition (Open Source)

**SDK/Pegoyu:**
- ✅ Banner de consentimiento básico (templates: maiz, modal, bottom-bar)
- ✅ Gestión de cookies (aceptar/rechazar/personalizar)
- ✅ Google Consent Mode V2
- ✅ Bloqueo de scripts hasta consentimiento
- ✅ Modo Manual (modificar scripts con data-category)
- ✅ Modo Simplificado básico (5 integraciones: GA4, Hotjar, Facebook Pixel, LinkedIn, TikTok)
- ✅ i18n (10 idiomas)
- ❌ Atribución de Marketing (UTM, click IDs)
- ❌ Sincronización Cross-domain
- ❌ GTM Gateway

**API:**
- ✅ GET `/api/config/:siteId` - Configuración de sitio
- ✅ POST `/api/consent/log` - Guardar consentimiento
- ✅ GET `/api/consent/history/:footprintId` - Historial de consentimiento (GDPR Art. 15)
- ✅ GET `/api/health` - Health check
- ✅ Rate limiting básico (30 req/min)
- ✅ CORS dinámico desde Firestore
- ❌ POST `/api/consent/sync` - Sincronización cross-domain
- ❌ GET `/gtm.js` - GTM Gateway
- ❌ Sistema de cuotas por plan

**Dashboard:**
- ✅ Login con Google
- ✅ Dashboard básico (estadísticas 7d/30d/90d)
- ✅ Gestión de sitios (CRUD)
- ✅ Configuración de banner (textos, colores)
- ✅ Footprint tracker (GDPR Art. 15)
- ✅ URL Stats
- ✅ Single-tenant (1 usuario = 1 sitio)
- ❌ Multi-tenancy (organizaciones)
- ❌ Planes de pago (Free, Pro, Enterprise)
- ❌ Límites de cuotas
- ❌ Gestión de usuarios
- ❌ Sistema de invitaciones
- ❌ Onboarding wizard
- ❌ Waiting list

**Base de Datos:**
- ✅ Firestore: `sites`, `consents`, `stats`, `users`
- ❌ Firestore: `organizations`, `invitations`, `waitingList`, `distributors`

---

### Enterprise Edition (Premium)

**SDK/Pegoyu EE Modules:**
- ✅ **Atribución de Marketing** (`modules/ee/attribution.js`)
  - UTM tracking (utm_source, utm_medium, utm_campaign, etc.)
  - Click IDs (gclid, fbclid, msclkid, ttclid, etc.)
  - Almacenamiento en localStorage
  - Envío con eventos de consentimiento

- ✅ **Sincronización Cross-domain** (`modules/ee/cross-domain.js`)
  - Compartir footprintId entre dominios
  - Sincronización vía API
  - Whitelist de dominios configurables

- ✅ **GTM Gateway** (carga desde dominio personalizado)
  - 19 integraciones vs 5 en CE
  - Configuración avanzada de scripts

**API EE:**
- ✅ POST `/api/consent/sync` - Sincronización cross-domain
- ✅ GET `/gtm.js` - GTM Gateway Proxy
- ✅ POST `/api/invitations/send` - Enviar invitaciones
- ✅ GET `/api/invitations/:id` - Ver invitación
- ✅ POST `/api/invitations/:id/accept` - Aceptar invitación
- ✅ Validación de cuotas por plan
- ✅ Multi-tenant routing

**Dashboard EE:**
- ✅ Multi-tenancy (organizaciones + usuarios)
- ✅ Planes de pago (Free, Pro, Enterprise)
- ✅ Límites de cuotas por plan
- ✅ Gestión de usuarios con roles
- ✅ Sistema de invitaciones por email
- ✅ Onboarding wizard (3 pasos)
- ✅ Waiting list
- ✅ Estadísticas avanzadas
- ✅ Login con email/password
- ✅ Verificación de email
- ✅ Reset de contraseña
- ✅ 19 integraciones (Analytics + Marketing + Functional)

---

## 🏗️ Arquitectura del Código

### Estructura de Carpetas

```
esbilla-cmp/ (Enterprise Edition - Privado)
├── esbilla-api/
│   ├── src/
│   │   ├── app.js              # ← CE + EE hooks
│   │   ├── config/
│   │   │   └── edition.js      # ← Feature flags
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js  # CE
│   │   │   └── index.js        # CE
│   │   ├── routes/
│   │   │   ├── consents.js     # CE
│   │   │   ├── config.js       # CE
│   │   │   └── health.js       # CE
│   │   └── enterprise/         # ← EE only (excluido en CE)
│   │       ├── middleware/
│   │       │   ├── quotas.js   # EE: Validación de cuotas
│   │       │   └── tenants.js  # EE: Multi-tenancy
│   │       ├── routes/
│   │       │   ├── invitations.js  # EE
│   │       │   ├── gtm-gateway.js  # EE
│   │       │   └── sync.js         # EE
│   │       └── services/
│   │           ├── email.js        # EE: Nodemailer
│   │           └── plans.js        # EE: Validación de planes
│   └── public/
│       ├── pegoyu.js           # CE + lazy load EE modules
│       └── modules/
│           ├── analytics/      # CE: 5 básicas
│           ├── marketing/      # CE: 5 básicas
│           └── ee/             # ← EE only
│               ├── attribution.js      # EE
│               ├── cross-domain.js     # EE
│               └── integrations/       # EE: 14 adicionales
│
├── esbilla-dashboard/
│   ├── src/
│   │   ├── config/
│   │   │   ├── edition.ts      # ← Feature flags
│   │   │   └── plans.ts        # EE only
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # CE + EE features
│   │   │   ├── Sites.tsx       # CE + EE features
│   │   │   └── Login.tsx       # CE (Google) + EE (email/password)
│   │   └── enterprise/         # ← EE only
│   │       ├── pages/
│   │       │   ├── Organizations.tsx
│   │       │   ├── Users.tsx
│   │       │   ├── OnboardingSetup.tsx
│   │       │   ├── AcceptInvite.tsx
│   │       │   └── WaitingList.tsx
│   │       ├── components/
│   │       │   └── PlanBadge.tsx
│   │       └── hooks/
│   │           └── usePlanLimits.ts
│
└── scripts/
    ├── build-ce.sh             # Build Community Edition
    ├── build-ee.sh             # Build Enterprise Edition
    └── prepare-ce-repo.sh      # Preparar repositorio público

esbilla-cmp-ce/ (Community Edition - Público)
└── (misma estructura, pero sin carpetas /enterprise)
```

---

## ⚙️ Sistema de Feature Flags

### 1. Variable de Entorno

```bash
# .env (EE)
ESBILLA_EDITION=enterprise

# .env (CE)
ESBILLA_EDITION=community
```

### 2. Config API (Node.js)

**Archivo:** `esbilla-api/src/config/edition.js`

```javascript
const EDITION = process.env.ESBILLA_EDITION || 'community';

const FEATURES = {
  community: {
    attribution: false,
    crossDomain: false,
    gtmGateway: false,
    multiTenancy: false,
    quotas: false,
    invitations: false,
    advancedIntegrations: false,
    emailAuth: false,
  },
  enterprise: {
    attribution: true,
    crossDomain: true,
    gtmGateway: true,
    multiTenancy: true,
    quotas: true,
    invitations: true,
    advancedIntegrations: true,
    emailAuth: true,
  }
};

module.exports = {
  EDITION,
  isEnterprise: () => EDITION === 'enterprise',
  isCommunity: () => EDITION === 'community',
  hasFeature: (feature) => FEATURES[EDITION][feature] || false,
  getFeatures: () => FEATURES[EDITION],
};
```

### 3. Config Dashboard (TypeScript)

**Archivo:** `esbilla-dashboard/src/config/edition.ts`

```typescript
export type Edition = 'community' | 'enterprise';

export const EDITION: Edition = (import.meta.env.VITE_ESBILLA_EDITION as Edition) || 'community';

export const FEATURES = {
  community: {
    multiTenancy: false,
    plans: false,
    quotas: false,
    invitations: false,
    onboarding: false,
    waitingList: false,
    emailAuth: false,
    advancedStats: false,
  },
  enterprise: {
    multiTenancy: true,
    plans: true,
    quotas: true,
    invitations: true,
    onboarding: true,
    waitingList: true,
    emailAuth: true,
    advancedStats: true,
  }
} as const;

export const isEnterprise = () => EDITION === 'enterprise';
export const isCommunity = () => EDITION === 'community';
export const hasFeature = (feature: keyof typeof FEATURES.enterprise) => {
  return FEATURES[EDITION][feature] || false;
};
```

---

## 🔌 Sistema de Hooks/Middleware (Backend)

### Concepto

El backend CE debe ser funcional sin EE, pero debe tener "puntos de enganche" (hooks) donde EE puede inyectar lógica adicional.

### Implementación

**Archivo:** `esbilla-api/src/app.js`

```javascript
const express = require('express');
const { isEnterprise, hasFeature } = require('./config/edition');

const app = express();

// ============================================
// MIDDLEWARE CE (siempre activo)
// ============================================
app.use(express.json());
app.use(require('./middleware/rateLimiter'));
app.use(require('./middleware/cors'));

// ============================================
// HOOKS EE (solo si EDITION=enterprise)
// ============================================
if (isEnterprise()) {
  // Cargar middleware EE
  const quotasMiddleware = require('./enterprise/middleware/quotas');
  const tenantsMiddleware = require('./enterprise/middleware/tenants');

  app.use(quotasMiddleware);
  app.use(tenantsMiddleware);
}

// ============================================
// ROUTES CE (siempre activo)
// ============================================
app.use('/api/config', require('./routes/config'));
app.use('/api/consent', require('./routes/consents'));
app.use('/api/health', require('./routes/health'));

// ============================================
// ROUTES EE (solo si EDITION=enterprise)
// ============================================
if (isEnterprise()) {
  app.use('/api/invitations', require('./enterprise/routes/invitations'));
  app.use('/gtm.js', require('./enterprise/routes/gtm-gateway'));
  app.post('/api/consent/sync', require('./enterprise/routes/sync'));
}

// ============================================
// HOOK: Before Save Consent (EE puede inyectar lógica)
// ============================================
app.post('/api/consent/log', async (req, res) => {
  try {
    // Lógica CE: guardar consentimiento
    const consentData = req.body;

    // HOOK EE: Validar cuotas antes de guardar
    if (isEnterprise()) {
      const { validateQuotas } = require('./enterprise/services/quotas');
      const quotaValid = await validateQuotas(req.siteId, 'consents');
      if (!quotaValid) {
        return res.status(429).json({ error: 'QUOTA_EXCEEDED' });
      }
    }

    // Guardar en Firestore (CE)
    await saveConsent(consentData);

    // HOOK EE: Actualizar contadores
    if (isEnterprise()) {
      const { incrementConsentCount } = require('./enterprise/services/stats');
      await incrementConsentCount(req.siteId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
```

---

## 📦 Modularización del SDK

### Estructura del Pegoyu

```javascript
// esbilla-api/public/pegoyu.js (CE + lazy load EE)

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN (detecta edición desde API)
  // ============================================
  const config = {}; // Se carga desde API /api/config/:siteId

  // ============================================
  // CORE CE (siempre se carga)
  // ============================================
  function loadBanner() { /* ... */ }
  function handleConsent() { /* ... */ }
  function blockScripts() { /* ... */ }
  function updateConsentMode() { /* ... */ }

  // ============================================
  // LAZY LOAD EE MODULES (solo si config.edition === 'enterprise')
  // ============================================
  async function loadEnterpriseModules() {
    if (config.edition !== 'enterprise') return;

    // Cargar módulo de atribución
    if (config.features?.attribution) {
      const attribution = await import('/modules/ee/attribution.js');
      attribution.init(config);
    }

    // Cargar módulo de cross-domain
    if (config.features?.crossDomain) {
      const crossDomain = await import('/modules/ee/cross-domain.js');
      crossDomain.init(config);
    }

    // Cargar integraciones avanzadas (14 adicionales)
    if (config.features?.advancedIntegrations) {
      const integrations = config.integrationsEE || [];
      for (const integration of integrations) {
        await import(`/modules/ee/integrations/${integration}.js`);
      }
    }
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  async function init() {
    // 1. Cargar config desde API
    const siteId = document.currentScript.getAttribute('data-id');
    config = await fetch(`/api/config/${siteId}`).then(r => r.json());

    // 2. Renderizar banner (CE)
    loadBanner();

    // 3. Cargar módulos EE si aplica
    await loadEnterpriseModules();
  }

  init();
})();
```

### Módulo EE: Attribution

**Archivo:** `esbilla-api/public/modules/ee/attribution.js`

```javascript
// Módulo EE: Atribución de Marketing
export function init(config) {
  console.log('[EE] Attribution module loaded');

  // Capturar UTM params
  const urlParams = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
    gclid: urlParams.get('gclid'),
    fbclid: urlParams.get('fbclid'),
    msclkid: urlParams.get('msclkid'),
    ttclid: urlParams.get('ttclid'),
  };

  // Guardar en localStorage
  if (Object.values(attribution).some(v => v)) {
    localStorage.setItem('esbilla_attribution', JSON.stringify(attribution));
  }

  // Adjuntar a eventos de consentimiento
  window.addEventListener('esbilla_consent_saved', (event) => {
    const storedAttribution = JSON.parse(localStorage.getItem('esbilla_attribution') || '{}');
    event.detail.attribution = storedAttribution;
  });
}
```

### Módulo EE: Cross-Domain

**Archivo:** `esbilla-api/public/modules/ee/cross-domain.js`

```javascript
// Módulo EE: Sincronización Cross-domain
export function init(config) {
  console.log('[EE] Cross-domain module loaded');

  const allowedDomains = config.crossDomainWhitelist || [];

  // Sincronizar footprintId entre dominios
  async function syncFootprint() {
    const footprintId = localStorage.getItem('esbilla_footprint');
    if (!footprintId) return;

    for (const domain of allowedDomains) {
      try {
        await fetch(`https://${domain}/api/consent/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ footprintId, sourceDomain: window.location.hostname })
        });
      } catch (error) {
        console.error(`[EE] Failed to sync with ${domain}:`, error);
      }
    }
  }

  // Ejecutar sync después de consentimiento
  window.addEventListener('esbilla_consent_saved', syncFootprint);
}
```

---

## 🛠️ Scripts de Build

### Script 1: Build Community Edition

**Archivo:** `scripts/build-ce.sh`

```bash
#!/bin/bash
set -e

echo "🌽 Building Community Edition..."

# 1. Clonar repo EE a carpeta temporal
rm -rf /tmp/esbilla-ce-build
cp -r . /tmp/esbilla-ce-build
cd /tmp/esbilla-ce-build

# 2. Eliminar carpetas /enterprise
echo "Removing /enterprise folders..."
find . -type d -name "enterprise" -exec rm -rf {} +

# 3. Eliminar archivos EE del SDK
echo "Removing EE modules from SDK..."
rm -rf esbilla-api/public/modules/ee

# 4. Configurar variables de entorno CE
echo "ESBILLA_EDITION=community" > esbilla-api/.env
echo "VITE_ESBILLA_EDITION=community" > esbilla-dashboard/.env

# 5. Actualizar package.json (remover dependencias EE)
echo "Removing EE dependencies..."
cd esbilla-api
npm pkg delete dependencies.nodemailer
cd ..

# 6. Copiar a repositorio CE
echo "Copying to esbilla-cmp-ce..."
rm -rf ../esbilla-cmp-ce
mkdir -p ../esbilla-cmp-ce
cp -r * ../esbilla-cmp-ce/

echo "✅ Community Edition built successfully!"
echo "📁 Output: ../esbilla-cmp-ce"
```

### Script 2: Preparar Repositorio CE

**Archivo:** `scripts/prepare-ce-repo.sh`

```bash
#!/bin/bash
set -e

echo "📦 Preparing Community Edition Repository..."

# 1. Build CE
./scripts/build-ce.sh

# 2. Ir a carpeta CE
cd ../esbilla-cmp-ce

# 3. Inicializar git
git init
git remote add origin https://github.com/ClicaOnline/esbilla-cmp-ce.git

# 4. Crear README específico para CE
cat > README.md << 'EOF'
# Esbilla CMP - Community Edition

Open Source Consent Management Platform (GDPR/ePrivacy compliance)

## What's Included

- ✅ Consent banner (3 templates)
- ✅ Google Consent Mode V2
- ✅ Script blocking until consent
- ✅ 5 basic integrations (GA4, Hotjar, Facebook, LinkedIn, TikTok)
- ✅ Dashboard (single-tenant)
- ✅ API for consent logging
- ✅ Firestore integration

## What's NOT Included (Enterprise Edition)

- ❌ Multi-tenancy (organizations)
- ❌ Marketing attribution (UTM tracking)
- ❌ Cross-domain synchronization
- ❌ GTM Gateway
- ❌ Advanced integrations (19 total)
- ❌ User invitations
- ❌ Onboarding wizard
- ❌ Email/password auth

**Want Enterprise features?** Contact: esbilla@clicaonline.com

## License

GPL v3 - See LICENSE file
EOF

# 5. Crear .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
EOF

# 6. Commit inicial
git add .
git commit -m "Initial Community Edition release

- Core consent management functionality
- 5 basic integrations
- Single-tenant dashboard
- GPL v3 license"

echo "✅ Repository prepared!"
echo "Next steps:"
echo "  1. Review the code in ../esbilla-cmp-ce"
echo "  2. Push to GitHub: git push -u origin main"
```

---

## 🚀 Flujo de Trabajo

### Development

```bash
# Trabajar en EE (repo privado actual)
cd esbilla-cmp
git checkout main

# Desarrollar features EE en carpetas /enterprise
# Commit normalmente en repo privado
```

### Release CE

```bash
# 1. Build Community Edition desde EE
cd esbilla-cmp
./scripts/build-ce.sh

# 2. Review cambios en CE
cd ../esbilla-cmp-ce
git diff

# 3. Commit y push a repo público
git add .
git commit -m "Release v1.3.0 CE

- Fix bug in consent banner
- Update i18n translations
- Performance improvements"

git push origin main
```

### Sincronización CE → EE

Si se reciben pull requests en CE:

```bash
# 1. Aplicar cambios en repo CE público
cd esbilla-cmp-ce
git pull origin main

# 2. Copiar cambios relevantes a EE
cd ../esbilla-cmp
# Copiar manualmente los archivos modificados (solo CE)

# 3. Commit en EE
git add .
git commit -m "Merge improvements from CE community

- [lista de cambios]"
```

---

## 📊 Comparativa CE vs EE

| Feature | Community Edition | Enterprise Edition |
|---------|-------------------|-------------------|
| **SDK** |
| Banner de consentimiento | ✅ | ✅ |
| Google Consent Mode V2 | ✅ | ✅ |
| Script blocking | ✅ | ✅ |
| Integraciones básicas | ✅ (5) | ✅ (19) |
| Atribución de Marketing | ❌ | ✅ |
| Cross-domain sync | ❌ | ✅ |
| GTM Gateway | ❌ | ✅ |
| **API** |
| Config endpoint | ✅ | ✅ |
| Consent logging | ✅ | ✅ |
| Consent history | ✅ | ✅ |
| GTM proxy | ❌ | ✅ |
| Sync endpoint | ❌ | ✅ |
| Quotas validation | ❌ | ✅ |
| **Dashboard** |
| Login (Google SSO) | ✅ | ✅ |
| Login (Email/Password) | ❌ | ✅ |
| Dashboard básico | ✅ | ✅ |
| Sites CRUD | ✅ | ✅ |
| Banner config | ✅ | ✅ |
| Multi-tenancy | ❌ | ✅ |
| Organizations | ❌ | ✅ |
| User management | ❌ | ✅ |
| Invitations | ❌ | ✅ |
| Onboarding wizard | ❌ | ✅ |
| Plans (Free/Pro/Enterprise) | ❌ | ✅ |
| Quotas enforcement | ❌ | ✅ |
| Waiting list | ❌ | ✅ |
| **Pricing** |
| Cost | Free (self-hosted) | $19-$99/mo (SaaS) |
| Support | Community | Priority |
| Updates | Community-driven | Rapid releases |

---

## 🔐 Seguridad

### Secretos y Credenciales

**EN EE (privado):**
- ✅ `.env` con variables sensibles (SMTP, API keys)
- ✅ Service account JSON de Firebase

**EN CE (público):**
- ❌ NO incluir `.env` real
- ❌ NO incluir service accounts
- ✅ Incluir `.env.example` con placeholders

### Validación de Licencias (futuro)

Si en el futuro quieres añadir validación de licencias:

**Archivo:** `esbilla-api/src/enterprise/middleware/license.js`

```javascript
// Validar licencia EE (solo si EDITION=enterprise)
async function validateLicense(req, res, next) {
  const licenseKey = process.env.ESBILLA_LICENSE_KEY;

  if (!licenseKey) {
    return res.status(403).json({
      error: 'MISSING_LICENSE',
      message: 'Enterprise features require a valid license key.'
    });
  }

  // Verificar licencia con servidor de licencias
  const valid = await checkLicenseWithServer(licenseKey);

  if (!valid) {
    return res.status(403).json({
      error: 'INVALID_LICENSE',
      message: 'Your license key is invalid or expired.'
    });
  }

  next();
}
```

---

## 📝 Documentación

### README para CE

Debe enfatizar:
- ✅ Lo que **SÍ** incluye (features CE)
- ✅ Lo que **NO** incluye (features EE)
- ✅ Cómo contactar para upgrade a EE
- ✅ Licencia GPL v3

### README para EE

Debe enfatizar:
- ✅ Features premium
- ✅ Pricing
- ✅ Soporte prioritario
- ✅ Licencia propietaria

---

## ✅ Checklist de Implementación

- [ ] Crear `config/edition.js` y `config/edition.ts`
- [ ] Mover código EE a carpetas `/enterprise`
- [ ] Implementar sistema de hooks en `app.js`
- [ ] Modularizar SDK con lazy loading EE
- [ ] Crear scripts `build-ce.sh` y `prepare-ce-repo.sh`
- [ ] Actualizar `.gitignore` para excluir `/enterprise` en CE
- [ ] Crear repositorio `esbilla-cmp-ce` en GitHub
- [ ] Documentar arquitectura Open Core
- [ ] Release inicial de CE
- [ ] Anuncio público de Open Core model

---

🌽 **Esbilla CMP** - Open Core: Community + Enterprise
