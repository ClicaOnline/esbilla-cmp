# Backlog de Optimizaciones - Esbilla Dashboard

## Estado Actual (Completado ✅)

- ✅ **Lazy Loading de Rutas**: Bundle inicial reducido de 1,240 KB a 237 KB (80% mejora)
- ✅ **Code Splitting Manual**: Vendors separados (Firebase 350KB, Recharts 362KB, React 48KB)
- ✅ **Optimización de Build**: Configuración de Vite con manualChunks
- ✅ **TypeScript Strict Mode**: Todos los errores de compilación corregidos

**Resultado Actual:**
- Bundle inicial: 237 KB (73 KB gzip)
- Primera carga: ~1.5s en 3G (antes: ~4s)
- Reducción total: 80% en bundle inicial

---

## Optimizaciones Pendientes

### 🔥 Alta Prioridad

#### 1. Bundle Analyzer
**Impacto estimado:** Insights para optimizaciones futuras
**Esfuerzo:** 10 minutos
**Requisitos:**
```bash
npm install -D rollup-plugin-visualizer -w esbilla-dashboard
```

**Implementación en `vite.config.ts`:**
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  tailwindcss(),
  visualizer({
    open: true,
    gzipSize: true,
    filename: 'dist/stats.html'
  })
],
```

**Beneficios:**
- Visualización interactiva del bundle
- Identificar dependencias duplicadas
- Encontrar imports innecesarios

---

#### 2. Reemplazar Recharts con Chart.js
**Impacto estimado:** 282 KB reducción (362 KB → 80 KB)
**Esfuerzo:** 4-6 horas (refactor de 3 componentes)
**Archivos afectados:**
- `Dashboard.tsx` - Gráficos de consents
- `UrlStats.tsx` - Gráficos por URL
- `Footprint.tsx` - Timeline de historial

**Instalación:**
```bash
npm uninstall recharts -w esbilla-dashboard
npm install chart.js react-chartjs-2 -w esbilla-dashboard
```

**Beneficios:**
- 78% reducción en tamaño del vendor de charts
- Mejor rendimiento en datasets grandes
- API más moderna

**Alternativa ligera:**
- **uPlot**: 45 KB (88% reducción) - Más rápido pero menos features

---

### 🟡 Media Prioridad

#### 3. Comprimir Assets con Brotli
**Impacto estimado:** 15-20% reducción adicional sobre gzip
**Esfuerzo:** 1 hora
**Archivos afectados:**
- `Dockerfile` (esbilla-api)
- Configuración de Express (headers)

**Implementación:**

**En `Dockerfile`:**
```dockerfile
# Después del build del dashboard
RUN apt-get update && apt-get install -y brotli && \
    find /app/public/dashboard -type f \( -name '*.js' -o -name '*.css' \) \
    -exec brotli -q 11 -k {} \;
```

**En `esbilla-api/src/app.js`:**
```javascript
import express_static_gzip from 'express-static-gzip';

// Reemplazar express.static por:
app.use('/dashboard', express_static_gzip(dashboardPath, {
  enableBrotli: true,
  orderPreference: ['br', 'gz'],
}));
```

**Requisitos:**
```bash
npm install express-static-gzip -w esbilla-api
```

**Beneficios:**
- 15-20% mejor compresión que gzip
- Soportado por todos los navegadores modernos
- Sin impacto en desarrollo (solo producción)

---

#### 4. Preload de Chunks Críticos
**Impacto estimado:** 200-400ms mejora en Time to Interactive
**Esfuerzo:** 1 hora

**Implementación en `index.html`:**
```html
<head>
  <!-- Preload vendors críticos -->
  <link rel="modulepreload" href="/assets/react-vendor-[hash].js">
  <link rel="modulepreload" href="/assets/firebase-vendor-[hash].js">

  <!-- Prefetch rutas comunes (para usuarios autenticados) -->
  <link rel="prefetch" href="/assets/Dashboard-[hash].js">
  <link rel="prefetch" href="/assets/Sites-[hash].js">
