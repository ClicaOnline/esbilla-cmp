
### 📋 Informe de Auditoría Esbilla-CMP

**Última actualización**: 2026-02-05

**Estado del Checklist**

| Criterio | Estado | Detalles |
| :--- | :--- | :--- |
| Core Legal | ✅ [OK] | Registro inmutable (.add() siempre), IP anonimizada (hashIP SHA-256), versión política (bannerVersion), timestamps (createdAt/expiresAt), Firestore rules bloquean write
| SDK Front | ✅ [OK] | **COMPLETADO**: Vanilla JS ~20KB, Google Consent Mode V2, script blocking con MutationObserver (v1.5), type="text/plain" interceptor, categorías analytics/marketing/functional
| UI/UX | ✅ [OK] | Banner con Aceptar/Rechazar/Configurar, persistencia LocalStorage, selector de idioma, múltiples plantillas
| Backend API | ✅ [OK] | POST /api/consent/log con Firestore, Cloud Run para alta concurrencia, TTL 3 años GDPR, endpoint recalculate stats
| Dashboard | ✅ [OK] | **MEJORADO**: CRUD organizaciones/sitios/usuarios, búsqueda avanzada, paginación, gestión completa de permisos multi-tenant (org_owner/admin/viewer, site_admin/viewer), modal de usuarios con roles, estadísticas, personalización CSS del banner. Falta: editor visual de banner (color picker, preview en tiempo real)
| Infra | ⚠️ [PARCIAL] | Dockerfile ✓, docker-compose.yml ✓. Falta: manifiestos K8s/Helm
| Cloud | ✅ [OK] | **COMPLETADO**: Entornos dev/prod separados, CI/CD automático (GitHub Actions), Firebase Hosting multi-target, Cloud Run multi-environment
| Licencia | ❌ [PENDIENTE] | Sin LICENSE ni CONTRIBUTING.md en raíz


**✅ Completado Recientemente (2026-02-04)**

- ✅ **Dashboard: Sistema de búsqueda y paginación** - Implementado en Organizations, Sites y Users con debounce 300ms
- ✅ **Dashboard: Gestión avanzada de usuarios** - Modal completo con roles, búsqueda por email, add/remove usuarios
- ✅ **Dashboard: UserSearchSelector component** - Componente reutilizable con dropdown y búsqueda en tiempo real
- ✅ **Cloud: Entornos dev/prod separados** - Firebase projects, Cloud Run services, configuración completa
- ✅ **Cloud: CI/CD automático** - GitHub Actions workflows (deploy-dev.yml, deploy-prod.yml, test.yml)
- ✅ **Documentación: Testing.md y SETUP.md** - Guías completas de deployment y configuración
- ✅ **Dashboard: Recalculate stats** - Botón para recalcular estadísticas de consentimientos por sitio
- ✅ **CONTRIBUTING.md** - Guía completa de contribución open-source con code of conduct, workflows, y guidelines
- ✅ **SDK v1.5: Script Blocking** - Sistema MutationObserver para bloqueo GDPR de scripts de terceros (analytics/marketing/functional)
- ✅ **Documentación: SCRIPT-BLOCKING.md** - Guía completa con ejemplos de GA4, Facebook Pixel, Hotjar, LinkedIn, TikTok
- ✅ **Ejemplo funcional: script-blocking-example.html** - Demo interactiva del sistema de bloqueo de scripts

**✅ Completado Recientemente (2026-02-08): G100 Opt-In + Legal Compliance**

**G100 Opt-In GDPR Compliant:**
- ✅ **SDK v2.1: G100 Opt-In** - Google Consent Mode V2 G100 ahora es opt-in (activado solo si `config.enableG100 === true`)
- ✅ **Arquitectura: Type definitions** - Añadido campo `enableG100?: boolean` a interface `Site` en dashboard
- ✅ **Dashboard: Analytics Settings UI** - Nueva sección en Settings.tsx con checkbox G100 y advertencias GDPR (CJEU Breyer, CNIL)
- ✅ **WordPress Plugin: G100 checkbox** - Añadido campo `enable_g100` en settings con advertencias de compliance
- ✅ **SDK: Config merge** - Pegoyu lee `window.esbillaConfig` para opciones inline (útil para plugins)
- ✅ **Compliance fix**: Por defecto G100 está DESACTIVADO - Solo envía pings anónimos a GA4 si usuario lo activa explícitamente

