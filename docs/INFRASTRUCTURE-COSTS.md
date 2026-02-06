# Análisis de Infraestructura y Costes - Esbilla CMP

**Última actualización**: 2026-02-05
**Región**: europe-west4 (Netherlands) - Cumplimiento GDPR

---

## 📊 Resumen Ejecutivo

Esbilla CMP utiliza una arquitectura serverless en Google Cloud Platform optimizada para costes variables y escalabilidad automática. Los costes principales están directamente relacionados con el uso (page views y consentimientos), lo que permite ofrecer planes por volumen.

### Costes Mensuales Estimados (por uso)

| Volumen | Firestore | Cloud Run | Hosting | **Total** | Coste/1K PV |
|---------|-----------|-----------|---------|-----------|-------------|
| **10K PV/mes** | €0.15 | €0.20 | €0.05 | **€0.40** | €0.04 |
| **100K PV/mes** | €1.50 | €1.80 | €0.10 | **€3.40** | €0.034 |
| **500K PV/mes** | €7.50 | €8.50 | €0.20 | **€16.20** | €0.032 |
| **1M PV/mes** | €15.00 | €16.80 | €0.30 | **€32.10** | €0.032 |
| **10M PV/mes** | €150.00 | €165.00 | €1.00 | **€316.00** | €0.032 |

**Nota**: Costes base fijos ~€2-5/mes (DB instances, cache, storage base).

---

## 🏗️ Componentes de Infraestructura

### 1. **Google Cloud Firestore** (Base de datos)
**Tipo**: NoSQL serverless con TTL automático
**Región**: europe-west4
**Database ID**: `esbilla-cmp` (named database, no default)

#### Colecciones Principales
- **`consents`** - Registro inmutable de consentimientos (TTL: 3 años)
  - 1 write por consentimiento registrado
  - TTL field: `deleteAt` (eliminación automática sin coste)
  - Tamaño promedio: ~500 bytes por documento

- **`stats`** - Pre-agregación diaria de métricas
  - 1 write por consentimiento (merge incremental)
  - Reduce reads para analytics (1 read por día vs. miles de reads de `consents`)
  - Documento format: `{siteId}_daily_{YYYY-MM-DD}`

- **`sites`** - Configuración de sitios web
  - 1 read por carga de SDK (con cache 5 min)
  - ~50-100 reads/día por sitio activo

- **`users`** - Gestión de usuarios del dashboard
  - Operaciones infrecuentes (login, CRUD)

- **`organizations`** - Multi-tenancy SaaS
  - Operaciones infrecuentes

#### Operaciones por Page View (promedio)
| Operación | Cantidad | Coste (€) | Descripción |
|-----------|----------|-----------|-------------|
| **Writes** | 2 | €0.000036 | 1x `consents` + 1x `stats` (merge) |
| **Reads** | 0.2 | €0.000001 | Config (cacheado 5min) + validación dominio |
| **Storage** | 500 bytes | €0.000000009 | ~0.5KB por consent (retenido 3 años) |
| **TTL Deletes** | 0 | €0 | Eliminación automática sin coste |
| **TOTAL/PV** | - | **~€0.000037** | **€0.037 por 1,000 PV** |

**Pricing Firestore (europe-west4):**
- Writes: €0.0549 por 100,000 operaciones = €0.00000054 por write
- Reads: €0.0197 por 100,000 operaciones = €0.00000019 por read
- Storage: €0.162 per GB/mes
- TTL deletes: Gratis (sin coste operacional)

#### Índices Compuestos (7 activos)
- `consents`: `siteId + createdAt DESC`
- `consents`: `footprintId + createdAt DESC`
- `consents`: `userHash + createdAt DESC`
- `stats`: `siteId + date DESC`
- `stats`: `date DESC`
- `sites`: `name ASC`
- `users`: `createdAt DESC`

**Coste índices**: Incluido en storage (sin coste adicional significativo)

---

### 2. **Google Cloud Run** (API + Dashboard)
**Región**: europe-west4
**Contenedor**: Multi-stage Docker (Node.js 20 Alpine)

#### Servicios
- **esbilla-api** (producción)
- **esbilla-api-dev** (desarrollo)

