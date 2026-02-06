# Configuración de Firebase Authentication

Guía para configurar Firebase Authentication con soporte de Email/Password y Google SSO para Esbilla CMP Dashboard.

## 📋 Requisitos Previos

- Acceso a [Firebase Console](https://console.firebase.google.com/)
- Proyecto: `esbilla-cmp`
- Permisos de administrador en el proyecto

---

## 1. Habilitar Email/Password Authentication

### Paso 1: Acceder a Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `esbilla-cmp`
3. En el menú lateral, haz clic en **Authentication**
4. Ve a la pestaña **Sign-in method**

### Paso 2: Activar Email/Password

1. En la lista de proveedores, busca **Email/Password**
2. Haz clic para expandir
3. Activa el toggle **Enable**
4. **NO actives** "Email link (passwordless sign-in)" por ahora
5. Haz clic en **Save**

### Paso 3: Verificar Google SSO

1. En la misma lista, verifica que **Google** esté habilitado
2. Si no está habilitado, actívalo:
   - Nombre público del proyecto: `Esbilla CMP`
   - Email de soporte: `soporte@esbilla.com`

---

## 2. Configurar Dominios Autorizados

### Paso 1: Añadir Dominios

1. En **Authentication**, ve a **Settings** → **Authorized domains**
2. Añade los siguientes dominios:
   - `app.esbilla.com` (producción)
   - `esbilla.com` (landing page)
   - `localhost` (ya debería estar)
   - Cualquier otro dominio de desarrollo si es necesario

### Paso 2: Verificar Dominios

Asegúrate de que estos dominios estén listados:
- ✅ `localhost`
- ✅ `app.esbilla.com`
- ✅ `esbilla.com`

---

## 3. Configurar Templates de Email

Firebase envía emails automáticos para verificación y reset de contraseña. Vamos a personalizarlos con la marca Esbilla.

### Paso 1: Email de Verificación

1. En **Authentication**, ve a **Templates**
2. Selecciona **Email address verification**
3. Personaliza el template:

**Asunto (Español):**
```
Verifica tu cuenta en Esbilla CMP 🌽
```

**Asunto (English):**
```
Verify your Esbilla CMP account 🌽
```

**Mensaje:**
```html
<p>Hola %DISPLAY_NAME%,</p>

<p>Gracias por registrarte en Esbilla CMP, la plataforma de gestión de consentimiento de cookies diseñada en Asturias.</p>

<p>Para completar tu registro y acceder al panel de control, verifica tu dirección de email haciendo clic en el siguiente enlace:</p>

<p><a href="%LINK%">Verificar mi email</a></p>

<p>Si no creaste una cuenta en Esbilla CMP, puedes ignorar este email.</p>

<p>Un cordial saludo,<br>
El equipo de Esbilla CMP 🌽</p>

<hr>

<p style="font-size: 0.85em; color: #666;">
Esbilla CMP — Consent management made in Asturias<br>
<a href="https://esbilla.com">esbilla.com</a> | <a href="mailto:soporte@esbilla.com">soporte@esbilla.com</a>
</p>
```

4. **Action URL:** Debería ser `https://app.esbilla.com/__/auth/action` (Firebase lo configura automáticamente)

5. Haz clic en **Save**

### Paso 2: Reset de Contraseña

1. Selecciona **Password reset**
2. Personaliza el template:

**Asunto (Español):**
```
Restablece tu contraseña en Esbilla 🌽
```

**Asunto (English):**
```
Reset your Esbilla password 🌽
```

**Mensaje:**
```html
<p>Hola %DISPLAY_NAME%,</p>

<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Esbilla CMP.</p>

<p>Para crear una nueva contraseña, haz clic en el siguiente enlace:</p>

<p><a href="%LINK%">Restablecer contraseña</a></p>

<p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>

<p>Un cordial saludo,<br>
El equipo de Esbilla CMP 🌽</p>

<hr>

<p style="font-size: 0.85em; color: #666;">
Esbilla CMP — Consent management made in Asturias<br>
<a href="https://esbilla.com">esbilla.com</a> | <a href="mailto:soporte@esbilla.com">soporte@esbilla.com</a>
</p>
```

3. **Action URL:** `https://app.esbilla.com/__/auth/action`

4. Haz clic en **Save**

### Paso 3: Personalizar "From" Address (Opcional)

Por defecto, Firebase envía desde `noreply@esbilla-cmp.firebaseapp.com`.

Para usar un dominio personalizado:
1. Ve a **Authentication** → **Templates** → **SMTP settings**
2. Configura SMTP con tu proveedor (Gmail, SendGrid, etc.)
3. From email: `noreply@esbilla.com`
4. From name: `Esbilla CMP`

**Nota:** Esto requiere configurar SPF/DKIM en tu dominio.

---

## 4. Configurar Variables de Entorno

### Dashboard (.env)

Asegúrate de que el dashboard tiene estas variables configuradas:

```bash
# Firebase Config (ya existe)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=esbilla-cmp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esbilla-cmp
VITE_FIREBASE_STORAGE_BUCKET=esbilla-cmp.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Modo de operación (NUEVO)
VITE_ESBILLA_MODE=saas    # "saas" o "selfhosted"
```

### API (.env)

Para el sistema de invitaciones por email (Fase 4 del plan):

```bash
# SMTP Configuration (para Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@esbilla.com
SMTP_PASS=your-app-password-here
FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>
FRONTEND_URL=https://app.esbilla.com

# Modo de operación
ESBILLA_MODE=saas    # "saas" o "selfhosted"
```

---

## 5. Probar la Configuración

### Test 1: Registro con Email/Password

1. Ve a `http://localhost:5173/register` (o la URL de desarrollo)
2. Rellena el formulario con un email de prueba
3. Haz clic en "Crear cuenta"
4. Verifica que:
   - ✅ El usuario se crea en Firebase Authentication
   - ✅ Recibes el email de verificación
   - ✅ El email tiene la marca Esbilla
   - ✅ El enlace funciona

### Test 2: Verificación de Email

1. Abre el email de verificación
2. Haz clic en el enlace
3. Verifica que:
   - ✅ Te redirige a `/login?verified=true`
   - ✅ El usuario aparece como "verified" en Firebase Console

### Test 3: Reset de Contraseña

1. Ve a `/forgot-password`
2. Introduce un email registrado
3. Haz clic en "Enviar enlace"
4. Verifica que:
   - ✅ Recibes el email de reset
   - ✅ El email tiene la marca Esbilla
   - ✅ El enlace te lleva a `/reset-password`
   - ✅ Puedes establecer una nueva contraseña

### Test 4: Login con Google

1. Ve a `/login`
2. Haz clic en "Continuar con Google"
3. Selecciona una cuenta Google
4. Verifica que:
   - ✅ El login funciona
   - ✅ No requiere verificación de email (Google ya lo verifica)
   - ✅ Se crea/actualiza el documento en Firestore `users/`

---

## 6. Seguridad

### Rate Limiting

Firebase Auth tiene rate limiting por defecto:
- **10 intentos/hora** por IP para login
- **5 emails/hora** por usuario para verificación/reset

### Monitoreo

Ve a **Authentication** → **Usage** para monitorear:
- Usuarios activos
- Intentos de login
- Emails enviados
- Errores

### Alertas

Configura alertas en Firebase Console:
1. Ve a **Authentication** → **Settings** → **Monitoring**
2. Activa alertas para:
   - Picos inusuales de registros
   - Intentos de login fallidos
   - Emails rebotados

---

## 7. Troubleshooting

### "Email already in use"

Si un usuario intenta registrarse con un email ya existente:
- Firebase retorna error `auth/email-already-in-use`
- El dashboard muestra: "Este email ya está registrado"

### "Too many attempts"

Si un usuario intenta login muchas veces:
- Firebase bloquea temporalmente la IP
- Mostrar: "Demasiados intentos. Inténtalo más tarde."

### "Email not verified"

Si un usuario intenta login sin verificar:
- `user.emailVerified === false`
- Redirigir a `/verify-email`
- Permitir reenviar email

### Enlaces de verificación expirados

Los enlaces de Firebase expiran después de **1 hora**.

Si un enlace expiró:
- Firebase retorna error `auth/invalid-action-code`
- Permitir al usuario solicitar un nuevo email

---

## 8. Modo Self-Hosted

En modo `selfhosted`, el primer usuario que se registre debe ser promovido automáticamente a `superadmin`.

**Lógica en AuthContext.tsx:**

```typescript
// Al crear el primer usuario
const usersSnapshot = await getDocs(collection(db, 'users'));

if (usersSnapshot.empty) {
  // Es el primer usuario → superadmin
  userData.globalRole = 'superadmin';
} else {
  // No es el primero → pending (requiere invitación)
  userData.globalRole = 'pending';
}
```

---

## ✅ Checklist Final

Antes de pasar a producción, verifica:

- [ ] Email/Password habilitado en Firebase Console
- [ ] Google SSO habilitado en Firebase Console
- [ ] Dominios autorizados: `app.esbilla.com`, `esbilla.com`
- [ ] Templates de email personalizados con marca Esbilla
- [ ] Action URL: `https://app.esbilla.com/__/auth/action`
- [ ] Variables de entorno configuradas (VITE_ESBILLA_MODE, SMTP)
- [ ] Tests de registro, verificación, reset completados
- [ ] Monitoreo y alertas configurados
- [ ] Rate limiting verificado

---

**Siguiente paso:** Implementar AuthContext.tsx con los métodos de email/password (Sprint 2).
