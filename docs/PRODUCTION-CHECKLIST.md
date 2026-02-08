# 🚀 Checklist de Despliegue a Producción - Esbilla CMP

**Fecha inicio:** _________
**Completado por:** _________
**Fecha completado:** _________

---

## 📋 Estado General

- [ ] **Bloqueantes resueltos**
- [ ] **Firebase Console configurado**
- [ ] **Variables de entorno configuradas**
- [ ] **Testing E2E completado**
- [ ] **Documentación actualizada**
- [ ] **Listo para producción** ✅

---

## 1️⃣ Firebase Console - Authentication

### 1.1. Activar Email/Password
**URL:** https://console.firebase.google.com/project/esbilla-cmp/authentication/providers

- [ ] Ir a **Authentication** → **Sign-in method**
- [ ] Click en **Email/Password**
- [ ] ✅ Activar **Email/Password**
- [ ] ❌ Dejar desactivado **Email link (passwordless)**
- [ ] Click en **Save**
- [ ] **Verificación:** El provider debe aparecer como "Enabled"

**Captura de pantalla:** (Adjuntar aquí)

---

### 1.2. Configurar Templates de Email
**URL:** https://console.firebase.google.com/project/esbilla-cmp/authentication/emails

#### Template 1: Email Address Verification

**Español (ES)**
- [ ] Asunto: `Verifica tu cuenta en Esbilla CMP 🌽`
- [ ] Cuerpo:
```
Hola,

Has creado una cuenta en Esbilla CMP. Para activarla, verifica tu dirección de email haciendo clic en el siguiente enlace:

%LINK%

Si no has solicitado esta verificación, puedes ignorar este email.

Gracias,
El equipo de Esbilla CMP 🌽
https://esbilla.com
```

**English (EN)**
- [ ] Subject: `Verify your Esbilla CMP account 🌽`
- [ ] Body:
```
Hello,

You have created an account with Esbilla CMP. To activate it, verify your email address by clicking the link below:

%LINK%

If you did not request this verification, you can ignore this email.

Thanks,
The Esbilla CMP team 🌽
https://esbilla.com
```

**Action URL:** `https://app.esbilla.com/__/auth/action`
- [ ] Verificar que la URL es exactamente esta (con doble barra `__`)

---

#### Template 2: Password Reset

**Español (ES)**
- [ ] Asunto: `Restablece tu contraseña en Esbilla CMP 🌽`
- [ ] Cuerpo:
```
Hola,

Has solicitado restablecer tu contraseña de Esbilla CMP. Haz clic en el siguiente enlace para crear una nueva contraseña:

%LINK%

Si no has solicitado este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.

Gracias,
El equipo de Esbilla CMP 🌽
https://esbilla.com
```

**English (EN)**
- [ ] Subject: `Reset your Esbilla password 🌽`
- [ ] Body:
```
Hello,

You have requested to reset your Esbilla CMP password. Click the link below to create a new password:

%LINK%

If you did not request this change, you can ignore this email. Your current password will remain valid.

Thanks,
The Esbilla CMP team 🌽
https://esbilla.com
```

**Action URL:** `https://app.esbilla.com/__/auth/action`
- [ ] Verificar que la URL es exactamente esta

---

#### Template 3: Email Address Change

**Español (ES)**
- [ ] Asunto: `Confirma el cambio de email en Esbilla CMP 🌽`
- [ ] Cuerpo:
```
Hola,

Has solicitado cambiar tu dirección de email en Esbilla CMP. Haz clic en el siguiente enlace para confirmar:

%LINK%

Si no has solicitado este cambio, contacta inmediatamente con soporte en hola@esbilla.com

Gracias,
El equipo de Esbilla CMP 🌽
```

**Action URL:** `https://app.esbilla.com/__/auth/action`
- [ ] Verificar que la URL es exactamente esta

**Captura de pantalla:** (Adjuntar aquí)

---

### 1.3. Añadir Dominios Autorizados
**URL:** https://console.firebase.google.com/project/esbilla-cmp/authentication/settings

- [ ] Ir a **Authentication** → **Settings** → **Authorized domains**
- [ ] Click en **Add domain**
- [ ] Añadir: `app.esbilla.com`
- [ ] Añadir: `esbilla.com`
- [ ] ✅ Verificar que `localhost` ya está incluido (para desarrollo)

**Lista final:**
- [x] localhost (pre-existente)
- [ ] app.esbilla.com
- [ ] esbilla.com

**Captura de pantalla:** (Adjuntar aquí)

---

## 2️⃣ Configurar SMTP para Invitaciones

### 2.1. Generar App Password de Gmail