#### Configuración Actual
- **CPU**: 1 vCPU
- **Memory**: 512 MB
- **Concurrency**: 80 requests simultáneas
- **Min instances**: 0 (escala a cero cuando no hay tráfico)
- **Max instances**: 100 (auto-scaling)
- **Timeout**: 60s (requests) / 300s (cold start)

#### Operaciones por Request
| Tipo Request | CPU Time | Memory | Coste (€) |
|--------------|----------|--------|-----------|
| **SDK delivery** (`/sdk.js`) | ~5ms | 50 MB | €0.0000008 |
| **Config** (`/api/config/:id`) | ~20ms | 80 MB | €0.000003 |
| **Log consent** (`/api/consent/log`) | ~150ms | 120 MB | €0.000024 |
| **Dashboard page** (SPA static) | ~3ms | 40 MB | €0.0000005 |

**Cold start**: ~1.2s (solo primera request tras inactividad)

**Pricing Cloud Run (europe-west4):**
- vCPU: €0.00002400 por vCPU-second
- Memory: €0.00000250 por GB-second
- Requests: €0.40 por millón = €0.0000004 por request
- Networking: Egress gratis dentro de GCP (europe-west4)

#### Costes Mensuales Estimados

**Escenario 1: 100,000 page views/mes**
- SDK loads: 100,000 × €0.0000008 = €0.08
- Config: 100,000 × €0.000003 = €0.30
- Consent logs: 100,000 × €0.000024 = €2.40
- Dashboard: ~2,000 × €0.0000005 = €0.001
- **Subtotal Cloud Run**: **€2.78/mes**

**Escenario 2: 1M page views/mes**
- SDK + Config + Logs: 1M × €0.0000278 = €27.80
- Dashboard: ~10,000 × €0.0000005 = €0.005
- **Subtotal Cloud Run**: **€27.81/mes**

---

### 3. **Firebase Hosting** (Landing Page + Rewrites)
**Región**: Global CDN con origen en europe-west4

#### Targets (4 sites)
- **prod** - Landing page principal (esbilla.com)
- **dev** - Landing development (dev.esbilla.com)
- **dashboard-prod** - Dashboard SPA (app.esbilla.com)
- **dashboard-dev** - Dashboard dev (app-dev.esbilla.com)

#### Rewrites Configurados
```json
{
  "/api/**": "Cloud Run esbilla-api (europe-west4)"
}
```
**Beneficio**: API calls no pasan por hosting (coste reducido)

#### Almacenamiento
- Landing page build: ~15 MB (Astro + assets)
- Dashboard build: ~2.5 MB (React SPA minificado)
- SDK files: ~30 KB (`sdk.js` + templates)
- **Total storage**: ~18 MB

#### Tráfico CDN
- Landing page: ~500 KB por sesión (HTML + CSS + images)
- Dashboard: ~400 KB initial load + ~50 KB lazy
- SDK: ~20 KB por page view (cacheado por navegador 1 año)

**Pricing Firebase Hosting:**
- Storage: €0.026 per GB/mes
- Transfer (CDN): €0.15 per GB (primeros 10 GB gratis/mes)

**Costes Estimados**:
- Storage: €0.0005/mes (~18 MB)
- Transfer (100K PV): ~2 GB = Gratis (< 10 GB)
- Transfer (1M PV): ~20 GB = €1.50/mes (10 GB gratis + 10 GB × €0.15)
- **Total hosting**: **€0.10 - €2/mes** (escalable con PV)

---

### 4. **GitHub Actions** (CI/CD)
**Plan**: Free tier (público, open-source)

#### Workflows Activos
- `deploy-api.yml` - Deploy a Cloud Run (triggers en push a `esbilla-api/`)
- `deploy-public.yml` - Deploy a Firebase Hosting (triggers en push a `esbilla-public/`)
- `test.yml` - Tests automáticos en PRs

**Build time promedio**:
- API + Dashboard: ~8 minutos (multi-stage Docker)
- Landing page: ~3 minutos (Astro build)
- Tests: ~2 minutos

**Coste**: €0 (dentro del free tier de GitHub)

---

### 5. **Networking y Egress**
**Región**: europe-west4 (optimizado para EU)

#### Tráfico Interno (Gratis)
- Firestore ↔ Cloud Run (misma región)
- Firebase Hosting ↔ Cloud Run (rewrite interno)
- GitHub Actions → Cloud Run (deploy via gcloud CLI)

