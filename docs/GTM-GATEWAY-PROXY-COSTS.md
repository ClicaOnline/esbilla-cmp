# Análisis de Costos: GTM Gateway Proxy vs Implementación Actual

**Fecha**: 2026-02-07
**Versión**: 1.0
**Contexto**: Evaluación del impacto en facturación antes de implementar arquitectura de proxy para GTM Gateway

---

## 📊 Resumen Ejecutivo

### Costos Actuales (Sin GTM Gateway Proxy)

| Volumen | Firestore | Cloud Run | Hosting | Egress | **Total** |
|---------|-----------|-----------|---------|--------|-----------|
| **100K PV/mes** | €1.50 | €1.80 | €0.10 | €0 | **€3.40** |
| **500K PV/mes** | €7.50 | €8.50 | €0.20 | €0 | **€16.20** |
| **1M PV/mes** | €15.00 | €16.80 | €0.30 | €1.00 | **€32.10** |
| **10M PV/mes** | €150.00 | €165.00 | €1.00 | €17.00 | **€316.00** |

### Costos CON GTM Gateway Proxy (Propuesto)

| Volumen | Firestore | Cloud Run | Hosting | Egress | **Total** | **Δ Coste** | **% Aumento** |
|---------|-----------|-----------|---------|--------|-----------|-------------|---------------|
| **100K PV/mes** | €1.50 | €2.05 (+€0.25) | €0.10 | €0 | **€3.65** | **+€0.25** | **+7.4%** |
| **500K PV/mes** | €7.50 | €9.75 (+€1.25) | €0.20 | €2.98 (+€2.98) | **€20.43** | **+€4.23** | **+26.1%** |
| **1M PV/mes** | €15.00 | €19.30 (+€2.50) | €0.30 | €6.95 (+€5.95) | **€41.55** | **+€9.45** | **+29.4%** |
| **10M PV/mes** | €150.00 | €190.00 (+€25.00) | €1.00 | €76.45 (+€59.45) | **€400.45** | **+€84.45** | **+26.7%** |

**⚠️ Impacto crítico**: El egress bandwidth es el factor de costo más significativo, representando **63% del aumento** en volúmenes altos.

---

## 🔍 Análisis Detallado por Componente

### 1. Cloud Run: Procesamiento de Proxy

#### Tráfico Adicional por Page View con GTM Gateway

Cada page view genera **2 nuevos requests** al proxy de Esbilla:

| Request | CPU Time | Memory | Egress | Descripción |
|---------|----------|--------|--------|-------------|
| **GET /gtm.js** | 50ms | 120 MB | 80 KB | Proxy del script GTM principal |
| **GET /metrics/healthy** | 20ms | 80 MB | 100 bytes | Health check de GTM |
| **TOTAL/PV** | **70ms** | - | **~80 KB** | - |

#### Cálculo de Costos Cloud Run

**Pricing Cloud Run (europe-west4):**
- vCPU: €0.00002400 por vCPU-second
- Memory: €0.00000250 por GB-second
- Requests: €0.40 por millón = €0.0000004 por request

**Por cada page view:**
- CPU: 0.070s × €0.000024 = €0.00000168
- Memory: 0.120 GB × 0.070s × €0.0000025 = €0.000000021
- Requests: 2 × €0.0000004 = €0.0000008
- **Subtotal**: **€0.0000025 por PV**

**Costos mensuales adicionales:**
- 100K PV: 100,000 × €0.0000025 = **+€0.25/mes**
- 500K PV: 500,000 × €0.0000025 = **+€1.25/mes**
- 1M PV: 1,000,000 × €0.0000025 = **+€2.50/mes**
- 10M PV: 10,000,000 × €0.0000025 = **+€25.00/mes**

**✅ Impacto moderado**: Cloud Run adicional representa solo 6-8% del costo total.

---

### 2. Egress Bandwidth: Factor Crítico

#### Problema: Scripts GTM Son Grandes

GTM carga múltiples scripts por page view:
- `gtm.js`: ~50-100 KB (depende del container)
- Respuestas de `/metrics/*`: ~100 bytes cada una
- **Total egress por PV**: ~80 KB promedio

#### ⚠️ Sin GTM Gateway Proxy (Actual)
- Usuario carga GTM **directamente desde Google**
- Esbilla no paga egress (€0 para nosotros)
- Google asume el costo de bandwidth

#### 🚨 CON GTM Gateway Proxy (Propuesto)
- Usuario carga GTM **desde esbilla-api (Cloud Run)**
- Esbilla hace fetch a Google (`G-{measurementId}.fps.goog`)
- Esbilla proxy la respuesta al usuario
- **Esbilla paga egress** por cada respuesta

#### Cálculo de Egress

