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
    // Usuarios: solo admins pueden escribir
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Consentimientos: API puede escribir, admins pueden leer
    match /consents/{consentId} {
      allow read: if request.auth != null;
      allow write: if true; // La API escribe sin auth (usar Cloud Functions para validar)
    }

    // Sitios: admins pueden gestionar
    match /sites/{siteId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

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

## Sistema de Usuarios y Roles

### Roles disponibles

| Rol | Permisos |
|-----|----------|
| `admin` | Ver estadísticas, gestionar usuarios, configurar sitios |
| `viewer` | Ver estadísticas, buscar footprints |
| `pending` | Sin acceso (esperando aprobación) |

### Flujo de aprobación

```
Usuario nuevo → Login con Google → Estado: pending
                                        ↓
                           Admin aprueba → Estado: viewer/admin
                                        ↓
                              Acceso al dashboard
```

### Gestión de usuarios (solo admins)

1. Accede al dashboard como admin
2. Ve a **Usuarios** en el menú lateral
3. En "Pendientes de Aprobación":
   - **Aprobar (Viewer)**: acceso solo lectura
   - **Admin**: acceso completo
   - **Rechazar**: elimina el usuario

---

## Integrar el SDK en tu Web

### Instalación básica

Añade el script antes del cierre de `</body>`:

```html
<script
  src="https://tu-api.esbilla.com/sdk.js"
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

### Colección: `users`

```json
{
  "email": "usuario@ejemplo.com",
  "displayName": "Nombre Usuario",
  "photoURL": "https://...",
  "role": "admin",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-20T15:45:00Z"
}
```

### Colección: `consents`

```json
{
  "cmpId": "mi-sitio-001",
  "footprintId": "ESB-A7F3B2C1",
  "choices": {
    "analytics": true,
    "marketing": false
  },
  "timestamp": "2024-01-20T15:45:00Z",
  "lang": "es",
  "userAgent": "Mozilla/5.0...",
  "ipHash": "a1b2c3d4e5f6",
  "createdAt": "2024-01-20T15:45:00Z"
}
```

### Colección: `sites` (futuro)

```json
{
  "name": "Mi Web",
  "domain": "ejemplo.com",
  "ownerId": "uid-del-admin",
  "config": {
    "layout": "modal",
    "theme": "default",
    "colors": { "primary": "#FFBF00" }
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Soporte

- **Issues**: https://github.com/ClicaOnline/esbilla-cmp/issues
- **Email**: esbilla@clicaonline.com

---

Hecho con 🌽 en Asturies
