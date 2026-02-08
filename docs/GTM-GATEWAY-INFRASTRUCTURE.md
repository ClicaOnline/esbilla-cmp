# GTM Gateway Proxy - Infraestructura y Escalabilidad

**Fecha:** 2026-02-07
**Versión:** 1.8+
**Arquitectura:** Multi-tenant DNS-based proxy con escalabilidad modular

---

## 📖 Visión General

Este documento describe la arquitectura de infraestructura del GTM Gateway Proxy, diseñada para:

- ✅ **Escalabilidad:** Soportar miles de clientes sin problemas de rate-limit o concurrencia
- ✅ **Modularidad:** Cada componente puede escalar, mejorar y depurar independientemente
- ✅ **Compliance GDPR:** Todas las regiones en zona UE (sin transferencia de datos fuera de UE)
- ✅ **Alta disponibilidad:** 99.9% uptime con failover automático
- ✅ **Performance:** Cache global con CDN, compresión Brotli, latencia <50ms

---

## 🏗️ Arquitectura Modular

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                                 │
│                 https://gtm.cliente.com/gtm.js                        │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CAPA 1: Cloud CDN (Global)                         │
│  PoPs: Frankfurt, London, Paris, Amsterdam, Milán, Madrid             │
│  - Cache en edge (TTL 5 min)                                          │
│  - SSL/TLS termination                                                 │
│  - DDoS protection                                                     │
│  - Compresión Brotli/Gzip automática                                  │
└────────────┬───────────────────────────────────────────────────────────┘
             │ (Cache MISS)
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│              CAPA 2: Cloud Load Balancer (Multi-región UE)             │
│  Regiones: europe-west4 (NL), europe-west1 (BE), europe-west3 (DE)   │
│  - Health checks automáticos                                          │
│  - Failover entre regiones                                            │
│  - Balanceo por latencia                                              │
│  - Rate limiting global                                               │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│         CAPA 3: Cloud Run (Compute - Auto-scaling)                     │
│  Regiones: europe-west4 (primary), europe-west1 (secondary)          │
│  Instancias: 1 mínimo, 100 máximo por región                         │
│  - Auto-scaling basado en CPU/requests                               │
│  - In-memory cache por instancia (Map con TTL)                       │
│  - Rate limiting por IP (10 req/min)                                 │
│  - Identificación multi-tenant via Host header                       │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│              CAPA 4: Firestore (Database)                              │
│  Región: europe-west4 (Netherlands)                                   │
│  - sites collection (lookup gtmGatewayDomain → containerId)          │
│  - Query cache (5 min)                                                │
│  - Composite index: gtmGatewayDomain                                  │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│              CAPA 5: Google Tag Manager (External)                     │
│  - googletagmanager.com (GTM-XXXXX)                                   │
│  - G-XXXXX.fps.goog (GA4)                                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Modulares

### 1. Cloud CDN (Capa de Cache Global)

**Responsabilidad:** Cache en edge locations cerca del usuario final.

**Configuración:**
- **Backend:** Cloud Run via Load Balancer
- **Cache mode:** `CACHE_ALL_STATIC` con override por headers
- **TTL:** 5 minutos (configurable)
- **Compression:** Automática (Brotli/Gzip)
- **PoPs activos:** 6 en UE (Frankfurt, London, Paris, Amsterdam, Milán, Madrid)

**Escalabilidad:**
- ✅ **Horizontal:** Añadir más PoPs según demanda geográfica
- ✅ **Cache hit rate:** Objetivo >80% (reduce carga a Cloud Run)
- ✅ **Invalidación:** Por path o wildcard si es necesario

**Beneficios:**
- Reduce latencia a <50ms para cache hits
- Reduce egress de Cloud Run en 80-90%
- DDoS protection automática

**Costos:**
- Cache ingress: €0.02/GB (solo cache misses)
- Cache egress UE: €0.04-0.08/GB (según PoP)
- Cache hits: Gratis (solo egress del PoP)

**Configuración GCP:**
```bash
# Habilitar Cloud CDN en backend service
gcloud compute backend-services update esbilla-api-backend \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=300 \
  --max-ttl=3600 \
  --client-ttl=300 \
  --global
```

---

### 2. Cloud Load Balancer (Capa de Distribución)

**Responsabilidad:** Distribuir tráfico entre regiones y health checks.

