# PROMPT: Sistema de Onboarding de Usuarios y Recuperación de Contraseña — Esbilla CMP

> **Para la IA de codificación**: Lee OBLIGATORIAMENTE `CLAUDE.md`, `HOWTO.md` y `Testing.md` del repo antes de empezar. Contienen la arquitectura completa, comandos, estructura de datos y convenciones del proyecto.

---

## 1. CONTEXTO DEL PROYECTO

### Arquitectura actual

Esbilla CMP es una plataforma de gestión de consentimiento (GDPR/ePrivacy). Es un **proyecto Open Source** que además se **comercializa como SaaS**. Monorepo con npm workspaces:

| Workspace | Stack | URL producción | Despliegue |
|-----------|-------|---------------|------------|
| `esbilla-public` | Astro + Tailwind v4 | `https://esbilla.com` | Firebase Hosting |
| `esbilla-api` | Express.js v5 | `https://api.esbilla.com` | Cloud Run (europe-west4) |
| `esbilla-dashboard` | **React 19** + Vite + TypeScript | `https://app.esbilla.com` | Servido como estático por la API (`/dashboard/*`) |
| `esbilla-plugins` | - | - | Planificado |

### Modelo de negocio dual

- **Open Source (self-hosted)**: Cualquiera puede desplegar Esbilla en su infra. El onboarding es básico (primer usuario → superadmin manual).
- **SaaS (hosted por Clica Online)**: Los usuarios se registran en `app.esbilla.com`, eligen un plan y gestionan su CMP desde el dashboard. El onboarding es guiado y vinculado a planes de pago.

**Ambos modos viven en el mismo repo.** Se diferencian con una variable de entorno `ESBILLA_MODE` (ver sección Feature Flags).

### Autenticación actual

- **Firebase Auth** con Google SSO (proveedor único actual)
- El dashboard usa `AuthContext.tsx` con Firebase Auth
- Al hacer login con Google, se crea un documento en Firestore `users/{uid}` con `globalRole: "pending"`
- Un superadmin debe aprobar manualmente al usuario desde Firestore Console
- NO hay login con email/password
- NO hay flujo de invitación, recuperación de contraseña, ni selección de plan

### ⚠️ Problema actual del onboarding

**El flujo actual está roto para SaaS**: cualquier persona puede hacer login con Google, quedarse como "pending" indefinidamente sin contexto ni utilidad. No hay selección de plan, no hay organización asociada, no hay guía de siguientes pasos. Esto hay que cambiarlo completamente.

### Base de datos: Firestore

- Proyecto GCP: `esbilla-cmp`
- Named database: `esbilla-cmp`
- Colecciones principales: `users`, `organizations`, `sites`, `consents`, `stats`

### Sistema de roles (ya implementado)

```
PLATAFORMA (superadmin | pending)
  ↓
ORGANIZACIÓN (org_owner | org_admin | org_viewer)
  ↓
SITIO (site_admin | site_viewer)
```

### Estructura de un documento `users/{uid}` actual

```json
{
  "id": "uid-firebase",
  "email": "usuario@ejemplo.com",
  "displayName": "Nombre Usuario",
  "photoURL": "https://...",
  "globalRole": "pending",
  "orgAccess": {
    "org_id": {
      "organizationId": "org_id",
      "organizationName": "Empresa S.L.",
      "role": "org_admin",
      "addedAt": "Timestamp",
      "addedBy": "uid"
    }
  },
  "siteAccess": { ... },
  "createdAt": "Timestamp",
  "lastLogin": "Timestamp",
  "createdBy": "uid-quien-aprobó"
}
```

### Estructura de `organizations` actual

```json
{
  "id": "org_abc123xyz789",
  "name": "Acme Corporation",
  "legalName": "Acme Corp S.L.",
  "taxId": "B12345678",
  "plan": "free" | "pro" | "enterprise",
  "maxSites": 10,
  "maxConsentsPerMonth": 100000,
  "billingEmail": "billing@acme.com",
  "billingAddress": { ... },
  "createdAt": "Timestamp",
  "createdBy": "uid-del-superadmin",
  "updatedAt": "Timestamp"
}
```

