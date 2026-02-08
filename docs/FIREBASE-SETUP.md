# Configuración de Firebase Console para Esbilla CMP

Este documento describe los pasos necesarios para configurar Firebase Console antes de desplegar Esbilla CMP en producción.

## 📋 Checklist de Configuración

- [ ] Activar Email/Password Authentication
- [ ] Configurar templates de email
- [ ] Añadir dominios autorizados
- [ ] Verificar Firestore rules deployed
- [ ] Configurar variables de entorno

---

## 1. Activar Email/Password Authentication

### Navegación:
Firebase Console → **Authentication** → **Sign-in method**

### Pasos:

1. Hacer clic en **"Add new provider"** o en **"Email/Password"** si ya aparece listado

2. **Activar el provider:**
   - ✅ **Enable** (Email/Password)
   - ❌ **Email link (passwordless sign-in)** - Dejar desactivado por ahora

3. Hacer clic en **"Save"**

### Verificación:

El provider "Email/Password" debe aparecer en la lista como **"Enabled"**.

---

## 2. Configurar Templates de Email

Firebase envía emails automáticos para verificación y reset de contraseña. Necesitamos personalizar estos templates.

### 2.1. Verificación de Email

#### Navegación:
Firebase Console → **Authentication** → **Templates**

#### Template: "Email address verification"

**Idioma: Español (ES)**

```
Asunto: Verifica tu cuenta en Esbilla CMP 🌽

Cuerpo:
Hola,

Has creado una cuenta en Esbilla CMP. Para activarla, verifica tu dirección de email haciendo clic en el siguiente enlace:

%LINK%

Si no has solicitado esta verificación, puedes ignorar este email.

Gracias,
El equipo de Esbilla CMP 🌽
https://esbilla.com
```

**Idioma: English (EN)**

```
Subject: Verify your Esbilla CMP account 🌽

Body:
Hello,

You have created an account with Esbilla CMP. To activate it, verify your email address by clicking the link below:

%LINK%

If you did not request this verification, you can ignore this email.

Thanks,
The Esbilla CMP team 🌽
https://esbilla.com
```

**Idioma: Asturianu (AST)** *(opcional)*

```
Asuntu: Verifica la to cuenta n'Esbilla CMP 🌽

Cuerpu:
Hola,

Creesti una cuenta n'Esbilla CMP. Pa activala, verifica la to direición de corréu faciendo clic nel siguiente enllaz:

%LINK%

Si nun solicitesti esta verificación, pues inorar esti corréu.

Gracies,
L'equipu d'Esbilla CMP 🌽
https://esbilla.com
```

#### Action URL:
```
https://app.esbilla.com/__/auth/action
```

**⚠️ IMPORTANTE:** Esta URL debe coincidir exactamente con la configurada en el dashboard.

---

### 2.2. Reset de Contraseña

#### Template: "Password reset"

**Idioma: Español (ES)**

```
Asunto: Restablece tu contraseña en Esbilla CMP 🌽

Cuerpo:
Hola,

Has solicitado restablecer tu contraseña de Esbilla CMP. Haz clic en el siguiente enlace para crear una nueva contraseña:

%LINK%

Si no has solicitado este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.

Gracias,
El equipo de Esbilla CMP 🌽
https://esbilla.com
```

**Idioma: English (EN)**

```
Subject: Reset your Esbilla password 🌽

Body:
Hello,

You have requested to reset your Esbilla CMP password. Click the link below to create a new password:

%LINK%

If you did not request this change, you can ignore this email. Your current password will remain valid.

Thanks,
The Esbilla CMP team 🌽
https://esbilla.com
```

#### Action URL:
```
https://app.esbilla.com/__/auth/action
```

---

### 2.3. Cambio de Email

#### Template: "Email address change"

**Idioma: Español (ES)**

```
Asunto: Confirma el cambio de email en Esbilla CMP 🌽

Cuerpo:
Hola,

Has solicitado cambiar tu dirección de email en Esbilla CMP. Haz clic en el siguiente enlace para confirmar:

%LINK%

Si no has solicitado este cambio, contacta inmediatamente con soporte en hola@esbilla.com

Gracias,
El equipo de Esbilla CMP 🌽
```

#### Action URL:
```
https://app.esbilla.com/__/auth/action
```

---

## 3. Añadir Dominios Autorizados

### Navegación:
Firebase Console → **Authentication** → **Settings** → **Authorized domains**

### Dominios a añadir:

- ✅ `app.esbilla.com` (Dashboard)
- ✅ `esbilla.com` (Landing page)
- ✅ `localhost` (Desarrollo local - ya incluido por defecto)

**Para desarrollo:**
- ✅ Tu dominio personalizado si usas uno (ej: `dev.esbilla.com`)

### Cómo añadir:

1. Hacer clic en **"Add domain"**
2. Introducir el dominio (sin `http://` ni `https://`)
3. Hacer clic en **"Add"**