**Configuración:**
- **Tipo:** Global HTTP(S) Load Balancer
- **SSL:** Managed certificate (auto-renovación)
- **Backend:** Cloud Run en 2-3 regiones UE
- **Health check:** `/api/health` cada 10s
- **Failover:** Automático si >50% instancias unhealthy
- **Timeout:** 30s
- **Balanceo:** Por latencia (envía a región más cercana)

**Escalabilidad:**
- ✅ **Multi-región:** 2 regiones activas (NL + BE), 1 standby (DE)
- ✅ **Failover automático:** Si region primary cae, traffic a secondary
- ✅ **Rate limiting global:** 1000 req/s total (ajustable)

**Beneficios:**
- Alta disponibilidad (99.95% SLA)
- Failover automático sin downtime
- SSL/TLS termination centralizado
- Logs centralizados en Cloud Logging

**Costos:**
- Forwarding rules: €0.025/hora (~€18/mes)
- Procesamiento: €0.008 por 10,000 requests
- Egress a Cloud Run: Gratis (mismo proyecto)

**Configuración GCP:**
```bash
# Crear load balancer con backends multi-región
gcloud compute url-maps create esbilla-api-lb \
  --default-service=esbilla-api-backend

gcloud compute target-https-proxies create esbilla-api-proxy \
  --url-map=esbilla-api-lb \
  --ssl-certificates=esbilla-ssl-cert

gcloud compute forwarding-rules create esbilla-api-forwarding-rule \
  --global \
  --target-https-proxy=esbilla-api-proxy \
  --ports=443
```

---

### 3. Cloud Run (Capa de Compute)

**Responsabilidad:** Ejecutar lógica de proxy (fetch a Google, cache, compresión).

**Configuración por región:**
- **Región primary:** europe-west4 (Netherlands) - 80% del tráfico
- **Región secondary:** europe-west1 (Belgium) - 20% del tráfico
- **Región standby:** europe-west3 (Germany) - 0% (failover)

**Configuración por instancia:**
- **CPU:** 1 vCPU
- **Memory:** 512 MB (suficiente para cache in-memory)
- **Min instances:** 1 (warm start)
- **Max instances:** 100 (auto-scaling)
- **Concurrency:** 80 requests por instancia
- **Timeout:** 60s
- **Startup time:** <5s (imagen optimizada)

**Auto-scaling triggers:**
- CPU > 70% → +1 instancia
- Requests > 60/instancia → +1 instancia
- CPU < 30% durante 5 min → -1 instancia

**In-Memory Cache:**
- **Estructura:** `Map<string, CacheEntry>`
- **Key:** `gtm_${domain}_${containerId}_${dataLayer}`
- **TTL:** 5 minutos
- **Max size:** 100 containers (LRU eviction)
- **Tamaño por entry:** ~80 KB (script GTM sin comprimir)
- **Total memory cache:** ~8 MB (despreciable vs 512 MB)

**Escalabilidad:**
- ✅ **Horizontal:** Auto-scaling 1-100 instancias por región
- ✅ **Vertical:** Aumentar CPU/memory si es necesario
- ✅ **Multi-región:** Añadir regiones adicionales (europe-west2, europe-north1)
- ✅ **Desacoplado:** Cada instancia es stateless (cache local no crítico)

**Beneficios:**
- Pay-per-use (solo pagas por requests procesados)
- Auto-scaling sin intervención manual
- Despliegue blue/green sin downtime
- Logs y métricas en Cloud Logging/Monitoring

**Costos:**
- CPU: €0.00002400/vCPU-s
- Memory: €0.00000250/GB-s
- Requests: €0.40 por millón
- **Ejemplo:** 1M requests/mes ≈ €5-10 (sin CDN), €1-2 (con CDN)

**Configuración GCP:**
```bash
# Deploy con configuración de auto-scaling
gcloud run deploy esbilla-api \
  --image=gcr.io/esbilla-cmp/esbilla-api:latest \
  --region=europe-west4 \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=80 \
  --cpu=1 \
  --memory=512Mi \
  --timeout=60s \
  --allow-unauthenticated \
  --set-env-vars="GCLOUD_PROJECT=esbilla-cmp,FIRESTORE_DATABASE_ID=esbilla-cmp"
```

---

### 4. Firestore (Capa de Configuración)

