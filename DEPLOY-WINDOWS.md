# 🚀 Guía de Despliegue a Producción - Windows

**Sistema Operativo:** Windows 10/11
**Shell:** PowerShell 5.1+
**Tiempo estimado:** 45-60 minutos

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener instalado:

- [x] **Node.js 18+** - https://nodejs.org/
- [x] **Git** - https://git-scm.com/
- [ ] **Firebase CLI** - Instalar con: `npm install -g firebase-tools`
- [ ] **Google Cloud SDK** (Opcional) - https://cloud.google.com/sdk/docs/install

---

## 1️⃣ Verificación Pre-Deploy (5 minutos)

Abre **PowerShell** y ejecuta:

```powershell
cd c:\jlasolis\esbilla-cmp
.\scripts\pre-deploy-check.ps1
```

**Output esperado:**
```
✅ TODO CORRECTO - Listo para desplegar
```

Si hay errores, el script te dirá exactamente qué falta.

### Solución de Problemas Comunes

#### Error: "no se puede ejecutar porque la ejecución de scripts está deshabilitada"
```powershell
# Permitir ejecución de scripts (solo una vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Error: "Firebase CLI NO instalado"
```powershell
npm install -g firebase-tools
firebase login
```

#### Error: "gcloud CLI NO instalado"
Descargar de: https://cloud.google.com/sdk/docs/install#windows

---

## 2️⃣ Configurar Firebase Console (15-20 minutos)

### A. Activar Email/Password Authentication

**URL:** https://console.firebase.google.com/project/esbilla-cmp/authentication/providers

1. Click en **Authentication** → **Sign-in method**
2. Click en **Email/Password**
3. ✅ Activar **Email/Password**
4. ❌ Dejar desactivado **Email link**
5. Click **Save**

**Verificar:** El provider debe aparecer como "Enabled" ✅

---

### B. Configurar Templates de Email

**URL:** https://console.firebase.google.com/project/esbilla-cmp/authentication/emails

#### Template 1: Email Verification

1. Click en **Email address verification**
2. Configurar para **Español:**
   - **Asunto:** `Verifica tu cuenta en Esbilla CMP 🌽`
   - **Cuerpo:**
   ```
   Hola,

   Has creado una cuenta en Esbilla CMP. Para activarla, verifica tu dirección de email haciendo clic en el siguiente enlace:

   %LINK%

   Si no has solicitado esta verificación, puedes ignorar este email.

   Gracias,
   El equipo de Esbilla CMP 🌽
   https://esbilla.com
   ```

3. **Action URL:** `https://app.esbilla.com/__/auth/action`
   - ⚠️ **IMPORTANTE:** Con doble barra `__`

4. (Opcional) Configurar también para **English**
5. Click **Save**

---

#### Template 2: Password Reset

1. Click en **Password reset**
2. Configurar para **Español:**
   - **Asunto:** `Restablece tu contraseña en Esbilla CMP 🌽`
   - **Cuerpo:**
   ```
   Hola,

   Has solicitado restablecer tu contraseña de Esbilla CMP. Haz clic en el siguiente enlace para crear una nueva contraseña:

   %LINK%

   Si no has solicitado este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.

   Gracias,
   El equipo de Esbilla CMP 🌽
   https://esbilla.com
   ```

3. **Action URL:** `https://app.esbilla.com/__/auth/action`
4. Click **Save**

---

#### Template 3: Email Change

1. Click en **Email address change**
2. Configurar para **Español:**
   - **Asunto:** `Confirma el cambio de email en Esbilla CMP 🌽`
   - **Cuerpo:**
   ```
   Hola,

   Has solicitado cambiar tu dirección de email en Esbilla CMP. Haz clic en el siguiente enlace para confirmar:

   %LINK%

   Si no has solicitado este cambio, contacta inmediatamente con soporte en hola@esbilla.com

   Gracias,
   El equipo de Esbilla CMP 🌽
   ```

3. **Action URL:** `https://app.esbilla.com/__/auth/action`
4. Click **Save**

---

### C. Añadir Dominios Autorizados

**URL:** https://console.firebase.google.com/project/esbilla-cmp/authentication/settings

