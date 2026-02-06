# Esbilla SDK v1.7 - Integraciones Soportadas

**Última actualización**: 2026-02-05
**SDK Version**: 1.7.0

Esbilla CMP SDK v1.7 incluye soporte nativo para 20+ plataformas de terceros con carga dinámica y cumplimiento GDPR automático.

---

## 🎯 Resumen Ejecutivo

- **Modo Simplificado**: Carga automática de scripts desde configuración del Dashboard
- **Cumplimiento GDPR**: Scripts solo se cargan DESPUÉS del consentimiento del usuario
- **Zero Manual Implementation**: Sin necesidad de modificar código HTML manualmente
- **Peso Optimizado**: SDK base ~60KB (~18KB gzipped), solo carga integraciones configuradas

---

## 📊 Categorías de Scripts

### 1. Analytics / Estadística (7 integraciones)
Scripts que requieren consentimiento de **analytics**

- Google Analytics 4 (GA4)
- Hotjar
- Amplitude
- Crazy Egg
- VWO (Visual Website Optimizer)
- Optimizely
- (HubSpot también puede ir aquí)

### 2. Marketing / Publicidad (11 integraciones)
Scripts que requieren consentimiento de **marketing**

- Facebook Pixel
- LinkedIn Insight Tag
- TikTok Pixel
- Google Ads Conversion Tracking
- Microsoft Ads (UET)
- Criteo OneTag
- Pinterest Tag
- Twitter Pixel
- Taboola
- YouTube (Privacy-Enhanced Mode)
- HubSpot

### 3. Funcional (2 integraciones)
Scripts que requieren consentimiento de **functional** (opcional según uso)

- Intercom (Live Chat)
- Zendesk Web Widget (Support Chat)

**Nota**: Chats como Intercom/Zendesk pueden considerarse funcionales si son necesarios para el funcionamiento del sitio, pero deben informarse al usuario en el banner.

---

## 🔧 Configuración en el Dashboard

### Estructura de Configuración

En el Dashboard de Esbilla (sección Settings → Site Configuration), añade el objeto `scriptConfig`:

```json
{
  "siteId": "site_xxx",
  "name": "Mi Sitio Web",
  "settings": {
    "mode": "simplified",
    "scriptConfig": {
      "analytics": {
        "googleAnalytics": "G-XXXXXXXXXX",
        "hotjar": "1234567",
        "amplitude": "YOUR_API_KEY",
        "crazyEgg": "00112233",
        "vwo": "654321",
        "optimizely": "1234567890"
      },
      "marketing": {
        "facebookPixel": "123456789012345",
        "linkedinInsight": "123456",
        "tiktokPixel": "ABCDEFGHIJKLMNOP",
        "googleAds": "AW-123456789",
        "microsoftAds": "12345678",
        "criteo": "123456",
        "pinterestTag": "2612345678901",
        "twitterPixel": "o1234",
        "taboola": "1234567",
        "youtube": "dQw4w9WgXcQ",
        "hubspot": "12345678"
      },
      "functional": {
        "intercom": "abcd1234",
        "zendesk": "your-zendesk-key"
      }
    }
  }
}
```

**Importante**: Solo incluye los scripts que realmente usas. Si un campo está vacío o no existe, ese script NO se cargará (optimización automática).

---

## 📝 Guía de Integración por Plataforma

### Analytics

#### 1. Google Analytics 4
```json
"googleAnalytics": "G-XXXXXXXXXX"
```
- **ID**: Measurement ID de GA4 (formato: `G-XXXXXXXXXX`)
- **Características**: Anonymize IP automático, cookie flags SameSite
- **Documentación**: https://support.google.com/analytics/answer/9744165

#### 2. Hotjar
```json
"hotjar": "1234567"
```
- **ID**: Site ID (número de 7 dígitos)
- **Características**: Heatmaps, grabaciones de sesiones, feedback polls
- **Documentación**: https://help.hotjar.com/hc/en-us/articles/115011639927

#### 3. Amplitude
```json
"amplitude": "YOUR_API_KEY"
```
- **ID**: API Key del proyecto
- **Características**: Product analytics, event tracking, user segmentation
- **Documentación**: https://www.docs.developers.amplitude.com/

#### 4. Crazy Egg
```json
"crazyEgg": "00112233"
```
- **ID**: Account Number (8 dígitos hexadecimales)
- **Características**: Heatmaps, scroll maps, click reports
- **Documentación**: https://help.crazyegg.com/article/170-installing-the-crazy-egg-tracking-code

#### 5. VWO (Visual Website Optimizer)
```json
"vwo": "654321"
```
- **ID**: Account ID (número de 6 dígitos)
- **Características**: A/B testing, multivariate testing, personalization
- **Documentación**: https://vwo.com/knowledge/smart-code/

#### 6. Optimizely
```json
"optimizely": "1234567890"
```
- **ID**: Project ID (número de 10 dígitos)
- **Características**: Experimentation platform, feature flags
- **Documentación**: https://docs.developers.optimizely.com/

---

### Marketing / Publicidad

