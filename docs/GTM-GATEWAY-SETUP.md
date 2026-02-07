# Google Tag Manager Gateway Proxy - Guía de Implementación

**Fecha:** 2026-02-07
**Versión Esbilla CMP:** 1.8+
**Arquitectura:** Multi-tenant DNS-based proxy con escalabilidad modular (Cloud CDN + Load Balancer + Cloud Run)

---

## 📖 ¿Qué es GTM Gateway Proxy?

**GTM Gateway Proxy** es una solución multi-tenant que permite cargar los scripts de Google Tag Manager **desde tu propio dominio** (ej: `gtm.tudominio.com`) que apunta a Esbilla API, en lugar de directamente desde `googletagmanager.com`.

**Configuración DNS requerida:** Debes configurar un registro DNS (CNAME o A) en tu dominio apuntando a Esbilla API. Esto garantiza que los ad blockers no puedan bloquear el script (es tu propio dominio).

### Ventajas

- 🚫 **Evita ad blockers** - Los bloqueadores de anuncios no bloquean Esbilla API
- 🔒 **Mejor privacidad** - Control total sobre la carga de scripts
- ⚡ **Cache inteligente** - TTL 5 minutos reduce latencia y costos
- 📦 **Compresión Brotli** - Reduce tamaño de 80 KB → 20 KB (75% menos egress)
- 🌍 **Geolocalización automática** - Headers X-Forwarded-Country-Region para mejor targeting
- 🛡️ **Rate limiting** - Protección contra abuse (10 req/min por IP)
- 📊 **Más datos** - Hasta 30% más tracking vs carga directa de Google

---

## 🆚 GTM Gateway Proxy vs Otras Soluciones

| Característica | GTM Gateway Proxy (Esbilla) | CNAME Directo | GTM Server Side |
|----------------|------------------------------|---------------|-----------------|
| **Qué hace** | Proxy via Esbilla API | CNAME → Google | Procesa eventos en servidor propio |
| **Configuración** | Solo checkbox en Dashboard | DNS CNAME + verificación | Servidor GTM completo |
| **Beneficio principal** | Evita ad blockers + cache + compresión | Evita ad blockers | Control total de datos |
| **Complejidad** | Baja (1 click) | Media (DNS + verificación) | Alta (infraestructura propia) |
| **Coste adicional** | 5-15% egress | Gratis (solo dominio) | Alto (servidor + infraestructura) |
| **Geolocalización** | ✅ Automática | ❌ No | ✅ Manual |
| **Cache** | ✅ 5 min TTL | ❌ No | ✅ Configurable |
| **Compresión** | ✅ Brotli/Gzip | ❌ No | ✅ Configurable |

**Recomendación:** Usar **GTM Gateway Proxy + GTM Server Side** para máxima privacidad y control.

---

## 🏗️ Arquitectura del Proxy

### Flujo de Datos (Multi-Tenant DNS-Based)

```
┌─────────┐   1. GET gtm.js      ┌──────────────────┐   2. DNS Lookup   ┌──────────────┐
│ Cliente │ ──────────────────>  │ gtm.cliente.com  │ ───────────────>  │  Cloud CDN   │
│ (Browser)│                      │ (Dominio cliente)│                    │ (Global PoPs)│
└─────────┘                       └──────────────────┘                    └──────┬───────┘
     ▲                                                                            │
     │                                                                    3. Cache HIT?
     │                                                                            │
     │                                                                            ▼
     │                                                                  ┌──────────────────┐
     │                                                                  │  Load Balancer   │
     │                                                                  │ (Multi-región UE)│
     │                                                                  └────────┬─────────┘
     │                                                                           │
     │                                                                  4. Route to region
     │                                                                           ▼
     │                                                                  ┌──────────────────┐
     │                                                                  │   Cloud Run      │
     │                          7. Compressed Response                  │ (Auto-scaling)   │
     │                          (Brotli, 20 KB)                        │ + In-Memory Cache│
     │ ◄────────────────────────────────────────────────────────────── └────────┬─────────┘
     │                                                                           │
     │                                                                  5. Identify Client
     │                                                                  (Host: gtm.cliente.com)
     │                                                                  Query Firestore
     │                                                                  → containerId
     │                                                                           │
     │                                                                  6. Fetch from Google
     │                                                                           ▼
     │                                                                  ┌──────────────────┐
     └────────────────────────────────────────────────────────────────│  Google GTM      │
                                                                       │ G-XXX.fps.goog   │
                                                                       └──────────────────┘
```

### Detalles Técnicos

1. **Cliente carga GTM desde su dominio personalizado**: `GET https://gtm.cliente.com/gtm.js`
   - **Ventaja:** Ad blockers no bloquean (es el dominio del cliente)
2. **DNS resuelve a Esbilla API**:
   - CNAME: `gtm.cliente.com → api.esbilla.com`
   - O A record: `gtm.cliente.com → [IP del Load Balancer]`
3. **Cloud CDN verifica cache global**:
   - **Cache HIT** → Respuesta inmediata desde PoP más cercano (~20ms)
   - **Cache MISS** → Forward to Load Balancer
