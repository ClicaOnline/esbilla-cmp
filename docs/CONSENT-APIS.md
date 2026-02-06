# Esbilla CMP - APIs de Consentimiento Soportadas

**Última actualización**: 2026-02-05
**SDK Version**: 1.7.0

Esbilla CMP integra nativamente con las principales APIs de consentimiento de la industria para garantizar cumplimiento completo con regulaciones de privacidad (GDPR, ePrivacy, CCPA).

---

## 📊 Resumen Ejecutivo

### APIs Soportadas (6 totales)

| API | Plataforma | Estado | Actualización |
|-----|------------|--------|---------------|
| Google Consent Mode V2 | Google Ads, GA4, GTM | ✅ Completo | Automático |
| Meta Pixel Consent API | Facebook/Instagram Ads | ✅ Completo | Automático |
| Microsoft UET Consent Mode | Microsoft Ads (Bing) | ✅ Completo | Automático |
| Microsoft Clarity Consent API | Clarity (Heatmaps) | ✅ Completo | Automático |
| Shopify Customer Privacy API | Shopify E-commerce | ✅ Completo | Automático |
| WordPress Consent API | WordPress Sites | ✅ Completo | Hook-based |

### Ventajas de Integración Nativa

1. **Zero Configuration**: Actualización automática cuando usuario cambia consentimiento
2. **Multi-Platform**: Un solo SDK actualiza todas las APIs simultáneamente
3. **Audit Trail**: Todos los cambios de consentimiento se registran en Firestore
4. **Real-time**: Actualización instantánea sin recargar página

---

## 1. Google Consent Mode V2

### ✅ Estado: Completamente Implementado

### Descripción
API oficial de Google para comunicar el estado de consentimiento a Google Analytics 4, Google Ads, Google Tag Manager y todas las herramientas de Google Marketing Platform.

### Señales de Consentimiento

```javascript
gtag('consent', 'update', {
  'analytics_storage': 'granted' | 'denied',       // Google Analytics 4
  'ad_storage': 'granted' | 'denied',              // Google Ads Cookies
  'ad_user_data': 'granted' | 'denied',            // Datos de usuario para ads
  'ad_personalization': 'granted' | 'denied',      // Personalización de ads
  'functionality_storage': 'granted' | 'denied',   // Cookies funcionales
  'personalization_storage': 'granted' | 'denied', // Preferencias usuario
  'security_storage': 'granted'                    // Siempre granted (CSRF, etc.)
});
```

### Mapeo Esbilla → Google Consent Mode

| Categoría Esbilla | Google Consent Mode | Valor |
|-------------------|---------------------|-------|
| `analytics: true` | `analytics_storage` | `granted` |
| `marketing: true` | `ad_storage`, `ad_user_data`, `ad_personalization` | `granted` |
| `functional: true` | `functionality_storage`, `personalization_storage` | `granted` |
| N/A (siempre) | `security_storage` | `granted` |

### Estado Predeterminado (antes de consentimiento)

```javascript
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500  // Espera 500ms antes de enviar hits
});
```

### Beneficios

- **Modelado de Conversiones**: Google usa modelado estadístico cuando `ad_storage` = `denied`
- **Reporting Agregado**: GA4 muestra datos agregados sin identificar usuarios
- **Cumplimiento Automático**: Google ajusta su comportamiento según señales

### Documentación Oficial