#### Tráfico Externo (Pagado)
- SDK delivery: ~20 KB por page view (cacheado por navegador)
- API responses: ~500 bytes promedio (JSON comprimido con gzip)
- Dashboard SPA: ~400 KB initial + lazy loading

**Pricing Egress (GCP):**
- EU a EU: Gratis (misma región)
- EU a Worldwide: €0.085 per GB (primeros 10 GB gratis)

**Costes Estimados**:
- 100K PV: ~2 GB = Gratis
- 1M PV: ~20 GB = €0.85/mes (10 GB gratis + 10 GB × €0.085)
- 10M PV: ~200 GB = €16.15/mes

---

## 🔧 Optimizaciones Implementadas

### 1. **Pre-agregación de Stats (Firestore)**
**Problema**: Consultar analytics requiere leer miles de documentos `consents`.
**Solución**: Collection `stats` con contadores diarios pre-calculados.

**Impacto**:
- ❌ **Sin stats**: 1,000 reads para mostrar gráfico de 7 días (€0.0002)
- ✅ **Con stats**: 7 reads (uno por día) (€0.0000013)
- **Ahorro**: 99.35% en reads de analytics

**Ejemplo**: Dashboard con 100 sitios consultando stats 10 veces/día:
- Sin pre-agregación: 100 × 10 × 1,000 = **1M reads/día** = **€6/día** = **€180/mes**
- Con pre-agregación: 100 × 10 × 7 = **7K reads/día** = **€0.04/día** = **€1.20/mes**
- **Ahorro anual**: **€2,148** 💰

### 2. **Cache de Configuración (5 minutos)**
**Problema**: Cada page view leería config de Firestore.
**Solución**: Map cache en memoria (Cloud Run) con TTL 5 minutos.

**Impacto**:
- ❌ **Sin cache**: 100K PV = 100K reads (€0.019)
- ✅ **Con cache**: 100K PV = ~200 reads (5 min TTL) (€0.00004)
- **Ahorro**: 99.8% en reads de config

**Ejemplo**: Sitio con 1M PV/mes:
- Sin cache: **1M reads** = **€0.19/mes**
- Con cache: **~2,000 reads** = **€0.0004/mes**
- **Ahorro anual**: **€2.28** (por sitio) × 100 sitios = **€228/año**

### 3. **TTL Automático (3 años)**
**Problema**: Almacenar consents indefinidamente viola GDPR y aumenta costes.
**Solución**: Field `deleteAt` con Firestore TTL (eliminación automática sin coste).

**Impacto**:
- Storage máximo por consent: 500 bytes × 3 años
- Eliminación: Gratis (sin batch deletes manuales)
- Compliance: GDPR Art. 5.1.e (limitación del plazo de conservación)

**Ejemplo**: Sitio con 1M PV/año durante 5 años:
- Sin TTL: 5M documents × 500 bytes = **2.5 GB** = **€0.40/mes** perpetuo
- Con TTL: Max 3M documents (últimos 3 años) = **1.5 GB** = **€0.24/mes** estable
- **Ahorro**: €0.16/mes × 100 sitios = **€192/año**

### 4. **Rate Limiting (In-Memory)**
**Problema**: Bots/spam podrían generar writes costosos.
**Solución**: 30 req/min por IP en memoria (Map con TTL 1 min).

**Impacto**:
- Bloquea spam sin queries a Firestore
- Coste adicional: €0 (lógica en memoria)
- Protección DDoS básica

**Ejemplo**: Ataque de 100K req/min bloqueado:
- Sin rate limit: **100K writes** × €0.00000054 = **€0.054/min** = **€3.24/hora** 😱
- Con rate limit: **3,000 writes** (30 req/min × 100 IPs) = **€0.0016/min** = **€0.096/hora**
- **Ahorro**: 97% de writes maliciosos bloqueados

### 5. **Validación de Dominio (Cache 5min)**
**Problema**: Verificar dominio autorizados requiere leer collection `sites`.
**Solución**: Cache de dominios registrados en memoria (5 min TTL).

**Impacto**:
- ❌ **Sin cache**: 100K consents = 100K reads de `sites` (€0.019)
- ✅ **Con cache**: 100K consents = ~200 reads (€0.00004)
- **Ahorro**: 99.8% en reads de seguridad

### 6. **Static Assets con Cache-Control**
**Landing page**: `max-age=31536000, immutable` (1 año)
**SDK**: Cacheado por navegador (delivery casi gratis tras first load)

