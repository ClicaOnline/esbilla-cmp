# Funcionalidades Implementadas - Esbilla CMP

**Última actualización:** 2026-02-07

## 🌽 Core: Gestión de Consentimiento GDPR

### ✅ SDK JavaScript (Pegoyu)
- **Versión actual:** v1.8
- **Tamaño:** ~20 KB (minified)
- **Tecnología:** Vanilla JavaScript, sin dependencias
- **Features:**
  - ✅ Banner de consentimiento multi-idioma (10 idiomas)
  - ✅ 3 plantillas predefinidas: maíz (default), modal, bottom-bar
  - ✅ Google Consent Mode V2 integrado
  - ✅ Persistencia en LocalStorage
  - ✅ Sincronización cross-domain de footprint
  - ✅ API de historial de consentimientos (/api/consent/history)
  - ✅ Personalización CSS avanzada (customCSS)
  - ✅ Compatibilidad con GTM, GA4, Facebook Pixel, Hotjar, LinkedIn, TikTok

### ✅ Script Blocking (v1.5)
- **Cumplimiento GDPR:** Bloqueo automático de scripts antes de consentimiento
- **Tecnología:** MutationObserver
- **Categorías soportadas:**
  - `analytics` - Google Analytics, Matomo, etc.
  - `marketing` - Facebook Pixel, LinkedIn, TikTok, etc.
  - `functional` - Chat widgets, mapas, etc.
- **Método:** Interceptor `type="text/plain"` → ejecuta tras consentimiento
- **Documentación:** [SCRIPT-BLOCKING.md](SCRIPT-BLOCKING.md)

### ✅ Modo Simplificado (v1.6)
- **Carga dinámica de scripts post-consentimiento** desde configuración Dashboard
- **No requiere modificar HTML** del sitio
- **Actúa como Tag Manager GDPR-compliant**
- **Scripts soportados:**
  - Google Analytics 4
  - Hotjar
  - Facebook Pixel
  - LinkedIn Insight Tag
  - TikTok Pixel

### ✅ Google Tag Manager Gateway (v1.8) 🆕
- **Configuración en Dashboard:**
  - Dominio CNAME personalizado (ej: `gtm.ejemplo.com`)
  - Container ID de GTM
  - Habilitación on/off por sitio
- **SDK:**
  - Función `loadGTM()` con soporte para proxy domain
  - Carga de `gtm.js` desde dominio personalizado
  - Fallback a GTM oficial si no hay configuración
- **API:**
  - Endpoint `.well-known/gateway/gtm-verification.txt`
  - Retorna Container ID para verificación de Google
- **Configuración DNS:**
  - CNAME: `gtm.ejemplo.com` → `googletagmanager.com`
- **Documentación completa:** [docs/GTM-GATEWAY-SETUP.md](docs/GTM-GATEWAY-SETUP.md)
- **Beneficios:**
  - Reduce bloqueos de adblockers
  - Mejora tasas de tracking (~15-30%)
  - Compatibilidad GDPR/ePrivacy
  - Control total del dominio

---

## 📊 Dashboard (React 19 + Firebase)

### ✅ Autenticación y Roles
- **Firebase Auth:** Google SSO
- **Roles globales:**
  - `superadmin` - Acceso completo al sistema
  - `pending` - Usuario sin permisos (requiere aprobación)
- **Roles de organización:**
  - `org_owner` - Propietario de organización
  - `org_admin` - Administrador de organización
  - `org_viewer` - Solo lectura de organización
- **Roles de sitio:**
  - `site_admin` - Administrador de sitio
  - `site_viewer` - Solo lectura de sitio
- **Herencia de permisos:** Org roles cascade a site roles

### ✅ Multi-Tenancy SaaS
- **Jerarquía:** Organizations → Sites
- **Aislamiento:** Firestore rules con validación de permisos
- **Gestión:**
  - CRUD completo de organizaciones
  - CRUD completo de sitios
  - Gestión de usuarios por org/site
  - Búsqueda avanzada y paginación

### ✅ Configuración de Sitios
- **Dominios:** Multi-domain por sitio (wildcards soportados)
- **API Keys:** Generación automática de claves únicas
- **Banner Configuration:**
  - Selección de plantilla (maíz, modal, bottom-bar)
  - Idioma por defecto
  - Textos personalizables (título, descripción, botones)
  - Política de privacidad URL
  - **Custom CSS:** Editor de estilos con referencia de clases
