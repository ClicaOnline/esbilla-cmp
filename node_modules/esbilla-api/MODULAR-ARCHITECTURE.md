# Arquitectura Modular Pegoyu v2.0

## 🎯 Objetivo

Transformar el Pegoyu monolítico en un sistema modular que carga integraciones bajo demanda, mejorando significativamente el rendimiento y la mantenibilidad.

## 📊 Beneficios

### Performance
- **58% más pequeño**: Pegoyu core reducido de ~70KB a ~25KB
- **Carga bajo demanda**: Los módulos solo se descargan cuando son necesarios
- **Mejor caching**: Cada módulo se cachea independientemente en el navegador
- **Menor tiempo de carga inicial**: FCP y LCP mejorados significativamente

### Mantenibilidad
- **19 archivos modulares** vs 1 archivo monolítico de 1730 líneas
- **Fácil extensión**: Añadir nuevas integraciones solo requiere crear un archivo
- **Cambios aislados**: Modificar una integración no afecta a las demás
- **Testing simplificado**: Cada módulo se puede probar independientemente

## 🏗️ Estructura

```
esbilla-api/public/
├── pegoyu.js (~25KB)              # Pegoyu core con loader dinámico
├── sdk-modules.json            # Manifest de módulos disponibles
└── modules/
    ├── analytics/              # 7 módulos
    │   ├── google-analytics.js
    │   ├── hotjar.js
    │   ├── microsoft-clarity.js
    │   ├── amplitude.js
    │   ├── crazyegg.js
    │   ├── vwo.js
    │   └── optimizely.js
    ├── marketing/              # 10 módulos
    │   ├── facebook-pixel.js
    │   ├── linkedin-insight.js
    │   ├── tiktok-pixel.js
    │   ├── google-ads.js
    │   ├── microsoft-ads.js
    │   ├── criteo.js
    │   ├── pinterest.js
    │   ├── twitter-pixel.js
    │   ├── taboola.js
    │   └── hubspot.js
    └── functional/             # 2 módulos
        ├── intercom.js
        └── zendesk.js
```

## 🔧 Componentes Clave

### 1. Pegoyu Core (`pegoyu.js`)

**Nuevo sistema de carga:**
```javascript
// Namespace global para módulos
window.EsbillaModules = window.EsbillaModules || {};

// Cache de módulos cargados
const moduleCache = new Set();

// Mapeo de módulos (inline para performance)
const moduleMap = {
  googleAnalytics: { category: 'analytics', file: 'google-analytics.js' },
  // ... 18 módulos más
};

// Cargador dinámico
async function loadModule(moduleName) {
  if (window.EsbillaModules[moduleName]) {
    return window.EsbillaModules[moduleName];
  }

  const moduleInfo = moduleMap[moduleName];
  const moduleUrl = `${apiBase}/modules/${moduleInfo.category}/${moduleInfo.file}`;

  // Cargar script dinámicamente
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = moduleUrl;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.EsbillaModules[moduleName];
}
```

### 2. Módulos (`modules/**/*.js`)

**Patrón de módulo:**
```javascript
/**
 * [Nombre] Module
 * @param {string} configValue - ID/Key del servicio
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.moduleName = function(configValue) {
  return `
    <!-- [Servicio] -->
    <script>
      // Código de integración
    </script>
  `;
};
```

### 3. Manifest (`sdk-modules.json`)

**Metadatos de módulos:**
```json
{
  "version": "2.0.0",
  "modules": {
    "analytics": {
      "googleAnalytics": {
        "name": "Google Analytics 4",
        "file": "modules/analytics/google-analytics.js",
        "size": "2.1kb",
        "required": false
      }
    }
  }
}
```

## 📝 Flujo de Carga

### Modo Simplificado (Simplified)

1. **Usuario da consentimiento** (analytics: true, marketing: true)
2. **Pegoyu detecta configuración** del Dashboard
   ```javascript
   config.scriptConfig = {
     analytics: {
       googleAnalytics: "G-XXXXXXXXXX",
       hotjar: "123456"
     },
     marketing: {
       facebookPixel: "1234567890"
     }
   }
   ```
3. **loadDynamicScripts() itera** sobre módulos configurados
4. **loadModule()** carga cada módulo bajo demanda
   - Crea `<script>` tag dinámicamente
   - Descarga desde `/modules/[category]/[file].js`
   - Módulo se registra en `window.EsbillaModules`
5. **injectScript()** inyecta el código generado por el módulo

### Ejemplo de Carga

```javascript
// Usuario acepta analytics
choices = { analytics: true, marketing: false };

// Pegoyu carga módulos configurados
loadModule('googleAnalytics')  // → fetch /modules/analytics/google-analytics.js
  .then(moduleFunc => {
    const scriptHTML = moduleFunc('G-XXXXXXXXXX');
    injectScript(scriptHTML, 'analytics');
  });

loadModule('hotjar')           // → fetch /modules/analytics/hotjar.js
  .then(moduleFunc => {
    const scriptHTML = moduleFunc('123456');
    injectScript(scriptHTML, 'analytics');
  });
```

