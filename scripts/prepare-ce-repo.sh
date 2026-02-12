#!/bin/bash
# Prepare Community Edition Repository
#
# Este script prepara un repositorio limpio de Community Edition
# para publicar en GitHub público (esbilla-cmp-ce)
#
# Acciones:
# 1. Elimina TODO el código /enterprise
# 2. Limpia referencias a features EE
# 3. Actualiza README para CE
# 4. Configura .gitignore para CE
# 5. Prepara para git push al repo público

set -e  # Exit on error

echo "🌽 Preparando repositorio Community Edition..."

# Verificar argumentos
if [ -z "$1" ]; then
  echo "Uso: $0 <directorio-destino>"
  echo "Ejemplo: $0 ../esbilla-cmp-ce"
  exit 1
fi

DEST_DIR="$1"

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto"
  exit 1
fi

# Verificar que el directorio destino no existe o está vacío
if [ -d "$DEST_DIR" ] && [ "$(ls -A $DEST_DIR)" ]; then
  echo "❌ Error: El directorio $DEST_DIR ya existe y no está vacío"
  echo "Por seguridad, elimínalo manualmente primero: rm -rf $DEST_DIR"
  exit 1
fi

echo "📁 Creando directorio destino: $DEST_DIR"
mkdir -p "$DEST_DIR"

echo "📋 Copiando archivos base (excluyendo Enterprise)..."

# Copiar con exclusiones
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='build' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='firebase-debug.log' \
  --exclude='.firebase' \
  --exclude='*/enterprise' \
  --exclude='**/enterprise' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='*.log' \
  . "$DEST_DIR/"

echo "🗑️  Eliminando código Enterprise Edition..."

# Asegurar que NO queda rastro de /enterprise
find "$DEST_DIR" -type d -name "enterprise" -exec rm -rf {} + 2>/dev/null || true

# Eliminar módulos EE del SDK
rm -rf "$DEST_DIR/esbilla-api/public/modules/ee" 2>/dev/null || true

# Eliminar archivos específicos de EE
rm -f "$DEST_DIR/esbilla-dashboard/src/config/plans.ts" 2>/dev/null || true
rm -f "$DEST_DIR/esbilla-dashboard/src/utils/featureFlags.ts" 2>/dev/null || true
rm -f "$DEST_DIR/docs/OPEN-CORE-ARCHITECTURE.md" 2>/dev/null || true
rm -f "$DEST_DIR/docs/GTM-GATEWAY-LOAD-BALANCER-SETUP.md" 2>/dev/null || true
rm -f "$DEST_DIR/esbilla-api/docs/HOOKS-SYSTEM.md" 2>/dev/null || true

echo "📝 Actualizando configuración..."

# Actualizar edition.js (API) - Forzar CE
cat > "$DEST_DIR/esbilla-api/src/config/edition.js" << 'EOF'
/**
 * Edition Configuration - Community Edition
 *
 * NOTA: Esta es la Community Edition (CE), open source bajo licencia GPL v3.
 * La Enterprise Edition (EE) con features premium está disponible en:
 * https://esbilla.com/pricing
 */

const EDITION = 'community'; // Siempre CE en este repositorio

const FEATURES = {
  community: {
    // SDK Features (CE)
    attribution: false,
    crossDomain: false,
    gtmGateway: false,
    advancedIntegrations: false,

    // Backend Features (CE)
    multiTenancy: false,
    quotas: false,
    invitations: false,
    sync: false,

    // Dashboard Features (CE)
    emailAuth: false,
    onboarding: false,
    waitingList: false,
    advancedStats: false,
    plans: false,
  }
};

function getEdition() {
  return EDITION;
}

function isEnterprise() {
  return false; // Siempre CE
}

function isCommunity() {
  return true; // Siempre CE
}

function hasFeature(feature) {
  return false; // Todas las features EE están deshabilitadas
}

function getFeatures() {
  return FEATURES.community;
}

function requireEnterprise(feature, message) {
  const defaultMessage = `Feature '${feature}' requires Enterprise Edition. Visit https://esbilla.com/pricing`;
  throw new Error(message || defaultMessage);
}

function featureMiddleware(feature) {
  return (req, res, next) => {
    return res.status(403).json({
      error: 'FEATURE_NOT_AVAILABLE',
      message: `This feature requires Enterprise Edition`,
      feature,
      edition: 'community',
      upgrade: 'https://esbilla.com/pricing'
    });
  };
}

