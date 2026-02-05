# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-02-05

### Añadido
- Versión inicial del plugin de WordPress
- Soporte para 3 modos de implementación:
  - Manual (modificación de scripts)
  - Simplificado (configuración de IDs)
  - Google Tag Manager (integración GTM)
- Interfaz de administración completa
- Soporte para 10 idiomas (ast, es, gl, eu, ca, en, fr, pt, it, de)
- Integración con SDK v1.6.0
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
  - `Esbilla_SDK` (integración del SDK)
  - `Esbilla_Admin` (panel de administración)
  - `Esbilla_Settings` (gestión de opciones)
- Hooks de activación/desactivación
- Sanitización de datos
- Carga condicional de assets
- Compatibilidad con WordPress 5.8+
- Requiere PHP 7.4+