</head>
```

**Automatización con Vite plugin:**
```bash
npm install -D vite-plugin-html -w esbilla-dashboard
```

**Beneficios:**
- Carga paralela de chunks críticos
- Navegación más rápida entre rutas
- Mejor First Contentful Paint

---

### 🔵 Baja Prioridad (Optimizaciones Finas)

#### 5. Tree-shaking Avanzado de Firebase
**Impacto estimado:** 30-50 KB reducción
**Esfuerzo:** 2 horas

**Revisar imports en:**
- `lib/firebase.ts` - Solo importar funciones usadas
- `context/AuthContext.tsx` - Revisar métodos de Auth
- Todos los archivos que usen Firestore

**Ejemplo de optimización:**
```typescript
// ❌ Actual
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// ✅ Optimizado (solo lo que se usa en el archivo)
import { collection, query, getDocs } from 'firebase/firestore';
```

---

#### 6. Implementar Service Worker con Workbox
**Impacto estimado:** Carga instantánea en visitas repetidas
**Esfuerzo:** 3-4 horas

**Instalación:**
```bash
npm install -D vite-plugin-pwa workbox-window -w esbilla-dashboard
```

**Features:**
- Cache de vendors (Firebase, React, Recharts)
- Cache de rutas visitadas
- Actualización automática en background
- Offline fallback

**Configuración en `vite.config.ts`:**
```typescript
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'firestore-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 300 },
          },
        },
      ],
    },
  }),
],
```

---

#### 7. Optimizar Imports de Lucide Icons
**Impacto estimado:** 5-10 KB reducción
**Esfuerzo:** 30 minutos

**Situación actual:**
Ya estás haciendo imports individuales correctamente:
```typescript
import { User, Settings, LogOut } from 'lucide-react'; // ✅ Correcto
```

**Optimización adicional:**
- Auditar iconos no usados con ESLint plugin
- Considerar generar SVGs inline para iconos muy usados

---

#### 8. Habilitar HTTP/2 Push en Cloud Run
**Impacto estimado:** 100-200ms mejora en carga inicial
**Esfuerzo:** 1 hora

**Configuración en Cloud Run:**
```yaml
# En .github/workflows/deploy-api.yml
gcloud run deploy $SERVICE_NAME \
  --http2 \
  --use-http2
```

**Beneficios:**
- Múltiples recursos en paralelo
- Reducción de latencia
- Mejor uso de conexión

---

## Optimizaciones de Infraestructura

#### 9. CDN para Assets Estáticos
**Impacto estimado:** 50-100ms mejora global
**Esfuerzo:** 2-3 horas

**Opciones:**
- **Firebase Hosting** (ya disponible, requiere configuración)
- **Cloudflare CDN** (gratis, fácil setup)
- **Cloud CDN de GCP** (integración nativa con Cloud Run)

**Archivos a servir desde CDN:**
- `dist/assets/*.js` (chunks)
- `dist/assets/*.css`
- Fuentes (si se añaden custom fonts)

---

#### 10. Compresión de Imágenes Optimizada
**Impacto estimado:** Variable (depende de uso futuro)
**Esfuerzo:** 1 hora

**Setup:**
```bash
npm install -D vite-plugin-imagemin -w esbilla-dashboard
```

**Formatos modernos:**
- WebP para fotos
- AVIF para máxima compresión
- Fallback a PNG/JPG

---

## Métricas de Seguimiento

### Objetivos de Performance
- **Time to First Byte (TTFB):** < 200ms
- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Total Bundle Size:** < 500 KB (inicial)
- **Lighthouse Score:** > 90

### Herramientas de Monitoreo
- Lighthouse CI en GitHub Actions
- WebPageTest para métricas reales
- Bundle analyzer en cada build

---

## Priorización Recomendada

### Sprint 1 (Quick Wins - 4 horas)
1. ✅ Lazy Loading (COMPLETADO)
2. Bundle Analyzer (setup)
3. Preload de chunks críticos

### Sprint 2 (High Impact - 1 semana)
1. Reemplazar Recharts con Chart.js
2. Comprimir con Brotli
3. Tree-shaking de Firebase

### Sprint 3 (Polish - 1 semana)
1. Service Worker + PWA
2. CDN para assets
3. HTTP/2 Push

---

## Notas

- **No revertir** las optimizaciones ya aplicadas (lazy loading + manual chunks)
- **Medir siempre** antes y después de cada optimización
- **Priorizar** optimizaciones con mejor ratio impacto/esfuerzo
- **Documentar** cambios en CHANGELOG.md

---

**Última actualización:** 2026-02-07
**Estado del proyecto:** Producción
**Bundle actual:** 237 KB inicial (73 KB gzip)