**Responsabilidad:** Almacenar configuración de sites (gtmGatewayDomain → containerId).

**Configuración:**
- **Región:** europe-west4 (Netherlands) - mismo datacenter que Cloud Run primary
- **Modo:** Native mode
- **Base de datos:** Named database `esbilla-cmp`

**Query crítico:**
```javascript
db.collection('sites')
  .where('gtmGatewayDomain', '==', 'gtm.cliente.com')
  .limit(1)
  .get()
```

**Índice requerido:**
```json
{
  "collectionGroup": "sites",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "gtmGatewayDomain", "order": "ASCENDING" }
  ]
}
```

**Cache de queries:**
- **Estructura:** `Map<string, SiteConfig>`
- **Key:** `gtmGatewayDomain`
- **TTL:** 5 minutos
- **Invalidación:** Manual si cambia configuración en Dashboard

**Escalabilidad:**
- ✅ **Reads:** Firestore escala automáticamente (sin límite práctico)
- ✅ **Cache:** Reduce reads en 95% (solo 1 query cada 5 min por dominio)
- ✅ **Multi-region replication:** Firestore multi-region si es necesario

**Beneficios:**
- Query latency <10ms (misma región que Cloud Run)
- Cache reduce costos de reads
- Firestore rules protegen contra acceso no autorizado

**Costos:**
- Reads: €0.036 por 100,000 documentos
- **Ejemplo:** 1M requests → 50,000 reads (con cache 95%) → €0.02/mes

---

### 5. Monitoring y Observabilidad

**Herramientas:**
- **Cloud Logging:** Logs estructurados de Cloud Run
- **Cloud Monitoring:** Métricas de CPU, memory, requests, latency
- **Cloud Trace:** Distributed tracing para debugging
- **Uptime Checks:** Monitoreo 24/7 desde múltiples regiones

**Métricas clave:**
- **Cache hit rate (CDN):** >80% esperado
- **Cache hit rate (in-memory):** >70% esperado
- **Latency p50:** <100ms
- **Latency p99:** <500ms
- **Error rate:** <0.1%
- **Availability:** >99.9%

**Alertas configuradas:**
- ⚠️ Error rate >1% durante 5 min → Email + Slack
- ⚠️ Latency p99 >1s durante 5 min → Email
- 🚨 Availability <99% durante 5 min → PagerDuty
- ⚠️ Cloud Run instances >80 → Email (escalar verticalmente)

**Logs importantes:**
```
[GTM Proxy] Multi-tenant routing: gtm.cliente.com → site abc123 → GTM-XXXXX
[GTM Proxy] Cache HIT para gtm.cliente.com (GTM-XXXXX)
[GTM Proxy] Cache MISS para gtm.cliente.com (GTM-XXXXX), fetching from Google...
[GTM Proxy] Cached gtm.cliente.com (GTM-XXXXX), size: 81234 bytes
[GTM Proxy] No site found for domain: gtm.noconfigurado.com
```

---

## 📊 Estrategia de Escalabilidad

### Fase 1: MVP (0-100 clientes)
- ✅ 1 región (europe-west4)
- ✅ Cloud Run: 1-10 instancias
- ✅ Sin CDN (opcional)
- ✅ Firestore cache 5 min
- **Capacidad:** ~10M requests/mes
- **Costo:** ~€5-15/mes

### Fase 2: Growth (100-1,000 clientes)
- ✅ 2 regiones (europe-west4 + europe-west1)
- ✅ Cloud Run: 1-50 instancias por región
- ✅ **Cloud CDN activado** (crítico para reducir costos)
- ✅ Load Balancer con failover
- **Capacidad:** ~100M requests/mes
- **Costo:** ~€50-150/mes

### Fase 3: Scale (1,000-10,000 clientes)
- ✅ 3 regiones (+ europe-west3 standby)
- ✅ Cloud Run: 1-100 instancias por región
- ✅ CDN con 6 PoPs en UE
- ✅ Firestore multi-region replication
- ✅ Cloud Armor para DDoS protection
- **Capacidad:** ~1B requests/mes
- **Costo:** ~€500-1,500/mes

