# Esbilla CMP - Backlog Consolidado y Roadmap

**Última actualización:** 2026-02-06

---

## 📊 Estado del Proyecto

| Criterio | Estado | Detalles |
| :--- | :--- | :--- |
| Core Legal | ✅ [OK] | Registro inmutable, IP anonimizada (SHA-256), versión política, timestamps, TTL 3 años |
| SDK Front | ✅ [OK] | **v1.6**: Vanilla JS ~20KB, Google Consent Mode V2, script blocking (MutationObserver), carga dinámica de scripts |
| UI/UX | ✅ [OK] | Banner multi-template, LocalStorage, i18n 10 idiomas, personalización CSS completa |
| Backend API | ✅ [OK] | Express.js + Firestore, Cloud Run, rate limiting, domain whitelist, GDPR compliance |
| Dashboard | ✅ [OK] | **Auth completo**: Email/Password + Google SSO, onboarding wizard, invitaciones, multi-tenant (org/site roles), GTM Server Side |
| Infra | ⚠️ [PARCIAL] | Docker ✓, CI/CD ✓. Falta: K8s/Helm, Terraform |
| Cloud | ✅ [OK] | Dev/prod separados, GitHub Actions, Firebase Hosting, Cloud Run multi-env |
| Licencia | ❌ [PENDIENTE] | Sin LICENSE en raíz |

---

## ✅ Completado (Histórico)

### Infraestructura y Core (2026-01 - 2026-02)

#### SDK (Pegoyu)
- [x] **SDK v1.5**: Script Blocking con MutationObserver
  - Bloqueo GDPR de scripts analytics/marketing/functional
  - Interceptor de `type="text/plain"`
  - Documentación completa (SCRIPT-BLOCKING.md)
- [x] **SDK v1.6**: Modo Simplificado y GTM
  - Carga dinámica de scripts desde config Dashboard
  - Google Analytics 4, Hotjar, Facebook Pixel, LinkedIn, TikTok
  - Proxy de scripts con consentimiento previo
  - 20+ integraciones preparadas
- [x] **SDK v1.7**: Múltiples APIs de Consentimiento
  - Integración con 6 APIs de consentimiento
  - Microsoft Clarity support
  - Documentación (SDK-INTEGRATIONS.md)

#### WordPress Plugin
- [x] **Plugin v1.0.0**: Completo y publicable
  - 3 modos: Manual, Simplificado, GTM
  - Interfaz de administración
  - Validación de campos
  - Soporte para 10 idiomas (preparado)
  - Assets (CSS/JS) personalizados
  - Documentación (README, CHANGELOG)
  - Empaquetado en .zip listo para WordPress.org

#### Landing Page (esbilla-public)
- [x] **Nuevas Secciones Completas**:
  - `/[lang]/como-empezar` - Guía de 3 pasos con explicación de modos
  - `/[lang]/gtm-legal` - Argumentación legal con jurisprudencia
  - `/[lang]/saas` - Planes y pricing (Free, Pro, Enterprise)
- [x] **Traducciones ES**: ~120 nuevas claves en español
- [x] **Multi-idioma**: Sistema i18n para 10 idiomas (ast, es, en, gl, eu, ca, fr, pt, it, de)

#### Personalización y UX
- [x] **Personalización CSS del Banner**:
  - SDK: `injectCustomCSS()` function
  - Dashboard: Campo `customCSS` en Settings
  - WordPress: Sección "Personalización"
  - Templates: IDs en todos los elementos
  - Documentación: PERSONALIZACION-BANNER.md (498 líneas, 5 ejemplos)

#### Dashboard - Infraestructura
- [x] **Búsqueda y paginación**: Organizations, Sites, Users (debounce 300ms)
- [x] **UserSearchSelector**: Componente reutilizable con dropdown
- [x] **Recalculate stats**: Botón para recalcular estadísticas de sitios

### Sprint 1: Autenticación Base (Completado - Feb 2026)
- [x] Feature flags (SaaS vs Self-hosted)
- [x] Configuración de planes (Free, Pro, Enterprise)
- [x] i18n completo (Asturianu, Español, English)
- [x] Firebase Email/Password Auth habilitado
- [x] Templates de email configurados en Firebase

### Sprint 2: Sistema de Autenticación (Completado)
- [x] Login con Email/Password
- [x] Login con Google SSO
- [x] Registro con email/password
- [x] Verificación de email obligatoria
- [x] Recuperación de contraseña (forgot/reset)
- [x] Página AuthAction para manejar acciones de Firebase
- [x] Gestión de estados de auth en AuthContext