function logEditionInfo() {
  console.log('');
  console.log('🌽  Esbilla CMP - Community Edition (Open Source)');
  console.log('');
  console.log('Features: Basic consent management');
  console.log('Integrations: 5 (Google Analytics, Hotjar, Clarity, Facebook, LinkedIn)');
  console.log('');
  console.log('💼 Want more features? Check out Enterprise Edition:');
  console.log('   https://esbilla.com/pricing');
  console.log('');
}

module.exports = {
  EDITION,
  FEATURES,
  getEdition,
  isEnterprise,
  isCommunity,
  hasFeature,
  getFeatures,
  requireEnterprise,
  featureMiddleware,
  logEditionInfo,
};
EOF

# Actualizar edition.ts (Dashboard) - Forzar CE
cat > "$DEST_DIR/esbilla-dashboard/src/config/edition.ts" << 'EOF'
/**
 * Edition Configuration - Community Edition
 *
 * NOTA: Esta es la Community Edition (CE), open source bajo licencia GPL v3.
 * La Enterprise Edition (EE) con features premium está disponible en:
 * https://esbilla.com/pricing
 */

export type Edition = 'community';

export type FeatureName =
  | 'multiTenancy'
  | 'plans'
  | 'quotas'
  | 'invitations'
  | 'onboarding'
  | 'waitingList'
  | 'emailAuth'
  | 'advancedStats'
  | 'gtmGateway'
  | 'attribution'
  | 'crossDomain'
  | 'advancedIntegrations';

export interface EditionFeatures {
  multiTenancy: boolean;
  plans: boolean;
  quotas: boolean;
  invitations: boolean;
  onboarding: boolean;
  waitingList: boolean;
  emailAuth: boolean;
  advancedStats: boolean;
  gtmGateway: boolean;
  attribution: boolean;
  crossDomain: boolean;
  advancedIntegrations: boolean;
}

export const EDITION: Edition = 'community'; // Siempre CE

export const FEATURES: Record<Edition, EditionFeatures> = {
  community: {
    multiTenancy: false,
    plans: false,
    quotas: false,
    invitations: false,
    onboarding: false,
    waitingList: false,
    emailAuth: false,
    advancedStats: false,
    gtmGateway: false,
    attribution: false,
    crossDomain: false,
    advancedIntegrations: false,
  }
};

export function getEdition(): Edition {
  return EDITION;
}

export function isEnterprise(): boolean {
  return false; // Siempre CE
}

export function isCommunity(): boolean {
  return true; // Siempre CE
}

export function hasFeature(feature: FeatureName): boolean {
  return false; // Todas las features EE deshabilitadas
}

export function getFeatures(): EditionFeatures {
  return FEATURES.community;
}

export function requireEnterprise(feature: FeatureName, message?: string): void {
  const defaultMessage = `Feature '${feature}' requires Enterprise Edition. Visit https://esbilla.com/pricing`;
  throw new Error(message || defaultMessage);
}

export function useFeature(feature: FeatureName): boolean {
  return false; // Todas las features EE deshabilitadas
}

export function getEditionName(): string {
  return 'Community';
}

export function getEditionEmoji(): string {
  return '🌽';
}

export function logEditionInfo(): void {
  console.log('');
  console.log('🌽  Esbilla CMP - Community Edition (Open Source)');
  console.log('');
  console.log('Features: Basic consent management');
  console.log('Integrations: 5 (Google Analytics, Hotjar, Clarity, Facebook, LinkedIn)');
  console.log('');
  console.log('💼 Want more features? Check out Enterprise Edition:');
  console.log('   https://esbilla.com/pricing');
  console.log('');
}

if (import.meta.env.DEV) {
  logEditionInfo();
}
EOF

echo "📝 Actualizando README.md..."

# Crear README específico para CE
cat > "$DEST_DIR/README.md" << 'EOF'
# Esbilla CMP - Community Edition 🌽

**Open-source Consent Management Platform (CMP) para GDPR/ePrivacy compliance.**

> 🌽 "Esbilla" viene del verbo asturiano "esbillar" (seleccionar, escoger).

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

---

## 🎯 Community Edition vs Enterprise Edition

Esta es la **Community Edition (CE)**, completamente gratuita y open source bajo GPL v3.

