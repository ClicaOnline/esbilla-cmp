# Sprint 5: Checklist de Verificación y Pulido

## 🧪 Testing

### Backend Tests
- [x] Tests unitarios creados (`invitations.test.js`)
- [ ] Tests E2E con Firebase Emulator
- [ ] Tests de email service
- [ ] Tests de validación de permisos

### Frontend Tests
- [ ] Tests de AcceptInvite.tsx
- [ ] Tests de modal de invitación en Users.tsx
- [ ] Tests de routing de invitaciones

### Manual Testing
- [ ] Flujo completo de invitación (send → email → accept)
- [ ] Error handling (invitación expirada, email incorrecto)
- [ ] Permisos (solo org_owner/org_admin pueden invitar)
- [ ] Multi-idioma (ES, EN, AST)

---

## 📱 Responsive Design

### Páginas de Auth
- [ ] Login.tsx - Mobile/Tablet/Desktop
- [ ] Register.tsx - Mobile/Tablet/Desktop
- [ ] VerifyEmail.tsx - Mobile/Tablet/Desktop
- [ ] ForgotPassword.tsx - Mobile/Tablet/Desktop
- [ ] AuthAction.tsx - Mobile/Tablet/Desktop
- [ ] AcceptInvite.tsx - Mobile/Tablet/Desktop
- [ ] OnboardingSetup.tsx - Mobile/Tablet/Desktop
- [ ] PendingApproval.tsx - Mobile/Tablet/Desktop

### Dashboard
- [ ] Users.tsx - Modal de invitación en mobile

---

## 🌍 Internacionalización

### Traducciones Completas
- [x] types.ts - Definiciones de tipos
- [x] es.ts - Español (completo)
- [x] ast.ts - Asturianu (completo)
- [x] en.ts - English (completo)

### Keys Verificadas
- [x] auth.invitation.* (13 keys)
- [x] auth.login.* (9 keys)
- [x] auth.register.* (11 keys)
- [x] auth.verifyEmail.* (8 keys)
- [x] auth.forgotPassword.* (5 keys)
- [x] auth.resetPassword.* (7 keys)
- [x] auth.pending.* (4 keys)
- [x] auth.onboarding.* (15 keys)
- [x] auth.errors.* (13 keys)

---

## 🔒 Seguridad

### Firestore Rules
- [x] users collection - Reglas actualizadas
- [x] invitations collection - Reglas implementadas
- [x] organizations collection - Acceso controlado
- [ ] Verificar rules con Firebase Emulator
- [ ] Deploy rules a producción

### Firestore Indexes
- [x] invitations - Índices compuestos creados
- [ ] Deploy indexes a producción

### API Security
- [x] Token validation en todos los endpoints
- [x] Email validation en invitaciones
- [x] Permission checks (org_owner/org_admin)
- [ ] Rate limiting en `/api/invitations/send`

---

## 📝 Documentación

### Archivos Actualizados
- [x] INVITATIONS-SYSTEM.md - Creado
- [ ] HOWTO.md - Actualizar con invitaciones
- [ ] CLAUDE.md - Actualizar con nuevas features
- [x] FIREBASE-AUTH-SETUP.md - Ya existe (Sprint 2)
- [ ] README.md - Añadir instrucciones SMTP

### Comentarios en Código
- [x] invitations.js - Comentarios JSDoc
- [x] email.js - Comentarios de funciones
- [x] AcceptInvite.tsx - Comentarios de lógica
- [x] Users.tsx - Comentarios en modal

---

## 🚀 Deployment

### Dependencias
- [x] nodemailer añadido a package.json
- [ ] Verificar que npm install funciona
- [ ] Verificar build de dashboard
- [ ] Verificar build de API

### Variables de Entorno
- [ ] SMTP_HOST configurado
- [ ] SMTP_PORT configurado
- [ ] SMTP_USER configurado
- [ ] SMTP_PASS configurado
- [ ] FROM_EMAIL configurado
- [ ] FRONTEND_URL configurado

### Firebase
- [ ] Deploy Firestore rules
- [ ] Deploy Firestore indexes
- [ ] Verificar Firebase Auth templates

---

## 🎨 UI/UX Polish