**Pricing Egress GCP:**
- Primeros 10 GB/mes: **Gratis**
- EU a Worldwide: **€0.085 per GB**

**Egress mensual:**
- 100K PV: 100,000 × 80 KB = **8 GB** → **€0** (dentro de 10 GB gratis)
- 500K PV: 500,000 × 80 KB = **40 GB** → (40 - 10) × €0.085 = **€2.98/mes**
- 1M PV: 1,000,000 × 80 KB = **80 GB** → (80 - 10) × €0.085 = **€5.95/mes**
- 10M PV: 10,000,000 × 80 KB = **800 GB** → (800 - 10) × €0.085 = **€67.15/mes**

**🔥 Conclusión**: En volúmenes altos (>500K PV/mes), el egress es el **mayor componente de costo adicional** (63-70% del aumento).

---

### 3. Ingress Bandwidth (Esbilla ← Google)

**Buena noticia**: Ingress es **gratis** en Google Cloud Platform.

- Esbilla hace fetch a `https://G-{measurementId}.fps.goog/gtm.js`
- Google responde con ~80 KB
- **Coste ingress**: **€0** (no se cobra)

---

### 4. Latencia y Experiencia de Usuario

#### Sin Proxy (Implementación Actual - Incorrecta para tus necesidades)
```
Usuario → [DNS CNAME] → googletagmanager.com → Usuario
Latencia: ~50-100ms (CDN de Google)
```

#### Con Proxy (Implementación Propuesta)
```
Usuario → esbilla-api (Cloud Run) → G-{measurementId}.fps.goog → esbilla-api → Usuario
Latencia: ~150-250ms (+100ms aprox)
```

**⚠️ Impacto en rendimiento**:
- **+100-150ms de latencia** por cada carga de GTM
- Multiplicado por 2-3 requests GTM por page view
- **Total**: ~300-500ms adicionales en carga de página

**Mitigación posible**:
- Cache de `gtm.js` en Cloud Run (5-10 min TTL)
- Reduce latencia a ~50ms en hits de cache
- Reduce egress significativamente

---

## 💰 Comparativa de Costos por Volumen

### Escenario 1: Cliente con 100K PV/mes

| Componente | Sin Proxy | Con Proxy | Δ Coste |
|------------|-----------|-----------|---------|
| Firestore | €1.50 | €1.50 | €0 |
| Cloud Run | €1.80 | €2.05 | **+€0.25** |
| Hosting | €0.10 | €0.10 | €0 |
| Egress | €0 | €0 | €0 (dentro 10GB gratis) |
| **TOTAL** | **€3.40** | **€3.65** | **+€0.25 (7.4%)** |

**✅ Impacto bajo**: Aumento de solo €0.25/mes por cliente.

---

### Escenario 2: Cliente con 1M PV/mes

| Componente | Sin Proxy | Con Proxy | Δ Coste |
|------------|-----------|-----------|---------|
| Firestore | €15.00 | €15.00 | €0 |
| Cloud Run | €16.80 | €19.30 | **+€2.50** |
| Hosting | €0.30 | €0.30 | €0 |
| Egress | €1.00 | €6.95 | **+€5.95** |
| **TOTAL** | **€32.10** | **€41.55** | **+€9.45 (29.4%)** |

**⚠️ Impacto moderado**: Aumento de €9.45/mes por cliente (~€113/año).

---

### Escenario 3: 100 clientes Plan Pro (100K PV cada uno)

| Métrica | Sin Proxy | Con Proxy | Δ Coste |
|---------|-----------|-----------|---------|
| Coste infraestructura | €357/mes | €382/mes | **+€25/mes** |
| Ingresos (100 × €29) | €2,900/mes | €2,900/mes | €0 |
| **Margen bruto** | **€2,543 (87.7%)** | **€2,518 (86.8%)** | **-0.9pp** |

**✅ Impacto mínimo**: Pérdida de 0.9 puntos porcentuales de margen.

---

### Escenario 4: 20 clientes Enterprise (1M PV cada uno)

| Métrica | Sin Proxy | Con Proxy | Δ Coste |
|---------|-----------|-----------|---------|
| Coste infraestructura | €640/mes | €831/mes | **+€191/mes** |
| Ingresos (20 × €299) | €5,980/mes | €5,980/mes | €0 |
| **Margen bruto** | **€5,340 (89.3%)** | **€5,149 (86.1%)** | **-3.2pp** |

**⚠️ Impacto moderado**: Pérdida de 3.2 puntos porcentuales de margen en clientes Enterprise.

---

## 🎯 Optimizaciones para Reducir Costos

### 1. Cache Agresivo de `gtm.js` en Cloud Run

**Problema**: Cada request hace fetch a Google.

