# Esbilla CMP - WordPress Plugin

Plugin de WordPress para integrar Esbilla CMP (Consent Management Platform) en tu sitio web.

## Descripción

Esbilla CMP es una plataforma de gestión de consentimiento RGPD/ePrivacy de código abierto. Este plugin facilita la integración del Pegoyu de Esbilla en sitios WordPress.

### Arquitectura: Single Source of Truth

El plugin de WordPress actúa como **launcher** del Pegoyu. La configuración avanzada (GTM Gateway, templates personalizados, estilos) se gestiona **exclusivamente desde el Dashboard** en [app.esbilla.com](https://app.esbilla.com).

**Flujo de configuración:**
1. Plugin de WordPress → Inyecta el Pegoyu con el Site ID
2. Pegoyu → Solicita configuración a la API con el Site ID
3. API → Devuelve configuración completa desde Firestore (GTM Gateway, scripts, estilos, etc.)
4. Pegoyu → Renderiza el banner con la configuración del Dashboard

**No hay sincronización bidireccional** entre el plugin y el dashboard. El Site ID es la única conexión necesaria.

### Características

- ✅ **3 Modos de Implementación**:
  - **Manual**: Control total modificando scripts manualmente
  - **Simplificado**: Configuración rápida con carga automática de scripts (IDs gestionados en Dashboard)
  - **Google Tag Manager**: Integración avanzada vía GTM (GTM Gateway gestionado en Dashboard)

- 🌍 **Multi-idioma**: Soporta 10 idiomas (Asturianu, Español, Galego, Euskara, Català, English, Français, Português, Italiano, Deutsch)

- 🚀 **Fácil configuración**: Site ID + activación del plugin = listo

- 🔒 **RGPD/ePrivacy**: Cumplimiento normativo automático

- 📊 **Dashboard centralizado**: Gestiona todos tus sitios desde [app.esbilla.com](https://app.esbilla.com)

## Instalación

### Desde el repositorio de WordPress (próximamente)

1. Ve a Plugins > Añadir nuevo
2. Busca "Esbilla CMP"
3. Haz clic en "Instalar ahora"
4. Activa el plugin

### Instalación manual

1. Descarga el archivo ZIP del plugin
2. Ve a Plugins > Añadir nuevo > Subir plugin
3. Sube el archivo ZIP
4. Activa el plugin
5. Ve a Ajustes > Esbilla CMP para configurarlo

## Configuración

### 1. Obtener tu Site ID

1. Regístrate en [app.esbilla.com](https://app.esbilla.com)
2. Crea un nuevo sitio
3. Copia el Site ID (formato UUID)

### 2. Configurar el plugin

1. Ve a **Ajustes > Esbilla CMP**
2. Pega tu **Site ID**
3. Escoge tu **Modo de implementación**:

#### Modo Manual
- Cambias `type="text/javascript"` a `type="text/plain"` en tus scripts
- Añades `data-category="analytics"` o `data-category="marketing"`
- Esbilla los activa cuando el usuario da consentimiento

```html
<!-- Antes -->
<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

<!-- Después -->
<script type="text/plain"
        data-category="analytics"
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

#### Modo Simplificado
- Introduces los IDs de las plataformas que usas
- El Pegoyu carga los scripts automáticamente

Plataformas soportadas:

**Analytics (7)**
- Google Analytics 4
- Hotjar
- Microsoft Clarity
- Amplitude
- Crazy Egg
- VWO (Visual Website Optimizer)
- Optimizely

**Marketing (10)**
- Facebook Pixel
- LinkedIn Insight Tag
- TikTok Pixel
- Google Ads
- Microsoft Ads (Bing)
- Criteo
- Pinterest Tag
- Twitter (X) Pixel
- Taboola
- HubSpot

**Functional (2)**
- Intercom
- Zendesk

#### Modo Google Tag Manager
- Selecciona el modo GTM en el plugin
- **Importante**: La configuración del GTM Container ID y GTM Gateway se gestiona desde el **Dashboard** ([app.esbilla.com](https://app.esbilla.com)), no desde el plugin
- El plugin solo inyecta el Pegoyu, que luego carga la configuración GTM desde la API
- Configuras tus tags en GTM y Esbilla proporciona variables para controlar la activación

4. Marca **"Habilitar Esbilla CMP"**
5. Guarda los cambios
6. **Ve al Dashboard** para configurar GTM Container ID, GTM Gateway y otros ajustes avanzados

## Preguntas Frecuentes

### ¿Es gratis?

Sí, Esbilla CMP es software libre bajo licencia GPL v3. Puedes usarlo, modificarlo y distribuirlo libremente.

### ¿Necesito cuenta en Esbilla?

Sí, necesitas crear una cuenta en [app.esbilla.com](https://app.esbilla.com) para obtener tu Site ID y gestionar el consentimiento de tus usuarios.

### ¿Qué modo debo escoger?

- **Manual**: Si quieres control total y tienes scripts personalizados
- **Simplificado**: Si usas plataformas comunes (GA4, Facebook, etc.) - Los IDs se configuran en el Dashboard
- **GTM**: Si ya usas Google Tag Manager y tienes configuración compleja - El GTM Container ID y GTM Gateway se configuran en el Dashboard

### ¿Dónde configuro los IDs de plataformas y el GTM Gateway?

**En el Dashboard** ([app.esbilla.com](https://app.esbilla.com)). El plugin de WordPress solo necesita el Site ID. Toda la configuración avanzada (IDs de plataformas, GTM Container ID, GTM Gateway, templates, estilos) se gestiona centralizadamente en el Dashboard. Esto permite:

- **Una única fuente de verdad**: No hay desincronización entre sistemas
- **Cambios instantáneos**: Actualiza la configuración sin tocar WordPress
- **Multi-sitio coherente**: Gestiona múltiples sitios desde un solo panel
- **Menos mantenimiento**: El plugin actúa como launcher, la lógica está en el Dashboard

### ¿Funciona con Page Builders?

Sí, Esbilla funciona con cualquier page builder (Elementor, Divi, Beaver Builder, etc.) porque se carga en el `<head>` del sitio.

### ¿Afecta al rendimiento?

El Pegoyu de Esbilla (v2.0) es extremadamente ligero (~25KB, 58% más pequeño que v1.7) y se carga de forma asíncrona sin bloquear la renderización de la página. Los módulos de integración se cargan bajo demanda.

### ¿Es compatible con otros plugins?

Sí, Esbilla es compatible con:
- Plugins de caché (WP Rocket, W3 Total Cache, etc.)
- Plugins de seguridad
- Plugins de optimización (Autoptimize, etc.)
- Plugins de SEO (Yoast, Rank Math, etc.)

## Roadmap

- [ ] Soporte para más plataformas en modo simplificado
- [ ] Plantillas personalizables de banner
- [ ] Integración con WooCommerce
- [ ] Widgets de WordPress para personalización avanzada
- [ ] Exportación de datos de consentimiento

## Soporte

- **Documentación**: [HOWTO.md](https://github.com/ClicaOnline/esbilla-cmp/blob/main/HOWTO.md)
- **Issues**: [GitHub Issues](https://github.com/ClicaOnline/esbilla-cmp/issues)
- **Email**: esbilla@clicaonline.com

## Licencia

GPL v3 or later - https://www.gnu.org/licenses/gpl-3.0.html

## Créditos

Desarrollado con ❤️ en Asturias por [Clica Online Soluciones S.L.](https://clicaonline.com)

---

**Proyecto Open Source**
[GitHub](https://github.com/ClicaOnline/esbilla-cmp) | [Sitio Web](https://esbilla.com) | [Dashboard](https://app.esbilla.com)