1. Click en **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Añadir: `app.esbilla.com`
4. Click **Add domain** de nuevo
5. Añadir: `esbilla.com`

**Lista final:**
- [x] localhost (pre-existente)
- [ ] app.esbilla.com
- [ ] esbilla.com

---

## 3️⃣ Configurar SMTP (10 minutos)

### A. Generar App Password de Gmail

**URL:** https://myaccount.google.com/security

1. Activar **2-Step Verification** (si no está activado)
2. Ir a **App passwords**
3. Crear nuevo App Password:
   - **App name:** `Esbilla CMP Invitations`
4. **Copiar** el password de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)
5. **Guardar** en tu gestor de contraseñas (¡solo se muestra una vez!)

---

### B. Configurar Variables en Cloud Run

**URL:** https://console.cloud.google.com/run/detail/europe-west4/esbilla-api/edit

1. Click en **Edit & Deploy New Revision**
2. Scroll hasta **Variables & Secrets**
3. Click **Add variable** para cada una:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `SMTP_HOST` | `smtp.gmail.com` | - |
| `SMTP_PORT` | `587` | - |
| `SMTP_USER` | `noreply@esbilla.com` | Tu email |
| `SMTP_PASS` | `[App Password]` | **SIN espacios** |
| `FROM_EMAIL` | `Esbilla CMP <noreply@esbilla.com>` | Con < > |
| `FRONTEND_URL` | `https://app.esbilla.com` | - |

4. Click **Deploy**
5. Esperar 2-3 minutos a que complete

**Verificar:** El servicio debe estar en "Serving" (verde) ✅

---

## 4️⃣ Deploy Firestore Rules (2 minutos)

En **PowerShell:**

```powershell
cd c:\jlasolis\esbilla-cmp
firebase deploy --only firestore:rules
```

**Output esperado:**
```
=== Deploying to 'esbilla-cmp'...

i  deploying firestore
✔  firestore: rules file compiled successfully
✔  firestore: released rules to esbilla-cmp

✔  Deploy complete!
```

---

## 5️⃣ Verificar Deploy Automático (5 minutos)

El deploy del código se hace automáticamente via GitHub Actions.

### Verificar en GitHub

**URL:** https://github.com/[tu-usuario]/esbilla-cmp/actions

1. Verificar que el último workflow corrió exitosamente ✅
2. Verificar que ambos jobs completaron:
   - `deploy-public` (Landing page)
   - `deploy-api` (API + Dashboard)

### Verificar Cloud Run

**URL:** https://console.cloud.google.com/run/detail/europe-west4/esbilla-api

1. Verificar que el servicio está en "Serving" (verde) ✅
2. Click en la URL del servicio
3. Añadir `/api/health` al final
4. Verificar respuesta JSON:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-02-06T...",
     "version": "2.1.0"
   }
   ```

### Verificar Landing Page

1. Ir a https://esbilla.com
2. Verificar que carga correctamente
3. Verificar que los idiomas funcionan (ES, EN, AST)

---

## 6️⃣ Testing E2E (30-45 minutos)

Usa el checklist completo en [PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md)

### Tests Críticos (mínimo)

#### ✅ Test 1: Registro con Email/Password

1. Ir a https://esbilla.com/es/saas
2. Click "Empezar" con plan Starter
3. Rellenar formulario de registro
4. Verificar email de verificación
5. Click en enlace del email
6. Completar onboarding wizard
7. Verificar acceso al dashboard

**Tiempo:** ~10 minutos
**Resultado esperado:** Dashboard accesible con organización y sitio creados

---

#### ✅ Test 2: Recuperación de Contraseña

1. Ir a https://app.esbilla.com/login
2. Click "¿Olvidaste tu contraseña?"
3. Introducir email
4. Verificar email de reset
5. Click en enlace del email
6. Introducir nueva contraseña
7. Login con nueva contraseña

**Tiempo:** ~5 minutos
**Resultado esperado:** Login exitoso con nueva contraseña

---

#### ✅ Test 3: Invitación a Organización

1. Login como org_owner
2. Ir a `/users`
3. Click "Invitar usuario"
4. Rellenar formulario
5. Verificar email de invitación
6. Abrir enlace en navegador incógnito
7. Crear cuenta y aceptar invitación
8. Verificar acceso a la organización

**Tiempo:** ~10 minutos
**Resultado esperado:** Usuario invitado tiene acceso con rol correcto

---

#### ✅ Test 4: Panoya Personalizada

1. Login como org_owner
2. Ir a `/settings`
3. Cambiar variante de Panoya
4. Cambiar colores personalizados
5. Guardar cambios
6. Abrir sitio web con banner (Ctrl+Shift+R para hard refresh)
7. Verificar en consola: `[Esbilla] Generando Panoya: { variant: '...', colors: {...} }`

**Tiempo:** ~5 minutos
**Resultado esperado:** Banner muestra nueva variante y colores

---

## 7️⃣ Monitorización Post-Deploy

### Ver Logs de Cloud Run

**PowerShell:**
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=esbilla-api" --limit 50 --format json | Out-File -Encoding utf8 logs.json
```

