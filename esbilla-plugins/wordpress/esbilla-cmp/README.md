# Esbilla CMP - WordPress Plugin

Plugin de WordPress para integrar Esbilla CMP (Consent Management Platform) en tu sitio web.

## Descripción

Esbilla CMP es una plataforma de gestión de consentimiento RGPD/ePrivacy de código abierto. Este plugin facilita la integración del SDK de Esbilla en sitios WordPress.

### Características

- ✅ **3 Modos de Implementación**:
  - **Manual**: Control total modificando scripts manualmente
  - **Simplificado**: Configuración rápida con carga automática de scripts
  - **Google Tag Manager**: Integración avanzada vía GTM

- 🌍 **Multi-idioma**: Soporta 10 idiomas (Asturianu, Español, Galego, Euskara, Català, English, Français, Português, Italiano, Deutsch)

- 🚀 **Fácil configuración**: Interfaz intuitiva en el panel de WordPress

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
- El SDK carga los scripts automáticamente

Plataformas soportadas:
- Google Analytics 4
- Hotjar
- Facebook Pixel
- LinkedIn Insight Tag
- TikTok Pixel

#### Modo Google Tag Manager
- Introduces tu GTM Container ID (GTM-XXXXXXX)
- Configuras tus tags en GTM
- Esbilla proporciona variables para controlar la activación

4. Marca **"Habilitar Esbilla CMP"**
5. Guarda los cambios

## Preguntas Frecuentes

### ¿Es gratis?

Sí, Esbilla CMP es software libre bajo licencia GPL v3. Puedes usarlo, modificarlo y distribuirlo libremente.

### ¿Necesito cuenta en Esbilla?

Sí, necesitas crear una cuenta en [app.esbilla.com](https://app.esbilla.com) para obtener tu Site ID y gestionar el consentimiento de tus usuarios.

### ¿Qué modo debo escoger?

- **Manual**: Si quieres control total y tienes scripts personalizados
- **Simplificado**: Si usas plataformas comunes (GA4, Facebook, etc.)
- **GTM**: Si ya usas Google Tag Manager y tienes configuración compleja

### ¿Funciona con Page Builders?

Sí, Esbilla funciona con cualquier page builder (Elementor, Divi, Beaver Builder, etc.) porque se carga en el `<head>` del sitio.

### ¿Afecta al rendimiento?

El SDK de Esbilla (v1.6.0) es extremadamente ligero (~15KB gzipped) y se carga de forma asíncrona sin bloquear la renderización de la página.

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
