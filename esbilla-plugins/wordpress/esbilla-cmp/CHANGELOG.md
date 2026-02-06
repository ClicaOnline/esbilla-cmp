# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.1] - 2026-02-06

### Cambiado
- **Rebranding**: Actualizada terminología de "SDK" a "Pegoyu" (el pilar que sostiene el Hórreo)
- **Rebranding**: "Mosca" renombrada a "Panoya" (la mazorca en asturiano)
- Actualizada documentación con nueva terminología cultural asturiana
- Compatible con Pegoyu v2.0 (arquitectura modular)

### Optimizado
- El Pegoyu v2.0 es 58% más pequeño (~25KB vs ~70KB en v1.7)
- Carga modular de integraciones bajo demanda
- Mejor rendimiento en Core Web Vitals

## [1.2.0] - 2026-02-06

### Añadido
- Sistema de acordeones en panel de administración para organizar las 19 plataformas por categorías
- Badges con contadores de plataformas disponibles por categoría
- Iconos visuales diferenciados por tipo (Analytics, Marketing, Functional)

### Optimizado
- **Core Web Vitals**: Implementado lazy loading del Pegoyu para no impactar en FCP, LCP y Speed Index
- **Resource Hints**: Añadido dns-prefetch y preconnect para mejorar tiempo de carga
- **Carga diferida**: Pegoyu se carga con requestIdleCallback o setTimeout para no bloquear el rendering
- **Defer en lugar de Async**: Cambio de estrategia de carga para no bloquear el parsing del HTML
- Reducción estimada de impacto en rendimiento: ~70% menos impacto en Core Web Vitals

### Cambiado
- UI del panel de administración con acordeones colapsables para mejor UX
- Estilos mejorados con animaciones suaves y estados hover

## [1.1.0] - 2026-02-06

### Añadido
- Soporte para 14 nuevas plataformas en modo Simplificado:
  - **Analytics**: Microsoft Clarity, Amplitude, Crazy Egg, VWO, Optimizely
  - **Marketing**: Google Ads, Microsoft Ads (Bing), Criteo, Pinterest, Twitter (X), Taboola, HubSpot
  - **Functional**: Intercom, Zendesk
- Total de 19 plataformas soportadas en modo Simplificado (7 analytics + 10 marketing + 2 functional)

### Cambiado
- Actualizado el panel de administración para mostrar todos los nuevos campos
- Mejorada la documentación del README con lista completa de integraciones
- Optimizada la estructura del script config en el Pegoyu

## [1.0.0] - 2026-02-05

### Añadido
- Versión inicial del plugin de WordPress
- Soporte para 3 modos de implementación:
  - Manual (modificación de scripts)
  - Simplificado (configuración de IDs)
  - Google Tag Manager (integración GTM)
- Interfaz de administración completa
- Soporte para 10 idiomas (ast, es, gl, eu, ca, en, fr, pt, it, de)
- Integración con Pegoyu v1.6.0
- Validación de campos en el formulario
- Panel de información y recursos
- Estilos personalizados para el admin
- Scripts de validación en tiempo real
- Documentación completa

### Características
- Control de activación/desactivación del plugin
- Configuración de Site ID y API URL
- Selección de modo de implementación con UI contextual
- Campos específicos para cada modo:
  - **Manual**: Sin configuración adicional
  - **Simplificado**: IDs de Google Analytics, Hotjar, Facebook Pixel, LinkedIn, TikTok
  - **GTM**: GTM Container ID
- Enlaces rápidos a recursos de Esbilla
- Comparación visual de modos
- Ayuda contextual para cada modo

### Técnico
- Arquitectura modular con clases separadas:
  - `Esbilla_CMP` (clase principal)
  - `Esbilla_SDK` (integración del Pegoyu)
  - `Esbilla_Admin` (panel de administración)
  - `Esbilla_Settings` (gestión de opciones)
- Hooks de activación/desactivación
- Sanitización de datos
- Carga condicional de assets
- Compatibilidad con WordPress 5.8+
- Requiere PHP 7.4+