### Fase del producto

Estamos en **fase de entusiastas/early adopters**. Priorizar: que funcione, que sea seguro, que sea mantenible. No necesitamos integración de pagos real todavía (Stripe vendrá después), pero sí la estructura de planes y el flujo de selección.

---

## 2. OBJETIVO

Implementar un sistema de onboarding completo con **dos vías de entrada** y soporte para **internacionalización**:

### Vía 1: Auto-registro con selección de plan ("Empezar")
Un usuario nuevo llega desde `esbilla.com`, elige un plan, se registra, crea su organización y empieza a usar Esbilla. Es el flujo principal del SaaS.

### Vía 2: Invitación a organización existente
Un org_owner o superadmin invita a un usuario por email a unirse a su organización con un rol específico. El invitado puede registrarse o hacer login si ya tiene cuenta.

### Funcionalidades transversales
- Login con email/password (además de Google SSO)
- Verificación de email obligatoria
- Recuperación de contraseña (forgot/reset)
- **Internacionalización (i18n)** de todas las pantallas de auth
- **Feature flags** para diferenciar modo SaaS vs self-hosted

**IMPORTANTE**: Toda la autenticación se hace con **Firebase Auth** nativo. NO implementar JWT propio, NO implementar bcrypt manual. Firebase Auth ya maneja tokens, hashes, verificación de email y reset de contraseña.

**CRÍTICO**: Ya NO existe el registro abierto sin plan. En modo SaaS, todo registro debe estar vinculado a un plan (auto-registro) o a una invitación. No puede quedar un usuario "pending" sin contexto.

---

## 3. FEATURE FLAGS: SaaS vs Self-Hosted

### 3.1 Variable de entorno

```bash
# En .env del dashboard
VITE_ESBILLA_MODE=saas    # "saas" | "selfhosted"

# En .env de la API
ESBILLA_MODE=saas          # "saas" | "selfhosted"
```

### 3.2 Comportamiento por modo

| Funcionalidad | `saas` | `selfhosted` |
|---------------|--------|--------------|
| Auto-registro con plan | ✅ | ❌ |
| Selección de plan en registro | ✅ | ❌ |
| Invitaciones por email | ✅ | ✅ |
| Límites por plan (maxSites, etc.) | ✅ Enforced | ❌ Sin límites |
| Billing / Stripe (futuro) | ✅ | ❌ |
| Página de pricing | ✅ | ❌ |
| Login con Google SSO | ✅ | ✅ |
| Login con email/password | ✅ | ✅ |
| Primer usuario → superadmin | ❌ | ✅ Auto-promueve |
| Registro abierto sin invitación/plan | ❌ Bloqueado | ❌ Solo invitación o primer usuario |

### 3.3 Implementación en React

```typescript
// utils/featureFlags.ts
export const isSaasMode = () => import.meta.env.VITE_ESBILLA_MODE === 'saas';
export const isSelfHostedMode = () => import.meta.env.VITE_ESBILLA_MODE === 'selfhosted';

// Uso en componentes:
{isSaasMode() && <PlanSelector />}
{isSelfHostedMode() && <SelfHostedSetup />}
```

### 3.4 Implementación en la API (Express)

```javascript
// utils/featureFlags.js
const isSaasMode = () => process.env.ESBILLA_MODE === 'saas';
const isSelfHostedMode = () => process.env.ESBILLA_MODE === 'selfhosted';

// Middleware para endpoints solo-SaaS
const requireSaasMode = (req, res, next) => {
  if (!isSaasMode()) return res.status(404).json({ error: 'Not available' });
  next();
};
```

---

## 4. FASE 1: Añadir Email/Password a Firebase Auth

### 4.1 Habilitar en Firebase Console

Firebase Console → Authentication → Sign-in method:
- Activar **Email/Password**
- Mantener **Google** activo

Firebase Console → Authentication → Settings → Authorized domains:
- Añadir `app.esbilla.com`, `esbilla.com`

### 4.2 Actualizar AuthContext.tsx

Archivo: `esbilla-dashboard/src/context/AuthContext.tsx`

Ampliar para soportar:

```typescript
// Métodos a añadir:

signUpWithEmail(email: string, password: string, displayName: string): Promise<UserCredential>
// 1. createUserWithEmailAndPassword(auth, email, password)
// 2. updateProfile(user, { displayName })
// 3. sendEmailVerification(user)
// 4. NO crear documento en Firestore aquí — se crea en el flujo de onboarding
// 5. signOut(auth) — debe verificar email antes de continuar

signInWithEmail(email: string, password: string): Promise<UserCredential>
// 1. signInWithEmailAndPassword(auth, email, password)
// 2. Si user.emailVerified === false → redirigir a /verify-email, signOut
// 3. Comprobar si tiene documento en Firestore (puede no tenerlo si no completó onboarding)
// 4. Si no tiene documento → redirigir a /onboarding (completar setup)
// 5. Si tiene documento con orgAccess → dashboard
// 6. Si tiene documento sin orgAccess (pending legacy) → /pending

resetPassword(email: string): Promise<void>
// sendPasswordResetEmail(auth, email) — SIEMPRE mostrar mensaje genérico

resendVerificationEmail(): Promise<void>
// sendEmailVerification(auth.currentUser)
```

### 4.3 Configurar templates de email en Firebase Console

Firebase Console → Authentication → Templates → Configurar en **todos los idiomas soportados** (empezar con ES y EN):

**Verificación de email:**
- ES: `Verifica tu cuenta en Esbilla CMP 🌽`
- EN: `Verify your Esbilla CMP account 🌽`

**Reset de contraseña:**
- ES: `Restablece tu contraseña en Esbilla 🌽`
- EN: `Reset your Esbilla password 🌽`

Action URL: `https://app.esbilla.com/__/auth/action`

---

## 5. FASE 2: Internacionalización (i18n) del Dashboard

### 5.1 Sistema de i18n

Usar `react-i18next` con detección automática de idioma del navegador:

```bash
npm install react-i18next i18next i18next-browser-languagedetector -w esbilla-dashboard
```

### 5.2 Estructura de archivos

```
esbilla-dashboard/src/
├── i18n/
│   ├── index.ts              ← Configuración de i18next
│   ├── locales/
│   │   ├── es/
│   │   │   ├── common.json   ← Textos comunes (botones, nav)
│   │   │   ├── auth.json     ← Login, registro, reset, verificación
│   │   │   ├── onboarding.json ← Flujo de onboarding con planes
│   │   │   └── dashboard.json ← Textos del panel
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── onboarding.json
│   │   │   └── dashboard.json
│   │   └── ast/              ← Asturianu (marca)
│   │       └── ...
```

### 5.3 Idiomas iniciales

| Código | Idioma | Prioridad |
|--------|--------|-----------|
| `es` | Español | Default / fallback |
| `en` | English | Alta (mercado internacional) |
| `ast` | Asturianu | Media (marca/identidad) |

Más idiomas se añadirán progresivamente, aprovechando la infraestructura i18n del `esbilla-public` que ya soporta 10 idiomas.

### 5.4 Uso en componentes

```typescript
import { useTranslation } from 'react-i18next';

function Login() {
  const { t } = useTranslation('auth');
  return <h1>{t('login.title')}</h1>; // "Iniciar sesión" / "Sign in"
}
```

### 5.5 Selector de idioma

Añadir un selector de idioma en:
- Las páginas de auth (login, registro, etc.) — en el footer o header
- El dashboard — en el menú de usuario/configuración

---

## 6. FASE 3: Flujo de Auto-Registro con Plan (Vía 1 — Solo SaaS)

### 6.1 Flujo completo

```
esbilla.com/[lang]/saas → "Empezar" (elige plan)
        │
        ▼
app.esbilla.com/register?plan=pro
        │
        ▼
  ┌─ Registro (email/password o Google) ─┐
  │                                       │
  ▼                                       ▼
  Verificar email                   (Google ya verificado)
  (si email/password)
        │                                 │
        ▼                                 ▼
  Login ──────────────────────────────────┘
        │
        ▼
  /onboarding/setup  ← Wizard de 2-3 pasos
        │
        ├─ Paso 1: Datos de la organización (nombre, web)
        ├─ Paso 2: Configurar primer sitio (dominio)
        └─ Paso 3: Obtener código de instalación
        │
        ▼
  /dashboard  ← Listo para usar
```