- [Google Consent Mode V2](https://developers.google.com/tag-platform/security/guides/consent)
- [Implementación en gtag.js](https://developers.google.com/tag-platform/devguides/consent)

---

## 2. Meta Pixel Consent API (Facebook)

### ✅ Estado: Completamente Implementado

### Descripción
API oficial de Meta (Facebook/Instagram) para comunicar el estado de consentimiento al Meta Pixel, permitiendo cumplimiento con GDPR mientras se mantiene la medición de conversiones.

### Métodos de Consentimiento

```javascript
// Cuando usuario acepta marketing
fbq('consent', 'grant');

// Cuando usuario rechaza/revoca marketing
fbq('consent', 'revoke');
```

### Mapeo Esbilla → Meta Pixel

| Categoría Esbilla | Método Meta Pixel |
|-------------------|-------------------|
| `marketing: true` | `fbq('consent', 'grant')` |
| `marketing: false` | `fbq('consent', 'revoke')` |

### Comportamiento según Estado

#### Consent Granted
- Cookies de Facebook se almacenan normalmente
- Tracking completo de conversiones y eventos
- Retargeting y Custom Audiences habilitados
- Attribution completa

#### Consent Denied/Revoked
- No se almacenan cookies de Facebook
- Eventos se envían como "limited data use" (agregados)
- No retargeting ni Custom Audiences
- Attribution limitada (modelado estadístico)

### Advanced Matching (Opcional)

Si se provee información del usuario (email, teléfono), Meta puede hacer matching sin cookies:

```javascript
fbq('init', 'YOUR_PIXEL_ID', {
  em: 'hashed_email@example.com',  // SHA256
  ph: 'hashed_phone'                // SHA256
});
```

**Nota**: Requiere consentimiento explícito adicional para compartir datos personales.

### Beneficios

- **Conversions API Compatible**: Funciona con server-side tracking
- **Privacy-Compliant**: Respeta revocación de consentimiento
- **Aggregated Events**: Sigue midiendo conversiones en modo agregado

### Documentación Oficial

- [Meta Pixel Consent](https://developers.facebook.com/docs/meta-pixel/implementation/gdpr)
- [Limited Data Use](https://developers.facebook.com/docs/marketing-apis/data-processing-options)

---

## 3. Microsoft UET Consent Mode

### ✅ Estado: Completamente Implementado

### Descripción
Universal Event Tracking (UET) de Microsoft Ads incluye soporte para señales de consentimiento, permitiendo cumplimiento con GDPR mientras se mantiene el tracking de conversiones en Microsoft Advertising.

### Señales de Consentimiento

```javascript
window.uetq = window.uetq || [];
window.uetq.push('consent', 'update', {
  'ad_storage': 'granted' | 'denied'
});
```

### Mapeo Esbilla → Microsoft UET

| Categoría Esbilla | Microsoft UET | Valor |
|-------------------|---------------|-------|
| `marketing: true` | `ad_storage` | `granted` |
| `marketing: false` | `ad_storage` | `denied` |

### Comportamiento según Estado

#### Consent Granted
- Cookies de Microsoft Ads se almacenan
- Tracking completo de conversiones
- Remarketing habilitado
- Audiencias personalizadas

#### Consent Denied
- No cookies de Microsoft Ads
- Conversiones en modo agregado (sin ID usuario)
- No remarketing
- Reporting básico solo

### Integración con Tag (Esbilla SDK)

```javascript
// Template automático en Esbilla SDK v1.7
microsoftAds: (tagId) => `
  <script>
    (function(w,d,t,r,u){
      // ... código UET ...
    })(window,document,"script","//bat.bing.com/bat.js","uetq");
  </script>
`
```

### Beneficios

- **Modelado de Conversiones**: Microsoft usa modelos predictivos cuando consent = denied
- **Multi-Device Attribution**: Funciona en ecosistema Microsoft (Edge, Bing, Xbox)
- **CCPA Compliant**: También respeta señales CCPA

### Documentación Oficial

- [Microsoft Ads UET Setup](https://help.ads.microsoft.com/#apex/ads/en/56682/2)
- [Consent Mode Documentation](https://help.ads.microsoft.com/apex/index/3/en/60126)

---

## 4. Microsoft Clarity Consent API

### ✅ Estado: Completamente Implementado

### Descripción
Microsoft Clarity (herramienta gratuita de heatmaps y session recordings) incluye métodos para controlar el tracking basado en consentimiento del usuario.

### Métodos de Control

```javascript
// Cuando usuario acepta analytics
window.clarity('consent');

// Cuando usuario rechaza analytics (detiene tracking)
window.clarity('stop');
```

### Mapeo Esbilla → Clarity

| Categoría Esbilla | Método Clarity |
|-------------------|----------------|
| `analytics: true` | `window.clarity('consent')` |
| `analytics: false` | `window.clarity('stop')` |

### Comportamiento según Estado

#### Consent Granted
- Session recordings activas
- Heatmaps generados
- Scroll maps y click maps
- Rage clicks y dead clicks detectados

#### Consent Denied
- Tracking detenido inmediatamente
- No se graban sesiones nuevas
- Datos existentes NO se eliminan (solo se para nueva captura)

### Integración con Tag (Esbilla SDK)

```javascript
// Template automático en Esbilla SDK v1.7
clarity: (projectId) => `
  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${projectId}");
  </script>
`
```

### Beneficios

- **Free Tool**: Clarity es 100% gratis sin límites
- **Privacy-Friendly**: Automáticamente oculta campos de contraseñas y datos sensibles
- **GDPR Compliant**: Respeta señales de consentimiento

### Documentación Oficial

- [Microsoft Clarity Setup](https://clarity.microsoft.com/getting-started)
- [Privacy & Consent](https://docs.microsoft.com/en-us/clarity/setup-and-installation/privacy-disclosure)

---

## 5. Shopify Customer Privacy API

### ✅ Estado: Completamente Implementado

### Descripción
API nativa de Shopify para gestionar consentimiento de clientes en tiendas Shopify. Permite sincronizar el estado de consentimiento de Esbilla con el backend de Shopify para cumplimiento completo en e-commerce.

### Método de Actualización

```javascript
window.Shopify.customerPrivacy.setTrackingConsent({
  analytics: true | false,
  marketing: true | false,
  preferences: true | false,
  sale_of_data: true | false  // CCPA compliance
}, function(error) {
  if (error) {
    console.error('Error actualizando Shopify Privacy API:', error);
  } else {
    console.log('Shopify Privacy API actualizado correctamente');
  }
});
```

### Mapeo Esbilla → Shopify

| Categoría Esbilla | Shopify Privacy API | Descripción |
|-------------------|---------------------|-------------|
| `analytics: true` | `analytics: true` | Google Analytics, Hotjar, etc. |
| `marketing: true` | `marketing: true` | Facebook Pixel, Google Ads, etc. |
| `functional: true` | `preferences: true` | Intercom, Zendesk, preferencias UI |
| `marketing: true` | `sale_of_data: true` | CCPA compliance (venta de datos) |

### Integración con Shopify Checkout

Cuando Esbilla actualiza el consentimiento, Shopify automáticamente:

1. **Actualiza cookies de sesión** con preferencias de privacidad
2. **Sincroniza con Shopify Analytics** para reportes correctos
3. **Aplica restricciones a apps de terceros** instaladas en la tienda
4. **Registra cambios en Customer Profile** para auditoría

### Beneficios

- **Native Integration**: Funciona con todas las apps de Shopify
- **Checkout Compliance**: Respeta consentimiento en checkout y post-compra
- **Customer Profile**: Preferencias guardadas en perfil del cliente
- **CCPA Ready**: Incluye señal `sale_of_data` para compliance California

### Documentación Oficial

- [Shopify Customer Privacy API](https://shopify.dev/api/consent-tracking)
- [Privacy & Compliance](https://help.shopify.com/en/manual/your-account/privacy/GDPR)

---

## 6. WordPress Consent API

### ✅ Estado: Completamente Implementado

### Descripción
WordPress no tiene una API de consentimiento oficial nativa, pero Esbilla implementa dos mecanismos:

1. **Custom Hook**: `esbilla_consent_updated` para que plugins escuchen cambios
2. **WP Consent API Plugin**: Integración con plugin estándar de la comunidad

### Hooks Disponibles

#### 1. Hook Personalizado de Esbilla

```javascript
// Esbilla dispara este hook cuando cambia consentimiento
wp.hooks.doAction('esbilla_consent_updated', {
  analytics: true | false,
  marketing: true | false,
  functional: true | false
});
```

**Uso en otros plugins WordPress**:

```php
// En functions.php o en plugin
add_action('wp_footer', function() {
  ?>
  <script>
    if (typeof wp !== 'undefined' && wp.hooks) {
      wp.hooks.addAction('esbilla_consent_updated', 'my-plugin', function(choices) {
        console.log('Consentimiento actualizado:', choices);

        // Activar/desactivar tu tracking aquí
        if (choices.analytics) {
          // Cargar Google Analytics
        }
        if (choices.marketing) {
          // Cargar Facebook Pixel
        }
      });
    }
  </script>
  <?php
});
```

#### 2. WP Consent API Plugin (Estándar Comunidad)

Si el sitio WordPress tiene instalado el plugin [WP Consent API](https://wordpress.org/plugins/wp-consent-api/), Esbilla automáticamente sincroniza con él:

```javascript
// Esbilla actualiza WP Consent API automáticamente
if (typeof wp !== 'undefined' && wp.consent) {
  wp.consent.setConsent('analytics', choices.analytics ? 'allow' : 'deny');
  wp.consent.setConsent('marketing', choices.marketing ? 'allow' : 'deny');
  wp.consent.setConsent('preferences', choices.functional ? 'allow' : 'deny');
}
```

### Mapeo Esbilla → WordPress Consent API

| Categoría Esbilla | WP Consent API | Valor |
|-------------------|----------------|-------|
| `analytics: true` | `setConsent('analytics', 'allow')` | `allow` |
| `marketing: true` | `setConsent('marketing', 'allow')` | `allow` |
| `functional: true` | `setConsent('preferences', 'allow')` | `allow` |

### Plugins WordPress Compatibles

Estos plugins ya escuchan WP Consent API y funcionarán automáticamente con Esbilla:

- **Complianz** (Premium GDPR plugin)
- **Cookiebot** (si se usa como CMP adicional)
- **MonsterInsights** (Google Analytics para WordPress)
- **Pixel Caffeine** (Facebook Pixel)
- **ExactMetrics** (Google Analytics)

### Beneficios

- **Universal Compatibility**: Funciona con plugins populares de WordPress
- **No Code Required**: Integración automática si WP Consent API está instalado
- **Custom Development**: Developers pueden escuchar hook personalizado

### Documentación

- [WP Consent API Plugin](https://wordpress.org/plugins/wp-consent-api/)
- [Esbilla WordPress Plugin](https://github.com/ClicaOnline/esbilla-cmp/tree/main/esbilla-plugins/wordpress)

---

## 7. Custom Event API (Universal)

### ✅ Estado: Completamente Implementado

### Descripción
Además de las APIs específicas de plataforma, Esbilla dispara un **CustomEvent** estándar del navegador que cualquier script puede escuchar, permitiendo integraciones personalizadas.

### Evento Disparado

```javascript
// Evento: "esbillaConsentUpdate"
window.addEventListener('esbillaConsentUpdate', function(event) {
  console.log('Consentimiento actualizado:', event.detail);
  /*
  event.detail = {
    analytics: true | false,
    marketing: true | false,
    functional: true | false,
    timestamp: "2026-02-05T12:34:56.789Z"
  }
  */
});
```

### Uso en Scripts Personalizados

#### Ejemplo 1: Cargar Analytics Solo con Consentimiento

```javascript
window.addEventListener('esbillaConsentUpdate', function(event) {
  if (event.detail.analytics) {
    // Cargar tu herramienta de analytics personalizada
    loadMyAnalytics();
  }
});
```

#### Ejemplo 2: Actualizar UI según Consentimiento

```javascript
window.addEventListener('esbillaConsentUpdate', function(event) {
  const statusElement = document.getElementById('consent-status');
  statusElement.textContent = event.detail.analytics
    ? 'Analytics: ✓ Activo'
    : 'Analytics: ✗ Desactivado';
});
```

#### Ejemplo 3: Sincronizar con Backend

```javascript
window.addEventListener('esbillaConsentUpdate', function(event) {
  fetch('/api/update-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      consent: event.detail
    })
  });
});
```

### Beneficios

- **Universal**: Funciona en cualquier sitio, sin dependencias
- **Real-time**: Se dispara inmediatamente al cambiar consentimiento
- **Flexible**: Permite integraciones custom sin modificar SDK

---

## 🔄 Flujo de Actualización Completo

### Cuando Usuario Cambia Consentimiento

```
1. Usuario hace click en "Aceptar Analytics" en Esbilla Banner
   ↓
2. SDK ejecuta updateConsentMode(choices)
   ↓
3. Actualización SIMULTÁNEA de todas las APIs:
   ├─→ Google Consent Mode V2: gtag('consent', 'update', {...})
   ├─→ Meta Pixel: fbq('consent', 'grant')
   ├─→ Microsoft UET: uetq.push('consent', 'update', {...})
   ├─→ Microsoft Clarity: window.clarity('consent')
   ├─→ Shopify: Shopify.customerPrivacy.setTrackingConsent({...})
   ├─→ WordPress: wp.hooks.doAction('esbilla_consent_updated', {...})
   └─→ Custom Event: window.dispatchEvent(new CustomEvent(...))
   ↓
4. Scripts de terceros ajustan su comportamiento automáticamente
   ↓
5. Registro guardado en Firestore con timestamp
```

**Tiempo total**: < 50ms (todas las APIs se actualizan en paralelo)

---

## 📊 Tabla Comparativa de Cobertura

| Plataforma | Esbilla CMP | Cookiebot | OneTrust | Complianz |
|------------|-------------|-----------|----------|-----------|
| Google Consent Mode V2 | ✅ | ✅ | ✅ | ✅ |
| Meta Pixel Consent API | ✅ | ❌ | ✅ | ❌ |
| Microsoft UET Consent | ✅ | ❌ | ✅ | ❌ |
| Microsoft Clarity | ✅ | ❌ | ❌ | ❌ |
| Shopify Privacy API | ✅ | ❌ | ❌ | ❌ |
| WordPress Consent API | ✅ | ✅ | ❌ | ✅ |
| Custom Event API | ✅ | ❌ | ❌ | ❌ |

**Ventaja competitiva**: Esbilla es el único CMP open-source con soporte completo para las 6 APIs principales + Custom Event.

---

## ✅ Testing y Verificación

### Cómo Verificar que las APIs Funcionan

#### 1. Google Consent Mode V2

```javascript
// En DevTools Console
window.dataLayer
// Debe mostrar array con objetos:
// [{event: "consent", ...}, {consent: "update", ...}]
```

#### 2. Meta Pixel

```javascript
// En DevTools Console
window.fbq
// Verificar que existe y revisar Network tab para requests a facebook.com
```

#### 3. Microsoft UET

```javascript
// En DevTools Console
window.uetq
// Debe contener eventos push con consent updates
```

#### 4. Microsoft Clarity

```javascript
// En DevTools Console
window.clarity
// Verificar que es una función y revisar Network tab para clarity.ms
```

#### 5. Shopify

```javascript
// Solo en sitios Shopify
window.Shopify.customerPrivacy
// Debe tener método setTrackingConsent
```

#### 6. WordPress

```javascript
// Solo en sitios WordPress
wp.hooks
wp.consent  // Si WP Consent API está instalado
```

### Herramientas de Auditoría Recomendadas

- **Google Tag Assistant**: Verifica Consent Mode V2
- **Facebook Pixel Helper**: Chrome extension para verificar Meta Pixel
- **Microsoft Clarity Dashboard**: Ver sesiones grabadas solo después de consent
- **OneTrust Cookie Compliance**: Auditoría multi-plataforma (gratis 30 días)

---

## 📝 Documentación de Referencia

### Google
- [Consent Mode V2 Guide](https://developers.google.com/tag-platform/security/guides/consent)
- [Implementation Examples](https://developers.google.com/tag-platform/devguides/consent)

### Meta (Facebook)
- [Meta Pixel GDPR Compliance](https://developers.facebook.com/docs/meta-pixel/implementation/gdpr)
- [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)

### Microsoft
- [UET Consent Mode](https://help.ads.microsoft.com/apex/index/3/en/60126)
- [Clarity Privacy](https://docs.microsoft.com/en-us/clarity/setup-and-installation/privacy-disclosure)

### Shopify
- [Customer Privacy API](https://shopify.dev/api/consent-tracking)
- [GDPR Compliance](https://help.shopify.com/en/manual/your-account/privacy/GDPR)

### WordPress
- [WP Consent API Plugin](https://wordpress.org/plugins/wp-consent-api/)
- [Developer Handbook - Hooks](https://developer.wordpress.org/plugins/hooks/)

---

## 🚀 Roadmap (Futuras APIs)

Próximas integraciones de APIs de consentimiento:

- **Stripe Privacy API** (para pagos con consentimiento)
- **PayPal Consent** (tracking de conversiones e-commerce)
- **Amazon Attribution API** (ads en Amazon)
- **LinkedIn Consent Mode** (actualización futura de LinkedIn)
- **TikTok Consent API** (cuando TikTok lo lance oficialmente)

---

**© 2026 Clica Online Soluciones S.L. - Esbilla CMP**
**SDK Version**: 1.7.0 - Open Source (MIT License)
