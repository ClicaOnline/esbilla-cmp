# HOWTO - Guía de Primeros Pasos

Esta guía explica cómo desplegar y usar Esbilla-CMP en tu entorno.

## Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Local](#instalación-local)
3. [Configurar Firebase](#configurar-firebase)
4. [Acceder al Dashboard](#acceder-al-dashboard)
5. [Integrar el SDK en tu Web](#integrar-el-sdk-en-tu-web)
6. [Despliegue en Producción](#despliegue-en-producción)
7. [Sistema de Usuarios y Roles](#sistema-de-usuarios-y-roles)

---

## Requisitos Previos

- **Node.js** 20 o superior
- **npm** 10 o superior
- **Cuenta de Google Cloud** (para Firebase)
- **Git**

---

## Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/ClicaOnline/esbilla-cmp.git
cd esbilla-cmp

# 2. Instalar dependencias (todas las workspaces)
npm install

# 3. Iniciar la API (incluye SDK y Dashboard)
npm start -w esbilla-api

# 4. Abrir en el navegador
# API + SDK:     http://localhost:3000
# Test SDK:      http://localhost:3000/test.html
# Dashboard:     http://localhost:3000/dashboard
```

### Desarrollo del Dashboard (con hot-reload)

```bash
# En una terminal, iniciar la API
npm start -w esbilla-api

# En otra terminal, iniciar el dashboard en modo dev
npm run dev -w esbilla-dashboard
# Dashboard dev: http://localhost:5173
```

---

## Configurar Firebase

El dashboard usa Firebase para autenticación (Google SSO) y almacenamiento de datos.

### 1. Crear proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto: `esbilla-cmp` (o tu nombre)
3. Activa **Authentication** → Sign-in method → **Google**
4. Activa **Firestore Database** en modo producción

### 2. Obtener credenciales

**Para el Dashboard (cliente):**

1. En Firebase Console → Project Settings → General
2. En "Your apps", añade una Web App
3. Copia la configuración y crea el archivo `.env` en `esbilla-dashboard/`:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Para la API (servidor):**

1. En Firebase Console → Project Settings → Service accounts
2. Genera una nueva clave privada (JSON)
3. Guarda el archivo y configura la variable de entorno:

```bash
# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu-clave.json"

# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\a\tu-clave.json"
```

### 3. Configurar reglas de Firestore

En Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // FUNCIONES HELPER
    // ============================================

    // Obtener datos del usuario actual
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    // Verificar si es superadmin
    function isSuperAdmin() {
      return getUserData().globalRole == 'superadmin';
    }

    // Verificar acceso a organización
    function hasOrgAccess(orgId) {
      let user = getUserData();
      return user.globalRole == 'superadmin' || orgId in user.orgAccess;
    }

    // Verificar rol de organización
    function getOrgRole(orgId) {
      let user = getUserData();
      if (user.globalRole == 'superadmin') return 'superadmin';
      return user.orgAccess[orgId].role;
    }

    // Verificar si puede escribir en organización
    function canWriteOrg(orgId) {
      let role = getOrgRole(orgId);
      return role == 'superadmin' || role == 'org_owner' || role == 'org_admin';
    }

    // ============================================
    // REGLAS POR COLECCIÓN
    // ============================================

    // Organizaciones
    match /organizations/{orgId} {
      // Leer: usuarios con acceso a la org
      allow read: if request.auth != null && hasOrgAccess(orgId);

      // Crear: solo superadmin
      allow create: if request.auth != null && isSuperAdmin();

      // Actualizar: org_owner o superadmin (facturación y config)
      allow update: if request.auth != null &&
        (isSuperAdmin() || getOrgRole(orgId) == 'org_owner');

      // Eliminar: solo superadmin
      allow delete: if request.auth != null && isSuperAdmin();
    }

    // Usuarios
    match /users/{userId} {
      // Leer su propio perfil: siempre permitido
      allow read: if request.auth != null && request.auth.uid == userId;

      // Leer otros usuarios: superadmin o misma organización
      allow read: if request.auth != null && isSuperAdmin();

      // Crear: cualquier usuario autenticado (login inicial)
      allow create: if request.auth != null && request.auth.uid == userId;

      // Actualizar propio perfil (campos limitados)
      allow update: if request.auth != null && request.auth.uid == userId &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['displayName', 'photoURL', 'lastLogin']);

      // Actualizar otros: superadmin o org_owner/org_admin de la misma org
      allow update: if request.auth != null && isSuperAdmin();

      // Eliminar: solo superadmin
      allow delete: if request.auth != null && isSuperAdmin();
    }

    // Sitios
    match /sites/{siteId} {
      // Leer: usuarios autenticados con acceso al sitio o su organización
      allow read: if request.auth != null;

      // Crear: superadmin o org_owner/org_admin de la organización
      allow create: if request.auth != null &&
        (isSuperAdmin() || canWriteOrg(request.resource.data.organizationId));

      // Actualizar: superadmin, org_owner/org_admin, o site_admin
      allow update: if request.auth != null &&
        (isSuperAdmin() || canWriteOrg(resource.data.organizationId) ||
         (getUserData().siteAccess[siteId] != null &&
          getUserData().siteAccess[siteId].role == 'site_admin'));

      // Eliminar: superadmin o org_owner de la organización
      allow delete: if request.auth != null &&
        (isSuperAdmin() || getOrgRole(resource.data.organizationId) == 'org_owner');
    }

    // Consentimientos
    match /consents/{consentId} {
      // Leer: usuarios autenticados (se filtra en la app por acceso a sitio)
      allow read: if request.auth != null;

      // Escribir: API sin auth (Cloud Run service account)
      // En producción, usar Cloud Functions o IAM para validar
      allow write: if true;
    }
  }
}
```

> **Nota de seguridad:** Las reglas anteriores son un punto de partida. En producción:
> - Usa Cloud Functions para validar escrituras de consents desde la API
> - Configura IAM para que solo el service account de Cloud Run pueda escribir
> - Considera usar Firebase App Check para validar el origen de las peticiones

---

## Acceder al Dashboard

### URL de acceso

| Entorno | URL |
|---------|-----|
| Local (API) | http://localhost:3000/dashboard |
| Local (Dev) | http://localhost:5173 |
| Producción | https://tu-api.com/dashboard |

### Primer login

1. Accede al dashboard
2. Haz clic en "Continuar con Google"
3. El primer usuario queda en estado **"pending"** (pendiente)
4. Un admin debe aprobar el usuario (ver siguiente sección)

### Crear el primer admin

El primer usuario necesita ser promovido manualmente a admin:

1. Ve a Firebase Console → Firestore
2. Busca la colección `users`
3. Encuentra tu documento (por email)
4. Cambia el campo `role` de `"pending"` a `"admin"`
5. Recarga el dashboard

---

## Sistema de Usuarios y Permisos Jerárquicos

Esbilla CMP implementa un sistema de permisos jerárquico similar a Google Analytics, con tres niveles:

```
┌─────────────────────────────────────────────────────────┐
│                    PLATAFORMA                           │
│                   (superadmin)                          │
└─────────────────────────┬───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  ORGANIZACIÓN │ │  ORGANIZACIÓN │ │  ORGANIZACIÓN │
│   (empresa)   │ │   (empresa)   │ │   (empresa)   │
│  org_owner    │ │  org_admin    │ │  org_viewer   │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
   ┌────┼────┐       ┌────┼────┐       ┌────┼────┐
   ▼    ▼    ▼       ▼    ▼    ▼       ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
│SITIO││SITIO││SITIO││SITIO││SITIO││SITIO││SITIO││SITIO│
│.com ││.es  ││.fr  ││.com ││.es  ││.com ││.es  ││.fr  │
└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘
```

### Niveles de jerarquía

| Nivel | Entidad | Descripción |
|-------|---------|-------------|
| **Plataforma** | Sistema | Acceso global a todas las organizaciones y sitios |
| **Organización** | Empresa | Entidad fiscal que agrupa múltiples dominios/sitios |
| **Sitio** | Dominio | Un dominio o grupo de subdominios relacionados |

### Roles disponibles

#### Nivel Plataforma
| Rol | Permisos |
|-----|----------|
| `superadmin` | Acceso total a toda la plataforma, todas las organizaciones y sitios |
| `pending` | Sin acceso (esperando aprobación) |

#### Nivel Organización
| Rol | Permisos |
|-----|----------|
| `org_owner` | Propietario: gestión completa + facturación + puede delegar a otros usuarios |
| `org_admin` | Administrador: gestionar sitios y usuarios de la org (sin acceso a facturación) |
| `org_viewer` | Lector: ver estadísticas de todos los sitios de la organización |

#### Nivel Sitio
| Rol | Permisos |
|-----|----------|
| `site_admin` | Administrar configuración del sitio específico |
| `site_viewer` | Solo lectura del sitio específico |

### Cascada de permisos

Los permisos fluyen de niveles superiores a inferiores:

```
superadmin ──────────────────────────────────────────► Todo
     │
     ▼
org_owner ───► Organización + Todos sus sitios + Facturación
     │
     ▼
org_admin ───► Organización + Todos sus sitios (sin facturación)
     │
     ▼
org_viewer ──► Lectura de todos los sitios de la org
     │
     ▼
site_admin ──► Solo el sitio asignado (gestión)
     │
     ▼
site_viewer ─► Solo el sitio asignado (lectura)
```

### Matriz de permisos detallada

| Acción | superadmin | org_owner | org_admin | org_viewer | site_admin | site_viewer |
|--------|:----------:|:---------:|:---------:|:----------:|:----------:|:-----------:|
| Ver estadísticas del sitio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exportar datos | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Configurar banner | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Crear/eliminar sitios | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar usuarios de org | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ |
| Ver/editar facturación | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear organizaciones | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*org_admin solo puede gestionar usuarios de nivel igual o inferior (org_viewer, site_admin, site_viewer)

### Casos de uso

#### Empresa con múltiples dominios
```
Organización: "Acme Corp" (org_owner: ceo@acme.com)
├── Sitio: acme.com (sitio principal)
├── Sitio: acme.es (versión española)
├── Sitio: shop.acme.com (tienda online)
└── Usuarios:
    ├── marketing@acme.com → org_viewer (ve todo, no edita)
    ├── webmaster@acme.com → org_admin (gestiona todos los sitios)
    └── freelance@agencia.com → site_admin de shop.acme.com solamente
```

#### Agencia con múltiples clientes
```
Organización: "Agencia Digital"
└── El superadmin crea organizaciones separadas para cada cliente

Organización: "Cliente A"
├── Sitio: clientea.com
└── Usuarios:
    ├── contacto@clientea.com → org_viewer (su empresa)
    └── gestor@agencia.com → org_admin (la agencia)
```

### Flujo de aprobación

```
Usuario nuevo → Login con Google → Estado: pending
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            Superadmin lo        Org_owner lo         Se rechaza
            asigna a una       asigna a sitios       la solicitud
            organización        de su org
                    │                   │
                    ▼                   ▼
              org_owner/           site_admin/
              org_admin/           site_viewer
              org_viewer
```

### Gestión de usuarios

1. **Como superadmin:**
   - Crear organizaciones
   - Asignar usuarios a organizaciones con rol org_owner/org_admin/org_viewer
   - Ver y gestionar todos los usuarios del sistema

2. **Como org_owner/org_admin:**
   - Ver usuarios de tu organización
   - Aprobar usuarios pendientes asignándoles acceso a tu organización
   - Dar acceso directo a sitios específicos (útil para freelancers/agencias)
   - Revocar acceso a usuarios de nivel igual o inferior

3. **Como site_admin:**
   - Solo puede gestionar la configuración del sitio
   - No puede gestionar otros usuarios

---

## Integrar el SDK en tu Web

### Instalación básica

Añade el script antes del cierre de `</body>`:

```html
<script
  src="https://tu-api.esbilla.com/pegoyu.js"
  data-id="mi-sitio-001"
  data-gtm="GTM-XXXXXX">
</script>
```

### Parámetros del SDK

| Atributo | Descripción | Ejemplo |
|----------|-------------|---------|
| `data-id` | Identificador único del sitio | `"mi-web-prod"` |
| `data-gtm` | ID de Google Tag Manager (opcional) | `"GTM-ABC123"` |
| `data-api` | URL de la API (si es diferente) | `"https://api.ejemplo.com"` |

### Probar localmente

1. Inicia la API: `npm start -w esbilla-api`
2. Abre http://localhost:3000/test.html
3. Verifica:
   - Aparece el banner de cookies
   - Al aceptar/rechazar, aparece "la mosca" con el footprint ID
   - El footprint se muestra como: `🍪 ESB-A7F3B2C1`

---

## Despliegue en Producción

### Opción 1: Docker

```bash
# Desde la raíz del monorepo
docker build -t esbilla-cmp .
docker run -p 3000:3000 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  -v /ruta/local/credentials.json:/app/credentials.json \
  esbilla-cmp
```

### Opción 2: Google Cloud Run

El repositorio incluye GitHub Actions para despliegue automático:

1. Configura los secrets en GitHub:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (JSON de la cuenta de servicio)
   - `GCP_REGION` (ej: `europe-west4`)

2. Push a `main` dispara el despliegue automático

### Variables de entorno en producción

```bash
# API
GCLOUD_PROJECT=tu-proyecto
FIRESTORE_DATABASE_ID=(default)
PORT=3000

# Dashboard (build time)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

---

## Ejecutar Tests

```bash
# Tests de la API (13 tests)
npm test -w esbilla-api

# Tests del Dashboard (15 tests)
npm test -w esbilla-dashboard

# Tests de la landing page
npm test -w esbilla-public -- --run
```

---

## Estructura de datos en Firestore

### Colección: `organizations`

```json
{
  "id": "org_abc123xyz789",
  "name": "Acme Corporation",
  "legalName": "Acme Corp S.L.",
  "taxId": "B12345678",
  "plan": "pro",
  "maxSites": 10,
  "maxConsentsPerMonth": 100000,
  "billingEmail": "billing@acme.com",
  "billingAddress": {
    "street": "Calle Principal 123",
    "city": "Madrid",
    "postalCode": "28001",
    "country": "ES"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "uid-del-superadmin",
  "updatedAt": "2024-01-20T15:45:00Z"
}
```

### Colección: `users`

```json
{
  "id": "uid-firebase",
  "email": "usuario@ejemplo.com",
  "displayName": "Nombre Usuario",
  "photoURL": "https://...",
  "globalRole": "pending",
  "orgAccess": {
    "org_abc123xyz789": {
      "organizationId": "org_abc123xyz789",
      "organizationName": "Acme Corporation",
      "role": "org_admin",
      "addedAt": "2024-01-16T09:00:00Z",
      "addedBy": "uid-del-org-owner"
    }
  },
  "siteAccess": {
    "site_xyz789abc123": {
      "siteId": "site_xyz789abc123",
      "siteName": "Blog Personal",
      "organizationId": "org_otro123",
      "role": "site_viewer",
      "addedAt": "2024-01-17T11:00:00Z",
      "addedBy": "uid-del-site-owner"
    }
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-20T15:45:00Z",
  "createdBy": "uid-quien-aprobo"
}
```

### Colección: `sites`

```json
{
  "id": "site_abc123def456",
  "name": "Mi Web Principal",
  "domains": ["ejemplo.com", "www.ejemplo.com"],
  "organizationId": "org_abc123xyz789",
  "apiKey": "esb_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "settings": {
    "banner": {
      "layout": "modal",
      "colors": {
        "primary": "#FFBF00",
        "secondary": "#E5E7EB",
        "background": "#FFFFFF",
        "text": "#1C1917"
      },
      "font": "system",
      "buttonStyle": "equal",
      "labels": {
        "acceptAll": "Aceptar todas",
        "rejectAll": "Rechazar todas",
        "customize": "Personalizar",
        "acceptEssential": "Solo esenciales"
      },
      "categories": [
        { "id": "essential", "name": "Esenciales", "required": true },
        { "id": "analytics", "name": "Analíticas", "required": false },
        { "id": "marketing", "name": "Marketing", "required": false }
      ]
    }
  },
  "stats": {
    "totalConsents": 15234,
    "lastConsentAt": "2024-01-20T15:45:00Z"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "uid-del-creador",
  "updatedAt": "2024-01-20T15:45:00Z"
}
```

{
  orgAccess: {
    "org_abc123": {
      organizationId: "org_abc123",
      organizationName: "Mi Empresa S.L.",
      role: "org_admin" | "org_owner" | "org_viewer",
      addedAt: Timestamp,
      addedBy: "superadmin_uid"
    }
  },
  siteAccess: {
    "site_xyz789": {
      siteId: "site_xyz789",
      siteName: "example.com",
      organizationId: "org_abc123",
      role: "site_admin" | "site_viewer",
      addedAt: Timestamp,
      addedBy: "org_owner_uid"
    }
  }
}


### Colección: `consents`

```json
{
  "siteId": "site_abc123def456",
  "projectId": "site_abc123def456",
  "footprintId": "ESB-A7F3B2C1",
  "userHash": "sha256-anonimizado",
  "bannerVersion": "1.3.0",
  "choices": {
    "analytics": true,
    "marketing": false
  },
  "action": "customize",
  "metadata": {
    "domain": "ejemplo.com",
    "pageUrl": "https://ejemplo.com/productos",
    "referrer": "https://google.com",
    "language": "es",
    "timezone": "Europe/Madrid",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "sdkVersion": "1.3.0",
    "consentVersion": "1.0"
  },
  "attribution": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "spring_sale",
    "gclid": "abc123xyz"
  },
  "ipHash": "a1b2c3d4e5f6",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-20T15:45:00Z",
  "createdAt": "2024-01-20T15:45:00Z",
  "expiresAt": "2027-01-20T15:45:00Z"
}
```

### Índices recomendados

```bash
# Índice para búsqueda de historial por footprint
gcloud firestore indexes composite create \
  --collection-group=consents \
  --field-config=field-path=footprintId,order=ascending \
  --field-config=field-path=createdAt,order=descending

# Índice para estadísticas por sitio y fecha
gcloud firestore indexes composite create \
  --collection-group=consents \
  --field-config=field-path=siteId,order=ascending \
  --field-config=field-path=createdAt,order=descending
```

---

## Sistema de Invitaciones (Sprint 4)

### Invitar usuarios a tu organización

Los usuarios con rol `org_owner` o `org_admin` pueden invitar colaboradores por email.

#### Desde el Dashboard

1. Ve a [/users](/users) en el dashboard
2. Click en "Invitar Usuario" (botón azul)
3. Completa el formulario:
   - **Email**: Email del usuario a invitar
   - **Organización**: Selecciona la organización
   - **Rol**: org_owner / org_admin / org_viewer
4. Click "Enviar Invitación"

#### Qué sucede

1. **Se crea** un documento en `invitations` collection
2. **Se envía** un email HTML con branding Esbilla al usuario
3. **Email expira** automáticamente en 7 días
4. **Usuario recibe** un link único: `https://app.esbilla.com/invite/{id}`

#### Aceptar invitación

El usuario invitado puede:
- **Con cuenta existente**: Login con Google o email/password
- **Sin cuenta**: Crear cuenta directamente desde la invitación
- **Auto-aplicación**: El acceso a la organización se aplica automáticamente

### Configurar SMTP

Para enviar emails, configura las variables en `esbilla-api/.env`:

```bash
# Gmail (Desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password desde Google Account

# SendGrid (Producción)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx

FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>
FRONTEND_URL=https://app.esbilla.com
```

**Sin SMTP configurado:** Los emails se loguean en consola (modo desarrollo).

**Gmail App Password:**
1. Google Account → Security → 2-Step Verification
2. App Passwords → Generate for "Mail"
3. Copiar código de 16 caracteres

### Colección: `invitations`

```json
{
  "id": "auto-generated",
  "email": "usuario@empresa.com",
  "type": "organization",
  "targetId": "org_xxx",
  "targetName": "Mi Empresa S.L.",
  "role": "org_admin",
  "organizationId": "org_xxx",
  "invitedBy": "uid-admin",
  "invitedByName": "Admin Principal",
  "status": "pending",
  "createdAt": "Timestamp",
  "expiresAt": "Timestamp (+7 días)",
  "acceptedAt": "Timestamp | null",
  "acceptedBy": "uid | null"
}
```

**Ver documentación completa:** [docs/INVITATIONS-SYSTEM.md](docs/INVITATIONS-SYSTEM.md)

---

## Soporte

- **Issues**: https://github.com/ClicaOnline/esbilla-cmp/issues
- **Email**: esbilla@clicaonline.com

---

Hecho con 🌽 en Asturies