**Legal Disclaimers + Banner Compliance (FASE 1):**
- ✅ **LICENSE**: Disclaimer legal robusto con exención de responsabilidad GDPR/ePrivacy
- ✅ **README.md**: Aviso legal prominente al inicio del documento
- ✅ **LEGAL-COMPLIANCE-BANNER.md**: Guía completa (8000+ palabras) sobre requisitos GDPR Art. 13
- ✅ **Templates HTML**: Enlace "Más información" + modal de política de privacidad (maiz.html, modal.html, bottom-bar.html)
- ✅ **i18n/config.json**: Traducciones en ast/es/en para enlace legal y título modal
- ✅ **SDK v2.1**: Lógica para modal legal (apertura/cierre, ESC, overlay)
- ✅ **base.css**: Estilos completos para modal responsive con animaciones
- ✅ **Type definitions**: Nuevo interface `LegalInfo` con campos GDPR completos (companyName, taxId, DPO, cross-domain, etc.)

**Formulario GDPR Completo (FASE 2):**
- ✅ **Settings.tsx**: Formulario exhaustivo organizado en 6 secciones GDPR Art. 13:
  - Responsable del Tratamiento (companyName*, taxId, address, contactEmail*)
  - Delegado de Protección de Datos/DPO (dpoName, dpoEmail) - opcional
  - Enlaces a Políticas (privacyPolicyUrl, cookiePolicyUrl)
  - Textos Legales (bannerText corto, fullPolicyText completo)
  - Configuración Cross-Domain (crossDomainEnabled, relatedDomains con advertencia GDPR)
  - Configuración Avanzada (consentRetentionDays default 1095, supervisoryAuthority, supervisoryAuthorityUrl)
  - Campos legacy colapsables (title, content) para backward compatibility
  - Warning banner con link a LICENSE sobre responsabilidad legal
- ✅ **SDK v2.1: generateLegalText()**: Generación automática de texto legal desde campos estructurados
  - Prioridad: fullPolicyText > content > auto-generado > fallback
  - Respeta GDPR Art. 13 con información obligatoria (responsable, finalidad, base legal, derechos, etc.)
  - Soporta cross-domain warnings y enlaces a autoridad de control
  - Multi-idioma con fallbacks traducidos
- ✅ **i18n ampliado (ast/es/en/fr/pt)**: Nuevas traducciones para términos legales GDPR:
  - dataController, dpo, purpose, legalBasis, retention
  - rights, complaint, crossDomain, moreInfo, privacyPolicy, cookiePolicy
- ✅ **BannerConfig interface**: Actualizado para usar `legal: LegalInfo` completo en lugar de solo title/content
- ✅ **Modal preview**: Usa fullPolicyText prioritariamente sobre content legacy

**🔥 Backlog Prioritario (Próximos Sprints)**

**🎯 Alta Prioridad (Semana 1-2)**
1. ✅ **Crear LICENSE** - COMPLETADO: MIT License con términos adicionales para uso SaaS (protege marca "Esbilla")
2. ✅ **Crear CONTRIBUTING.md** - COMPLETADO: Guía de contribución para la comunidad open-source
3. ✅ **SDK: Implementar script blocking** - COMPLETADO: MutationObserver implementado en SDK v1.5 con documentación completa
4. ✅ **SDK v1.6: Carga Dinámica de Scripts (modo GTM)** - COMPLETADO: Sistema de carga automática de scripts desde configuración del Dashboard, sin modificar HTML. Actúa como Tag Manager simplificado para cumplimiento GDPR automático
5. ⚠️ **Dashboard: Editor visual de banner** - UI para personalizar colores, posición, textos, logo del banner
6. ✅ **SDK v1.8+: Google Tag Manager Gateway Proxy** - COMPLETADO: Proxy de GTM via Esbilla API con optimizaciones (cache 5min + compresión Brotli + geolocalización)
7. ❌ **Implementar GTM Server Side** - Configuración de GTM Server-Side Tagging con Cloud Run

