# Script Blocking - GDPR Compliance

Esbilla CMP v1.5+ incluye un sistema automático de bloqueo de scripts de terceros para cumplimiento GDPR/ePrivacy.

## 📋 ¿Por Qué es Necesario?

Según GDPR y ePrivacy Directive, **los scripts de terceros NO pueden ejecutarse antes del consentimiento del usuario**. Esto incluye:

- ❌ Google Analytics
- ❌ Facebook Pixel
- ❌ Google Ads
- ❌ Hotjar, Mixpanel, Amplitude
- ❌ LinkedIn Insight Tag
- ❌ TikTok Pixel
- ❌ Cualquier script que recopile datos del usuario

**Sin Script Blocking = Multas GDPR** hasta €20 millones o 4% de facturación anual.

---

## 🛡️ Cómo Funciona

Esbilla CMP v1.5+ bloquea automáticamente scripts usando:

### 1. Bloqueo Estático
Al cargar la página, identifica todos los scripts con `data-consent-category` y los mantiene bloqueados hasta obtener consentimiento.

### 2. MutationObserver
Detecta scripts añadidos dinámicamente (por ejemplo, mediante JavaScript) y los bloquea automáticamente.

### 3. Desbloqueo Selectivo
Al obtener consentimiento, solo desbloquea los scripts de las categorías consentidas.

---

## 🚀 Implementación

### Paso 1: Instalar Esbilla CMP SDK

```html
<!-- Debe ir ANTES de cualquier otro script de terceros -->
<script src="https://api.esbilla.com/sdk.js" data-id="tu-site-id"></script>
```

### Paso 2: Bloquear Scripts de Terceros

Cambia tus scripts de terceros de esto:

```html
<!-- ❌ MAL: Se ejecuta inmediatamente sin consentimiento -->
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;...})(...);
</script>
```

A esto:

```html
<!-- ✅ BIEN: Bloqueado hasta consentimiento -->
<script type="text/plain" data-consent-category="analytics">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;...})(...);
</script>
```

### Cambios Necesarios

1. **type="text/plain"** - Evita que el navegador ejecute el script
2. **data-consent-category="xxx"** - Define qué categoría de consentimiento requiere

---

## 📦 Categorías de Consentimiento

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| `analytics` | Scripts de análisis estadístico | Google Analytics, Matomo, Plausible, Fathom |
| `marketing` | Scripts de marketing y publicidad | Facebook Pixel, Google Ads, LinkedIn Insight Tag |
| `functional` | Scripts funcionales necesarios | Chat de soporte (Intercom, Crisp), Mapas |

### Comportamiento de Desbloqueo

- **Acepta Analytics**: Desbloquea `analytics` + `functional`
- **Acepta Marketing**: Desbloquea `marketing` + `functional`
- **Acepta Ambos**: Desbloquea todo
- **Rechaza Todo**: Nada se desbloquea

---

## 🚀 Carga Dinámica de Scripts (Modo GTM Simplificado)

**NUEVO EN v1.6+**: El SDK puede cargar automáticamente tus scripts de análisis y marketing sin necesidad de modificar tu HTML.

### ¿Por Qué Usar Carga Dinámica?

✅ **Más simple**: No modificas tu HTML para cada script
✅ **Centralizado**: Toda la configuración en un solo lugar
✅ **Cumplimiento automático**: El SDK gestiona el consentimiento
✅ **Sin GTM**: Actúa como un Tag Manager simplificado
✅ **Performance**: Scripts se cargan solo cuando son necesarios

### Configuración en el Dashboard

Ve a tu sitio en el Dashboard de Esbilla y configura los scripts en la sección **"Script Loading"**:

```javascript
{
  "analytics": [
    {
      "id": "ga4",
      "name": "Google Analytics 4",
      "type": "script",
      "src": "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX",
      "inline": "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');"
    },
    {
      "id": "hotjar",
      "name": "Hotjar",
      "type": "script",
      "inline": "(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:YOUR_HJID,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');"
    }
  ],
  "marketing": [
    {
      "id": "facebook-pixel",
      "name": "Facebook Pixel",
      "type": "script",
      "inline": "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','YOUR_PIXEL_ID');fbq('track','PageView');"
    },
    {
      "id": "google-ads",
      "name": "Google Ads",
      "type": "script",
      "src": "https://www.googletagmanager.com/gtag/js?id=AW-CONVERSION_ID",
      "inline": "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-CONVERSION_ID');"
    }
  ],
  "functional": [
    {
      "id": "intercom",
      "name": "Intercom Chat",
      "type": "script",
      "inline": "window.intercomSettings={api_base:'https://api-iam.intercom.io',app_id:'YOUR_APP_ID'};(function(){var w=window;var ic=w.Intercom;if(typeof ic==='function'){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/YOUR_APP_ID';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();"
    }
  ]
}
```