**URL:** https://myaccount.google.com/security

- [ ] Activar **2-Step Verification** (si no está activado)
- [ ] Ir a **App passwords**
- [ ] Crear nuevo App Password con nombre: `Esbilla CMP Invitations`
- [ ] Copiar el password de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)
- [ ] Guardar el password de forma segura (se usará en el siguiente paso)

⚠️ **IMPORTANTE:** El password solo se muestra una vez. Guárdalo en tu gestor de contraseñas.

**Captura de pantalla:** (Adjuntar aquí)

---

### 2.2. Configurar Variables en Cloud Run

**Método A: Via Cloud Console** (Recomendado)

**URL:** https://console.cloud.google.com/run/detail/europe-west4/esbilla-api/edit

- [ ] Ir a Cloud Run → **esbilla-api**
- [ ] Click en **Edit & Deploy New Revision**
- [ ] Scroll hasta **Variables & Secrets**
- [ ] Añadir las siguientes variables:

| Variable | Valor | Verificado |
|----------|-------|-----------|
| `SMTP_HOST` | `smtp.gmail.com` | [ ] |
| `SMTP_PORT` | `587` | [ ] |
| `SMTP_USER` | `noreply@esbilla.com` | [ ] |
| `SMTP_PASS` | `[App Password sin espacios]` | [ ] |
| `FROM_EMAIL` | `Esbilla CMP <noreply@esbilla.com>` | [ ] |
| `FRONTEND_URL` | `https://app.esbilla.com` | [ ] |

- [ ] Click en **Deploy**
- [ ] Esperar que el deployment complete (2-3 minutos)

**Captura de pantalla:** (Adjuntar aquí)

---

**Método B: Via gcloud CLI** (Alternativo)

```bash
gcloud run services update esbilla-api \
  --region europe-west4 \
  --set-env-vars SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=noreply@esbilla.com \
  --set-env-vars SMTP_PASS=[tu-app-password],FROM_EMAIL="Esbilla CMP <noreply@esbilla.com>" \
  --set-env-vars FRONTEND_URL=https://app.esbilla.com
```

---

## 3️⃣ Verificar Firestore Rules

### 3.1. Deploy de Rules

- [ ] Abrir terminal en el proyecto
- [ ] Ejecutar:
```bash
cd c:\jlasolis\esbilla-cmp
firebase deploy --only firestore:rules
```

- [ ] Verificar que el output muestra: `✔  Deploy complete!`

**Output esperado:**
```
=== Deploying to 'esbilla-cmp'...

i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to esbilla-cmp

✔  Deploy complete!
```

---

### 3.2. Verificar en Console

**URL:** https://console.firebase.google.com/project/esbilla-cmp/firestore/rules

- [ ] Ir a **Firestore Database** → **Rules**
- [ ] Verificar que las rules incluyen:
  - [ ] `match /invitations/{invitationId}`
  - [ ] `match /waitingList/{entryId}`
  - [ ] `match /organizations/{orgId}`
  - [ ] `match /users/{userId}`
  - [ ] `match /sites/{siteId}`
  - [ ] `function hasDistributorAccess(orgId)`
  - [ ] `function hasAnyOrgAccess(orgId)`

**Captura de pantalla:** (Adjuntar aquí)

---

## 4️⃣ Deploy de Aplicaciones

### 4.1. Deploy API + Dashboard (Cloud Run)

**NOTA:** El deploy se activa automáticamente via GitHub Actions al hacer push a `main`.

**URL GitHub Actions:** https://github.com/[tu-repo]/esbilla-cmp/actions

- [ ] Verificar que el último workflow corrió exitosamente
- [ ] Verificar que la imagen se construyó correctamente
- [ ] Verificar que Cloud Run está sirviendo la nueva versión

**Verificar versión:**
```bash
curl https://esbilla-api-[hash].run.app/api/health
```