- **GTM Configuration:**
  - Server URL (GTM Server-Side)
  - **Gateway enabled** (GTM Gateway) 🆕
  - **Gateway domain** (CNAME personalizado) 🆕
  - **Container ID** (GTM) 🆕
- **Script Configuration (Modo Simplificado):**
  - Google Analytics 4 (Measurement ID)
  - Hotjar (Site ID)
  - Facebook Pixel (Pixel ID)
  - LinkedIn Insight (Partner ID)
  - TikTok Pixel (Pixel ID)

### ✅ Analytics y Reportes
- **Dashboard principal:**
  - Total de consentimientos (7d/30d/90d)
  - Tasa de aceptación vs rechazo
  - Gráficos con Recharts
  - Filtros por rango de fechas
- **Footprint Tracker:**
  - Búsqueda por footprint ID
  - Historial completo de consentimientos de un usuario
  - Exportación de datos (GDPR Art. 15)
- **URL Stats:**
  - Estadísticas por URL
  - Top páginas con más consentimientos
  - Paginación y búsqueda
- **Recalculate Stats:**
  - Botón para recalcular estadísticas agregadas
  - Útil tras migraciones o cambios masivos

### ✅ Gestión de Usuarios
- **Búsqueda por email** con autocompletado
- **Añadir usuarios:**
  - Asignar a organización o sitio
  - Seleccionar rol específico
- **Eliminar usuarios** de org/site
- **Modal completo** con UserSearchSelector component

### ✅ Lista de Espera (Waiting List) 🆕
- **Solo superadmin** puede acceder
- **Estadísticas:**
  - Total de registros
  - Pendientes, Contactados, Convertidos, Rechazados
- **Filtros:**
  - Por estado (pending/contacted/converted/rejected)
  - Por plan (free/starter/growth/agency)
  - Búsqueda por email/nombre/empresa
- **Paginación:** 10/20/50/100 resultados por página
- **Exportación:**
  - CSV con todos los campos
  - JSON completo
- **Integración con landing:** Formulario en `/[lang]/lista-espera`

---

## 🔧 API Backend (Express.js + Firestore)

### ✅ Endpoints de Consentimiento
- `POST /api/consent/log` - Registrar consentimiento
  - Rate limit: 30 req/min por IP
  - Validación de dominio contra whitelist
  - Anti-bot: User-Agent validation
  - Anonimización: SHA256 de IP y footprint
- `GET /api/consent/history/:footprintId` - Historial de usuario (GDPR Art. 15)
- `POST /api/consent/sync` - Sincronización cross-domain de footprint

### ✅ Endpoints de Configuración
- `GET /api/config/:siteId` - Configuración del sitio (cacheo 5 min)
- `POST /api/stats/recalculate` - Recalcular estadísticas agregadas

### ✅ Endpoints GTM Gateway 🆕
- `GET /.well-known/gateway/gtm-verification.txt` - Verificación de Container ID
  - Query param: `?domain=ejemplo.com`
  - Retorna Container ID de GTM configurado para ese dominio

### ✅ SDK Delivery
- `GET /pegoyu.js` - Entrega del SDK con cache headers

### ✅ Dashboard Static Hosting
- `GET /dashboard/*` - SPA del dashboard (fallback a index.html)

### ✅ Seguridad
- **CORS dinámico:** Whitelist desde Firestore `sites` collection
- **Rate limiting:** In-memory store con cleanup automático
- **Anonimización:** SHA256 en todos los identificadores personales
- **Anti-bot:** User-Agent checking, bloquea headless clients

---

## 🗄️ Base de Datos (Firestore)

### ✅ Colecciones
- **users** - Autenticación y roles
  - Campos: id, email, displayName, globalRole, orgAccess, siteAccess, createdAt, lastLogin
- **organizations** - Entidades multi-tenant
  - Campos: id, name, plan, maxSites, billingEmail, createdAt, createdBy
- **sites** - Configuración de dominios
  - Campos: id, name, domains, organizationId, apiKey, settings, scriptConfig, customCSS, createdAt
  - **scriptConfig incluye GTM Gateway:** `gtm.gatewayEnabled`, `gtm.gatewayDomain`, `gtm.containerId`