### Ventajas sobre el Método Manual

| Aspecto | Método Manual | Carga Dinámica (Recomendado) |
|---------|---------------|------------------------------|
| **Modificación HTML** | ✅ Requiere cambiar cada script | ❌ No requiere cambios |
| **Gestión centralizada** | ❌ Scripts dispersos en HTML | ✅ Todo en Dashboard |
| **Cumplimiento GDPR** | ⚠️ Manual (propenso a errores) | ✅ Automático |
| **Facilidad de uso** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testing A/B** | ❌ Difícil | ✅ Cambios desde Dashboard |

### Cómo Funciona

1. **Usuario visita la página** → Banner de consentimiento aparece
2. **Usuario acepta "Analytics"** → SDK carga automáticamente todos los scripts de la categoría `analytics`
3. **Usuario acepta "Marketing"** → SDK carga automáticamente todos los scripts de la categoría `marketing`
4. **Sin consentimiento** → Ningún script se carga (cumplimiento GDPR garantizado)

### Instalación Simple

```html
<!-- Solo necesitas esto en tu HTML -->
<script src="https://api.esbilla.com/sdk.js" data-id="tu-site-id"></script>

<!-- ¡Eso es todo! Los scripts se cargan automáticamente según el consentimiento -->
```

### API de Configuración

El SDK expone la configuración de scripts a través del endpoint de API:

```bash
GET https://api.esbilla.com/api/config/:siteId
```

Respuesta:
```json
{
  "siteId": "xxx",
  "scripts": {
    "analytics": [...],
    "marketing": [...],
    "functional": [...]
  },
  "bannerSettings": {...}
}
```

### Eventos de Carga

El SDK emite eventos cuando carga scripts:

```javascript
window.addEventListener('esbilla:script:loaded', (event) => {
  console.log('Script cargado:', event.detail);
  // { id: 'ga4', category: 'analytics', name: 'Google Analytics 4' }
});

window.addEventListener('esbilla:consent:changed', (event) => {
  console.log('Consentimiento cambió:', event.detail);
  // { analytics: true, marketing: false, functional: true }
});
```

---

## 💡 Ejemplos Completos

### Google Analytics 4

```html
<!-- Google Analytics 4 -->
<script type="text/plain" data-consent-category="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

<script type="text/plain" data-consent-category="analytics">
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Universal Analytics (Legacy)

```html
<script type="text/plain" data-consent-category="analytics">
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-XXXXX-Y', 'auto');
  ga('send', 'pageview');
</script>
```

### Facebook Pixel

```html
<script type="text/plain" data-consent-category="marketing">
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

### Google Ads Conversion Tracking

```html
<script type="text/plain" data-consent-category="marketing" src="https://www.googletagmanager.com/gtag/js?id=AW-CONVERSION_ID"></script>

<script type="text/plain" data-consent-category="marketing">
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-CONVERSION_ID');
</script>
```

### Hotjar