### 6.2 Planes disponibles

Definir en la configuración (no hardcoded, para poder cambiar desde Firestore o config):

```typescript
// config/plans.ts
export const PLANS = {
  free: {
    id: 'free',
    name: { es: 'Gratuito', en: 'Free', ast: 'De baldre' },
    maxSites: 1,
    maxConsentsPerMonth: 5000,
    features: ['1 sitio', 'Banner personalizable', 'Estadísticas básicas'],
    price: { monthly: 0, yearly: 0 },
    cta: { es: 'Empezar gratis', en: 'Start free', ast: 'Entamar de baldre' }
  },
  pro: {
    id: 'pro',
    name: { es: 'Profesional', en: 'Professional', ast: 'Profesional' },
    maxSites: 10,
    maxConsentsPerMonth: 100000,
    features: ['10 sitios', 'Multi-idioma', 'Analytics avanzadas', 'Soporte prioritario'],
    price: { monthly: 19, yearly: 190 },
    cta: { es: 'Empezar con Pro', en: 'Start with Pro', ast: 'Entamar con Pro' }
  },
  enterprise: {
    id: 'enterprise',
    name: { es: 'Empresa', en: 'Enterprise', ast: 'Empresa' },
    maxSites: -1, // ilimitado
    maxConsentsPerMonth: -1,
    features: ['Sitios ilimitados', 'API dedicada', 'SLA', 'Soporte 24/7'],
    price: { monthly: null, yearly: null }, // contactar
    cta: { es: 'Contactar', en: 'Contact us', ast: 'Contautar' }
  }
};
```

### 6.3 Página Register.tsx — CREAR (modo SaaS)

```
┌─────────────────────────────────────────┐
│           🌽  Esbilla CMP               │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │ Plan seleccionado: Profesional    │  │
│   │ 10 sitios · 100k consents/mes    │  │
│   │ [Cambiar plan]                    │  │
│   └───────────────────────────────────┘  │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ 👤 Nombre completo                  │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 📧 Email                            │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 🔒 Contraseña                       │ │
│  └─────────────────────────────────────┘ │
│  [████████░░] Fortaleza: Buena           │
│  ┌─────────────────────────────────────┐ │
│  │ 🔒 Confirmar contraseña             │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ☐ Acepto los términos de servicio y     │
│    la política de privacidad             │
│                                          │
│  [        Crear cuenta        ]          │
│                                          │
│  ───── o registrarse con ─────           │
│                                          │
│  [   🔵 Continuar con Google   ]         │
│                                          │
│  ¿Ya tienes cuenta? [Inicia sesión]      │
│                                          │
│  [🌐 ES ▾]          ← selector idioma   │
└─────────────────────────────────────────┘
```

**Lógica:**
1. Lee `?plan=pro` del query param. Si no hay plan → mostrar selector o redirigir a pricing.
2. Validaciones: nombre (2-100 chars), email válido, password (min 8, 1 mayúsc, 1 número), confirm match, términos
3. Firebase Auth: `createUserWithEmailAndPassword` → `updateProfile` → `sendEmailVerification` → `signOut`
4. Guardar plan seleccionado en `sessionStorage` (se usará en onboarding post-login)
5. Redirigir a `/verify-email?email=xxx`

Si se registra con **Google**:
1. `signInWithPopup(auth, googleProvider)`
2. Google ya verifica el email → no necesita paso de verificación
3. Guardar plan en sessionStorage
4. Redirigir directamente a `/onboarding/setup`

**NO crear documento en Firestore `users/` durante el registro.** Se crea durante el onboarding wizard, porque necesitamos los datos de la organización.

### 6.4 Wizard de Onboarding: /onboarding/setup — CREAR

Se muestra tras el primer login exitoso cuando el usuario NO tiene documento en Firestore.