**Solución**: Cache en memoria (Map) con TTL configurable.

```javascript
const gtmCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

app.get('/gtm.js', async (req, res) => {
  const measurementId = req.query.id; // G-12345
  const cacheKey = `gtm_${measurementId}`;

  // Check cache
  const cached = gtmCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.send(cached.content);
  }

  // Fetch from Google
  const response = await fetch(`https://${measurementId}.fps.goog/gtm.js`);
  const content = await response.text();

  // Store in cache
  gtmCache.set(cacheKey, { content, timestamp: Date.now() });

  res.send(content);
});
```

**Impacto**:
- **Reducción de latencia**: 150ms → 50ms (66% mejora)
- **Reducción de egress**: 80% de hits de cache = 16 KB efectivo por PV
- **Ahorro en 1M PV**:
  - Egress: 80 GB → 16 GB = (16 - 10) × €0.085 = **€0.51** (vs €5.95)
  - **Ahorro**: €5.44/mes por 1M PV (92% reducción)

**✅ Recomendación crítica**: Implementar cache con TTL 5-10 minutos.

---

### 2. Usar CDN Delante de Cloud Run

**Problema**: Cada request al proxy genera egress desde europe-west4.

**Solución**: Google Cloud CDN o Cloudflare CDN delante de Cloud Run.

**Configuración con Cloud CDN**:
- Habilitar Cloud CDN en Cloud Run backend
- Cache-Control: `public, max-age=300` (5 min)
- Cloud CDN cachea en ~100 PoPs globales

**Impacto**:
- **Reducción de latencia global**: 150ms → 50-80ms
- **Reducción de egress de Cloud Run**: ~90% (CDN absorbe tráfico)
- **Coste Cloud CDN**: €0.08 per GB (similar a egress, pero con PoPs globales)
- **Mejora experiencia usuario**: Cache más cercano

**Coste adicional**:
- Cloud CDN: €0.08 per GB (vs €0.085 egress directo)
- **Ahorro neto**: Mínimo, pero mejora latencia significativamente

**✅ Recomendación**: Implementar Cloud CDN si >50% tráfico fuera de EU.

---

### 3. Rate Limiting Específico para GTM Proxy

**Problema**: Posible abuso del endpoint `/gtm.js`.

**Solución**: Rate limit independiente para rutas de proxy.

```javascript
const gtmRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Max 10 cargas de gtm.js por IP/min
  message: 'Too many GTM requests'
});

app.get('/gtm.js', gtmRateLimit, async (req, res) => {
  // ...proxy logic
});
```

**Impacto**:
- Previene abuse/spam de scripts GTM
- Protege contra scripts maliciosos que recargan GTM en loop

---

### 4. Comprimir Respuestas con Brotli

**Problema**: GTM scripts son ~80 KB sin comprimir.

**Solución**: Comprimir respuestas con Brotli antes de enviar al cliente.

```javascript
import compression from 'compression';