**🎨 Recursos Gráficos (Sprint Actual - Ver docs/GRAPHIC-RESOURCES.md)**
1. ⚡ **URGENTE: Icono de la Panoya - 3 Variantes**
   - Panoya Realista (optimizar actual)
   - Panoya Minimalista (nuevo - flat design)
   - Panoya Geométrica (nuevo - estilo tech)
   - Componente selector en Dashboard con preview
   - Sistema de personalización de colores (CSS variables)
2. 🔥 **Iconos del Sistema** (18 iconos)
   - 12 iconos de características para Landing (CMP, Open Source, GDPR, etc.)
   - 6 badges de estado para Dashboard (plan free/pro/enterprise, email verified, SMTP)
3. 🖼️ **Imágenes de Fondo** (3 imágenes)
   - Hero alternativo: Campo de maíz asturiano
   - Features: Textura de maíz abstracta
   - Comunidad: Colaboración rural
4. 📸 **Ilustraciones** (4 flat design)
   - Instalación del script
   - Usuario dando consentimiento
   - Dashboard con estadísticas
   - Cumplimiento GDPR
5. 🎯 **Iconos de Integraciones** (20 logos de terceros: GA4, Hotjar, Facebook Pixel, etc.)

**🔮 Backlog Fase 2 - Personalización Avanzada**
- 📌 **Banner: Icono del Cliente Personalizado** - Permitir que cada organización suba su propio logo para mostrar en el banner de cookies (en lugar de la panoya). Upload a Firebase Storage, fallback a panoya por defecto. Campo `Organization.bannerLogoUrl` en Firestore.

**🏗️ GTM Gateway Proxy - Infraestructura (Post-implementación)**
1. ✅ **Firestore Index**: Crear índice compuesto para `gtmGatewayDomain` en colección `sites`
   - ✅ Índice añadido a `firestore.indexes.json`
   - ✅ Query: `sites.gtmGatewayDomain == 'gtm.cliente.com'`
   - Pendiente: Deploy del índice a Firestore
2. ✅ **Deploy con Load Balancer**: Configurar Cloud Load Balancer multi-región
   - ✅ Script `infrastructure/setup-load-balancer.sh` creado
   - ✅ Backend service con Cloud Run en 3 regiones UE (west4, west1, west3)
   - ✅ Health checks configurados (`/api/health`)
   - ✅ SSL/TLS con managed certificate
   - ✅ Distribución de tráfico: 70% primary, 30% secondary, 0% standby
   - Pendiente: Ejecutar script en GCP
3. ✅ **Habilitar Cloud CDN**: Configurar CDN global con backends multi-región
   - ✅ Script `infrastructure/setup-cdn.sh` creado
   - ✅ Cache mode: `CACHE_ALL_STATIC`
   - ✅ TTL: 5 minutos (default), 1 hora (max)
   - ✅ PoPs en UE: Frankfurt, London, Paris, Amsterdam, Milán, Madrid
   - ✅ Compresión Brotli/Gzip automática
   - ✅ Cache key policy: protocol + host + query string
   - Pendiente: Ejecutar script en GCP (requiere Load Balancer primero)
4. ✅ **Monitoring y Alertas**: Configurar observabilidad completa
   - ✅ Script `infrastructure/setup-monitoring.sh` creado
   - ✅ Notification channel configurado (email)
   - ✅ Uptime Check: `/api/health` cada 60s desde Europa y USA
   - ✅ 4 Alertas configuradas:
     - Error rate >1% durante 5 min → Email
     - Latency p99 >1s durante 5 min → Email
     - Availability <99% durante 5 min → Email
     - Cloud Run instances >80 → Email (escalar)
   - ✅ Dashboard personalizado: requests/s, latency, errors, instances, cache hit rate
   - Pendiente: Ejecutar script en GCP