### Feedback Visual
- [x] Loading states en modal de invitación
- [x] Success message tras enviar invitación
- [x] Error messages con íconos
- [ ] Animaciones de transición
- [ ] Toast notifications (opcional)

### Accesibilidad
- [ ] Labels en inputs
- [ ] ARIA labels en botones
- [ ] Keyboard navigation
- [ ] Screen reader friendly

### Consistencia
- [x] Colores Esbilla (#FFBF00, #3D2B1F)
- [x] Iconos Lucide-react consistentes
- [x] Tipografía (stone-xxx colores)
- [x] Espaciado (px-6 py-4 standard)

---

## 🐛 Bug Fixes

### Conocidos
- [ ] Link de invitación no funciona en desarrollo local (CORS)
- [ ] Email templates no se ven en algunos clientes
- [ ] Modal de invitación no cierra con ESC

### Por Verificar
- [ ] Invitación aceptada múltiples veces
- [ ] Race condition en aceptación simultánea
- [ ] Memory leaks en onSnapshot listeners

---

## 📊 Performance

### Optimizaciones
- [ ] Lazy loading de páginas de auth
- [ ] Code splitting en dashboard
- [ ] Caching de invitaciones
- [ ] Debounce en email input

### Métricas
- [ ] Tiempo de carga de AcceptInvite.tsx
- [ ] Tiempo de envío de invitación
- [ ] Bundle size impacto

---

## 🔄 Testing E2E Flows

### Flujo 1: Auto-registro con Plan (SaaS)
- [ ] Landing → "Empezar" → Register
- [ ] Verificar email
- [ ] Completar onboarding (3 pasos)
- [ ] Acceder a dashboard

### Flujo 2: Invitación a Organización
- [ ] Admin invita usuario
- [ ] Usuario recibe email
- [ ] Usuario acepta con Google
- [ ] Usuario accede a dashboard con rol correcto

### Flujo 3: Invitación + Registro Nuevo
- [ ] Admin invita usuario
- [ ] Usuario no tiene cuenta
- [ ] Usuario crea cuenta desde invitación
- [ ] Usuario verifica email
- [ ] Usuario accede a dashboard

### Flujo 4: Login Existente
- [ ] Usuario con cuenta hace login
- [ ] Email/password
- [ ] Google SSO
- [ ] Redirección correcta según estado

### Flujo 5: Pending Approval
- [ ] Usuario sin orgAccess
- [ ] Pantalla /pending
- [ ] Real-time listener detecta aprobación
- [ ] Redirección automática

---

## 🛠️ Comandos de Verificación

### Lint
```bash
npm run lint -w esbilla-dashboard
```

### Tests
```bash
npm run test -w esbilla-api
npm run test -w esbilla-dashboard
```

### Build
```bash
npm run build -w esbilla-dashboard
```

### Deploy Firebase
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## ✅ Completado

**Fecha de inicio:** 2026-02-06
**Fecha prevista fin:** 2026-02-07

**Total items:** 72
**Completados:** 32 (44%)
**Pendientes:** 40 (56%)

---

## 📋 Próximos Pasos Opcionales

### Mejoras Futuras (Post-Sprint 5)
- [ ] Resend invitation
- [ ] Revoke invitation
- [ ] Bulk invitations
- [ ] Invitation analytics
- [ ] Custom email templates por organización
- [ ] Notification center en dashboard
- [ ] Email templates preview
- [ ] Invitation expiration configurable
- [ ] Role-based invitation templates

---

## 🎯 Criterios de Aceptación Sprint 5

Para considerar Sprint 5 completado, deben cumplirse:

1. ✅ Todos los tests unitarios pasan
2. ⬜ Al menos 2 flujos E2E verificados manualmente
3. ⬜ Responsive en mobile/tablet/desktop
4. ✅ Traducciones completas en 3 idiomas
5. ⬜ Documentación actualizada (HOWTO.md, CLAUDE.md)
6. ⬜ Sin errores de TypeScript/ESLint críticos
7. ⬜ Firebase rules deployadas
8. ⬜ SMTP configurado y funcionando

**Estado actual:** 1/8 completado

---

🌽 **Esbilla CMP** — Sprint 5: Pulido y Testing