### Sprint 3: Onboarding Multi-Vía (Completado)
- [x] Wizard de onboarding (3 pasos)
- [x] Selección de plan en registro (SaaS)
- [x] Creación automática de organización + sitio
- [x] Página PendingApproval con listener real-time
- [x] Routing condicional post-login
- [x] ProtectedRoute con validaciones completas

### Sprint 4: Sistema de Invitaciones (Completado)
- [x] Colección `invitations` en Firestore
- [x] API `/api/invitations/send` con Nodemailer
- [x] API `/api/invitations/:id/accept`
- [x] Email service con templates multi-idioma
- [x] Página AcceptInvite.tsx
- [x] Modal de invitación en Users.tsx
- [x] Firestore rules para invitations
- [x] Índices compuestos para invitations
- [x] Documentación completa (INVITATIONS-SYSTEM.md)

### Sprint 5: Testing y Documentación (En progreso - Feb 2026)
- [x] Tests unitarios de API invitations (invitations.test.js)
- [x] SPRINT-5-CHECKLIST.md (81 items)
- [x] HOWTO.md actualizado con invitaciones
- [x] CLAUDE.md actualizado con auth/onboarding
- [x] BACKLOG.md consolidado
- [x] CONTRIBUTING.md - Guía de contribución open-source
- [ ] Tests E2E con Firebase Emulator
- [ ] Responsive design verificado en todas las páginas auth
- [ ] Deploy de Firestore rules e indexes a producción

### Gestión de Sitios (Reciente - Feb 2026)
- [x] Selector de organización en Sites.tsx
- [x] ID del sitio visible en tarjetas (monospace)
- [x] Nombre de organización mostrado en sitio
- [x] **GTM Server Side URL** en configuración de sitios
- [x] Actualización de tipos (ScriptConfig.gtm.serverUrl)
- [x] Modal de usuarios por sitio con gestión de roles

### Cloud y CI/CD (Completado - Feb 2026)
- [x] Entornos dev/prod separados (Firebase projects)
- [x] GitHub Actions workflows (deploy-dev, deploy-prod, test)
- [x] Cloud Run multi-environment
- [x] Firebase Hosting multi-target
- [x] Docker multi-stage build

---

## 🚧 En Progreso

### Sprint 5: Pulido Final
- [ ] Testing E2E completo de flujos auth
- [ ] Responsive design en mobile/tablet/desktop
- [ ] Verificación de traducciones en 3 idiomas
- [ ] Deploy de Firestore rules y indexes a producción
- [ ] Configuración SMTP en producción

---

## 📋 Próximas Tareas (Priorizado)

### 🔥 Crítico - Licencias y Legal
- [ ] **Crear LICENSE** - Definir modelo de licencia (MIT/Apache/comercial dual) en raíz del proyecto

### 🎯 Alta Prioridad - Traducciones Pendientes
- [ ] **Landing: Traducciones a 9 idiomas** - ~120 claves nuevas
  - Prioridad: ast (Asturianu) > en (English) > gl/eu/ca > fr/pt/it/de
  - Ver TRANSLATIONS-PENDING.md (si existe)
  - Páginas: como-empezar, gtm-legal, saas
- [ ] **WordPress Plugin: Traducciones** - Archivos .po/.mo
  - Archivos base creados (ast, en_US)
  - Faltan traducciones restantes
- [ ] **WordPress Plugin: Assets gráficos** - Iconos y banners para WordPress.org

### 🏢 Alta Prioridad - Gestión de Sitios por Organización

#### 1. Filtrado de Sitios por Organización
**Descripción:** En Sites.tsx, añadir selector/filtro para mostrar solo sitios de una organización específica
**Requisitos:**
- Añadir dropdown de organizaciones en la barra de búsqueda
- Filtrar `paginatedSites` por `organizationId`
- Mostrar contador de sitios filtrados
- Opción "Todas las organizaciones"
**Archivos:** `esbilla-dashboard/src/pages/Sites.tsx`

#### 2. Lista de Sitios en Organizations.tsx
**Descripción:** Mostrar sitios asociados a cada organización en la página Organizations
**Requisitos:**
- En cada tarjeta de organización, mostrar lista de sitios asociados
- Link directo a cada sitio (navegar a Sites.tsx con filtro aplicado)
- Contador de sitios por organización
- Icono indicador si la org no tiene sitios
**Archivos:** `esbilla-dashboard/src/pages/Organizations.tsx`