**Impacto**:
- 100K usuarios returning: 90% menos SDK loads (€0.07 ahorro)
- CDN hits reducidos: €0.10/mes menos en hosting

---

## 💰 Modelo de Pricing Sugerido

### Variables de Coste Clave
1. **Page Views (PV)** - Principal métrica de coste variable
2. **Sitios activos** - Reads de config (mínimo con cache)
3. **Dashboard usage** - Insignificante (<5% del coste)

### Márgenes Recomendados

| Coste Real | Precio Plan | Margen | Notas |
|------------|-------------|--------|-------|
| €0.037/1K PV | €0.10-0.15/1K PV | **170-305%** | Competitivo (cookiebot: €0.20/1K PV) |
| €3.40/100K PV | €10/100K PV | **194%** | Sweet spot para SMBs |
| €32/1M PV | €100/1M PV | **213%** | Enterprise margin |

### Planes Propuestos (basados en costes reales)

#### 🆓 **Plan Comunidad (Free)**
- **Límite**: 10,000 PV/mes
- **Coste real**: €0.40/mes
- **Precio**: €0 (acquisition funnel)
- **Restricciones**: 1 sitio, dashboard básico, soporte comunidad
- **Objetivo**: Captación + evangelización open-source

#### 💼 **Plan Profesional**
- **Límite**: 100,000 PV/mes
- **Coste real**: €3.40/mes
- **Precio sugerido**: **€29/mes** (€25/mes anual)
- **Margen bruto**: 85% (€25.60/mes)
- **Incluye**: 5 sitios, API access, soporte prioritario, exportación datos

**Justificación**:
- Cookiebot: €39/mes (100K PV)
- OneTrust: €90/mes (100K PV)
- **Esbilla competitivo**: €29/mes (25% más barato que Cookiebot)

#### 🏢 **Plan Empresa**
- **Límite**: Personalizado (ej: 1M PV/mes)
- **Coste real**: €32/mes (1M PV)
- **Precio base**: **€299/mes** (negociable)
- **Margen bruto**: 89% (€267/mes)
- **Incluye**: Sitios ilimitados, white-label, SLA 99.9%, consultoría RGPD

**Add-ons**:
- +500K PV: +€80/mes (coste real: €16)
- White-label dashboard: +€100/mes (one-time setup)
- Consultoría legal: €200/hora (externo)

---

## 📈 Proyecciones de Coste por Escala

### Escenario 1: 100 clientes Plan Pro (100K PV cada uno)
| Concepto | Cálculo | Coste/mes |
|----------|---------|-----------|
| **Firestore** | 100 × €1.50 | €150 |
| **Cloud Run** | 100 × €1.80 | €180 |
| **Hosting** | Base + CDN | €10 |
| **Egress** | 200 GB | €17 |
| **TOTAL COSTES** | - | **€357/mes** |
| **Ingresos** | 100 × €29 | **€2,900/mes** |
| **Margen bruto** | - | **€2,543/mes (87.7%)** |

### Escenario 2: 1,000 clientes mixtos
- 800 × Free (10K PV) = €320 coste / €0 ingreso (acquisition)
- 180 × Pro (100K PV) = €612 coste / **€5,220** ingreso
- 20 × Enterprise (1M PV) = €640 coste / **€5,980** ingreso
- **TOTAL COSTES**: **€1,572/mes**
- **TOTAL INGRESOS**: **€11,200/mes**
- **Margen bruto**: **€9,628/mes (86.0%)**

### Escenario 3: 10,000 clientes (escala SaaS)
- 8,000 × Free = €3,200 coste / €0 ingreso
- 1,800 × Pro = €6,120 coste / **€52,200** ingreso
- 200 × Enterprise (avg 2M PV) = €12,800 coste / **€59,800** ingreso
- **TOTAL COSTES**: **€22,120/mes**
- **TOTAL INGRESOS**: **€112,000/mes**
- **Margen bruto**: **€89,880/mes (80.2%)**
- **ARR proyectado**: **€1.34M/año**

---

## 🚨 Puntos de Alerta de Coste

### 1. **Firestore Writes Explosivos**
**Trigger**: >10M writes/día
**Causa**: Ataque DDoS o loop infinito en SDK
**Mitigación**: Rate limiting + validación User-Agent + CORS estricto
**Coste pico**: 10M writes = **€5.40/día** (sin rate limit) → **€0.16/día** (con rate limit)