---

## 4. Verificar Firestore Rules Deployed

### Navegación:
Firebase Console → **Firestore Database** → **Rules**

### Verificación:

Las rules deben incluir secciones para:
- ✅ `match /invitations/{invitationId}`
- ✅ `match /waitingList/{entryId}` (nombre correcto: `waitingList`, NO `waitlist`)
- ✅ `match /organizations/{orgId}`
- ✅ `match /users/{userId}`
- ✅ `match /sites/{siteId}`

### Deploy manual (si es necesario):

```bash
cd esbilla-cmp
firebase deploy --only firestore:rules
```

---

## 5. Variables de Entorno (Cloud Run / .env)

Estas variables son necesarias en el backend (esbilla-api) para el envío de invitaciones por email.

### Variables requeridas:

```bash
# SMTP Configuration (usar Gmail, SendGrid, o similar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@esbilla.com
SMTP_PASS=<app-password-generado>
FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>

# Frontend URL (para links en emails)
FRONTEND_URL=https://app.esbilla.com

# Firebase (ya configurado vía Service Account)
GCLOUD_PROJECT=esbilla-cmp
FIRESTORE_DATABASE_ID=esbilla-cmp
```

### ⚠️ Generar App Password en Gmail:

1. Ir a https://myaccount.google.com/security
2. Activar **"2-Step Verification"** (si no está activado)
3. Ir a **"App passwords"**
4. Crear un nuevo App Password con nombre "Esbilla CMP Invitations"
5. Copiar el password de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)
6. Usar este password en `SMTP_PASS` (sin espacios)

### Deploy en Cloud Run:

```bash
# Opción 1: Via gcloud CLI
gcloud run services update esbilla-api \
  --set-env-vars SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=noreply@esbilla.com \
  --set-env-vars SMTP_PASS=<app-password>,FROM_EMAIL="Esbilla CMP <noreply@esbilla.com>" \
  --set-env-vars FRONTEND_URL=https://app.esbilla.com

# Opción 2: Via Cloud Console
# Cloud Run → esbilla-api → Edit & Deploy New Revision → Variables & Secrets
```

---

## 6. Testing de Configuración

### Test 1: Registro con Email/Password

```bash
# Desde el navegador
1. Ir a https://app.esbilla.com/register?plan=starter
2. Rellenar formulario con email real
3. Click "Crear cuenta"
4. Verificar que llega email de verificación
5. Click en el link del email
6. Verificar redirección a /login con mensaje de éxito
```

### Test 2: Recuperación de Contraseña

```bash
1. Ir a https://app.esbilla.com/forgot-password
2. Introducir email
3. Click "Enviar enlace"
4. Verificar que llega email de reset
5. Click en el link del email
6. Introducir nueva contraseña
7. Verificar login con nueva contraseña
```

### Test 3: Invitaciones

```bash
1. Login como superadmin
2. Ir a /users
3. Click "Invitar usuario"
4. Rellenar email, organización y rol
5. Click "Enviar invitación"
6. Verificar que llega email de invitación
7. Abrir link de invitación (navegador incógnito)
8. Verificar que muestra página de aceptación
```

---

## 7. Troubleshooting

### Email de verificación no llega

**Posibles causas:**
1. Variables SMTP no configuradas → Ver logs de Cloud Run
2. App Password incorrecto → Regenerar en Google Account
3. Email bloqueado por spam → Revisar carpeta spam

**Debug:**
```bash
# Ver logs del backend
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=esbilla-api" --limit 50 --format json
```

### Error "Unauthorized" al crear invitación

**Posibles causas:**
1. Firestore rules no deployed → Verificar en Console
2. Usuario no tiene rol org_owner/org_admin → Verificar en Firestore
3. Token expirado → Logout y login de nuevo

### Action URL no funciona

**Verificar:**
1. Dominio autorizado en Firebase Auth Settings
2. Ruta exacta: `/__/auth/action` (con doble barra)
3. Página `AuthAction.tsx` existe y está en router

---

## ✅ Checklist Final

Antes de considerar Firebase configurado correctamente:

- [ ] Email/Password provider activado
- [ ] Templates de email personalizados (ES + EN)
- [ ] Action URL configurada: `https://app.esbilla.com/__/auth/action`
- [ ] Dominios autorizados: `app.esbilla.com`, `esbilla.com`
- [ ] Firestore rules deployed con `invitations` y `waitingList`
- [ ] Variables SMTP configuradas en Cloud Run
- [ ] Test de registro exitoso + email recibido
- [ ] Test de forgot password exitoso + email recibido
- [ ] Test de invitación exitoso + email recibido

---

## 📞 Soporte

Si tienes problemas con la configuración:
- GitHub Issues: https://github.com/anthropics/esbilla-cmp/issues
- Email: hola@esbilla.com