#### 3. Asignación Masiva de Sitios (Bulk Assign)
**Descripción:** Permitir asignar múltiples sitios a una organización de una vez
**Requisitos:**
- Checkbox en lista de sitios para selección múltiple
- Botón "Asignar seleccionados a organización"
- Modal con selector de organización
- Confirmación con preview de cambios
- Solo para sitios sin organización o con opción de reasignar
**Archivos:** `esbilla-dashboard/src/pages/Sites.tsx`

#### 4. Validación de Permisos de Asignación
**Descripción:** Solo org_admin+ puede asignar sitios a organizaciones
**Requisitos:**
- Verificar permisos antes de mostrar selector de organización
- Mostrar selector solo a superadmin y org_admin de la org seleccionada
- Backend: validar permisos en API si se crea endpoint
- UI: deshabilitar selector si no tiene permisos
**Archivos:**
- `esbilla-dashboard/src/pages/Sites.tsx`
- `esbilla-dashboard/src/context/AuthContext.tsx` (helper de permisos)

---

## 🔮 Futuras Mejoras (Post-Sprint 5)

### Autenticación y Usuarios
- [ ] Resend invitation
- [ ] Revoke invitation
- [ ] Bulk invitations (CSV upload)
- [ ] Invitation analytics (tasa de aceptación)
- [ ] Custom email templates por organización
- [ ] Notification center en dashboard
- [ ] Invitation expiration configurable
- [ ] Two-factor authentication (2FA)
- [ ] SSO con SAML/LDAP (Enterprise)

### Dashboard y Analytics
- [ ] Exportación de datos (CSV, Excel, PDF)
- [ ] Filtros avanzados por fecha range
- [ ] Comparación entre períodos
- [ ] Alertas personalizadas (email/webhook)
- [ ] Custom dashboards por rol
- [ ] Widgets personalizables
- [ ] Dark mode toggle

### Sites y Configuración
- [ ] Preview del banner antes de guardar
- [ ] A/B testing de banners
- [ ] Templates de banner predefinidos
- [ ] Importar/exportar configuración entre sitios
- [ ] Histórico de cambios de configuración
- [ ] Staging environment por sitio

### SDK y Integraciones
- [ ] Modo headless (API-only, sin UI)
- [ ] Custom events tracking
- [ ] Webhooks para eventos de consentimiento
- [ ] GraphQL API (alternativa a REST)
- [ ] SDK para mobile (iOS, Android)
- [ ] Plugins para más CMS (Drupal, Joomla)
- [ ] Integración con más plataformas (Shopify, Magento)

### Compliance y Legal
- [ ] CCPA/CPRA support (California)
- [ ] LGPD support (Brasil)
- [ ] Cookie scanner automático
- [ ] Generador de Privacy Policy
- [ ] Audit logs detallados
- [ ] Certificación IAB TCF v2.2
- [ ] GDPR consent receipts (RFC)

### Performance y Escalabilidad
- [ ] Edge caching (Cloudflare Workers)
- [ ] Rate limiting más sofisticado
- [ ] Queue system para emails (Bull/Redis)
- [ ] Sharding de Firestore collections
- [ ] CDN para SDK delivery
- [ ] Monitoring avanzado (Sentry, Datadog)

### Billing y Monetización (SaaS)
- [ ] Stripe integration
- [ ] Paddle integration
- [ ] Facturación automática
- [ ] Invoices PDF
- [ ] Usage-based pricing
- [ ] Downgrade/upgrade plans
- [ ] Trial period management
- [ ] Affiliate program

### Infrastructure (Opcional)
- [ ] Manifiestos Kubernetes (k8s/)
- [ ] Terraform IaC para Cloud Run, Firestore, IAM
- [ ] Helm Chart parametrizable
- [ ] Monitoring avanzado (Sentry/Datadog)

---

## 🔧 Auditoría Técnica