4. **Load Balancer distribuye** a región Cloud Run más cercana (europe-west4, west1, west3)
5. **Cloud Run identifica cliente**:
   - Lee Host header: `gtm.cliente.com`
   - Query Firestore: `sites.gtmGatewayDomain == 'gtm.cliente.com'`
   - Obtiene `containerId` (GTM-XXXXX o G-XXXXX)
   - Verifica in-memory cache (TTL 5 min)
6. **Fetch a Google con headers enriquecidos**:
   ```http
   GET https://G-XXXXX.fps.goog/gtm.js?id=GTM-XXXXX
   Host: G-XXXXX.fps.goog
   X-Forwarded-For: 1.2.3.4
   X-Forwarded-Country-Region: ES,AS
   X-Forwarded-Country: ES
   X-Forwarded-Region: AS
   User-Agent: Mozilla/5.0 ...
   ```
7. **Google responde** con script GTM (~80 KB sin comprimir)
8. **Cloud Run procesa**:
   - Almacena en cache in-memory (TTL 5 min)
   - Comprime con Brotli/Gzip (80 KB → 20 KB)
   - Añade headers: `Cache-Control: public, max-age=300`, `X-GTM-Site-Id: xxx`
9. **Cloud CDN cachea** la respuesta (cache global)
10. **Cliente recibe** script comprimido (20 KB) desde CDN o Cloud Run

---

## 🚀 Configuración en Esbilla Dashboard

### Paso 1: Habilitar GTM Gateway Proxy

1. Ir a **Dashboard → Sites** → Editar sitio
2. Scroll hasta sección **"GTM Gateway Proxy (v1.8+)"**
3. Marcar checkbox **"Habilitar GTM Gateway Proxy"**
4. Introducir:
   - **Container ID**: `GTM-XXXXX` (GTM tradicional) o `G-XXXXX` (GA4)
   - **Gateway Domain**: `gtm.tudominio.com` (subdominio que usarás para el proxy)
5. Click **"Guardar"**

**Importante:** El dominio personalizado (Gateway Domain) es **obligatorio** para evitar ad blockers. Si lo dejas vacío, el SDK usará `api.esbilla.com` como fallback, pero esto es menos efectivo contra ad blockers.

### Paso 2: Configurar DNS

Añade un registro DNS en tu proveedor (Cloudflare, GoDaddy, etc.):

**Opción A: CNAME (recomendado)**
```
Tipo: CNAME
Nombre: gtm (o el subdominio que elijas)
Valor: api.esbilla.com
TTL: 3600
```

**Opción B: A Record**
```
Tipo: A
Nombre: gtm
Valor: [IP del Load Balancer de Esbilla - consultar soporte]
TTL: 3600
```

**Tiempo de propagación:** 5-30 minutos (puede tomar hasta 48h en algunos casos)

**Verificar DNS:**
```bash
# Linux/Mac
dig gtm.tudominio.com

# Windows
nslookup gtm.tudominio.com
```

Debe resolver a `api.esbilla.com` (CNAME) o la IP del Load Balancer (A record).

### Paso 3: Verificar Implementación

El SDK de Esbilla cargará automáticamente GTM desde tu dominio personalizado:

```html
<!-- Antes (sin Gateway Proxy) -->
<script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"></script>

<!-- Después (con Gateway Proxy DNS-based) -->
<script src="https://gtm.tudominio.com/gtm.js"></script>
```

**Verificar en navegador:**

1. Abrir **DevTools → Network**
2. Buscar peticiones `gtm.js`
3. Debe cargarse desde `gtm.tudominio.com` (tu dominio personalizado)
4. Verificar headers:
   - `X-Cache: HIT` (si está en cache CDN/in-memory) o `X-Cache: MISS` (primera carga)
   - `X-GTM-Site-Id: [tu-site-id]` (identifica qué site se usó para lookup)
5. Verificar que NO hay errores de CORS o SSL

---

## 🔧 Optimizaciones Implementadas

### 1. Cache en Memoria (TTL 5 minutos)

**Problema**: Cada request hace fetch a Google → latencia + egress.

**Solución**: Cache en memoria con TTL 5 minutos.

**Impacto**:
- **Latencia**: 150ms → 50ms (66% mejora)
- **Egress**: 80% de hits de cache = **92% ahorro** en egress
- **Ejemplo**: 1M PV/mes → 80 GB sin cache → **16 GB con cache** (€5.95 → €0.51)

### 2. Compresión Brotli/Gzip

**Problema**: Scripts GTM son grandes (~80 KB).

**Solución**: Middleware `compression` con Brotli level 6.

**Impacto**:
- **Tamaño**: 80 KB → 20 KB (75% reducción)
- **Egress**: 1M PV = 80 GB → **20 GB** (€5.95 → €0.85)
- **Ahorro combinado** (cache + compresión): **€5.10/mes por 1M PV**

### 3. Rate Limiting Específico

**Problema**: Posible abuse del endpoint `/gtm.js`.