### Fase 4: Enterprise (10,000+ clientes)
- ✅ 5+ regiones (toda Europa)
- ✅ Cloud Run: 1-200 instancias por región
- ✅ CDN con cache optimizado (TTL más largo)
- ✅ Dedicated Load Balancer per client segment
- ✅ Redis/Memorystore para cache compartido entre instancias
- ✅ Cloud SQL para analytics de usage
- **Capacidad:** >10B requests/mes
- **Costo:** ~€5,000-15,000/mes

---

## 🔐 Compliance GDPR

**Todas las regiones en zona UE:**
- ✅ europe-west4 (Netherlands)
- ✅ europe-west1 (Belgium)
- ✅ europe-west3 (Germany)
- ✅ europe-west2 (UK) - opcional si Brexit no es problema
- ✅ europe-north1 (Finland) - opcional para Nórdicos

**NO usar regiones fuera de UE:**
- ❌ us-central1, us-east1, us-west1 (EEUU)
- ❌ asia-southeast1, asia-east1 (Asia)
- ❌ australia-southeast1 (Australia)

**Justificación:**
- **GDPR Art. 44-50:** Transferencia de datos fuera de UE requiere garantías adicionales
- **Schrems II:** Cloud providers de EEUU (Google, AWS, Azure) tienen riesgo de acceso por FISA 702
- **Solución:** Mantener TODOS los datos y procesamiento en UE elimina el problema

**Datos que NO salen de UE:**
- ✅ Configuración de sites (Firestore UE)
- ✅ Logs de requests (Cloud Logging UE)
- ✅ Cache in-memory (Cloud Run UE)
- ✅ CDN cache (PoPs en UE)

**Único dato fuera de UE:**
- ✅ Fetch a Google Tag Manager (googletagmanager.com / fps.goog)
- ⚠️ Pero es necesario para funcionalidad (Google es el data processor)
- ✅ No se envían datos personales en el fetch (solo Container ID)

---

## 🚀 Despliegue Multi-Región

### Terraform Configuration (Infraestructure as Code)

```hcl
# terraform/gtm-gateway/main.tf

variable "regions" {
  type = list(object({
    name = string
    weight = number
    min_instances = number
    max_instances = number
  }))
  default = [
    {
      name = "europe-west4"
      weight = 70
      min_instances = 1
      max_instances = 100
    },
    {
      name = "europe-west1"
      weight = 30
      min_instances = 1
      max_instances = 50
    },
    {
      name = "europe-west3"
      weight = 0  # standby
      min_instances = 0
      max_instances = 50
    }
  ]
}

# Cloud Run services per region
resource "google_cloud_run_service" "esbilla_api" {
  for_each = { for r in var.regions : r.name => r }

  name     = "esbilla-api"
  location = each.value.name

  template {
    spec {
      containers {
        image = "gcr.io/esbilla-cmp/esbilla-api:latest"
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = each.value.min_instances
        "autoscaling.knative.dev/maxScale" = each.value.max_instances
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Backend service con Cloud CDN
resource "google_compute_backend_service" "esbilla_api" {
  name        = "esbilla-api-backend"
  protocol    = "HTTPS"
  timeout_sec = 30

  enable_cdn = true
  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 300
    max_ttl           = 3600
    client_ttl        = 300
    negative_caching  = false
  }

  dynamic "backend" {
    for_each = var.regions
    content {
      group = google_cloud_run_service.esbilla_api[backend.value.name].status[0].url
      balancing_mode = "UTILIZATION"
      capacity_scaler = backend.value.weight / 100
    }
  }

  health_checks = [google_compute_health_check.esbilla_api.id]
}

# Health check
resource "google_compute_health_check" "esbilla_api" {
  name               = "esbilla-api-health"
  check_interval_sec = 10
  timeout_sec        = 5

  https_health_check {
    port         = 443
    request_path = "/api/health"
  }
}

# Load Balancer
resource "google_compute_url_map" "esbilla_api" {
  name            = "esbilla-api-lb"
  default_service = google_compute_backend_service.esbilla_api.id
}

# SSL certificate
resource "google_compute_managed_ssl_certificate" "esbilla_api" {
  name = "esbilla-api-ssl"

  managed {
    domains = ["api.esbilla.com"]
  }
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "esbilla_api" {
  name             = "esbilla-api-proxy"
  url_map          = google_compute_url_map.esbilla_api.id
  ssl_certificates = [google_compute_managed_ssl_certificate.esbilla_api.id]
}

# Forwarding rule (IP pública)
resource "google_compute_global_forwarding_rule" "esbilla_api" {
  name       = "esbilla-api-forwarding-rule"
  target     = google_compute_target_https_proxy.esbilla_api.id
  port_range = "443"
  ip_protocol = "TCP"
}
```