- **consents** - Audit trail GDPR (inmutable, TTL 3 años)
  - Campos: id, siteId, userHash, ipHash, choices, bannerVersion, createdAt, expiresAt, deleteAt
- **stats** - Agregados diarios (reduce costos de lectura)
  - Campos: siteId, date, totalConsents, acceptedAll, rejectedAll, customized
- **config** - Configuración de banners
  - Campos: siteId, template, language, texts, privacyPolicyUrl, customCSS
- **waitingList** 🆕 - Registros de lista de espera
  - Campos: email, name, company, plan, website, message, status, locale, source, createdAt

### ✅ Security Rules
- Multi-nivel: global > org > site
- Validación de permisos en cascada
- `consents` collection: write-only (audit trail)
- `waitingList`: public write (landing form), admin read

### ✅ Indexes
- Composite indexes para queries complejas
- TTL en `consents.deleteAt` (auto-delete tras 3 años)
- Indexes para `waitingList`: createdAt, status, plan

---

## 🌐 Landing Page (Astro + Tailwind)

### ✅ Multi-idioma (i18n)
- **10 idiomas soportados:**
  - ast (Asturianu) - Default
  - es (Español) - Completo
  - en (English)
  - gl (Galego)
  - eu (Euskara)
  - ca (Català)
  - fr (Français)
  - pt (Português)
  - it (Italiano)
  - de (Deutsch)
- **Sistema i18n custom:** `src/i18n/`
- **Rutas dinámicas:** `/[lang]/pagina`

### ✅ Páginas Principales
- **Homepage (`/`)** - Hero, features, CTA
- **Como Empezar (`/[lang]/como-empezar`)** - Guía de 3 pasos
  - Paso 1: Crear cuenta
  - Paso 2: Configurar sitio (3 modos: Manual, Simplificado, GTM)
  - Paso 3: Instalar código
- **GTM Legal (`/[lang]/gtm-legal`)** - Argumentación legal del modo GTM
  - Jurisprudencia
  - Comparativas con competencia
  - Ventajas legales
- **SaaS (`/[lang]/saas`)** - Planes y pricing
  - Free (1 sitio)
  - Starter (5 sitios)
  - Growth (20 sitios)
  - Agency (ilimitado)
- **Lista de Espera (`/[lang]/lista-espera`)** 🆕 - Formulario de registro
  - Campos: nombre, email, empresa, plan, dominio, mensaje, teléfono (opcional)
  - Integración con Firestore `waitingList`
  - Modal de información legal

### ⚠️ Pendiente en Landing
- ❌ **GTM Gateway NO mencionado** en como-empezar ni saas
- ❌ Falta sección técnica sobre GTM Gateway
- ⏳ Traducciones pendientes para 8 idiomas (solo ES completo)

---

## 🔌 Integraciones

### ✅ Plugin WordPress v1.0.0
- **3 modos de configuración:**
  - Manual: Solo script del banner
  - Simplificado: Carga dinámica de scripts desde Dashboard
  - GTM: Integración con Google Tag Manager
- **Interfaz de administración:**
  - Configuración visual de campos
  - Validación en tiempo real
  - Personalización CSS inline
  - Enlace a documentación
- **Multi-idioma:**
  - 10 idiomas preparados (.po files)
  - Asturianu y English traducidos
  - Resto pendientes
- **Assets optimizados:**
  - CSS minificado
  - JS con validaciones
- **Documentación:**
  - README.md completo
  - CHANGELOG.md
  - Instrucciones de instalación

---

## 📚 Documentación

### ✅ Guías Técnicas
- [CLAUDE.md](CLAUDE.md) - Guía para Claude Code (project context)
- [HOWTO.md](HOWTO.md) - Guía de uso para desarrolladores
- [SETUP.md](SETUP.md) - Configuración de entornos dev/prod
- [Testing.md](Testing.md) - Guía de testing y CI/CD
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guía de contribución open-source
- [GUIA-INSTALACION.md](GUIA-INSTALACION.md) - Instalación para usuarios finales

### ✅ Documentación de Features
- [SCRIPT-BLOCKING.md](SCRIPT-BLOCKING.md) - Script blocking con MutationObserver (498 líneas)
- [docs/PERSONALIZACION-BANNER.md](docs/PERSONALIZACION-BANNER.md) - Personalización CSS del banner (498 líneas)
- [docs/GTM-GATEWAY-SETUP.md](docs/GTM-GATEWAY-SETUP.md) - Setup de GTM Gateway (489 líneas) 🆕
- [docs/SDK-INTEGRATIONS.md](docs/SDK-INTEGRATIONS.md) - Integraciones del SDK con servicios de terceros