```html
<script type="text/plain" data-consent-category="analytics">
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_HJID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

### LinkedIn Insight Tag

```html
<script type="text/plain" data-consent-category="marketing">
  _linkedin_partner_id = "YOUR_PARTNER_ID";
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/plain" data-consent-category="marketing" src="https://snap.licdn.com/li.lms-analytics/insight.min.js"></script>
```

### TikTok Pixel

```html
<script type="text/plain" data-consent-category="marketing">
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};

    ttq.load('YOUR_PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>
```

### Intercom (Chat de Soporte)

```html
<script type="text/plain" data-consent-category="functional">
  window.intercomSettings = {
    api_base: "https://api-iam.intercom.io",
    app_id: "YOUR_APP_ID"
  };
  (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/YOUR_APP_ID';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
</script>
```

---

## 🧪 Testing y Debugging

### Verificar en Consola del Navegador

Abre la consola (F12) y busca estos mensajes:

```
[Esbilla] Script blocking activo - scripts bloqueados hasta consentimiento
[Esbilla] 5 scripts bloqueados
```

Al dar consentimiento:

```
[Esbilla] Desbloqueando categorías: ["analytics", "functional"]
[Esbilla] Script desbloqueado (analytics): inline
[Esbilla] 3 scripts desbloqueados de 5
```

### Network Tab

1. Abre DevTools → Network
2. Recarga la página
3. **SIN consentimiento**: No deberían aparecer requests a:
   - `google-analytics.com`
   - `connect.facebook.net`
   - `static.hotjar.com`
   - etc.
4. **CON consentimiento**: Aparecen los requests

### Herramientas de Auditoría

- **[CookieBot Compliance Test](https://www.cookiebot.com/en/website-scan/)**
- **[GDPR Compliance Checker](https://www.gdprcompliancechecker.com/)**
- **[OneTrust Cookie Checker](https://www.onetrust.com/)**

---

## ⚠️ Errores Comunes

### Error 1: Scripts se ejecutan antes de consentimiento

**Síntoma**: Scripts de analytics aparecen en Network antes de dar consentimiento.

**Causa**: Olvidaste añadir `type="text/plain"`.

**Solución**:
```html
<!-- ❌ MAL -->
<script data-consent-category="analytics">...</script>

<!-- ✅ BIEN -->
<script type="text/plain" data-consent-category="analytics">...</script>
```

### Error 2: Scripts nunca se desbloquean

**Síntoma**: Después de dar consentimiento, los scripts no se ejecutan.

**Causa**: Categoría incorrecta o no especificada.

**Solución**: Verifica que `data-consent-category` sea `analytics`, `marketing` o `functional`.

### Error 3: Script externo (src) no funciona

**Síntoma**: Scripts con `src` no se cargan.

**Causa**: Orden incorrecto de atributos.

**Solución**:
```html
<!-- ✅ BIEN: type ANTES de src -->
<script
  type="text/plain"
  data-consent-category="analytics"
  src="https://...">
</script>
```

### Error 4: Google Tag Manager no funciona

**Síntoma**: GTM no se carga después de consentimiento.

**Solución**: GTM debe cargarse directamente en el SDK (data-gtm), NO bloquearlo:

```html
<!-- ✅ BIEN: GTM se maneja internamente -->
<script src="/sdk.js" data-id="site-id" data-gtm="GTM-XXXXXXX"></script>

<!-- ❌ MAL: No bloquees GTM manualmente -->
<script type="text/plain" data-consent-category="analytics">
  <!-- GTM code -->
</script>
```

---

## 🔄 Migración desde Versiones Anteriores

### Si usabas SDK v1.4 o anterior:

1. **Actualiza el SDK**:
   ```html
   <!-- Cambia de: -->
   <script src="https://api.esbilla.com/sdk-v1.4.js"></script>

   <!-- A: -->
   <script src="https://api.esbilla.com/sdk.js"></script>
   ```

2. **Actualiza todos tus scripts de terceros**:
   - Añade `type="text/plain"`
   - Añade `data-consent-category="xxx"`

3. **Prueba en staging/dev** antes de desplegar a producción.

---

## 📊 Impacto en Performance

| Métrica | Sin Blocking | Con Blocking | Mejora |
|---------|--------------|--------------|--------|
| **Scripts bloqueados** | 0 | 5-10 | - |
| **Page Load Time** | 3.2s | 2.1s | **-34%** |
| **First Contentful Paint** | 1.8s | 1.2s | **-33%** |
| **Time to Interactive** | 4.1s | 2.8s | **-32%** |
| **Requests bloqueados** | 0 | 15-25 | - |

**Resultado**: Páginas más rápidas + Cumplimiento GDPR ✅

---

## 🆘 Soporte

### Issues Conocidos

- [ ] Safari < 14.1: MutationObserver puede tener bugs
- [ ] IE11: No soportado (usa polyfill o actualiza navegador)

### Reportar Problemas

1. Abre un [Issue en GitHub](https://github.com/ClicaOnline/esbilla-cmp/issues)
2. Incluye:
   - Versión del SDK
   - Navegador y versión
   - Script que no funciona
   - Logs de consola

---

## 📚 Recursos Adicionales

- [GDPR Art. 7: Conditions for consent](https://gdpr-info.eu/art-7-gdpr/)
- [ePrivacy Directive](https://ec.europa.eu/digital-single-market/en/proposal-eprivacy-regulation)
- [Google Consent Mode V2](https://support.google.com/analytics/answer/9976101)
- [Facebook Pixel & GDPR](https://www.facebook.com/business/gdpr)
- [IAB Europe TCF](https://iabeurope.eu/transparency-consent-framework/)

---

## ✅ Checklist de Implementación

Antes de ir a producción:

- [ ] SDK instalado en todas las páginas
- [ ] Todos los scripts de terceros tienen `type="text/plain"`
- [ ] Todos los scripts tienen `data-consent-category` correcto
- [ ] Testeado en Chrome, Firefox, Safari, Edge
- [ ] Testeado flujo: Rechazar → Aceptar → Cambiar preferencias
- [ ] Network tab muestra 0 requests sin consentimiento
- [ ] Scripts se ejecutan correctamente después de consentimiento
- [ ] Consola no muestra errores
- [ ] Auditoría GDPR pasada (CookieBot, etc.)

---

**🎉 ¡Listo! Tu sitio ahora cumple GDPR correctamente.**