### 2. **Cloud Run Instancias Sin Escalar a Cero**
**Trigger**: Requests constantes (health checks mal configurados)
**Causa**: External monitoring pinging constantemente
**Mitigación**: Min instances = 0, health check cada 5 min (no 30s)
**Coste pico**: 1 instancia 24/7 = **€17/mes** → **€0.50/mes** (escala a cero)

### 3. **Egress a Regiones No-EU**
**Trigger**: >50% tráfico fuera de EU
**Causa**: Clientes en US/Asia sin CDN local
**Mitigación**: Firebase Hosting CDN (gratis) + SDK cache 1 año
**Coste pico**: 1 TB egress = **€85/mes** → **€8/mes** (con CDN + cache)

### 4. **Analytics Queries Sin Pre-agregación**
**Trigger**: Dashboard consultando `consents` directamente
**Causa**: Feature nueva sin usar collection `stats`
**Mitigación**: SIEMPRE usar `stats`, nunca queries masivas a `consents`
**Coste pico**: €180/mes → **€1.20/mes** (con pre-agregación)

---

## 🎯 Recomendaciones Estratégicas

### Para Pricing
1. **Anclar precio en Page Views** - Correlación directa con costes (transparente)
2. **Ofrecer descuento anual (10-15%)** - Mejora cash flow y retención
3. **Add-ons claros** - White-label (+€100/mes), Extra PV (+€80/500K)
4. **Free tier generoso** - 10K PV/mes captación, conversión a Pro en ~5-10%

### Para Optimización
1. **Monitorear writes diarios** - Alert si >5M writes/día (anomalía)
2. **Cache agresivo** - Config 5min, Stats 1min, SDK 1 año navegador
3. **Pre-agregación obligatoria** - Nunca queries directas a `consents` desde dashboard
4. **Firestore TTL extendido opcional** - Ofrecer retención 5 años como add-on (+€50/mes)

### Para Escalabilidad
1. **Multi-region actual OK hasta 10K clientes** - europe-west4 suficiente
2. **Si >50% clientes US** - Considerar Cloud Run multi-region (us-central1)
3. **Si >100K clientes** - Migrar stats a BigQuery (€0.020 per GB query)
4. **Firestore scaling** - Actual arquitectura soporta hasta 10M writes/día sin cambios

---

## 📊 Comparativa Competitiva

| Proveedor | Precio 100K PV | Precio 1M PV | Self-hosted | Open-source |
|-----------|----------------|--------------|-------------|-------------|
| **Esbilla** | €29/mes | €100-150/mes | ✅ Gratis | ✅ MIT |
| Cookiebot | €39/mes | €199/mes | ❌ | ❌ |
| OneTrust | €90/mes | €500+/mes | ❌ | ❌ |
| Usercentrics | €49/mes | €249/mes | ❌ | ❌ |
| Osano | $99/mes (~€92) | $499/mes (~€465) | ❌ | ❌ |

**Ventaja competitiva de Esbilla**:
- 25-40% más barato que competencia
- Única opción open-source con SaaS gestionado
- Sin vendor lock-in (self-host disponible)
- Transparencia total de costes (código abierto)

---

## 📝 Notas Finales

### Costes No Incluidos (Externos)
- **Dominio**: €10-30/año (esbilla.com, app.esbilla.com)
- **Email marketing**: €0-50/mes (si hay newsletter)
- **Soporte**: Coste humano (no infraestructura)
- **Legal/compliance review**: €500-2,000 one-time

### Monitorización Recomendada
- **Cloud Monitoring** (GCP): €0.50-5/mes (alertas)
- **Sentry** (errores): €0-26/mes (plan team)
- **Uptime monitoring**: Gratis (UptimeRobot free tier)

### Next Steps
1. ✅ Confirmar márgenes con finanzas
2. ✅ Validar precios con early adopters (user interviews)
3. ⏳ Implementar billing (Stripe) - Ver backlog.md
4. ⏳ Dashboard de usage per-plan (límites, alertas)
5. ⏳ Sistema de upgrades automático (free → pro cuando alcanza límite)

---

**© 2026 Clica Online Soluciones S.L. - Esbilla CMP**
**Confidencial** - Solo para uso interno