```
┌─────────────────────────────────────────────┐
│  🌽 ¡Bienvenido a Esbilla!                  │
│                                              │
│  Paso 1 de 3: Tu organización                │
│  [●─────○─────○]                             │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 🏢 Nombre de tu empresa                 │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ 🌐 Sitio web principal                  │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ 📋 CIF / NIF (opcional)                 │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Plan: Profesional (19€/mes)                 │
│                                              │
│  [        Siguiente →        ]               │
│                                              │
└─────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────┐
│  Paso 2 de 3: Tu primer sitio                │
│  [●─────●─────○]                             │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 🌐 Dominio (ej: www.ejemplo.com)        │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ 📝 Nombre del sitio                     │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [← Anterior]    [Siguiente →]               │
│                                              │
└─────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────┐
│  Paso 3 de 3: ¡Instala el Pegoyu!           │
│  [●─────●─────●]                             │
│                                              │
│  Copia este código y pégalo en el <head>     │
│  de tu web:                                  │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ <script                                 │ │
│  │   src="https://api.esbilla.com/         │ │
│  │   pegoyu.js"                            │ │
│  │   data-id="site_xxx"                    │ │
│  │   data-api="https://api.esbilla.com">   │ │
│  │ </script>                               │ │
│  │                            [📋 Copiar]  │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [  Ir al Dashboard →  ]                     │
│                                              │
│  ¿Necesitas ayuda? Consulta la               │
│  guía de instalación                         │
│                                              │
└─────────────────────────────────────────────┘
```

**Lógica del Wizard:**

Al completar el Paso 1, crear en Firestore (en una sola transacción o batch):

1. **Documento `organizations/{orgId}`**:
   ```json
   {
     "id": "org_<generated>",
     "name": "Nombre empresa",
     "legalName": "",
     "taxId": "",
     "plan": "pro",  // del sessionStorage
     "maxSites": 10,  // según plan
     "maxConsentsPerMonth": 100000,
     "billingEmail": "email-del-usuario",
     "createdAt": "serverTimestamp()",
     "createdBy": "uid"
   }
   ```

2. **Documento `users/{uid}`**:
   ```json
   {
     "id": "uid",
     "email": "email",
     "displayName": "nombre",
     "photoURL": "...",
     "globalRole": "pending",  // se mantiene pending a nivel global
     "orgAccess": {
       "org_xxx": {
         "organizationId": "org_xxx",
         "organizationName": "Nombre empresa",
         "role": "org_owner",  // el creador es owner
         "addedAt": "serverTimestamp()",
         "addedBy": "uid (self)"
       }
     },
     "siteAccess": {},
     "createdAt": "serverTimestamp()",
     "lastLogin": "serverTimestamp()",
     "authProvider": "email" | "google",
     "onboardingCompleted": true,
     "locale": "es"  // idioma preferido
   }
   ```

Al completar el Paso 2, crear:

3. **Documento `sites/{siteId}`**:
   ```json
   {
     "id": "site_<generated>",
     "name": "Nombre del sitio",
     "domains": ["www.ejemplo.com"],
     "organizationId": "org_xxx",
     "apiKey": "esb_<generated>",
     "settings": { /* defaults del banner */ },
     "createdAt": "serverTimestamp()",
     "createdBy": "uid"
   }
   ```

---

## 7. FASE 4: Flujo de Invitación a Organización Existente (Vía 2)

### 7.1 Colección Firestore: `invitations`

```json
{
  "id": "auto-generated",
  "email": "invitado@empresa.com",
  "type": "organization" | "site",
  "targetId": "org_xxx o site_xxx",
  "targetName": "Nombre de la org o sitio",
  "role": "org_admin" | "org_viewer" | "site_admin" | "site_viewer",
  "organizationId": "org_xxx",
  "invitedBy": "uid-del-invitador",
  "invitedByName": "Nombre del invitador",
  "status": "pending" | "accepted" | "expired" | "revoked",
  "createdAt": "Timestamp",
  "expiresAt": "Timestamp (7 días)",
  "acceptedAt": "Timestamp | null",
  "acceptedBy": "uid | null"
}
```

### 7.2 Flujo