O desde la consola:
**URL:** https://console.cloud.google.com/run/detail/europe-west4/esbilla-api/logs

### Verificar Firestore

**URL:** https://console.firebase.google.com/project/esbilla-cmp/firestore

1. Verificar que se crean documentos en `users`
2. Verificar que se crean documentos en `organizations`
3. Verificar que se crean documentos en `sites`
4. Verificar que se crean documentos en `invitations`

---

## 8️⃣ Rollback (si algo sale mal)

### Revertir Cloud Run

**PowerShell:**
```powershell
# Ver revisiones anteriores
gcloud run revisions list --service=esbilla-api --region=europe-west4

# Revertir a revisión anterior
gcloud run services update-traffic esbilla-api --region=europe-west4 --to-revisions=[REVISION-NAME]=100
```

### Revertir Firestore Rules

**PowerShell:**
```powershell
# Si tienes backup
firebase deploy --only firestore:rules --config firebase.backup.json
```

### Revertir Landing Page

**PowerShell:**
```powershell
firebase hosting:rollback
```

---

## ✅ Checklist Final

Antes de dar por completado el deploy:

- [ ] Script de verificación pasó sin errores
- [ ] Firebase Console configurado (Auth + Templates + Dominios)
- [ ] SMTP configurado en Cloud Run
- [ ] Firestore rules deployed
- [ ] GitHub Actions workflows exitosos
- [ ] Cloud Run serving correctamente
- [ ] Landing page cargando
- [ ] Test de registro pasó
- [ ] Test de recovery pasó
- [ ] Test de invitación pasó
- [ ] Test de Panoya pasó
- [ ] Logs sin errores críticos
- [ ] Firestore creando documentos correctamente

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

#### 1. Email de verificación no llega

**Verificar:**
- Variables SMTP configuradas en Cloud Run
- Logs de Cloud Run: buscar "SMTP" o "email"
- Carpeta de spam

**Solución:**
```powershell
# Ver logs con filtro
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=esbilla-api AND textPayload=~'email'" --limit 20
```

---

#### 2. Error 403 en Firestore

**Causa:** Rules no deployed o incorrectas

**Solución:**
```powershell
firebase deploy --only firestore:rules
```

---

#### 3. Panoya no se actualiza

**Causa:** Cache del navegador

**Solución:**
1. Hard refresh: `Ctrl + Shift + R`
2. O abrir en navegador incógnito
3. Verificar en consola que config no tiene cache

---

#### 4. Cloud Run no arranca

**Verificar:**
```powershell
gcloud run services describe esbilla-api --region=europe-west4
```

**Solución:** Ver logs para error específico

---

### Contacto

Si necesitas ayuda adicional:
- **Email:** hola@esbilla.com
- **Docs:** [FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md)
- **Checklist:** [PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md)

---

## 🎉 ¡Listo!

Si todos los tests pasaron, **¡Esbilla CMP está en producción!** 🌽

**Próximos pasos:**
1. Monitorizar por 24-48 horas
2. Verificar emails de usuarios reales
3. Revisar métricas de conversión
4. Completar sistema de distribuidores (si necesario)

---

**¿Algo salió mal?** Ejecuta el rollback y revisa los logs. No te preocupes, siempre puedes volver atrás. 💪