app.use(compression({
  level: 6, // Brotli level
  threshold: 1024 // Solo comprimir si >1KB
}));
```

**Impacto**:
- **Reducción de tamaño**: 80 KB → 20-25 KB (70-75% reducción)
- **Ahorro en egress**:
  - 1M PV: 80 GB → 20 GB = (20 - 10) × €0.085 = **€0.85** (vs €5.95)
  - **Ahorro**: €5.10/mes por 1M PV (85.7% reducción)

**✅ Recomendación crítica**: Implementar compresión Brotli/Gzip SIEMPRE.

---

## 🔄 Arquitectura Alternativa: Híbrida (CNAME + Verificación)

### Propuesta: Mantener CNAME Directo pero con Validación Esbilla

**Flujo**:
1. Cliente configura CNAME: `gtm.cliente.com → googletagmanager.com`
2. Esbilla sirve solo el archivo de verificación: `/.well-known/gateway/gtm-verification.txt`
3. GTM carga directamente desde Google (sin proxy de Esbilla)
4. Esbilla controla la configuración pero no proxy el tráfico

**Ventajas**:
- ✅ **€0 adicional en infraestructura** (sin proxy)
- ✅ **Sin latencia adicional** (carga directa de Google)
- ✅ **Sin egress** para Esbilla
- ✅ **Configuración gestionada desde Dashboard**

**Desventajas**:
- ❌ **No hay control de headers** (X-Forwarded-CountryRegion, etc.)
- ❌ **No hay proxy de geolocalización**
- ❌ **Funcionalidad limitada** vs Google Cloud Load Balancer

**¿Cuándo usar esta alternativa?**
- Si el objetivo es solo **mejorar tasas de tracking** (evitar ad blockers)
- Si **no necesitas manipular headers** de geolocalización
- Si **costos de proxy son prohibitivos** para tu modelo de negocio

---

## 📈 Proyección de Costos a Escala

### Con Implementación de Optimizaciones (Cache + Brotli)

| Volumen | Coste Base | Coste Proxy (Sin Opt) | Coste Proxy (Con Opt) | Ahorro |
|---------|------------|----------------------|----------------------|--------|
| **100K PV** | €3.40 | €3.65 (+€0.25) | €3.50 (+€0.10) | **€0.15** |
| **500K PV** | €16.20 | €20.43 (+€4.23) | €17.10 (+€0.90) | **€3.33** |
| **1M PV** | €32.10 | €41.55 (+€9.45) | €33.60 (+€1.50) | **€7.95** |
| **10M PV** | €316.00 | €400.45 (+€84.45) | €331.00 (+€15.00) | **€69.45** |

**✅ Con optimizaciones**: Aumento de solo **5-15%** vs 26-29% sin optimizar.

---

## 🎯 Recomendaciones Finales

### Opción 1: Implementar Proxy con Optimizaciones (Recomendado)

**Implementar**:
1. ✅ Cache de `gtm.js` en memoria (TTL 5 min)
2. ✅ Compresión Brotli/Gzip de respuestas
3. ✅ Rate limiting en rutas de proxy
4. ✅ Cloud CDN si >50% tráfico fuera de EU

**Resultado**:
- Aumento de costos: **5-15%** (manejable)
- Control completo de headers y geolocalización
- Funcionalidad completa de Gateway

**Margen ajustado**:
- Plan Pro (100K PV): 87.7% → **86.5%** (-1.2pp)
- Plan Enterprise (1M PV): 89.3% → **87.8%** (-1.5pp)

**✅ Viable comercialmente**: Márgenes siguen siendo excelentes (>85%).

---

### Opción 2: Implementación Híbrida (Alternativa Barata)

**Implementar**:
1. Cliente configura CNAME directo a Google
2. Esbilla solo sirve verificación (no proxy)
3. Dashboard gestiona configuración

**Resultado**:
- Aumento de costos: **€0** (sin impacto)
- Funcionalidad limitada (sin control de headers)
- Suficiente para evitar ad blockers

**Casos de uso**:
- Clientes en Plan Free (10K PV)
- Clientes que solo quieren evasión de ad blockers
- Clientes sensibles al precio

---

### Opción 3: Ofrecer GTM Gateway como Add-on

**Pricing propuesto**:
- Plan Pro: +€10/mes (incluye proxy optimizado hasta 100K PV)
- Plan Enterprise: +€30/mes (incluye proxy optimizado hasta 1M PV)

**Justificación**:
- Cubre costo adicional (€0.10 - €1.50/mes) con margen
- Feature premium (no todos los clientes lo necesitan)
- Modelo opt-in (clientes deciden si vale la pena)

**Ventaja**:
- No impacta márgenes de clientes que no usan GTM Gateway
- Revenue adicional para subsidiar desarrollo
- Competitivo vs Google Cloud Load Balancer (que requiere infra propia)

---

## 💡 Conclusión

### Resumen de Impacto en Facturación

| Escenario | Aumento Sin Opt | Aumento Con Opt | Recomendación |
|-----------|----------------|----------------|---------------|
| **100K PV/mes** | +€0.25 (7.4%) | +€0.10 (2.9%) | ✅ **Implementar** |
| **500K PV/mes** | +€4.23 (26.1%) | +€0.90 (5.6%) | ✅ **Implementar con Opt** |
| **1M PV/mes** | +€9.45 (29.4%) | +€1.50 (4.7%) | ✅ **Implementar con Opt** |
| **10M PV/mes** | +€84.45 (26.7%) | +€15.00 (4.7%) | ⚠️ **Con CDN obligatorio** |

**🎯 Decisión recomendada**:

**SÍ, implementar GTM Gateway como proxy CON optimizaciones obligatorias**:
- Cache en memoria (5 min TTL)
- Compresión Brotli/Gzip
- Rate limiting

**Resultado esperado**:
- Aumento de costos: **5-15%** máximo
- Márgenes siguen >85% (excelentes)
- Funcionalidad completa de Gateway
- Diferenciador competitivo fuerte

**Consideraciones adicionales**:
- Monitorear egress mensualmente (alertas si >100 GB/mes)
- Implementar Cloud CDN si tráfico crece a >10M PV/mes
- Considerar add-on pricing (+€10-30/mes) para clientes que lo usen

---

**Última actualización**: 2026-02-07
**Próximo paso**: Validar con equipo financiero y decidir si se implementa proxy o alternativa híbrida.

---

🌽 **Esbilla CMP** — Consent management made in Asturias