**Desplegar con Terraform:**
```bash
cd terraform/gtm-gateway
terraform init
terraform plan
terraform apply
```

---

## 🧪 Testing de Escalabilidad

### Load Testing con k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up a 100 usuarios
    { duration: '5m', target: 100 },   // Mantener 100 usuarios
    { duration: '2m', target: 500 },   // Ramp-up a 500 usuarios
    { duration: '5m', target: 500 },   // Mantener 500 usuarios
    { duration: '2m', target: 1000 },  // Ramp-up a 1000 usuarios
    { duration: '5m', target: 1000 },  // Mantener 1000 usuarios
    { duration: '3m', target: 0 },     // Ramp-down a 0
  ],
};

export default function () {
  const domains = [
    'gtm.cliente1.com',
    'gtm.cliente2.com',
    'gtm.cliente3.com',
    // ... 100 dominios diferentes para simular multi-tenancy
  ];

  const domain = domains[Math.floor(Math.random() * domains.length)];

  const res = http.get(`https://${domain}/gtm.js`, {
    headers: { 'Host': domain }
  });

  check(res, {
    'status 200': (r) => r.status === 200,
    'latency < 500ms': (r) => r.timings.duration < 500,
    'has X-Cache header': (r) => r.headers['X-Cache'] !== undefined,
  });

  sleep(1);
}
```

**Ejecutar load test:**
```bash
k6 run --vus 1000 --duration 30m load-test.js
```

**Objetivos:**
- ✅ 0% error rate
- ✅ p50 latency <100ms
- ✅ p99 latency <500ms
- ✅ Cache hit rate >80%
- ✅ Auto-scaling funciona correctamente

---

## 💰 Proyección de Costos por Fase

### Fase 1: MVP (100 clientes, 10M req/mes)
| Componente | Costo/mes |
|------------|-----------|
| Cloud Run (1 región) | €5 |
| Firestore reads | €0.02 |
| Egress (sin CDN) | €25 |
| **Total** | **€30** |

### Fase 2: Growth (1,000 clientes, 100M req/mes)
| Componente | Costo/mes |
|------------|-----------|
| Cloud Run (2 regiones) | €15 |
| Cloud CDN cache | €10 |
| Cloud CDN egress | €40 |
| Load Balancer | €18 |
| Firestore reads | €0.20 |
| Monitoring | €5 |
| **Total** | **€88** |

### Fase 3: Scale (10,000 clientes, 1B req/mes)
| Componente | Costo/mes |
|------------|-----------|
| Cloud Run (3 regiones) | €50 |
| Cloud CDN cache | €100 |
| Cloud CDN egress | €400 |
| Load Balancer | €18 |
| Firestore reads | €2 |
| Monitoring | €20 |
| **Total** | **€590** |

**Pricing para clientes:**
- Fase 1: €10-15/mes por cliente (margen 50%)
- Fase 2: €15-25/mes por cliente (margen 70%)
- Fase 3: €20-30/mes por cliente (margen 80%)

---

## 🎯 Conclusión

Esta arquitectura modular permite:

1. ✅ **Escalar horizontalmente** añadiendo regiones o instancias según demanda
2. ✅ **Escalar verticalmente** aumentando CPU/memory de Cloud Run si es necesario
3. ✅ **Aislar componentes** para debug y mejoras independientes:
   - CDN: Ajustar cache TTL o añadir PoPs
   - Load Balancer: Cambiar algoritmo de balanceo o añadir regiones
   - Cloud Run: Optimizar código, añadir instancias o cambiar configuración
   - Firestore: Optimizar queries o añadir índices
4. ✅ **Cumplir GDPR** manteniendo TODO el procesamiento en UE
5. ✅ **Alta disponibilidad** con failover automático y multi-región
6. ✅ **Costos predecibles** con pricing por cliente transparente

**Próximos pasos:**
1. Implementar Terraform config para despliegue automatizado
2. Configurar Cloud CDN con backends multi-región
3. Añadir monitoring y alertas
4. Load testing con k6
5. Documentar runbooks de incidencias

---

🌽 **Esbilla CMP** — Consent management made in Asturias