| Criterio | Estado | Observaciones |
| :--- | :--- | :--- |
| Multi-tenancy jerárquica | ✅ [OK] | Platform → Organization → Site con roles completos |
| Gestión de usuarios | ✅ [OK] | Sistema completo con búsqueda, roles granulares, herencia de permisos |
| Identidad Unificada | ⚠️ [PARCIAL] | userHash basado en footprintId+IP+UA, no cross-domain por UID/Email |
| Firestore Schema | ✅ [OK] | Timestamps, metadata, choices, TTL 3 años, users con orgAccess/siteAccess |
| Seguridad acceso cruzado | ✅ [OK] | hasSiteAccess() con herencia, aislamiento por roles |
| SDK sin claves maestras | ✅ [OK] | SDK → API backend, no acceso directo a Firestore |
| Privacidad/Anonimización | ✅ [OK] | SHA-256 hashing, transparencia endpoint /api/consent/history |
| CI/CD y Testing | ⚠️ [PARCIAL] | GitHub Actions ✓, tests unitarios ✓. Falta: E2E tests |

---

## 🐛 Bugs Conocidos

### Alta Prioridad
- [ ] Link de invitación no funciona en desarrollo local (CORS)
- [ ] Modal de invitación no cierra con ESC

### Media Prioridad
- [ ] Email templates no se ven en algunos clientes (Outlook)
- [ ] Invitación aceptada múltiples veces (race condition)
- [ ] Memory leaks en onSnapshot listeners (verificar cleanup)

### Baja Prioridad
- [ ] Animaciones de transición faltantes en auth pages
- [ ] Toast notifications no implementadas
- [ ] Keyboard navigation incompleta

---

## 📊 Métricas de Progreso

### Sprints Completados: 4.5/5 (90%)
- Infrastructure: ✅ Completo (100%)
- Sprint 1: ✅ Autenticación (100%)
- Sprint 2: ✅ Onboarding (100%)
- Sprint 3: ✅ Invitaciones (100%)
- Sprint 4: ✅ Sites Management + GTM (100%)
- Sprint 5: 🔄 Testing y Deploy (50%)

### Features Implementadas: 65/95 (68%)
- SDK: 15/18 (83%) - v1.7 con 20+ integraciones
- Autenticación: 12/14 (86%)
- Onboarding: 8/10 (80%)
- Invitaciones: 10/12 (83%)
- Sites Management: 13/18 (72%)
- Dashboard: 7/23 (30%)

---

## 🎯 Hitos Clave

### Q1 2026
- [x] SDK v1.5-1.7 con script blocking y carga dinámica (Feb)
- [x] WordPress Plugin v1.0.0 (Feb)
- [x] Landing pages completas (como-empezar, gtm-legal, saas) (Feb)
- [x] Sistema de auth completo (email/password + Google SSO) (Feb)
- [x] Sistema de invitaciones con SMTP (Feb)
- [x] Sites management + GTM Server Side (Feb)
- [x] Multi-tenant roles completo (Feb)
- [ ] Traducciones a 9 idiomas (Feb-Mar)
- [ ] Testing E2E completo (Mar)
- [ ] Deploy a producción (Mar)

### Q2 2026
- [ ] Billing con Stripe (Apr)
- [ ] Mobile SDK (iOS/Android) (May)
- [ ] IAB TCF v2.2 certification (Jun)

### Q3 2026
- [ ] Enterprise features (SSO, SAML) (Jul)
- [ ] Advanced analytics (Aug)
- [ ] API v2 con GraphQL (Sep)

---

## 💡 Notas de Implementación

### GTM Server Side (Reciente)
**Implementado:** 2026-02-06
**Archivos modificados:**
- `esbilla-dashboard/src/pages/Sites.tsx` - Campo gtmServerUrl en formulario
- `esbilla-dashboard/src/types/index.ts` - ScriptConfig.gtm.serverUrl

**Próximos pasos:**
1. Integrar gtmServerUrl en el SDK (pegoyu.js)
2. Enviar eventos de consentimiento a GTM Server Side
3. Documentar en SDK-INTEGRATIONS.md
4. Actualizar templates de ejemplo

### Sistema de Invitaciones
**SMTP configurado:** Gmail en desarrollo, pendiente SendGrid/SES en producción
**Expiración:** 7 días por defecto
**Seguridad:** Email verification + permission validation + Firestore rules

### Multi-tenancy
**Jerarquía:** Platform → Organization → Site
**Roles:** superadmin > org_owner > org_admin > org_viewer > site_admin > site_viewer
**Permisos:** Calculados dinámicamente con helpers en AuthContext

---

## 📞 Contacto

**Mantenedor:** Jorge L. Solis
**Email:** esbilla@clicaonline.com
**Documentación:** Ver carpeta `docs/`
**Issues:** GitHub Issues

---

🌽 **Esbilla CMP** — Consent management made in Asturias
