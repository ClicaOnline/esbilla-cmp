# Sistema de Invitaciones - Sprint 4

Sistema completo de invitaciones por email para onboarding colaborativo en Esbilla CMP.

## Características

✅ **API de Invitaciones** (`/api/invitations`)
- `POST /api/invitations/send` - Enviar invitación por email
- `GET /api/invitations/:id` - Obtener detalles de invitación
- `POST /api/invitations/:id/accept` - Aceptar invitación

✅ **Emails HTML con Branding Esbilla**
- Templates multi-idioma (ES, EN, AST)
- Diseño responsive con gradientes (#FFBF00)
- Versión texto plano como fallback

✅ **Página de Aceptación** (`/invite/:inviteId`)
- Login con Google o email/password
- Registro directo desde la invitación
- Aplicación automática de acceso a organización

✅ **UI en Dashboard**
- Botón "Invitar Usuario" en `/users`
- Modal con selección de organización y rol
- Feedback inmediato (success/error)

✅ **Seguridad**
- Verificación de permisos (org_owner/org_admin)
- Validación de email coincidente
- Expiración automática (7 días)
- Firestore rules con multi-nivel

---

## Configuración SMTP

### Variables de Entorno (esbilla-api/.env)

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@esbilla.com
SMTP_PASS=your-app-password-here
FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>

# Frontend URL
FRONTEND_URL=https://app.esbilla.com
```

### Opciones de SMTP

#### 1. Gmail (Desarrollo)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password
```

**Crear App Password:**
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generar contraseña para "Mail"
3. Copiar el código de 16 caracteres

#### 2. SendGrid (Producción)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx  # SendGrid API Key
```

#### 3. Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.esbilla.com
SMTP_PASS=your-mailgun-password
```

#### 4. Amazon SES
```bash
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key-id
SMTP_PASS=your-ses-secret-access-key
```

### Modo Desarrollo (Sin SMTP)

Si no configuras SMTP, los emails se loguean en consola:
```
[Email] Would send invitation email to: usuario@ejemplo.com
[Email] Data: { inviterName, organizationName, role, inviteUrl, locale }
```

---

## Estructura de Firestore

### Colección `invitations`

```javascript
{
  "id": "auto-generated",
  "email": "invitado@empresa.com",
  "type": "organization",
  "targetId": "org_xxx",
  "targetName": "Nombre Organización",
  "role": "org_admin",
  "organizationId": "org_xxx",
  "invitedBy": "uid-invitador",
  "invitedByName": "Nombre Invitador",
  "status": "pending",  // pending | accepted | expired | revoked
  "createdAt": "Timestamp",
  "expiresAt": "Timestamp (+7 días)",
  "acceptedAt": "Timestamp | null",
  "acceptedBy": "uid | null"
}
```

### Firestore Rules

```javascript
match /invitations/{invitationId} {
  // Leer: invitado, invitador o admin
  allow read: if isAuthenticated() && (
    resource.data.email == request.auth.token.email ||
    resource.data.invitedBy == request.auth.uid ||
    isSuperAdmin()
  );

  // Crear: admins o org_owner/org_admin
  allow create: if isAuthenticated() && (
    isSuperAdmin() ||
    (getUserData().orgAccess != null &&
     request.resource.data.organizationId in getUserData().orgAccess &&
     getUserData().orgAccess[request.resource.data.organizationId].role in ['org_owner', 'org_admin'])
  );

  // Actualizar: invitado o invitador
  allow update: if isAuthenticated() && (
    request.auth.token.email == resource.data.email ||
    request.auth.uid == resource.data.invitedBy ||
    isSuperAdmin()
  );

  // No eliminar (audit trail)
  allow delete: if false;
}
```

### Índices Compuestos

```json
{
  "collectionGroup": "invitations",
  "fields": [
    { "fieldPath": "email", "order": "ASCENDING" },
    { "fieldPath": "organizationId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

---

## Flujo de Invitación

### 1. Enviar Invitación (Admin)

**Dashboard → `/users` → "Invitar Usuario"**

```
Usuario org_admin/org_owner
        ↓
Completa formulario (email, org, rol)
        ↓
POST /api/invitations/send
        ↓
Crea documento en Firestore
        ↓
Envía email con link único
```

### 2. Recibir Email

**Template HTML con branding Esbilla**

```html
🌽 Esbilla CMP

Has recibido una invitación

[Nombre] te ha invitado a unirte a [Organización] como [Rol]

[Botón: Aceptar invitación]
→ https://app.esbilla.com/invite/{inviteId}

Expira en 7 días
```

### 3. Aceptar Invitación

**Usuario hace click → `/invite/:inviteId`**

```
Cargar invitación desde Firestore
        ↓
¿Tiene cuenta?
   ├─ SÍ → Login (Google o email/password)
   └─ NO → Registro (sin plan, directo)
        ↓
POST /api/invitations/:id/accept
        ↓
Actualizar users/{uid}.orgAccess
        ↓
Marcar invitación como accepted
        ↓
Redirigir a /dashboard
```

---

## API Endpoints

### POST /api/invitations/send

**Auth:** Bearer token (Firebase ID Token)

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "organizationId": "org_xxx",
  "type": "organization",
  "role": "org_admin",
  "locale": "es"
}
```

**Response:**
```json
{
  "success": true,
  "invitationId": "invitation-id",
  "expiresAt": "2026-02-13T12:00:00.000Z"
}
```

**Errores:**
- `401` - No autenticado
- `403` - Permisos insuficientes
- `400` - Email ya es miembro
- `400` - Invitación ya enviada
- `404` - Organización no encontrada

---

### GET /api/invitations/:id

**Auth:** Público (sin token)

**Response:**
```json
{
  "email": "usuario@ejemplo.com",
  "organizationName": "Mi Empresa S.L.",
  "role": "org_admin",
  "invitedByName": "Admin Principal",
  "expiresAt": "2026-02-13T12:00:00.000Z"
}
```

**Errores:**
- `404` - Invitación no encontrada
- `410` - Invitación expirada
- `410` - Invitación ya aceptada
- `410` - Invitación revocada

---

### POST /api/invitations/:id/accept

**Auth:** Bearer token (Firebase ID Token)

**Body:** Vacío

**Response:**
```json
{
  "success": true
}
```

**Errores:**
- `401` - No autenticado
- `403` - Email no coincide
- `404` - Invitación no encontrada
- `410` - Invitación expirada
- `400` - Invitación ya procesada

---

## Testing

### 1. Instalar Dependencias

```bash
npm install  # En el root del monorepo
```

### 2. Configurar Variables de Entorno

```bash
cd esbilla-api
cp .env.example .env
# Editar .env con tus credenciales SMTP
```

### 3. Ejecutar API

```bash
npm run start -w esbilla-api
```

### 4. Ejecutar Dashboard

```bash
npm run dev -w esbilla-dashboard
```

### 5. Flujo de Prueba

1. **Login como admin:** `http://localhost:5173/login`
2. **Ir a Usuarios:** `http://localhost:5173/users`
3. **Invitar usuario:** Click en "Invitar Usuario"
4. **Completar formulario:**
   - Email: `test@ejemplo.com`
   - Organización: Seleccionar una existente
   - Rol: `org_admin`
5. **Enviar invitación**
6. **Verificar consola API:**
   ```
   [Email] Would send invitation email to: test@ejemplo.com
   [Email] Data: { ... }
   ```
7. **Copiar URL del email:** `http://localhost:5173/invite/{id}`
8. **Abrir en navegador privado**
9. **Aceptar invitación:**
   - Con Google: Click "Aceptar con Google"
   - Con email: Completar formulario registro
10. **Verificar acceso al dashboard**

---

## Traduciones (i18n)

### Claves Añadidas

**`src/i18n/translations/types.ts`**
```typescript
invitation: {
  title: string;
  invitedBy: string;
  invitedTo: string;
  asRole: string;
  acceptWith: string;
  acceptAndSignIn: string;
  noAccount: string;
  createAndAccept: string;
  expired: string;
  expiredMessage: string;
  notFound: string;
  notFoundMessage: string;
  orContinueWith: string;
  accepting: string;
}
```

**Implementado en:**
- `src/i18n/translations/es.ts` - Español
- `src/i18n/translations/ast.ts` - Asturianu
- `src/i18n/translations/en.ts` - English

---

## Archivos Creados

### Backend (esbilla-api)
1. **`src/services/email.js`** - Servicio de emails con Nodemailer
2. **`src/routes/invitations.js`** - API routes de invitaciones

### Frontend (esbilla-dashboard)
3. **`src/pages/AcceptInvite.tsx`** - Página de aceptación de invitaciones

### Configuración
4. **`firestore.rules`** - Reglas de seguridad actualizadas
5. **`firestore.indexes.json`** - Índices compuestos
6. **`esbilla-api/package.json`** - Dependencia `nodemailer` añadida

### Modificados
7. **`src/App.tsx`** - Ruta `/invite/:inviteId` añadida
8. **`src/pages/Users.tsx`** - Botón y modal de invitación
9. **`esbilla-api/src/app.js`** - Route `/api/invitations` integrado

---

## Seguridad

✅ **Validación de Permisos:**
- Solo org_owner y org_admin pueden invitar
- Verificación en backend con Firebase Auth
- Firestore rules como segunda capa

✅ **Protección de Email:**
- Verificación de email coincidente al aceptar
- No se puede aceptar invitación de otro email

✅ **Expiración:**
- 7 días automáticos
- Estado marcado como `expired` al consultar

✅ **Audit Trail:**
- Invitaciones no se eliminan (soft delete)
- Campos `acceptedAt`, `acceptedBy` para tracking

✅ **No PII en URL:**
- Solo `inviteId` en el link
- Email no expuesto en la URL

---

## Próximos Pasos (Opcional)

### Sprint 5: Pulido (Si se desea)

- [ ] Testing E2E con Playwright
- [ ] Notifications en tiempo real (Firebase Cloud Messaging)
- [ ] Resend invitation
- [ ] Revoke invitation
- [ ] Invitation analytics (tasa de aceptación)
- [ ] Email templates customizables por organización
- [ ] Invitación múltiple (bulk invite)

---

## Troubleshooting

### Email no llega

**Problema:** No se envía el email

**Soluciones:**
1. Verificar variables SMTP en `.env`
2. Comprobar logs de API: `[Email] Error sending invitation:`
3. Verificar que Gmail tiene App Password configurado
4. Probar con otro servicio SMTP (SendGrid)

### Invitación expirada

**Problema:** Invitación muestra "expired"

**Soluciones:**
1. Verificar fecha de `expiresAt` en Firestore
2. Crear nueva invitación (las antiguas no se pueden reactivar)

### Error "Email mismatch"

**Problema:** El email del usuario no coincide

**Soluciones:**
1. Asegurarse de usar el email correcto al aceptar
2. Con Google, usar la cuenta de email invitada
3. Con email/password, usar el email exacto

---

## Contacto

**Documentación completa:** Ver `docs/` folder
**Issues:** Reportar en GitHub
**Email:** esbilla+privacy@clicaonline.com

---

🌽 **Esbilla CMP** — Consent management made in Asturias
