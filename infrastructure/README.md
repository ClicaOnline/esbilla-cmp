# Infraestructura de Esbilla CMP - GTM Gateway Proxy

Scripts de configuración para la infraestructura modular del GTM Gateway Proxy.

## 📋 Requisitos Previos

- **gcloud CLI** instalado y autenticado
- Permisos de administrador en el proyecto GCP `esbilla-cmp`
- Cloud Run ya desplegado (al menos en `europe-west4`)

## 🚀 Orden de Ejecución

### Opción A: Deploy Automático (Recomendado)

```bash
cd infrastructure
chmod +x deploy-all.sh
./deploy-all.sh
```

**Qué hace:**
- ✅ Despliega índices de Firestore
- ✅ Configura Load Balancer multi-región
- ✅ Habilita Cloud CDN
- ✅ Configura Monitoring y Alertas
- ✅ Verificaciones interactivas entre pasos
- ✅ Resumen completo al finalizar

**Tiempo estimado:** 15-30 minutos (incluyendo espera de SSL certificate)

---

### Opción B: Deploy Manual (Paso a Paso)

#### 0. Deploy Firestore Indexes

```bash
cd ..  # Ir a raíz del proyecto
firebase deploy --only firestore:indexes --project=esbilla-cmp
```

**Qué hace:**
- Despliega índice para `sites.gtmGatewayDomain`
- Necesario para queries rápidas de multi-tenant routing

**Tiempo estimado:** 2-5 minutos (construcción del índice puede tardar más)

#### 1. Configurar Load Balancer

```bash
cd infrastructure
chmod +x setup-load-balancer.sh
./setup-load-balancer.sh
```

**Qué hace:**
- ✅ Verifica servicios Cloud Run en 3 regiones (europe-west4, west1, west3)
- ✅ Crea Network Endpoint Groups (NEGs) para cada región
- ✅ Configura Health Check (`/api/health`)
- ✅ Crea Backend Service con distribución de tráfico:
  - Primary (70%): europe-west4
  - Secondary (30%): europe-west1
  - Standby (0%): europe-west3 (solo failover)
- ✅ Reserva IP estática global
- ✅ Crea certificado SSL managed para `api.esbilla.com`
- ✅ Configura URL Map, HTTPS Proxy y Forwarding Rule

**Tiempo estimado:** 5-10 minutos

**Output:**
- IP estática global
- Certificado SSL (tarda ~15 min en aprovisionarse)

### 2. Habilitar Cloud CDN

```bash
chmod +x setup-cdn.sh
./setup-cdn.sh
```

**Qué hace:**
- ✅ Habilita Cloud CDN en el Backend Service
- ✅ Configura cache mode: `CACHE_ALL_STATIC`
- ✅ Configura TTL: 5 minutos (default), 1 hora (max)
- ✅ Configura cache key policy (protocol + host + query string)
- ✅ Activa PoPs en 6 regiones de Europa

**Tiempo estimado:** 2-3 minutos

**Beneficios:**
- 📉 Reducción de latencia: 66% (150ms → 50ms para cache hits)
- 📉 Reducción de egress Cloud Run: 80-90%
- 💰 Ahorro: ~€5/mes por 1M pageviews

### 3. Configurar Monitoring y Alertas

```bash
chmod +x setup-monitoring.sh
./setup-monitoring.sh
```

**Qué hace:**
- ✅ Crea canal de notificación por email
- ✅ Configura Uptime Check (`/api/health`) desde Europa y USA
- ✅ Crea 4 políticas de alerta:
  1. Error Rate > 1% durante 5 min
  2. Latency P99 > 1s durante 5 min
  3. Availability < 99% durante 5 min
  4. Cloud Run instances > 80
- ✅ Crea dashboard personalizado con métricas clave

**Tiempo estimado:** 3-5 minutos

**Dashboard incluye:**
- Requests per second
- Latency P50/P99
- Error rate (5xx)
- Instance count
- CDN cache hit rate

## 📊 Verificación Post-Deploy

### Verificar Load Balancer

