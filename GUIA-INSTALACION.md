# 🌽 Guía de Instalación - Esbilla CMP

Guía rápida para instalar el Pegoyu (el pilar del consentimiento) en tu sitio web.

## 📋 Antes de Empezar

Necesitarás:
- ✅ Un **Site ID** (lo obtienes desde el [Dashboard](https://dashboard.esbilla.com))
- ✅ Acceso al código HTML de tu sitio web O instalar un plugin

---

## 🚀 Opción 1: Instalación Directa (HTML)

### 1. Copia este código

```html
<script
  src="https://api.esbilla.com/pegoyu.js"
  data-id="TU-SITE-ID"
  data-api="https://api.esbilla.com"
></script>
```

### 2. Pégalo en tu web

**Colócalo en el `<head>` de tu HTML**, antes de cualquier otro script de analytics o marketing:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mi Web</title>

  <!-- ⬇️ Pega el código AQUÍ ⬇️ -->
  <script
    src="https://api.esbilla.com/pegoyu.js"
    data-id="mi-sitio-web"
    data-api="https://api.esbilla.com"
  ></script>
  <!-- ⬆️ ANTES de otros scripts ⬆️ -->

</head>
<body>
  <!-- Tu contenido -->
</body>
</html>
```

### 3. Reemplaza los parámetros

| Parámetro | Qué poner | Ejemplo |
|-----------|-----------|---------|
| `data-id` | Tu Site ID del Dashboard | `"mi-tienda-online"` |
| `data-api` | La URL de la API (normalmente no cambiar) | `"https://api.esbilla.com"` |

### 4. ¡Listo!

Recarga tu web y verás el banner de consentimiento. 🎉

---

## 🎨 Configuración Avanzada (Opcional)

### Integración con Google Tag Manager

Si usas GTM, añade tu Container ID:

```html
<script
  src="https://api.esbilla.com/pegoyu.js"
  data-id="mi-sitio-web"
  data-api="https://api.esbilla.com"
  data-gtm="GTM-XXXXXXX"
  data-gtm-mode="true"
></script>
```

### Modo Simplificado (Dashboard gestiona todo)

El Dashboard puede configurar el Pegoyu automáticamente con Google Analytics, Facebook Pixel, etc.:

```html
<script
  src="https://api.esbilla.com/pegoyu.js"
  data-id="mi-sitio-web"
  data-api="https://api.esbilla.com"
></script>
```

Luego configura tus IDs desde el Dashboard en **Sitios → Configuración → Scripts**.

### Modo Manual (Control total)

Si prefieres gestionar tú los scripts, cambia el tipo de tus scripts de analytics/marketing:

**Antes:**
```html
<script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

**Después:**
```html
<script
  type="text/plain"
  data-category="analytics"
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX">
</script>
```

El Pegoyu solo los cargará cuando el usuario dé su consentimiento.

---

## 🔌 Opción 2: Plugin de WordPress

### 1. Descarga el Plugin

Descarga `esbilla-cmp.zip` desde:
- [Releases de GitHub](https://github.com/ClicaOnline/esbilla-cmp/releases)
- O desde tu Dashboard

### 2. Instala en WordPress

1. Ve a **Plugins → Añadir nuevo → Subir plugin**
2. Selecciona el archivo `esbilla-cmp.zip`
3. Haz clic en **Instalar ahora**
4. Activa el plugin

### 3. Configura

1. Ve a **Ajustes → Esbilla CMP**
2. Rellena los campos:

| Campo | Qué poner |
|-------|-----------|
| **Activar** | ✅ Marca la casilla |
| **Site ID** | Tu Site ID del Dashboard |
| **API URL** | `https://api.esbilla.com` |
| **Modo** | Elige: Manual, Simplificado o GTM |

### 4. Modo Simplificado (Recomendado)

Si eliges **Modo Simplificado**, podrás configurar directamente en WordPress:

- **Google Analytics 4:** Pega tu `G-XXXXXXXXXX`
- **Facebook Pixel:** Pega tu Pixel ID
- **Hotjar:** Pega tu Site ID
- **Microsoft Clarity:** Pega tu Project ID
- ... y más

El plugin cargará automáticamente estos scripts cuando el usuario acepte.

### 5. Guarda y Prueba

Haz clic en **Guardar cambios** y visita tu web. Verás el banner de consentimiento. 🎉

---

## 🎯 Modos de Implementación

Elige según tu necesidad:

| Modo | Cuándo usarlo | Complejidad |
|------|---------------|-------------|
| **Manual** | Control total, modificas scripts tú mismo | ⭐⭐⭐ |
| **Simplificado** | Dashboard/Plugin gestiona todo automáticamente | ⭐ (Más fácil) |
| **GTM** | Ya usas Google Tag Manager | ⭐⭐ |

---

## 🔧 Personalización

### Cambiar colores, textos, idioma

Todo se configura desde el **Dashboard → Sitios → Configuración**:

- 🎨 **Colores:** Personaliza el banner a tu marca
- 🌍 **Idiomas:** Soporta 10 idiomas (Asturianu, Español, English, etc.)
- 📝 **Textos:** Personaliza los mensajes
- 🌽 **La Panoya:** Configura el botón flotante (posición, icono)

### Ver la Panoya (botón flotante)

Después de dar consentimiento, aparece un botón flotante (🌽) en la esquina de tu web. Los usuarios pueden hacer clic para cambiar sus preferencias.

---

## 📊 Ver Estadísticas

Desde el Dashboard puedes ver:
- ✅ **Consentimientos:** Cuántos usuarios aceptaron/rechazaron
- 📈 **Estadísticas por URL:** Qué páginas tienen más consentimientos
- 🔍 **Historial (Footprint):** Busca por ID para ver el historial de un usuario específico

---

## ❓ Preguntas Frecuentes

### ¿Funciona con mi CMS?

Sí, funciona con cualquier web HTML:
- ✅ WordPress (plugin disponible)
- ✅ Wix, Squarespace, Webflow
- ✅ HTML estático
- ✅ React, Vue, Angular (SPA)
- ✅ Shopify, PrestaShop, Magento

### ¿Es gratis?

Consulta los planes en [esbilla.com/saas](https://esbilla.com/saas)

### ¿Cumple con RGPD?

Sí, está diseñado para cumplir con:
- ✅ RGPD (Reglamento General de Protección de Datos)
- ✅ ePrivacy Directive
- ✅ Google Consent Mode v2

### ¿Necesito cookies propias?

No, el Pegoyu usa localStorage y cookies de sesión para gestionar el consentimiento. No necesitas configurar nada adicional.

### ¿Afecta al rendimiento?

No, el Pegoyu v2.0 es extremadamente ligero:
- 📦 **Core:** ~25KB (58% más pequeño que v1.7)
- ⚡ **Carga modular:** Solo descarga lo que necesitas
- 🚀 **No bloquea:** Se carga de forma asíncrona

---

## 🆘 Soporte

¿Necesitas ayuda?

- 📧 **Email:** esbilla+soporte@clicaonline.com
- 💬 **GitHub:** [github.com/ClicaOnline/esbilla-cmp/issues](https://github.com/ClicaOnline/esbilla-cmp/issues)
- 📖 **Documentación:** [esbilla.com/docs](https://esbilla.com/docs)

---

**Desarrollado con ❤️ en Asturias por [Clica Online Soluciones S.L.](https://clicaonline.com)**