Output esperado:
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T...",
  "version": "2.1.0"
}
```

---

### 4.2. Deploy Landing Page (Firebase Hosting)

**NOTA:** El deploy se activa automáticamente via GitHub Actions al hacer push a `main`.

- [ ] Verificar que el workflow `deploy-public` corrió exitosamente
- [ ] Acceder a https://esbilla.com y verificar que carga correctamente
- [ ] Verificar que todos los idiomas funcionan (ES, EN, AST, etc.)

---

## 5️⃣ Testing End-to-End

### Test 1: Registro con Email/Password

- [ ] **Paso 1:** Ir a https://esbilla.com/es/saas
- [ ] **Paso 2:** Click en "Empezar" con plan **Starter** → Redirige a `app.esbilla.com/register?plan=starter`
- [ ] **Paso 3:** Rellenar formulario:
  - Nombre: `Test Usuario`
  - Email: `test+registro@esbilla.com`
  - Password: `TestPass123!`
  - Confirmar password: `TestPass123!`
  - [x] Aceptar términos
- [ ] **Paso 4:** Click "Crear cuenta"
- [ ] **Paso 5:** Verificar redirección a `/verify-email`
- [ ] **Paso 6:** Abrir email en `test+registro@esbilla.com`
- [ ] **Paso 7:** Verificar que llega email con asunto "Verifica tu cuenta en Esbilla CMP 🌽"
- [ ] **Paso 8:** Click en el enlace del email
- [ ] **Paso 9:** Verificar redirección a `/login?verified=true`
- [ ] **Paso 10:** Login con credenciales
- [ ] **Paso 11:** Verificar que aparece wizard de onboarding `/onboarding/setup`
- [ ] **Paso 12:** Completar wizard:
  - Organización: `Test Org SL`
  - Sitio: `www.test-example.com`
- [ ] **Paso 13:** Verificar que crea organización en Firestore
- [ ] **Paso 14:** Verificar que crea sitio en Firestore
- [ ] **Paso 15:** Verificar que crea usuario en Firestore con `orgAccess`
- [ ] **Paso 16:** Verificar redirección final a `/dashboard`

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _____________________________

---

### Test 2: Login con Google SSO

- [ ] **Paso 1:** Ir a https://app.esbilla.com/login
- [ ] **Paso 2:** Click "Continuar con Google"
- [ ] **Paso 3:** Seleccionar cuenta Google
- [ ] **Paso 4:** Si es primer login → debe ir a wizard onboarding
- [ ] **Paso 5:** Si ya completó onboarding → dashboard directo
- [ ] **Paso 6:** Verificar que `lastLogin` se actualiza en Firestore

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _____________________________

---

### Test 3: Recuperación de Contraseña

- [ ] **Paso 1:** Ir a https://app.esbilla.com/login
- [ ] **Paso 2:** Click "¿Olvidaste tu contraseña?"
- [ ] **Paso 3:** Introducir email: `test+registro@esbilla.com`
- [ ] **Paso 4:** Click "Enviar enlace"
- [ ] **Paso 5:** Verificar mensaje genérico (no revela si email existe)
- [ ] **Paso 6:** Abrir email en `test+registro@esbilla.com`
- [ ] **Paso 7:** Verificar que llega email con asunto "Restablece tu contraseña en Esbilla CMP 🌽"
- [ ] **Paso 8:** Click en el enlace del email
- [ ] **Paso 9:** Introducir nueva contraseña: `NewTestPass456!`
- [ ] **Paso 10:** Confirmar contraseña: `NewTestPass456!`
- [ ] **Paso 11:** Click "Restablecer contraseña"
- [ ] **Paso 12:** Verificar redirección a `/login?reset=true`
- [ ] **Paso 13:** Login con nueva contraseña
- [ ] **Paso 14:** Verificar acceso al dashboard

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _____________________________

---

### Test 4: Invitación a Organización

- [ ] **Paso 1:** Login como org_owner (`test+registro@esbilla.com`)
- [ ] **Paso 2:** Ir a `/users`
- [ ] **Paso 3:** Click "Invitar usuario"
- [ ] **Paso 4:** Rellenar formulario:
  - Email: `test+invitado@esbilla.com`
  - Tipo: `Organización`
  - Organización: Seleccionar `Test Org SL`
  - Rol: `org_admin`
- [ ] **Paso 5:** Click "Enviar invitación"
- [ ] **Paso 6:** Verificar que se crea documento en Firestore `invitations/`
- [ ] **Paso 7:** Abrir email en `test+invitado@esbilla.com`
- [ ] **Paso 8:** Verificar que llega email de invitación
- [ ] **Paso 9:** Click en el enlace del email
- [ ] **Paso 10:** Página `/invite/{id}` muestra datos de invitación correctamente
- [ ] **Paso 11:** Click "Crear cuenta y aceptar"
- [ ] **Paso 12:** Rellenar formulario de registro
- [ ] **Paso 13:** Verificar email
- [ ] **Paso 14:** Login
- [ ] **Paso 15:** Verificar que invitación se aplica automáticamente
- [ ] **Paso 16:** Verificar documento `users/{uid}` tiene `orgAccess` con rol `org_admin`
- [ ] **Paso 17:** Verificar invitación tiene `status: 'accepted'`
- [ ] **Paso 18:** Verificar acceso al dashboard con permisos correctos

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _____________________________

---

### Test 5: Panoya Personalizada

- [ ] **Paso 1:** Login como org_owner
- [ ] **Paso 2:** Ir a `/settings`
- [ ] **Paso 3:** Scroll hasta "Personalización de Panoya"
- [ ] **Paso 4:** Cambiar variante a "Minimalista"
- [ ] **Paso 5:** Cambiar colores:
  - Primario: `#FF5733`
  - Secundario: `#C70039`
  - Acento: `#900C3F`