### ✅ Backlog y Roadmap
- [backlog.md](backlog.md) - Backlog de funcionalidades y tareas
- [BACKLOG-OPTIMIZATIONS.md](BACKLOG-OPTIMIZATIONS.md) - Optimizaciones de rendimiento pendientes 🆕

---

## 🚀 Infraestructura y DevOps

### ✅ Cloud Deployment
- **Firebase Hosting:**
  - Landing page (esbilla.com)
  - Multi-target: prod + dev
- **Google Cloud Run:**
  - API + Dashboard
  - Región: europe-west4 (GDPR compliance)
  - Auto-scaling
  - Multi-environment: dev + prod

### ✅ CI/CD (GitHub Actions)
- **Workflows:**
  - `deploy-api.yml` - Deploy API + Dashboard a Cloud Run
  - `deploy-public.yml` - Deploy landing a Firebase Hosting
  - `test.yml` - Tests automáticos en PRs
- **Triggers:**
  - Push a `main` → deploy automático
  - PR → tests automáticos

### ✅ Docker
- **Multi-stage build:**
  - Stage 1: Build dashboard (Vite)
  - Stage 2: API (Node.js) + Dashboard estático
- **Optimizaciones:**
  - Imagen base Alpine Linux
  - Layer caching
  - .dockerignore configurado

---

## 📈 Performance y Optimización

### ✅ Bundle Optimization (Dashboard)
- **Lazy loading de rutas:** Solo LoginPage cargado inicialmente
- **Code splitting manual:**
  - `react-vendor` - 48 KB
  - `firebase-vendor` - 350 KB
  - `chart-vendor` - 362 KB
  - `query-vendor` - 14 KB
  - `icons-vendor` - 15 KB
- **Resultado:**
  - Bundle inicial: 237 KB (73 KB gzip)
  - Reducción: 80% vs bundle único
  - Primera carga: ~1.5s en 3G (antes: ~4s)

### ⏳ Optimizaciones Pendientes (ver BACKLOG-OPTIMIZATIONS.md)
- Bundle analyzer
- Reemplazar Recharts con Chart.js (282 KB reducción)
- Comprimir con Brotli
- Service Worker + PWA
- CDN para assets estáticos

---

## 🔐 Cumplimiento Legal

### ✅ GDPR Compliance
- ✅ Registro inmutable de consentimientos
- ✅ Anonimización de IPs (SHA256)
- ✅ TTL de 3 años en datos de consentimiento
- ✅ Derecho de acceso (Art. 15): `/api/consent/history/:footprintId`
- ✅ Banner con opciones: Aceptar/Rechazar/Configurar
- ✅ Script blocking pre-consentimiento
- ✅ Versioning de políticas (`bannerVersion`)

### ✅ ePrivacy Compliance
- ✅ Bloqueo de cookies antes de consentimiento
- ✅ Categorización de scripts (analytics/marketing/functional)
- ✅ GTM Gateway para mejorar tracking sin violar privacidad
- ✅ Transparencia en el tratamiento de datos

---

## 🎯 Roadmap Próximos Pasos

### Alta Prioridad
- ❌ **Añadir GTM Gateway a landing** (como-empezar.astro) 🔥
- ❌ **Traducir landing a 8 idiomas** (solo ES completo)
- ❌ **Crear LICENSE** (MIT recomendado)
- ❌ **Tests E2E críticos** (login, create site, add user)

### Media Prioridad
- ❌ **Dashboard: Editor visual de banner** (color picker, position, preview)
- ❌ **Analytics avanzados** (evolución temporal, exportación CSV/PDF)
- ❌ **GTM Server Side** (complemento a GTM Gateway)

### Baja Prioridad
- ❌ **Multi-tenancy jerárquica** (distributors > orgs > sites)
- ❌ **Unified user identity** (cross-domain tracking)
- ❌ **SaaS features** (registro público, Stripe, planes)
- ❌ **Infrastructure as Code** (Terraform + Helm)

---

**Versión del documento:** 1.0
**Última revisión:** 2026-02-07
**Mantenedor:** Jorge Lasolis (@jlasolis)