```
org_owner hace clic en "Invitar usuario" en Users.tsx
        │
        ▼
Introduce email + selecciona rol
        │
        ▼
API crea invitación en Firestore + envía email
        │
        ▼
Invitado recibe email con enlace:
app.esbilla.com/invite/{inviteId}
        │
        ▼
  ¿Tiene cuenta?
    │           │
   NO          SÍ
    │           │
    ▼           ▼
  Registro     Login
  (sin plan)   (normal)
    │           │
    ▼           ▼
  Verificar ───┘
    │
    ▼
  Se aplica la invitación automáticamente:
  - Actualiza users/{uid}.orgAccess o siteAccess
  - Invitación status → "accepted"
        │
        ▼
  /dashboard (con acceso a la org)
```

**IMPORTANTE**: En el flujo de invitación, el usuario invitado NO pasa por el wizard de onboarding ni selecciona plan. Se une a una organización existente que ya tiene su plan.

### 7.3 Página AcceptInvite.tsx

```
┌─────────────────────────────────────────┐
│                 🌽                       │
│    Has sido invitado a Esbilla CMP       │
│                                          │
│  [Nombre] te ha invitado a unirte a      │
│  [Organización] como [rol].              │
│                                          │
│  ───────────────────────────────────     │
│                                          │
│  [   🔵 Aceptar con Google   ]           │
│                                          │
│  ───── o con email ─────                 │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ 📧 Email                            │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 🔒 Contraseña                       │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  [   Aceptar e iniciar sesión   ]        │
│                                          │
│  ¿No tienes cuenta?                      │
│  [Crear cuenta y aceptar]                │
│                                          │
│  [🌐 ES ▾]                              │
└─────────────────────────────────────────┘
```

**Lógica:**
1. Cargar invitación por `inviteId` desde Firestore
2. Validar: no expirada, status === "pending"
3. Guardar `inviteId` en sessionStorage
4. Login o registro → tras auth exitoso, verificar que el email del usuario coincide con `invitation.email`
5. Aplicar acceso: actualizar `users/{uid}` con orgAccess/siteAccess
6. Marcar invitación como `status: "accepted"`
7. Si el usuario no tenía documento en Firestore, crearlo ahora (sin wizard, datos mínimos)
8. Redirigir a `/dashboard`

### 7.4 Envío de emails de invitación desde la API

```bash
npm install nodemailer -w esbilla-api
```