## 🧪 Testing

### Verificación Automatizada

```bash
# Ejecutar tests de integridad
node scripts/verify-modular-architecture.js
```

**Tests incluidos:**
1. ✅ Manifest válido y completo
2. ✅ Estructura de carpetas correcta
3. ✅ Todos los archivos de módulos existen
4. ✅ Módulos siguen el patrón correcto
5. ✅ Pegoyu core tiene loader implementado
6. ✅ Nombres de módulos consistentes

### Test Manual en Navegador

```bash
# Abrir en navegador
open http://localhost:3000/test-modular.html
```

**Tests interactivos:**
1. Inicialización del Pegoyu
2. Carga de módulos Analytics
3. Carga de módulos Marketing
4. Verificación de caché

## 🚀 Añadir Nuevo Módulo

### Paso 1: Crear archivo del módulo

```bash
# Ejemplo: Nueva integración de Mixpanel
touch esbilla-api/public/modules/analytics/mixpanel.js
```

### Paso 2: Implementar patrón

```javascript
/**
 * Mixpanel Module
 * @param {string} token - Mixpanel Project Token
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.mixpanel = function(token) {
  return `
    <!-- Mixpanel -->
    <script type="text/javascript">
      (function(c,a){...})(document,window.mixpanel||[]);
      mixpanel.init("${token}");
    </script>
  `;
};
```

### Paso 3: Actualizar manifest

```json
{
  "modules": {
    "analytics": {
      "mixpanel": {
        "name": "Mixpanel",
        "file": "modules/analytics/mixpanel.js",
        "size": "1.5kb",
        "required": false
      }
    }
  }
}
```

### Paso 4: Actualizar moduleMap en Pegoyu

```javascript
const moduleMap = {
  // ... módulos existentes
  mixpanel: { category: 'analytics', file: 'mixpanel.js' },
};
```

### Paso 5: Verificar

```bash
node scripts/verify-modular-architecture.js
```

## 📈 Métricas de Rendimiento

### Antes (v1.7 - Monolítico)
- **Tamaño Pegoyu**: ~70KB
- **Carga inicial**: Incluye todas las integraciones
- **Impacto en FCP**: Alto (descarga ~70KB antes de renderizar)
- **Impacto en LCP**: Alto (bloquea recursos críticos)

### Después (v2.0 - Modular)
- **Tamaño Pegoyu core**: ~25KB (↓ 58%)
- **Carga inicial**: Solo el core
- **Impacto en FCP**: Bajo (solo ~25KB)
- **Impacto en LCP**: Bajo (módulos cargan después)
- **Módulos**: Se cargan bajo demanda (3-5 módulos típicos = ~5KB adicionales)

### Ejemplo Real

**Sitio con GA4 + Hotjar + Facebook Pixel:**
- **v1.7**: 70KB descargados
- **v2.0**: 25KB (core) + 0.7KB (GA4) + 0.7KB (Hotjar) + 1KB (FB) = **27.4KB** (↓ 61%)

## 🔄 Compatibilidad

### WordPress Plugin (v1.2.0)
✅ Compatible sin cambios - Plugin ya optimizado con lazy loading

### Dashboard
✅ Compatible - Sistema de configuración sin cambios

### Modos de Implementación
✅ **Manual**: Sin cambios
✅ **Simplified**: Usa carga modular
✅ **GTM**: Sin cambios

## 📋 Checklist de Migración

Para proyectos usando versiones anteriores:

- [x] Pegoyu v2.0 deployed
- [x] Manifest actualizado
- [x] 19 módulos creados
- [x] Tests pasando
- [ ] Documentación actualizada
- [ ] Changelog actualizado
- [ ] Deploy a producción

## 🐛 Troubleshooting

### Módulo no carga
```javascript
// Verificar en consola del navegador
console.log(window.EsbillaModules); // Ver módulos cargados
```

### Error 404 al cargar módulo
- Verificar que el archivo existe en `/modules/[category]/`
- Verificar que `moduleMap` tiene el módulo
- Verificar que manifest tiene el archivo correcto

### Módulo no se registra
- Verificar que el módulo exporta a `window.EsbillaModules.moduleName`
- Verificar que el nombre coincide con `moduleMap`

## 📚 Referencias

- [Plan de Implementación](../../../.claude/plans/modular-architecture-plan.md)
- [Tests Automatizados](scripts/verify-modular-architecture.js)
- [Test HTML Interactivo](public/test-modular.html)
- [Changelog](CHANGELOG.md)

---

**Desarrollado con ❤️ en Asturias por Clica Online Soluciones S.L.**