5. ✅ **Documentación**: README completo con guías de uso
   - ✅ `infrastructure/README.md` creado con orden de ejecución
   - ✅ Comandos de verificación y troubleshooting
   - ✅ Estimación de costos por fase
   - ✅ `deploy-all.sh` - Script maestro para deploy completo automático
   - ✅ Opción A (Deploy Automático) y Opción B (Deploy Manual) documentadas
   - ✅ Guía de verificación post-deploy con comandos útiles

**🎉 Completado (2026-02-05 / 2026-02-07 / 2026-02-08)**
- ✅ **Plugin de WordPress v1.0.0** - Plugin completo con 3 modos (Manual, Simplificado, GTM)
  - Interfaz de administración completa
  - Validación de campos en tiempo real
  - Soporte para 10 idiomas (preparado, pendiente traducción)
  - Assets (CSS/JS) personalizados
  - Documentación completa (README, CHANGELOG)
- ✅ **SDK v1.6: Modo Simplificado y GTM** - Carga dinámica de scripts post-consentimiento
  - Google Analytics 4, Hotjar, Facebook Pixel, LinkedIn, TikTok
  - Proxy de scripts con consentimiento previo
  - Integración completa con Dashboard
- ✅ **SDK v1.8+: GTM Gateway Proxy - Multi-Tenant DNS-Based** - COMPLETADO (2026-02-07)
  - **Arquitectura DNS-based multi-tenant** (Cliente configura gtm.cliente.com → Esbilla API)
  - **Identificación por Host header**: API identifica site por gtmGatewayDomain, lookup en Firestore
  - **Infraestructura modular escalable**:
    - **Cloud CDN**: Cache global en PoPs de UE (Frankfurt, London, Paris, etc.)
    - **Load Balancer**: Multi-región UE (europe-west4, west1, west3) con failover automático
    - **Cloud Run**: Auto-scaling 1-100 instancias por región, in-memory cache por instancia
    - **Firestore**: Lookup gtmGatewayDomain → containerId con query cache 5 min
  - **Cache en memoria**: TTL 5 minutos, reduce latencia 66% y egress 92%
  - **Compresión Brotli/Gzip**: Reduce tamaño 80 KB → 20 KB (75% reducción)
  - **Rate limiting específico**: 10 req/min por IP para protección contra abuse
  - **Geolocalización automática**: Headers X-Forwarded-Country-Region para targeting
  - **GDPR compliance**: Todas las regiones en UE (sin transferencia fuera de UE)
  - **Endpoints implementados**: /gtm.js con multi-tenant routing, /metrics/* con health checks
  - **Dashboard actualizado**: Checkbox enable + Container ID + GTM Gateway Domain (obligatorio)
  - **SDK actualizado**: loadGTM() usa gtmGatewayDomain del config (dominio personalizado del cliente)
  - **Documentación completa**:
    - GTM-GATEWAY-SETUP.md (reescrito para arquitectura DNS-based)
    - GTM-GATEWAY-PROXY-COSTS.md (460 líneas) con pricing como add-on
    - GTM-GATEWAY-INFRASTRUCTURE.md (NUEVO, 600+ líneas) - Infraestructura modular y escalabilidad
  - **Impacto en costos**: +5-15% egress (€1.50/mes adicional por 1M PV con optimizaciones)
  - **Pricing sugerido**: Add-on premium +€10-30/mes según plan
  - **Capacidad de escalabilidad**:
    - MVP (100 clientes): 10M req/mes, €30/mes
    - Growth (1,000 clientes): 100M req/mes, €88/mes
    - Scale (10,000 clientes): 1B req/mes, €590/mes
    - Enterprise (10,000+ clientes): >10B req/mes, €5k-15k/mes
- ✅ **Landing: Nuevas Secciones** - COMPLETADO (2026-02-05)
  - ✅ Traducciones en Español completas (~120 nuevas claves)
  - ✅ Sección "Cómo Empezar" ([lang]/como-empezar.astro) - Página completa con 3 pasos y explicación de modos
  - ✅ Sección "Modo GTM: Argumentación Legal" ([lang]/gtm-legal.astro) - Página completa con jurisprudencia y comparativas
  - ✅ Sección "SaaS Expandido" ([lang]/saas.astro) - Página completa con 3 planes, beneficios y CTA
- ✅ **Personalización CSS del Banner** - COMPLETADO (2026-02-05)
  - ✅ SDK: Función injectCustomCSS() para aplicar estilos personalizados
  - ✅ Dashboard: Campo customCSS en Settings con editor de texto y referencia de IDs/clases
  - ✅ WordPress Plugin: Sección "Personalización" con textarea y enlace a documentación
  - ✅ Templates: IDs añadidos a todos los elementos del banner (modal.html, bottom-bar.html, maiz.html)
  - ✅ Documentación: docs/PERSONALIZACION-BANNER.md (498 líneas) con 5 ejemplos completos y guía de mejores prácticas
- ✅ **Dashboard: Editor de Permisos y Fixes Críticos** - COMPLETADO (2026-02-08)
  - ✅ Editor de permisos con dropdown selector de roles (superadmin, pending)
  - ✅ Validación de último superadmin (no permite degradar si es el único)
  - ✅ Modal de confirmación para cambios críticos de rol
  - ✅ Fix Firestore Rules: Priorizar globalRole sobre role (backward compatibility)
  - ✅ Fix Onboarding: Permitir crear organizations/sites durante onboarding
  - ✅ Fix WaitingList: QueryClientProvider añadido a App.tsx
  - ✅ Fix Landing: Usar named database 'esbilla-cmp' en firebase.ts
  - ✅ Fix Landing: Colección 'waitingList' (camelCase) con validación de campos

**🔥 Tareas Inmediatas (Semana actual)**
- ✅ **Landing: Crear páginas nuevas en Astro** - COMPLETADO: como-empezar.astro, gtm-legal.astro, saas.astro
- ⏳ **Landing: Traducciones a 9 idiomas** - PENDIENTE: Traducir ~120 claves nuevas (ast, gl, eu, ca, en, fr, pt, it, de)
  - Ver TRANSLATIONS-PENDING.md para lista completa
  - Prioridad: ast (Asturianu) > en (English) > gl/eu/ca
  - Nota: Solo español (es) completado en este sprint
- ⏳ **Plugin WordPress: Traducciones** - EN PROGRESO: Archivos base .po creados (ast, en_US), faltan traducciones restantes
- ❌ **Plugin WordPress: Assets gráficos** - Iconos y banners para WordPress.org
- ✅ **Dashboard: Editor de permisos de usuario** - COMPLETADO: UI intuitiva para cambiar roles desde Users.tsx
  - ✅ Dropdown selector editable de roles globales (superadmin, pending)
  - ✅ Restricción crítica implementada: SIEMPRE debe haber al menos 1 superadmin
  - ✅ Validación automática: Bloquea degradación del último superadmin
  - ✅ Modal de confirmación para cambios críticos de rol
  - ✅ Warning visual si intenta eliminar el último superadmin (con contador)
  - ✅ Solo superadmin puede cambiar roles de otros usuarios
  - ✅ El usuario no puede cambiar su propio rol (seguridad)

**📊 Prioridad Media (Semana 3-4)**
5. ❌ **Tests automatizados completos** - Unit tests para componentes críticos, E2E tests para flujos principales
6. ❌ **Dashboard: Analytics avanzados** - Gráficos de evolución temporal, exportación CSV/PDF
7. ⚠️ **Multi-tenancy jerárquica** - Implementar distributors > companies > sites con permisos en cascada
8. ❌ **Unified user identity** - Sistema de identidad unificada entre dominios del mismo cliente

**🔧 Prioridad Baja (Backlog futuro)**
9. ❌ **Infra: Manifiestos Kubernetes** - k8s/ con Deployment, Service, Ingress, ConfigMap
10. ❌ **Cloud: Terraform IaC** - Infraestructura como código para Cloud Run, Firestore, IAM, VPC
11. ❌ **Infra: Helm Chart** - Chart parametrizable para despliegues multi-entorno
12. ❌ **SaaS: Registro público** - Self-service signup con verificación de email
13. ❌ **SaaS: Integración Stripe** - Planes de pago, billing, límites por plan
14. ❌ **Monitoring y Alertas** - Sentry/Datadog para errores, alertas de disponibilidad

### Auditoría Técnica: Esbilla-CMP Multi-tenant SaaS

**Última actualización**: 2026-02-05

| Criterio | Estado | Observaciones |
| :--- | :--- | :--- |
| Multi-tenancy jerárquica | ⚠️ [PARCIAL] | **MEJORADO**: Existe organizations > sites con gestión completa de usuarios y roles (org_owner/admin/viewer, site_admin/viewer). Falta: nivel distributor opcional |
| Gestión de usuarios | ✅ [OK] | **COMPLETADO**: Sistema completo de gestión de accesos, búsqueda por email, roles granulares, herencia de permisos org→site |
| Identidad Unificada | ⚠️ [PARCIAL] | userHash basado en footprintId+IP+UA (dispositivo), no en UID/Email del usuario entre dominios |
| Firestore Schema | ✅ [OK] | timestamp ✓, metadata.domain ✓, choices ✓, bannerVersion ✓, expiresAt ✓, users collection con orgAccess/siteAccess |
| Seguridad acceso cruzado | ✅ [OK] | **MEJORADO**: hasSiteAccess() con herencia de permisos de organización, aislamiento por roles |
| SDK sin claves maestras | ✅ [OK] | SDK llama a API backend (/api/consent/log), no accede directamente a Firestore |
| Privacidad/Anonimización | ✅ [OK] | userHash SHA-256, ipHash, endpoint transparencia /api/consent/history/:footprintId |
| CI/CD y Testing | ✅ [OK] | **NUEVO**: Entornos dev/prod, GitHub Actions workflows, tests automáticos en PRs |


**🔧 Mejoras Técnicas Recomendadas**

**Para producción inmediata:**
- ⚠️ **SDK Script Blocking** - Crítico para compliance GDPR, bloquear scripts antes de consentimiento
- ⚠️ **LICENSE file** - Necesario antes de cualquier uso comercial o contribuciones externas
- ⚠️ **Tests E2E** - Asegurar que flujos críticos no se rompan en producción

**Para escalabilidad futura:**
- 🔄 **Nivel Distributor opcional** - Si planeas modelo de revendedores/partners
  - Añadir campos `distributorId` a `organizations` y `sites`
  - Reglas Firestore: `hasDistributorAccess(distId)`
  - Queries segmentadas por distribuidor en analytics

- 🔄 **Unified User Identity** - Para tracking cross-domain del mismo usuario
  - Campo opcional `unifiedUserId` (hash de email si autenticado)
  - Permitir cruzar consentimientos entre dominios del mismo cliente
  - Útil para analytics multi-dominio

---

## 📅 Plan de Implementación Recomendado

### ✅ **Semana 0 (COMPLETADA - 2026-02-04)**
```
✅ Configurar entornos dev/prod
✅ CI/CD automático con GitHub Actions
✅ Dashboard: Gestión completa de usuarios y permisos
✅ Dashboard: Búsqueda y paginación en todas las páginas
✅ Documentación completa (Testing.md, SETUP.md)
```

### 🎯 **Semana 1 (Próxima) - Quick Wins**
```
Prioridad: Legalidad y Producción
├── ✅ Día 1: Crear CONTRIBUTING.md [COMPLETADO]
├── ✅ Día 2-3: SDK Script Blocking (MutationObserver) [COMPLETADO]
├── Pendiente: Crear LICENSE (MIT recomendado para open-source)
├── Pendiente: Tests E2E críticos (login, create site, add user)
└── Pendiente: Review de seguridad + deploy a producción
```

### 📊 **Semana 2-3 - Features de Valor**
```
Prioridad: Mejora de UX y Analytics
├── Dashboard: Editor visual de banner
│   ├── Color picker para background/text/buttons
│   ├── Position selector (bottom/top/modal)
│   ├── Preview en tiempo real
│   └── Guardar presets por organización
│
└── Analytics avanzados
    ├── Gráficos de evolución temporal (últimos 30 días)
    ├── Tasa de aceptación/rechazo por sitio
    ├── Comparativas entre sitios de una org
    └── Exportación CSV/PDF de reportes
```

### 🚀 **Semana 4-6 - Escalabilidad (Opcional)**
```
Prioridad: Preparar para crecimiento
├── Multi-tenancy jerárquica (si necesitas distribuidores)
├── Unified user identity (si necesitas cross-domain)
├── SaaS features (registro público, Stripe, planes)
└── Infrastructure as Code (Terraform + Helm)
```

---

## 🎯 Recomendación Inmediata

**✅ Completado (esta semana):**

1. ✅ **CONTRIBUTING.md** - Guía de contribución open-source completa
2. ✅ **SDK Script Blocking v1.5** - Compliance GDPR crítico implementado con MutationObserver
3. ✅ **Documentación completa** - SCRIPT-BLOCKING.md y ejemplo funcional

**Empezar por (próximos pasos inmediatos):**

1. **Testing en desarrollo** (medio día) - Probar script blocking en entorno dev con scripts reales
2. **Deploy a producción** (medio día) - Desplegar SDK v1.5 a producción
3. **LICENSE** (30 min) - Crítico para cualquier despliegue comercial

**Después (próximas 2 semanas):**

4. **Editor visual de banner** (3-4 días) - Alto valor para clientes
5. **Tests E2E** (2-3 días) - Seguridad en deploys futuros
6. **Analytics avanzados** (3-4 días) - Diferenciador competitivo

**Futuro (cuando haya demanda):**

8. **Nivel Distributor** - Solo si vendes a revendedores
9. **SaaS features** - Solo si quieres modelo self-service
10. **Kubernetes/Terraform** - Solo si escala requiere múltiples clusters

---

## 📊 **Dashboard de Analytics Anónimos**

**Prioridad:** Media
**Fecha agregada:** 2026-02-11
**Descripción:** Agregar visualización de estadísticas de bounce y pages_until_decision en el dashboard.

**Features a implementar:**
1. **Tarjetas de métricas:**
   - Tasa de bounce por sitio/layout
   - Promedio de páginas hasta decisión
   - Tiempo promedio hasta decisión

2. **Gráficas:**
   - Bounce rate por día (últimos 7/30/90 días)
   - Distribución de páginas navegadas antes de decisión
   - Comparativa por layout (modal vs bar vs corner)
   - Funnel de conversión: Banner mostrado → Decisión tomada

3. **Filtros:**
   - Por sitio
   - Por rango de fechas
   - Por layout del banner

**Colección de datos:** `analytics`
- Eventos de tipo "bounce" y "pages_until_decision"
- TTL de 90 días
- Sin datos personales (anónimo)

**Archivos involucrados:**
- Dashboard: `esbilla-dashboard/src/pages/Dashboard.tsx` o nueva página `Analytics.tsx`
- API: Ya existe endpoint `/api/analytics/event`
- Firestore rules: Ya implementadas
- SDK: Ya implementado el tracking automático

**Estado actual:**
- ✅ Backend completamente implementado
- ✅ SDK enviando eventos automáticamente
- ❌ Visualización en dashboard pendiente