```bash
# Obtener IP
gcloud compute addresses describe esbilla-api-ip --global --project=esbilla-cmp --format="get(address)"

# Verificar health
curl -I https://api.esbilla.com/api/health

# Verificar certificado SSL
openssl s_client -connect api.esbilla.com:443 -servername api.esbilla.com
```

### Verificar CDN

```bash
# Primera request (debe ser MISS)
curl -I https://api.esbilla.com/gtm.js?id=GTM-XXXXX

# Segunda request (debe ser HIT)
curl -I https://api.esbilla.com/gtm.js?id=GTM-XXXXX

# Buscar header: X-Cache: HIT
```

### Verificar Monitoring

```bash
# Listar alertas
gcloud alpha monitoring policies list --project=esbilla-cmp

# Ver uptime checks
gcloud monitoring uptime list --project=esbilla-cmp

# Ver dashboards
gcloud monitoring dashboards list --project=esbilla-cmp
```

## 🔧 Comandos Útiles

### Invalidar Cache de CDN

```bash
gcloud compute url-maps invalidate-cdn-cache esbilla-api-backend \
  --path '/gtm.js' \
  --global \
  --project=esbilla-cmp
```

### Ver Logs en Tiempo Real

```bash
gcloud logging tail "resource.type=cloud_run_revision resource.labels.service_name=esbilla-api" \
  --project=esbilla-cmp
```

### Escalar Cloud Run Manualmente

```bash
gcloud run services update esbilla-api \
  --region=europe-west4 \
  --min-instances=2 \
  --max-instances=150 \
  --project=esbilla-cmp
```

### Ver Métricas de Cache Hit Rate

```bash
gcloud monitoring time-series list \
  --filter='metric.type="loadbalancing.googleapis.com/https/request_count" AND metric.label.cache_result!=""' \
  --project=esbilla-cmp
```

## 🛠️ Troubleshooting

### Error: "Backend service not found"

**Solución:** Ejecutar `setup-load-balancer.sh` primero.

### Error: "SSL certificate provisioning"

**Causa:** El certificado managed tarda 15-60 minutos en aprovisionarse.

**Solución:** Esperar. Verificar estado:
```bash
gcloud compute ssl-certificates describe esbilla-api-ssl --global --project=esbilla-cmp
```

### Error: "Permission denied"

**Solución:** Verificar permisos IAM:
```bash
gcloud projects get-iam-policy esbilla-cmp
```

Roles necesarios:
- `roles/run.admin`
- `roles/compute.admin`
- `roles/monitoring.admin`

### CDN no cachea (siempre MISS)

**Posibles causas:**
1. Cache-Control headers incorrectos en Cloud Run
2. Query strings dinámicos
3. Cookies en la request

**Solución:**
```bash
# Verificar headers de respuesta
curl -I https://api.esbilla.com/gtm.js?id=GTM-XXXXX

# Debe tener: Cache-Control: public, max-age=300
```

## 📚 Documentación Relacionada

- [GTM-GATEWAY-INFRASTRUCTURE.md](../docs/GTM-GATEWAY-INFRASTRUCTURE.md) - Arquitectura completa
- [GTM-GATEWAY-SETUP.md](../docs/GTM-GATEWAY-SETUP.md) - Guía de configuración
- [GTM-GATEWAY-PROXY-COSTS.md](../docs/GTM-GATEWAY-PROXY-COSTS.md) - Análisis de costos

## 📊 Costos Estimados

### Infraestructura base
- Load Balancer forwarding rules: €18/mes
- Cloud Run (1M req): €5-10/mes
- Cloud CDN cache: €10/mes
- Cloud CDN egress: €40/mes
- Firestore reads: €0.20/mes
- Monitoring: €5/mes

**Total:** ~€88/mes para 100M requests/mes (1,000 clientes)

### Con optimizaciones (CDN + cache)
- Reducción egress Cloud Run: 80-90%
- Cache hit rate objetivo: >80%
- Ahorro neto: ~€50/mes vs sin CDN

---

🌽 **Esbilla CMP** — Consent management made in Asturias
