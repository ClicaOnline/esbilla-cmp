# Esbilla CMP - WordPress Plugin

Plugin oficial de WordPress para integrar Esbilla CMP en tu sitio.

## Estructura del Proyecto

```
esbilla-cmp/
├── admin/
│   └── settings-page.php       # Página de configuración visual
├── assets/
│   ├── css/
│   │   └── admin.css           # Estilos del panel de administración
│   └── js/
│       └── admin.js            # Scripts de validación y UX
├── includes/
│   ├── class-esbilla-admin.php # Gestión del panel de admin
│   ├── class-esbilla-sdk.php   # Integración del SDK en frontend
│   └── class-esbilla-settings.php # Utilidades de configuración
├── languages/                  # Traducciones (POT, PO, MO)
├── esbilla-cmp.php             # Archivo principal del plugin
├── README.md                   # Documentación de usuario
└── CHANGELOG.md                # Registro de cambios
```

## Desarrollo

### Requisitos

- WordPress 5.8 o superior
- PHP 7.4 o superior
- Node.js (para compilar assets, opcional)

### Instalación en desarrollo

1. Clona el repositorio:
   ```bash
   git clone https://github.com/ClicaOnline/esbilla-cmp.git
   cd esbilla-cmp/esbilla-plugins/wordpress
   ```

2. Copia la carpeta `esbilla-cmp` a `wp-content/plugins/`

3. Activa el plugin desde el panel de WordPress

### Generar traducciones

Para generar archivos de traducción:

```bash
# Instalar WP-CLI (si no lo tienes)
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp

# Generar archivo POT
wp i18n make-pot esbilla-cmp esbilla-cmp/languages/esbilla-cmp.pot

# Generar archivos MO desde PO
cd esbilla-cmp/languages
for po in *.po; do msgfmt -o "${po%.po}.mo" "$po"; done
```

### Idiomas Soportados

El plugin está traducido a 10 idiomas:

- 🇪🇸 **ast** - Asturianu (idioma por defecto)
- 🇪🇸 **es** - Español
- 🇪🇸 **gl** - Galego
- 🇪🇸 **eu** - Euskara
- 🇪🇸 **ca** - Català
- 🇬🇧 **en** - English
- 🇫🇷 **fr** - Français
- 🇵🇹 **pt** - Português
- 🇮🇹 **it** - Italiano
- 🇩🇪 **de** - Deutsch

Para añadir un nuevo idioma:

1. Copia `languages/esbilla-cmp-es_ES.po` a `esbilla-cmp-{locale}.po`
2. Traduce las cadenas usando Poedit o un editor de texto
3. Genera el archivo .mo: `msgfmt -o esbilla-cmp-{locale}.mo esbilla-cmp-{locale}.po`

## Arquitectura

### Single Source of Truth (Arquitectura de Configuración)

El plugin de WordPress sigue una arquitectura de **Single Source of Truth** donde:

- **Plugin de WordPress**: Actúa como **launcher** del Pegoyu
  - Responsabilidad: Inyectar el script del Pegoyu con el Site ID
  - NO gestiona: Configuración avanzada de plataformas, GTM Gateway, templates, estilos

- **Dashboard (app.esbilla.com)**: Es la **única fuente de verdad** para la configuración
  - Responsabilidad: Gestionar toda la configuración de banners, plataformas, GTM Gateway, etc.
  - Base de datos: Firestore

- **API**: Intermedia entre Pegoyu y Dashboard
  - Responsabilidad: Servir configuración completa al Pegoyu cuando la solicita
  - Cacheo: 5 minutos para reducir lecturas de Firestore

**Flujo de configuración:**
```
WordPress Plugin → Inyecta Pegoyu con Site ID
                          ↓
               Pegoyu carga en navegador
                          ↓
            Solicita configuración a API (GET /api/config/:siteId)
                          ↓
          API consulta Firestore (con caché 5 min)
                          ↓
         Devuelve configuración completa (GTM, scripts, estilos, textos)
                          ↓
           Pegoyu renderiza banner con configuración
```

**Ventajas:**
- ✅ No hay sincronización bidireccional
- ✅ Cambios en Dashboard son instantáneos (tras expirar caché)
- ✅ Un Site ID gestiona múltiples configuraciones
- ✅ Menor mantenimiento del plugin de WordPress

### Flujo de Inicialización

1. WordPress carga `esbilla-cmp.php`
2. Se define la clase `Esbilla_CMP` (singleton)
3. Se cargan las dependencias (`includes/`)
4. Se registran los hooks de admin y público
5. En el frontend, `Esbilla_SDK::inject_sdk()` inyecta el script en `<head>` con el Site ID

### Hooks Disponibles

```php
// Antes de inyectar el SDK
do_action('esbilla_before_inject_sdk');

// Después de inyectar el SDK
do_action('esbilla_after_inject_sdk');

// Modificar opciones del plugin
apply_filters('esbilla_settings', $options);

// Modificar atributos del script SDK
apply_filters('esbilla_sdk_attributes', $attributes);
```

### Ejemplo de Uso de Hooks

```php
// En tu tema o plugin
add_filter('esbilla_sdk_attributes', function($attributes) {
    // Añadir un atributo personalizado
    $attributes['data-custom'] = 'mi-valor';
    return $attributes;
});
```

## Testing

### Test Manual

1. Instala el plugin en un WordPress local
2. Configura un Site ID de prueba
3. Prueba los 3 modos de implementación
4. Verifica que el SDK se inyecta correctamente
5. Comprueba el banner de consentimiento

### Checklist de Release

- [ ] Actualizar `CHANGELOG.md`
- [ ] Incrementar versión en `esbilla-cmp.php`
- [ ] Generar archivos de traducción
- [ ] Probar en WordPress 5.8, 6.0, 6.4 (última versión)
- [ ] Probar en PHP 7.4, 8.0, 8.1, 8.2
- [ ] Validar código con WPCS (WordPress Coding Standards)
- [ ] Crear tag en Git
- [ ] Subir a repositorio de WordPress

## Distribución

### Preparar para el repositorio de WordPress

```bash
# Limpiar archivos de desarrollo
rm -rf .git node_modules

# Crear ZIP
cd ..
zip -r esbilla-cmp.zip esbilla-cmp/ -x "*.git*" "*node_modules*" "*.DS_Store"
```

### Subir al repositorio de WordPress

1. Crea una cuenta en https://wordpress.org/plugins/developers/
2. Sube el ZIP inicial
3. Espera la revisión (1-2 semanas)
4. Una vez aprobado, usa SVN para actualizaciones

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Coding Standards

Seguimos los [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/):

```bash
# Instalar PHP_CodeSniffer
composer global require "squizlabs/php_codesniffer=*"
composer global require wp-coding-standards/wpcs

# Configurar WPCS
phpcs --config-set installed_paths ~/.composer/vendor/wp-coding-standards/wpcs

# Validar código
phpcs --standard=WordPress esbilla-cmp/
```

## Licencia

GPL v3 o posterior - https://www.gnu.org/licenses/gpl-3.0.html

## Contacto

- **Email**: esbilla@clicaonline.com
- **GitHub**: https://github.com/ClicaOnline/esbilla-cmp
- **Web**: https://esbilla.com