Crear `esbilla-api/src/services/email.js`:
- Configuración SMTP via variables de entorno
- Templates HTML inline-styled con marca Esbilla (#FFBF00 / #3D2B1F)
- **Templates i18n**: enviar en el idioma del invitador (o inglés por defecto)
- Versión texto plano como fallback
- Footer: "Esbilla CMP — Consent management made in Asturias 🌽"

Endpoint:
```javascript
// POST /api/invitations/send
// Auth: verificar token Firebase con firebase-admin
// Body: { email, organizationId, role, type, locale }
// Solo SaaS y self-hosted (disponible en ambos modos)
```

Variables de entorno:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@esbilla.com
SMTP_PASS=app-password
FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>
FRONTEND_URL=https://app.esbilla.com
```

---

## 8. FASE 5: Páginas de Auth Complementarias

### 8.1 Login.tsx — MODIFICAR

Añadir formulario email/password al login existente (que solo tiene Google):

```
┌─────────────────────────────────────────┐
│           🌽  Esbilla CMP               │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ 📧 Email                            │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 🔒 Contraseña                       │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  [¿Olvidaste tu contraseña?]             │
│                                          │
│  [     Iniciar sesión     ]              │
│                                          │
│  ───── o continuar con ─────             │
│  [   🔵 Continuar con Google   ]         │
│                                          │
│  ¿No tienes cuenta? [Empieza aquí]       │
│  → enlaza a esbilla.com/[lang]/saas      │
│    (modo SaaS) o /register (self-hosted) │
│                                          │
│  [🌐 ES ▾]                              │
└─────────────────────────────────────────┘
```

**Post-login routing:**
1. `emailVerified === false` → `/verify-email`
2. No tiene documento en Firestore → `/onboarding/setup` (SaaS) o error (self-hosted)
3. Tiene `orgAccess` → `/dashboard`
4. No tiene `orgAccess` (legacy pending) → `/pending`

### 8.2 VerifyEmail.tsx — CREAR

Pantalla post-registro para verificar email. Con cooldown de 60s para reenvío.

### 8.3 ForgotPassword.tsx — CREAR

Formulario de email → `sendPasswordResetEmail` → mensaje genérico SIEMPRE.

### 8.4 Firebase Auth Action Handler — CREAR

Ruta: `/__/auth/action`

Maneja query params `mode`, `oobCode`, `apiKey` de Firebase:
- `mode === "resetPassword"` → formulario nueva contraseña → `confirmPasswordReset` → `/login?reset=true`
- `mode === "verifyEmail"` → `applyActionCode` → `/login?verified=true`

### 8.5 PendingApproval.tsx — CREAR

Solo para usuarios legacy que quedaron en "pending" sin organización. Con listener `onSnapshot` para detectar aprobación en tiempo real.

---

## 9. FASE 6: Protección de Rutas

### 9.1 Flujo de decisión

```
USUARIO LLEGA A app.esbilla.com
         │
         ▼
  ¿Autenticado (Firebase Auth)?
    │           │
   NO          SÍ
    │           │
    ▼           ▼
 /login    ¿Email verificado?
              │           │
             NO          SÍ
              │           │
              ▼           ▼
         /verify-email  ¿Tiene documento en Firestore users/?
                            │           │
                           NO          SÍ
                            │           │
                            ▼           ▼
                      /onboarding    ¿Tiene orgAccess?
                       /setup           │           │
                      (modo SaaS)      NO          SÍ
                                        │           │
                                        ▼           ▼
                                   /pending     /dashboard
```

### 9.2 Componentes wrapper

```typescript
<PublicRoute>     // Solo sin auth (login, register, forgot)
<ProtectedRoute>  // Requiere auth + email verificado + onboarding completo + orgAccess
<OnboardingRoute> // Requiere auth + email verificado, pero permite sin orgAccess
```

### 9.3 AuthContext ampliado

```typescript
interface AuthState {
  user: FirebaseUser | null;
  userData: UserDocument | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;  // tiene documento en Firestore
  hasOrgAccess: boolean;            // tiene al menos una org en orgAccess
  isPending: boolean;               // legacy: tiene doc pero sin orgAccess
  locale: string;                   // idioma preferido del usuario
}
```

---

## 10. CHECKLIST DE SEGURIDAD

- [ ] Firebase Auth gestiona TODOS los tokens, hashes y verificaciones
- [ ] NO almacenar passwords en Firestore
- [ ] Mensajes de error genéricos en login y forgot-password
- [ ] Verificación de email obligatoria antes de acceder al dashboard
- [ ] En modo SaaS, NO hay registro sin plan ni invitación
- [ ] En modo self-hosted, el primer usuario se auto-promueve a superadmin
- [ ] Templates de email en Firebase Console personalizados con marca Esbilla
- [ ] Dominio autorizado en Firebase Auth settings
- [ ] Firestore rules actualizadas para `invitations`
- [ ] Invitaciones con expiración de 7 días y uso único
- [ ] Feature flag `ESBILLA_MODE` controla qué funcionalidades están activas
- [ ] CORS en la API solo para dominios propios
- [ ] Email de invitación: verificar permisos del solicitante en el backend con firebase-admin

---

## 11. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Sprint 1: Infraestructura (1-2 días)
1. Crear sistema de feature flags (`VITE_ESBILLA_MODE` / `ESBILLA_MODE`)
2. Instalar y configurar `react-i18next` con estructura de locales
3. Crear archivos de traducción iniciales (ES + EN) para auth y onboarding
4. Habilitar Email/Password en Firebase Console + configurar templates
5. Crear `AuthLayout.tsx` compartido + selector de idioma

### Sprint 2: Auth básico (2-3 días)
6. Actualizar `AuthContext.tsx` con métodos email/password
7. Modificar `Login.tsx` (añadir formulario + i18n)
8. Crear `Register.tsx` (con selector de plan en modo SaaS)
9. Crear `VerifyEmail.tsx`
10. Crear `ForgotPassword.tsx`
11. Crear Auth Action Handler (`/__/auth/action`)
12. Actualizar rutas en React Router

### Sprint 3: Onboarding wizard (2-3 días)
13. Crear `/onboarding/setup` — wizard de 3 pasos
14. Implementar creación de organización + usuario + primer sitio en Firestore
15. Implementar routing condicional post-login
16. Crear componentes wrapper de rutas (PublicRoute, ProtectedRoute, OnboardingRoute)
17. Crear `PendingApproval.tsx` para legacy

### Sprint 4: Invitaciones (2-3 días)
18. Crear colección `invitations` + Firestore rules
19. Crear endpoint `/api/invitations/send` en la API con Nodemailer
20. Crear templates de email de invitación (ES + EN)
21. Crear `AcceptInvite.tsx`
22. Añadir botón "Invitar usuario" en `Users.tsx`

### Sprint 5: Pulido (1-2 días)
23. Tests (Vitest + Testing Library)
24. Responsive
25. Traducciones completas EN
26. Actualizar HOWTO.md y CLAUDE.md con los nuevos flujos
27. Probar flujo completo E2E en ambos modos (SaaS + self-hosted)

---

## 12. NOTAS PARA LA IA DE CODIFICACIÓN

### LO QUE SÍ ES
- **Dashboard**: React 19 + Vite + TypeScript (NO Angular)
- **Auth**: Firebase Auth nativo (NO JWT propio, NO bcrypt manual)
- **BBDD**: Firestore (NO PostgreSQL)
- **API**: Express.js v5 (NO FastAPI/Python)
- **UI**: Tailwind CSS v4 + Lucide icons (NO Material UI)
- **State**: React Context + TanStack Query (NO Redux)
- **Router**: React Router v7
- **i18n**: react-i18next (NO angular/translate, NO custom i18n)
- **Monorepo**: npm workspaces
- **Región Cloud Run**: europe-west4 (Netherlands)

### LO QUE NO HAY QUE HACER
- NO implementar JWT propio — Firebase Auth lo gestiona
- NO crear endpoints de login/register en la API — Firebase Auth SDK en el cliente
- NO almacenar hashes de password en Firestore — Firebase Auth lo gestiona
- NO implementar bcrypt/crypto para passwords
- NO crear tokens de verificación/reset propios — Firebase lo gestiona
- NO crear colección de refresh tokens
- NO permitir registro abierto sin plan ni invitación (en modo SaaS)
- NO crear sistema de pagos todavía (Stripe vendrá en otra fase)
- NO hardcodear textos en español — todo debe pasar por i18n

### CONVENCIONES DEL PROYECTO
- **i18n obligatorio**: Todo texto visible al usuario debe usar `t('key')`. Empezar con ES y EN.
- Código (variables, funciones, commits) en **inglés**
- UI en **el idioma del usuario** (detectado automáticamente o seleccionado)
- Commits con **conventional commits** en inglés
- La mascota es "la panoya" (🌽) — usar donde sea apropiado en la marca
- El SDK se llama "Pegoyu"
- Asturianismos bienvenidos en textos de marca, pero no obligatorios
- El proyecto es **Open Source con licencia comercial** — el código de SaaS vive en el mismo repo controlado por feature flags, no en un repo separado

### COMANDOS PARA DESARROLLO
```bash
npm run dev -w esbilla-dashboard   # Dashboard en localhost:5173
npm start -w esbilla-api           # API en localhost:3000
npm run test -w esbilla-dashboard  # Tests del dashboard
npm run lint -w esbilla-dashboard  # Lint
```

### ARCHIVOS CLAVE A CONSULTAR ANTES DE CODIFICAR
- `CLAUDE.md` — Referencia completa del proyecto (LEER PRIMERO)
- `esbilla-dashboard/src/context/AuthContext.tsx` — Contexto de auth actual
- `esbilla-dashboard/src/types/index.ts` — Tipos TypeScript
- `esbilla-dashboard/src/pages/Login.tsx` — Login actual (solo Google)
- `esbilla-dashboard/src/pages/Users.tsx` — Gestión de usuarios
- `esbilla-api/src/app.js` — Express app con rutas actuales
- `firestore.rules` — Reglas de seguridad actuales
- `HOWTO.md` — Guía de instalación y estructura de datos Firestore