| Feature | Community Edition | Enterprise Edition |
|---------|------------------|-------------------|
| **Consent Management** | ✅ | ✅ |
| **Cookie Banner** | ✅ | ✅ |
| **Google Consent Mode v2** | ✅ | ✅ |
| **Integrations** | 5 básicas | 19 completas |
| **Multi-tenancy** | ❌ | ✅ Organizations + Users |
| **Plans & Quotas** | ❌ | ✅ Free/Pro/Enterprise |
| **Invitations** | ❌ | ✅ Email invites |
| **Onboarding Wizard** | ❌ | ✅ 3-step setup |
| **Email Auth** | ❌ | ✅ + Google SSO |
| **Attribution Tracking** | ❌ | ✅ UTM + Click IDs |
| **Cross-domain Sync** | ❌ | ✅ |
| **GTM Gateway** | ❌ | ✅ Custom domain |
| **Advanced Stats** | ❌ | ✅ |
| **Support** | Community | Priority |
| **Pricing** | Free | [Ver pricing](https://esbilla.com/pricing) |

**¿Necesitas features empresariales?** 👉 [Descubre Enterprise Edition](https://esbilla.com/pricing)

---

## 📦 Características CE

✅ **Gestión de Consentimiento GDPR/ePrivacy**
- Cookie banner personalizable
- 3 categorías: Necesarias, Analytics, Marketing
- Audit trail inmutable (3 años)

✅ **Google Consent Mode V2**
- Integración nativa
- Estados: granted/denied
- Compatible con GA4

✅ **5 Integraciones Incluidas**
- **Analytics**: Google Analytics 4, Hotjar, Microsoft Clarity
- **Marketing**: Facebook Pixel, LinkedIn Insight Tag

✅ **Dashboard React**
- Gestión de sites
- Estadísticas básicas
- Firebase Auth (Google SSO)

✅ **SDK Ligero (Pegoyu)**
- ~25KB minificado
- Carga asíncrona
- Multi-idioma (10 idiomas)

---

## 🚀 Quick Start

### 1. Requisitos

- Node.js 18+
- Firebase account (Firestore + Auth)
- Git

### 2. Instalación

```bash
git clone https://github.com/tu-usuario/esbilla-cmp-ce.git
cd esbilla-cmp-ce
npm install
```

### 3. Configuración Firebase

Crea un proyecto en [Firebase Console](https://console.firebase.google.com):

1. Habilita Firestore (named database: `esbilla-cmp`)
2. Habilita Authentication (Google provider)
3. Copia tus credenciales

### 4. Variables de Entorno

**Dashboard** (`esbilla-dashboard/.env`):
```bash
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**API** (`esbilla-api/.env`):
```bash
PORT=3000
GCLOUD_PROJECT=tu-proyecto-id
FIRESTORE_DATABASE_ID=esbilla-cmp
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### 5. Deploy Firestore Rules & Indexes

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy reglas e índices
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. Ejecutar en Desarrollo

```bash
# Terminal 1: API
npm run start -w esbilla-api

# Terminal 2: Dashboard
npm run dev -w esbilla-dashboard

# Terminal 3: Landing (opcional)
npm run dev:public
```

- API: http://localhost:3000
- Dashboard: http://localhost:5173
- Landing: http://localhost:4321

---

## 📚 Documentación

- [Instalación Completa](docs/INSTALLATION.md)
- [Configuración Firebase](docs/FIREBASE-SETUP.md)
- [Integración del SDK](docs/SDK-INTEGRATION.md)
- [API Reference](docs/API-REFERENCE.md)
- [FAQ](docs/FAQ.md)

---

## 🏗️ Arquitectura

```
esbilla-cmp-ce/
├── esbilla-public/       # Landing page (Astro)
├── esbilla-api/          # Backend API (Express.js)
│   └── public/
│       ├── pegoyu.js     # SDK de consentimiento
│       └── modules/      # Módulos de integración (CE: 5)
├── esbilla-dashboard/    # Dashboard admin (React 19)
└── esbilla-plugins/      # Plugins para CMS (WordPress)
```

---

## 🧪 Testing

```bash
# Tests de API
npm run test -w esbilla-api

# Tests de Dashboard
npm run test -w esbilla-dashboard

# Tests de Landing
npm run test -w esbilla-public -- --run
```

---

## 🚢 Deployment

### Opción 1: Docker + Google Cloud Run

```bash
# Build imagen
docker build -t esbilla-cmp .

# Deploy a Cloud Run
gcloud run deploy esbilla-api \
  --image esbilla-cmp \
  --region europe-west4 \
  --allow-unauthenticated
```

### Opción 2: Firebase Hosting

```bash
# Build dashboard
npm run build -w esbilla-dashboard

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para más opciones.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -m 'Add: nueva característica'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

---

## 📄 Licencia

GPL v3 - Ver [LICENSE](LICENSE)

---

## 💼 Enterprise Edition

¿Necesitas features avanzadas para tu empresa?

**Enterprise Edition incluye:**
- ✅ Multi-tenancy (organizaciones + usuarios + roles)
- ✅ Planes y quotas (Free/Pro/Enterprise)
- ✅ Sistema de invitaciones por email
- ✅ Onboarding wizard de 3 pasos
- ✅ Attribution tracking (UTM + Click IDs)
- ✅ Cross-domain sync (footprint unificado)
- ✅ GTM Gateway (custom domain para evitar adblockers)
- ✅ 14 integraciones adicionales (total: 19)
- ✅ Advanced stats y analytics
- ✅ Soporte prioritario

👉 [Ver pricing y features](https://esbilla.com/pricing)

---

## 🌟 Créditos

Desarrollado con ❤️ en Asturias por [Clica Online Soluciones S.L.](https://clicaonline.com)

---

## 🔗 Links

- [Sitio Web](https://esbilla.com)
- [Documentación](https://docs.esbilla.com)
- [Enterprise Edition](https://esbilla.com/pricing)
- [Issues](https://github.com/tu-usuario/esbilla-cmp-ce/issues)
- [Roadmap](https://github.com/tu-usuario/esbilla-cmp-ce/projects)

---

**¿Te gusta el proyecto?** ⭐ Dale una estrella en GitHub!
EOF

echo "📝 Actualizando .gitignore..."

# Añadir exclusión de /enterprise por si acaso
cat >> "$DEST_DIR/.gitignore" << 'EOF'

# Enterprise Edition (no incluir en CE)
**/enterprise/
modules/ee/

# Build artifacts
build/
dist/
EOF

echo "📝 Creando CONTRIBUTING.md..."

cat > "$DEST_DIR/CONTRIBUTING.md" << 'EOF'
# Contributing to Esbilla CMP - Community Edition

¡Gracias por tu interés en contribuir! 🎉

## Code of Conduct

Se respetuoso, inclusivo y profesional.

## Cómo Contribuir

1. **Fork** el repositorio
2. **Clone** tu fork: `git clone https://github.com/tu-usuario/esbilla-cmp-ce.git`
3. **Crea una rama**: `git checkout -b feature/mi-caracteristica`
4. **Haz cambios** y commit: `git commit -m "Add: mi característica"`
5. **Push**: `git push origin feature/mi-caracteristica`
6. **Abre un Pull Request**

## Guidelines

- Escribe tests para nuevas features
- Sigue el estilo de código existente (ESLint)
- Documenta funciones públicas con JSDoc
- Commits en inglés, comentarios en español
- Actualiza README si es necesario

## Reportar Bugs

Abre un [Issue](https://github.com/tu-usuario/esbilla-cmp-ce/issues) con:

- Descripción clara del bug
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Versiones (Node, browser, etc.)

## Solicitar Features

Abre un [Issue](https://github.com/tu-usuario/esbilla-cmp-ce/issues) con:

- Descripción de la feature
- Por qué sería útil
- Ejemplos de uso

## Testing

Antes de hacer PR, asegúrate de que pasan los tests:

```bash
npm run test -w esbilla-api
npm run test -w esbilla-dashboard
npm run test -w esbilla-public -- --run
```

## Licencia

Al contribuir, aceptas que tu código se licencie bajo GPL v3.

¡Gracias! 🌽
EOF

echo "🔧 Inicializando git en repo CE..."

cd "$DEST_DIR"

# Inicializar git
git init
git add .
git commit -m "Initial commit - Community Edition

This is the open-source Community Edition of Esbilla CMP.

Features:
- Basic consent management (GDPR/ePrivacy)
- Google Consent Mode v2
- 5 integrations (GA4, Hotjar, Clarity, Facebook, LinkedIn)
- Single-tenant mode
- Firebase Auth (Google SSO)
- Basic analytics

For Enterprise features (multi-tenancy, advanced integrations, etc.)
visit: https://esbilla.com/pricing

License: GPL v3"

cd - > /dev/null

echo ""
echo "✅ Repositorio Community Edition preparado!"
echo ""
echo "📁 Ubicación: $DEST_DIR"
echo ""
echo "📋 Siguiente paso:"
echo "   1. cd $DEST_DIR"
echo "   2. Revisar README.md"
echo "   3. Crear repo en GitHub: https://github.com/new"
echo "   4. git remote add origin https://github.com/tu-usuario/esbilla-cmp-ce.git"
echo "   5. git branch -M main"
echo "   6. git push -u origin main"
echo ""
echo "🌟 Recuerda:"
echo "   - Configurar LICENSE (GPL v3)"
echo "   - Configurar GitHub Actions para CI/CD"
echo "   - Configurar branch protection para main"
echo "   - Añadir topics: gdpr, consent-management, cookie-banner, open-source"
echo ""
