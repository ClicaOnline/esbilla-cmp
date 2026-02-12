# Enterprise Edition - SDK Modules

Módulos del Pegoyu (SDK) exclusivos de la **Enterprise Edition**.

## ⚠️ Importante

- Estos módulos **NO** se incluyen en la Community Edition (CE)
- Se cargan dinámicamente solo cuando están habilitados en la configuración del sitio
- Requieren licencia Enterprise para uso en producción

## Módulos Disponibles

### attribution.js
**Marketing Attribution Tracking**

Seguimiento de parámetros UTM y Click IDs para atribución de marketing.

**Features:**
- Parámetros UTM: source, medium, campaign, term, content
- Click IDs soportados:
  - `gclid` - Google Ads
  - `fbclid` - Facebook
  - `msclkid` - Microsoft Ads
  - `ttclid` - TikTok
  - `li_fat_id` - LinkedIn
  - `twclid` - Twitter/X
  - `pin_id` - Pinterest
  - `ctc` - Criteo
- First-touch y last-touch attribution
- Persistencia en localStorage (30 días)
- Tracking de referrer

**API pública:**
```javascript
// Obtener datos de atribución
const attribution = window.EsbillaAttribution.get();
console.log(attribution.firstTouch);
console.log(attribution.lastTouch);

// Actualizar manualmente
window.EsbillaAttribution.update();

// Limpiar datos
window.EsbillaAttribution.clear();
```

**Estructura de datos:**
```javascript
{
  firstTouch: {
    timestamp: 1234567890,
    url: "https://example.com/landing",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "summer-sale",
    clickId: "gclid",
    clickIdValue: "abc123",
    platform: "google",
    referrer: {
      url: "https://google.com/search",
      domain: "google.com"
    }
  },
  lastTouch: { ... }
}
```

### cross-domain.js
**Cross-Domain Footprint Synchronization**

Sincroniza el Footprint ID del usuario entre múltiples dominios.

**Features:**
- Sincronización vía parámetro URL (`?esbilla_fid=xxx`)
- Sincronización vía API (`POST /api/consent/sync`)
- Decoración automática de links salientes
- User hash para identificación cross-domain
- Limpieza automática de URL (sin recarga)

**API pública:**
```javascript
// Inicializar
window.EsbillaCrossDomain.init({
  apiUrl: 'https://api.esbilla.com',
  siteId: 'site_xxx',
  enabled: true
});

// Obtener footprint ID local
const footprintId = window.EsbillaCrossDomain.getFootprintId();

// Sincronizar a API manualmente
window.EsbillaCrossDomain.syncToApi(footprintId);

// Decorar links salientes
window.EsbillaCrossDomain.decorateLinks('dominio-destino.com');
```

**Flujo:**
1. Usuario en dominio-a.com da consentimiento → footprintId guardado
2. Footprint se sincroniza con API
3. Usuario navega a dominio-b.com?esbilla_fid=xxx
4. dominio-b.com detecta parámetro, guarda footprintId localmente
5. dominio-b.com sincroniza con API
6. Ambos dominios comparten el mismo footprint

### gtm-gateway.js
**Google Tag Manager Gateway**

Carga GTM desde dominio personalizado (first-party).

**Features:**
- Carga GTM desde dominio custom (ej: `gtm.tudominio.com`)
- Bypass de ad blockers
- Integración con Google Consent Mode v2
- Control de dataLayer
- Eventos personalizados

**API pública:**
```javascript
// Inicializar GTM Gateway
window.EsbillaGTM.init({
  containerId: 'GTM-XXXXX',
  gatewayDomain: 'gtm.tudominio.com'
});

// Establecer consentimiento por defecto (antes de cargar GTM)
window.EsbillaGTM.setDefaultConsent({
  analytics: 'denied',
  marketing: 'denied'
});

// Actualizar consentimiento
window.EsbillaGTM.updateConsent({
  analytics: 'granted',
  marketing: 'granted'
});

// Enviar evento personalizado
window.EsbillaGTM.pushEvent({
  event: 'custom_event',
  category: 'engagement',
  action: 'click',
  label: 'cta-button'
});

// Verificar carga
if (window.EsbillaGTM.isLoaded()) {
  console.log('GTM cargado correctamente');
}
```

**Google Consent Mode v2:**
El módulo envía eventos `consent_default` y `consent_update` al dataLayer que GTM puede usar para controlar la activación de tags.

## Carga Dinámica

Estos módulos se cargan bajo demanda desde el Pegoyu principal:

```javascript
// En pegoyu.js
async function loadEEModule(moduleName) {
  const script = document.createElement('script');
  script.src = `${API_URL}/modules/ee/${moduleName}.js`;
  script.async = true;
  document.head.appendChild(script);

  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
}

// Cargar solo si está habilitado en config
if (config.features.attribution) {
  await loadEEModule('attribution');
}

if (config.features.crossDomain) {
  await loadEEModule('cross-domain');
}

if (config.features.gtmGateway) {
  await loadEEModule('gtm-gateway');
}
```

## Testing

Para probar estos módulos localmente:

```bash
# Servir archivos estáticos
cd esbilla-api
npm start

# Abrir test.html en navegador
open http://localhost:3000/test.html
```

```html
<!-- test.html -->
<script src="/modules/ee/attribution.js"></script>
<script src="/modules/ee/cross-domain.js"></script>
<script src="/modules/ee/gtm-gateway.js"></script>

<script>
  // Test attribution
  console.log(window.EsbillaAttribution.get());

  // Test cross-domain
  window.EsbillaCrossDomain.init({
    apiUrl: 'http://localhost:3000',
    siteId: 'test',
    enabled: true
  });

  // Test GTM
  window.EsbillaGTM.init({
    containerId: 'GTM-TEST',
    gatewayDomain: 'gtm.localhost'
  });
</script>
```

## Exclusión en CE

Estos módulos se excluyen del build de CE:
- Script `prepare-ce-repo.sh` elimina `modules/ee/`
- El Pegoyu CE no intenta cargar módulos EE
- La API CE retorna error 403 si se intentan cargar

## Licencia

Código propietario © Clica Online Soluciones S.L.
Uso permitido solo con licencia Enterprise Edition.