#### 7. Facebook Pixel
```json
"facebookPixel": "123456789012345"
```
- **ID**: Pixel ID (15 dígitos)
- **Características**: Conversion tracking, retargeting, lookalike audiences
- **Documentación**: https://developers.facebook.com/docs/meta-pixel

#### 8. LinkedIn Insight Tag
```json
"linkedinInsight": "123456"
```
- **ID**: Partner ID (6 dígitos)
- **Características**: Conversion tracking, retargeting para LinkedIn Ads
- **Documentación**: https://www.linkedin.com/help/lms/answer/a417991

#### 9. TikTok Pixel
```json
"tiktokPixel": "ABCDEFGHIJKLMNOP"
```
- **ID**: Pixel Code (16 caracteres alfanuméricos)
- **Características**: TikTok Ads conversion tracking, event tracking
- **Documentación**: https://ads.tiktok.com/help/article/standard-mode-pixel

#### 10. Google Ads Conversion Tracking
```json
"googleAds": "AW-123456789"
```
- **ID**: Conversion ID (formato: `AW-XXXXXXXXX`)
- **Características**: Conversion tracking, remarketing
- **Documentación**: https://support.google.com/google-ads/answer/6331314

#### 11. Microsoft Ads (UET)
```json
"microsoftAds": "12345678"
```
- **ID**: UET Tag ID (8 dígitos)
- **Características**: Bing Ads conversion tracking, remarketing
- **Documentación**: https://help.ads.microsoft.com/#apex/ads/en/56682/2

#### 12. Criteo OneTag
```json
"criteo": "123456"
```
- **ID**: Account ID (6 dígitos)
- **Características**: Retargeting dinámico, product recommendations
- **Documentación**: https://help.criteo.com/kb/guide/en/onetag-setup-guide-GbvmUi0G4X/Steps/759326,759327,759328

#### 13. Pinterest Tag
```json
"pinterestTag": "2612345678901"
```
- **ID**: Tag ID (13 dígitos, empieza con 261)
- **Características**: Pinterest Ads conversion tracking
- **Documentación**: https://help.pinterest.com/en/business/article/track-conversions-with-pinterest-tag

#### 14. Twitter Pixel
```json
"twitterPixel": "o1234"
```
- **ID**: Pixel ID (formato: `o` + 4 dígitos)
- **Características**: Twitter Ads conversion tracking, tailored audiences
- **Documentación**: https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html

#### 15. Taboola Pixel
```json
"taboola": "1234567"
```
- **ID**: Account ID (7 dígitos)
- **Características**: Native advertising, content recommendation tracking
- **Documentación**: https://help.taboola.com/hc/en-us/articles/115005576989

#### 16. YouTube (Privacy-Enhanced)
```json
"youtube": "dQw4w9WgXcQ"
```
- **ID**: Video ID (11 caracteres alfanuméricos)
- **Características**: Embeds con youtube-nocookie.com (enhanced privacy)
- **Documentación**: https://support.google.com/youtube/answer/171780

#### 17. HubSpot
```json
"hubspot": "12345678"
```
- **ID**: Portal ID (8 dígitos)
- **Características**: Marketing automation, CRM integration, tracking
- **Documentación**: https://knowledge.hubspot.com/reports/install-the-hubspot-tracking-code

---

### Funcional (Chats / Soporte)

#### 18. Intercom
```json
"intercom": "abcd1234"
```
- **ID**: App ID (8 caracteres alfanuméricos)
- **Características**: Live chat, customer support, messaging
- **Documentación**: https://developers.intercom.com/installing-intercom/docs/basic-javascript

#### 19. Zendesk Web Widget
```json
"zendesk": "your-zendesk-key"
```
- **ID**: Snippet Key (alfanumérico)
- **Características**: Help center, live chat, ticketing
- **Documentación**: https://developer.zendesk.com/documentation/classic-web-widget-sdks/web-widget/installing/

---

## 🔄 Flujo de Carga

### Modo Simplificado (Recommended)

1. **Usuario llega al sitio** → SDK carga configuración desde Dashboard
2. **Banner se muestra** → Usuario ve opciones de consentimiento
3. **Usuario acepta Analytics** → Solo scripts de `scriptConfig.analytics` se cargan
4. **Usuario acepta Marketing** → Scripts de `scriptConfig.marketing` se añaden
5. **Usuario acepta Functional** → Scripts de `scriptConfig.functional` se añaden

### Ejemplo de Flujo Completo

```javascript
// 1. Usuario acepta solo Analytics
{
  analytics: true,
  marketing: false,
  functional: false
}
// Resultado: Se cargan GA4, Hotjar, Amplitude (si configurados)

// 2. Usuario vuelve y acepta todo
{
  analytics: true,
  marketing: true,
  functional: true
}
// Resultado: Se añaden Facebook Pixel, Google Ads, Intercom, etc.
```

---

## 🎨 Estrategia de Peso Ligero

### Carga Condicional

El SDK v1.7 solo incluye el **código de inicialización** de cada plataforma. El peso del SDK (~60KB sin comprimir, ~18KB gzipped) NO crece significativamente con más integraciones porque:

1. **Templates como strings**: Los snippets de código son strings pequeños (~0.5-2KB cada uno)
2. **Solo se ejecutan si están configurados**: `if (analytics.amplitude && scriptTemplates.amplitude)`
3. **Carga diferida**: Scripts de terceros se cargan bajo demanda desde sus CDNs

### Comparativa de Peso

| Configuración | Integraciones | Weight SDK | Weight Total (con CDNs) |
|---------------|---------------|------------|-------------------------|
| Sin config | 0 | 60KB (~18KB gz) | 60KB |
| Solo GA4 | 1 | 60KB | 60KB + 45KB (GA4) = 105KB |
| GA4 + FB + HubSpot | 3 | 60KB | 60KB + 45KB + 25KB + 30KB = 160KB |
| Todas (20+) | 20+ | 60KB | 60KB + ~500KB (todos los CDNs) |

**Nota**: Los scripts de terceros (CDNs) solo se descargan DESPUÉS del consentimiento, no en la carga inicial.

---

## 📊 Ejemplo de Configuración Completa

```json
{
  "siteId": "site_example123",
  "name": "E-commerce Demo",
  "domains": ["www.example.com", "shop.example.com"],
  "settings": {
    "mode": "simplified",
    "scriptConfig": {
      "analytics": {
        "googleAnalytics": "G-ABC123XYZ",
        "hotjar": "3456789",
        "amplitude": "a1b2c3d4e5f6g7h8"
      },
      "marketing": {
        "facebookPixel": "987654321098765",
        "googleAds": "AW-987654321",
        "hubspot": "87654321"
      },
      "functional": {
        "intercom": "xyz12345"
      }
    },
    "banner": {
      "layout": "modal",
      "colors": {
        "primary": "#F59E0B",
        "secondary": "#78350F",
        "background": "#FFFFFF",
        "text": "#1F2937"
      }
    }
  }
}
```

---

## 🚀 Deploy y Testing

### 1. Configurar en Dashboard

1. Login en https://app.esbilla.com
2. Settings → Select Site
3. Scroll a "Script Configuration"
4. Añadir IDs de plataformas que uses
5. Save

### 2. Instalar SDK

```html
<script
  src="https://api.esbilla.com/pegoyu.js"
  data-id="site_example123"
  data-api="https://api.esbilla.com"
></script>
```

### 3. Verificar Carga

Abre DevTools Console y busca:
```
[Esbilla v1.7] Modo: Simplified (carga dinámica desde Dashboard)
[Esbilla v1.7] Cargando scripts dinámicos...
[Esbilla v1.7] ✓ Google Analytics 4 cargado
[Esbilla v1.7] ✓ Facebook Pixel cargado
[Esbilla v1.7] Carga dinámica completada
```

### 4. Testing de Consentimiento

1. **Rechazar todo** → No debe haber requests a `analytics.google.com`, `facebook.com`, etc.
2. **Aceptar Analytics** → Solo requests a GA4, Hotjar, Amplitude
3. **Aceptar Marketing** → Añade requests a Facebook, Google Ads, etc.

**Herramienta recomendada**: Network tab en DevTools, filtrar por `analytics|facebook|google|hotjar`

---

## 🛡️ Compliance GDPR

### Garantías Implementadas

1. **Consentimiento Previo**: Scripts solo se cargan DESPUÉS de aceptación explícita
2. **Granularidad**: Usuario puede aceptar solo Analytics, solo Marketing, o ambos
3. **Revocación**: Usuario puede cambiar consentimiento desde la mosca (icono flotante)
4. **Registro Inmutable**: Todos los consentimientos se guardan en Firestore con timestamps
5. **TTL Automático**: Registros se eliminan automáticamente a los 3 años (GDPR Art. 5)

### Auditoría de Cumplimiento

Para demostrar cumplimiento a una APD (Autoridad de Protección de Datos):

1. **Network Log**: Captura de pantalla mostrando CERO requests a terceros antes del consentimiento
2. **Console Log**: Screenshots de `[Esbilla v1.7]` logs mostrando carga post-consentimiento
3. **Firestore Records**: Exportación de collection `consents` con timestamps y choices
4. **Source Code**: SDK open-source auditable en GitHub

---

## 📚 Recursos Adicionales

- **GitHub**: https://github.com/ClicaOnline/esbilla-cmp
- **Dashboard**: https://app.esbilla.com
- **Documentación**: https://esbilla.com/docs
- **Soporte**: esbilla@clicaonline.com

---

## 🔮 Roadmap (Futuras Integraciones)

Próximas integraciones en SDK v1.8+:

- Matomo (Analytics)
- Plausible (Analytics)
- Segment (CDP)
- Mixpanel (Analytics)
- Klaviyo (Marketing Email)
- Mailchimp (Marketing Email)
- Google Optimize (A/B Testing) - Deprecado por Google, considerar alternativas
- Adobe Analytics (Enterprise)

**¿Necesitas otra integración?** Abre un issue en GitHub: https://github.com/ClicaOnline/esbilla-cmp/issues

---

**© 2026 Clica Online Soluciones S.L. - Esbilla CMP**
**SDK Version**: 1.7.0 - Open Source (MIT License)