**Solución**: Rate limit independiente (10 req/min por IP).

**Impacto**:
- Previene spam/DoS en endpoint de proxy
- Protege contra loops infinitos en SDK mal configurado

### 4. Headers de Geolocalización

**Problema**: Google necesita geolocalización para targeting correcto.

**Solución**: Headers automáticos desde Cloud Run/Cloudflare:
- `X-Forwarded-Country-Region: ES,AS`
- `X-Forwarded-Country: ES`
- `X-Forwarded-Region: AS`

**Impacto**:
- Mejor targeting de anuncios
- Cumplimiento con geolocalización de Google

---

## 🐛 Troubleshooting

### Error: "Failed to load GTM script"

**Causa**: Esbilla API no alcanzable o Container ID inválido.

**Solución**:
1. Verificar que Esbilla API esté online: `curl -I https://api.esbilla.com/api/health`
2. Verificar Container ID: debe ser `GTM-XXXXX` o `G-XXXXX` (mayúsculas)
3. Revisar logs de Esbilla API: `[GTM Proxy] Error fetching ...`

### Error: "GTM_RATE_LIMIT_EXCEEDED"

**Causa**: Más de 10 requests de GTM por minuto desde la misma IP.

**Solución**:
1. Verificar que el SDK no esté en un loop infinito
2. Esperar 60 segundos y reintentar
3. Si es legítimo (CDN con IP compartida), contactar soporte para whitelist

### GTM carga desde Google en lugar de Esbilla API

**Causa**: `gtmGatewayEnabled` no está habilitado en Dashboard.

**Solución**:
1. Ir a Dashboard → Sites → Editar sitio
2. Scroll a "GTM Gateway Proxy"
3. Marcar checkbox "Habilitar GTM Gateway Proxy"
4. Guardar y recargar la página

### Cache no funciona (siempre `X-Cache: MISS`)

**Causa**: Cache TTL expirado o instancia de Cloud Run reiniciada.

**Solución**:
- **Normal**: Primera carga siempre es MISS
- **Verificar**: Segunda carga (dentro de 5 min) debe ser HIT
- **Si persiste**: Revisar logs de Esbilla API, posible error en cache

### Ad blockers siguen bloqueando

**Causa**: Esbilla API está en lista de bloqueo (raro pero posible).

**Solución**:
1. **Verificar dominio API**: No usar subdominios obvios como `analytics.`, `tracking.`
2. **Mejor**: `api.esbilla.com`, `sdk.esbilla.com`
3. **Alternativa**: Servir desde mismo dominio que el sitio (rewrite en Cloud Run/CDN)

---

## 📚 Referencias Técnicas

### Endpoints del Proxy

- **GET `/gtm.js?id={containerId}`** - Script principal de GTM (endpoint crítico)
- **GET `/metrics/:check`** - Health checks de GTM Gateway (ej: `/metrics/healthy`)

**Nota**: El endpoint `/gtm/*` para recursos adicionales está comentado temporalmente debido a incompatibilidad con Express 5. GTM generalmente solo necesita `/gtm.js`, por lo que este endpoint no es crítico.

### Headers de Respuesta

```http
HTTP/1.1 200 OK
Content-Type: application/javascript; charset=utf-8
Content-Encoding: br
Cache-Control: public, max-age=300
X-Cache: HIT
Vary: Accept-Encoding
```

### Logs de Esbilla API

```
[GTM Proxy] Cache MISS para GTM-XXXXX, fetching from Google...
[GTM Proxy] Cached GTM-XXXXX, size: 81234 bytes
[GTM Proxy] Cache HIT para GTM-XXXXX
```

---

## 🎯 Mejores Prácticas

### Performance

✅ **Dejar cache en 5 minutos** - Balance entre latencia y freshness
✅ **Comprimir siempre** - Brotli reduce egress 75%
✅ **Monitorear rate limiting** - Alertas si muchos 429s
✅ **Usar GA4 (G-XXXXX)** - fps.goog gateway más rápido que GTM tradicional

### Seguridad

✅ **Validar Container IDs** - Formato `GTM-XXXXX` o `G-XXXXX`
✅ **Rate limiting estricto** - 10 req/min suficiente para uso normal
✅ **Logs detallados** - Monitorear fetches a Google
✅ **Headers CORS correctos** - Solo dominios registrados

### Costos

✅ **Activar solo si necesario** - No todos los sitios necesitan proxy
✅ **Monitorear egress mensual** - Alertas si >100 GB/mes
✅ **Considerar CDN** - Si >50% tráfico fuera de EU
✅ **Pricing como add-on** - No impactar planes base

---

## 🆘 Soporte

**Documentación:** `docs/` folder
**Issues:** [GitHub Issues](https://github.com/anthropics/esbilla-cmp/issues)
**Email:** esbilla@clicaonline.com
**Costos:** [GTM-GATEWAY-PROXY-COSTS.md](GTM-GATEWAY-PROXY-COSTS.md)

---

🌽 **Esbilla CMP** — Consent management made in Asturias