- [ ] **Paso 6:** Click "Guardar cambios"
- [ ] **Paso 7:** Abrir sitio web con el banner en navegador incógnito
- [ ] **Paso 8:** Hacer hard refresh (Ctrl+Shift+R)
- [ ] **Paso 9:** Abrir consola del navegador
- [ ] **Paso 10:** Buscar log: `[Esbilla] Generando Panoya: { variant: 'minimalista', colors: {...} }`
- [ ] **Paso 11:** Verificar que el banner muestra la variante minimalista
- [ ] **Paso 12:** Verificar que los colores coinciden con los configurados

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _____________________________

---

### Test 6: Distribuidores (Superadmin Only)

- [ ] **Paso 1:** Login como superadmin
- [ ] **Paso 2:** Verificar que aparece enlace "Distribuidores" en sidebar
- [ ] **Paso 3:** Click en "Distribuidores"
- [ ] **Paso 4:** Verificar que carga página `/distributors`
- [ ] **Paso 5:** Buscar un usuario
- [ ] **Paso 6:** Click "Asignar Organización"
- [ ] **Paso 7:** Seleccionar organización y rol
- [ ] **Paso 8:** Añadir notas
- [ ] **Paso 9:** Click "Asignar"
- [ ] **Paso 10:** Verificar que se actualiza Firestore `users/{uid}.distributorAccess`
- [ ] **Paso 11:** Logout y login como el distribuidor
- [ ] **Paso 12:** Verificar acceso a la organización asignada
- [ ] **Paso 13:** Verificar permisos según el rol asignado

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _____________________________

---

## 6️⃣ Verificaciones de Seguridad

### 6.1. Firestore Rules

- [ ] Probar escribir en `users/` sin auth → debe fallar (403)
- [ ] Probar leer org sin acceso → debe fallar (403)
- [ ] Probar crear invitación sin permisos → debe fallar (403)
- [ ] Probar editar site sin permisos → debe fallar (403)

**Resultado:** ✅ PASS / ❌ FAIL

---

### 6.2. API Endpoints

- [ ] Probar `/api/consent/log` sin dominio válido → debe fallar (403)
- [ ] Probar `/api/consent/log` excediendo rate limit → debe fallar (429)
- [ ] Probar `/api/config/:id` sin cache → debe retornar config fresca

**Resultado:** ✅ PASS / ❌ FAIL

---

## 7️⃣ Monitorización Post-Deploy

### 7.1. Cloud Run Logs

**URL:** https://console.cloud.google.com/run/detail/europe-west4/esbilla-api/logs

- [ ] Verificar que no hay errores 500
- [ ] Verificar que no hay rate limit excesivo
- [ ] Verificar que las invitaciones se envían correctamente

---

### 7.2. Firebase Console

**Authentication:**
- [ ] Verificar que se crean usuarios correctamente
- [ ] Verificar que email verification funciona

**Firestore:**
- [ ] Verificar que se crean documentos correctamente
- [ ] Verificar que no hay operaciones fallidas

---

## 8️⃣ Rollback Plan

Si algo sale mal:

1. **Revertir Cloud Run:**
```bash
gcloud run services update esbilla-api \
  --region europe-west4 \
  --image gcr.io/esbilla-cmp/esbilla-api:[previous-tag]
```

2. **Revertir Firestore Rules:**
```bash
firebase deploy --only firestore:rules --config firebase.backup.json
```

3. **Revertir Landing:**
```bash
firebase hosting:rollback
```

---

## ✅ Sign-Off Final

### Pre-Launch
- [ ] Todos los tests E2E pasaron
- [ ] No hay errores en logs
- [ ] Variables de entorno configuradas
- [ ] Backups creados
- [ ] Equipo notificado

### Post-Launch
- [ ] Monitorizar por 24 horas
- [ ] Verificar emails de usuarios reales
- [ ] Verificar métricas de conversión
- [ ] Documentar lecciones aprendidas

---

**Firmado por:** _____________________________
**Fecha:** _____________________________
**Hora:** _____________________________

🌽 **Esbilla CMP - Production Ready!**
