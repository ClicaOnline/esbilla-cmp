# Recursos Gráficos Necesarios para Esbilla CMP

Este documento lista todos los recursos gráficos que necesita el proyecto Esbilla CMP para su implementación completa. Los recursos están organizados por prioridad y ubicación de uso.

---

## 🎨 Paleta de Colores Esbilla

- **Maiz (Amarillo/Oro)**: `#FFBF00` - Color primario de marca
- **Madera (Marrón Oscuro)**: `#3D2B1F` - Color secundario de marca
- **Blanco**: `#FFFFFF`
- **Grises**: `#F5F5F4`, `#E7E5E4`, `#78716C`

---

## 🌽 PRIORIDAD ALTA - Icono de la Panoya (Banner SDK)

### Contexto
El icono de la panoya (mazorca de maíz) es la imagen central del banner de cookies. Actualmente existe solo UNA versión SVG muy detallada (Panoya.astro). Necesitamos versiones adicionales personalizables.

### Necesidades

#### 1. Tres Estilos de Panoya
Cada estilo debe entregarse como SVG optimizado y editable:

**Estilo 1: "Panoya Realista"** (ACTUAL)
- Descripción: Mazorca de maíz detallada con granos individuales y hojas
- Estilo: Ilustración con degradados y sombras
- Formato: SVG con capas editables
- Tamaños: Responsive (16px - 128px)
- Colores base: Amarillo #FFBF00, Dorado #C2A561, Verde #2F6E8D

**Estilo 2: "Panoya Minimalista"** (NUEVA)
- Descripción: Versión simplificada, líneas limpias, estilo flat
- Estilo: Diseño plano sin degradados
- Formato: SVG con formas básicas
- Tamaños: Responsive (16px - 128px)
- Colores: Un solo tono de amarillo más contorno opcional

**Estilo 3: "Panoya Geométrica"** (NUEVA)
- Descripción: Estilo moderno con formas geométricas
- Estilo: Líneas rectas, ángulos marcados, estilo tech
- Formato: SVG vectorial
- Tamaños: Responsive (16px - 128px)
- Colores: Variante con gradiente de amarillo a naranja

#### 2. Requisitos Técnicos para las Panoyas

**Formato:**
- SVG optimizado (< 10KB por archivo)
- Compatible con navegadores modernos + IE11
- Clases CSS editables para colores personalizables

**Estructura del SVG:**
```svg
<svg id="panoya-[estilo]" viewBox="0 0 128 128">
  <defs>
    <style>
      .panoya-primary { fill: var(--esbilla-primary, #FFBF00); }
      .panoya-secondary { fill: var(--esbilla-secondary, #C2A561); }
      .panoya-accent { fill: var(--esbilla-accent, #2F6E8D); }
    </style>
  </defs>
  <!-- Contenido del icono -->
</svg>
```

**Personalización de Colores:**
- El usuario debe poder cambiar los colores desde el panel de administración
- Colores editables: primario, secundario, acento
- Previsualización en tiempo real en el Dashboard

**Entregables:**
- `panoya-realista.svg` (optimización del actual)
- `panoya-minimalista.svg` (nuevo)
- `panoya-geometrica.svg` (nuevo)
- Componente React: `IconPanoyaSelector.tsx` (selector visual en Dashboard)
- Documentación de uso en `docs/BANNER-ICONS.md`

---

## 🎭 PRIORIDAD ALTA - Iconos del Sistema

### Landing Page (esbilla.com)

**Iconos de Características** (12 iconos)
- **CMP (Consent Management)**: Icono de escudo con checkmark
- **Open Source**: Icono de código abierto (bifurcación/fork)
- **GDPR Compliant**: Icono de certificación europea
- **Multi-idioma**: Icono de globo con idiomas
- **Analytics**: Icono de gráficos/estadísticas
- **Script Blocking**: Icono de stop/bloqueo
- **Cross-domain**: Icono de dominios enlazados
- **Self-hosted**: Icono de servidor propio
- **Performance**: Icono de rayo/velocidad
- **Privacy First**: Icono de candado/privacidad
- **API REST**: Icono de conectores/API
- **Dashboard**: Icono de panel de control

**Formato:**
- SVG con viewBox="0 0 24 24"
- Monocromo con fill="currentColor" para usar con Tailwind
- Grosor de línea: 2px (stroke-width="2")
- Estilo: Lucide/Heroicons compatible

**Ubicación:**
- `esbilla-public/src/components/icons/features/`
- Importar como componentes Astro

---

### Dashboard (app.esbilla.com)

**Iconos de Navegación** (ya implementados con Lucide, OK ✅)
- Dashboard, Sites, Organizations, Users, Settings, etc.
- No requiere acción adicional

**Estados/Badges** (6 iconos pequeños)
- **Plan Free**: Icono de hoja/starter
- **Plan Pro**: Icono de estrella/pro
- **Plan Enterprise**: Icono de edificio/corporativo
- **Email Verified**: Check verde
- **Email Pending**: Reloj/pendiente
- **SMTP Configured**: Sobre con check

**Formato:**
- SVG 16x16px
- Colores: Verde (#10B981), Amarillo (#FFBF00), Gris (#78716C)

---

## 🖼️ PRIORIDAD MEDIA - Imágenes de Fondo

### Hero Section - Landing Page

**Imagen Actual:** `esbilla-pueblu.png`
- Descripción: Pueblo asturiano entre montañas
- Uso: Fondo de la sección hero en landing
- Estado: ✅ Existente

**Imágenes Adicionales Necesarias:**

**1. Hero Alternativo - "Panoya de Maíz en Campo"**
- Descripción: Campo de maíz asturiano con montañas al fondo
- Estilo: Fotografía natural con luz cálida
- Resolución: 1920x1080px (Full HD), WebP optimizado
- Peso máximo: 200KB
- Uso: Variante alternativa para A/B testing

**2. Sección Features - "Textura de Maíz Abstracta"**
- Descripción: Patrón abstracto inspirado en granos de maíz
- Estilo: Gráfico vectorial, colores Esbilla (amarillo/marrón)
- Resolución: 1920x400px (banner horizontal)
- Formato: SVG o WebP
- Peso máximo: 100KB
- Uso: Fondo decorativo en secciones de características

**3. Sección Comunidad - "Colaboración Rural"**
- Descripción: Personas trabajando juntas en entorno rural/colaborativo
- Estilo: Ilustración flat design o fotografía editada
- Resolución: 800x600px
- Formato: WebP
- Peso máximo: 150KB
- Uso: Sección de comunidad/open source

---

## 📸 PRIORIDAD MEDIA - Ilustraciones de Características

### Landing Page - Sección "Cómo Funciona"

**Ilustración 1: "Instalación del Script"**
- Escena: Código HTML con el script de Esbilla siendo añadido a una web
- Estilo: Flat design, colores Esbilla
- Dimensiones: 400x300px
- Formato: SVG
- Elementos: Editor de código, tag `<script>`, icono de checkmark

**Ilustración 2: "Usuario Dando Consentimiento"**
- Escena: Silueta de usuario frente a banner de cookies eligiendo opciones
- Estilo: Flat design, colores Esbilla
- Dimensiones: 400x300px
- Formato: SVG
- Elementos: Persona, modal de cookies, botones de aceptar/rechazar

**Ilustración 3: "Dashboard con Estadísticas"**
- Escena: Interfaz del dashboard mostrando gráficos de consentimientos
- Estilo: Flat design, colores Esbilla
- Dimensiones: 400x300px
- Formato: SVG
- Elementos: Gráficos de barras/líneas, iconos, interfaz limpia

**Ilustración 4: "Cumplimiento GDPR"**
- Escena: Escudo europeo con checkmark y símbolo de privacidad
- Estilo: Flat design, colores institucionales + Esbilla
- Dimensiones: 400x300px
- Formato: SVG
- Elementos: Escudo, bandera UE estilizada, candado, checkmark

---

## 🎯 PRIORIDAD MEDIA - Iconos de Integraciones (SDK v1.7)

El SDK soporta 20+ integraciones de terceros. Necesitamos iconos para mostrar en el Dashboard.

### Analíticas (7 iconos)
- Google Analytics (logo G)
- Hotjar (logo H naranja/rojo)
- Amplitude (logo A morado)
- Crazy Egg (logo huevo loco)
- VWO (logo VWO azul)
- Optimizely (logo O)
- Microsoft Clarity (logo Clarity)

### Marketing (11 iconos)
- Facebook Pixel (logo F)
- LinkedIn Insight (logo in)
- TikTok Pixel (logo TikTok)
- Google Ads (logo G Ads)
- Microsoft Ads (logo MS Ads)
- Criteo (logo C)
- Pinterest Tag (logo P)
- Twitter Pixel (logo X)
- Taboola (logo T verde)
- YouTube (logo play rojo)
- HubSpot (logo H naranja)

### Funcionales (2 iconos)
- Intercom (logo burbujas)
- Zendesk (logo Z verde)

**Formato:**
- SVG 32x32px
- Colores oficiales de cada marca
- Fondo transparente
- Optimizados (< 5KB cada uno)

**Ubicación:**
- `esbilla-dashboard/src/components/icons/integrations/`

---

## 🌐 PRIORIDAD BAJA - Assets de Marketing

### Open Graph / Social Media

**1. OG Image - Esbilla**
- Descripción: Imagen destacada para compartir en redes sociales
- Contenido: Logo Esbilla + tagline "Consent management made in Asturias 🌽"
- Resolución: 1200x630px (estándar OG)
- Formato: PNG
- Estado: ✅ Existente (`esbilla-og.png`)

**2. Twitter Card**
- Descripción: Versión cuadrada para Twitter
- Resolución: 800x800px
- Formato: PNG

**3. Favicon Variations**
- Descripción: Variantes del favicon para diferentes contextos
- Estado: ✅ Existente (`favicon.svg`)
- Adicional: Versiones PNG en 16x16, 32x32, 64x64, 128x128, 256x256

---

### Documentación Técnica

**Diagramas de Arquitectura** (4 diagramas)
1. **Diagrama de Flujo de Consentimiento**
   - Usuario → Banner → SDK → API → Firestore
   - Formato: SVG editable (draw.io o similar)

2. **Diagrama de Multi-tenancy**
   - Platform → Organizations → Sites → Users
   - Formato: SVG editable

3. **Diagrama de Integración SDK**
   - Website → Pegoyu.js → GTM/GA4 → Consent Mode V2
   - Formato: SVG editable

4. **Diagrama de Cross-domain Sync**
   - Dominio A ↔ API ↔ Dominio B (sincronización footprint)
   - Formato: SVG editable

**Ubicación:**
- `docs/diagrams/`

---

## 📋 Resumen de Prioridades

### ⚡ URGENTE (Sprint Actual)
- [ ] 3 estilos de Panoya (realista, minimalista, geométrica) - SVG editables
- [ ] Componente selector de panoya en Dashboard
- [ ] Sistema de personalización de colores para panoya

### 🔥 ALTA (Próximo Sprint)
- [ ] 12 iconos de características para Landing
- [ ] 6 badges de estado para Dashboard
- [ ] 2 imágenes de fondo alternativas (hero + features)

### 📊 MEDIA (Backlog Corto Plazo)
- [ ] 4 ilustraciones "Cómo Funciona"
- [ ] 20 iconos de integraciones (logos de terceros)
- [ ] Twitter Card + Favicon variations

### 🎨 BAJA (Backlog Largo Plazo)
- [ ] 4 diagramas técnicos de arquitectura
- [ ] Assets adicionales de marketing

---

## 🛠️ Especificaciones Técnicas Generales

### Formatos Preferidos
- **Iconos**: SVG con viewBox, fill="currentColor"
- **Ilustraciones**: SVG o WebP optimizado
- **Fotografías**: WebP con fallback JPG
- **Logos de marca**: SVG original + PNG en múltiples tamaños

### Optimización
- SVG: < 10KB por archivo (usar SVGO)
- WebP: < 200KB, calidad 80-85
- PNG: < 100KB, optimizar con TinyPNG

### Naming Convention
```
[categoria]-[nombre]-[variante].[ext]

Ejemplos:
icon-feature-gdpr.svg
panoya-minimalista-amarillo.svg
bg-hero-maizal.webp
illustration-dashboard-stats.svg
logo-integration-google-analytics.svg
```

### Estructura de Directorios
```
esbilla-public/public/images/
├── icons/
│   ├── features/          # Iconos de características
│   ├── panoyas/          # 3 estilos de panoya
│   └── integrations/     # Logos de integraciones
├── backgrounds/           # Imágenes de fondo
├── illustrations/         # Ilustraciones flat design
└── marketing/            # OG images, Twitter cards

esbilla-dashboard/src/assets/
├── icons/
│   ├── badges/           # Badges de estado
│   └── integrations/     # Logos de integraciones
```

---

## 📝 Notas para Diseñadores

1. **Estilo Visual**: Inspirado en cultura asturiana rural, colores cálidos (amarillo maíz, marrón madera), estética artesanal pero moderna.

2. **Accesibilidad**:
   - Contraste mínimo 4.5:1 para textos
   - Iconos con etiquetas alt descriptivas
   - SVGs con títulos y descripciones para lectores de pantalla

3. **Responsive**:
   - Todos los iconos deben funcionar desde 16px hasta 128px
   - Imágenes de fondo deben tener versiones mobile (768px ancho)

4. **Licencias**:
   - Todo el contenido debe ser original o tener licencia compatible con Apache 2.0
   - Evitar uso de assets con copyright de terceros sin permiso explícito

---

## 🔮 Roadmap Futuro (No Prioritario)

### Fase 2: Personalización Avanzada del Banner
- **Icono del Cliente en Banner**: Permitir que cada organización suba su propio logo para mostrar en el banner de cookies
- **Ubicación**: Configuración avanzada en `Settings.tsx`
- **Formato**: PNG/SVG, máx 50KB, 128x128px
- **Implementación**:
  - Upload a Firebase Storage
  - URL almacenada en `Organization.bannerLogoUrl`
  - Fallback a panoya por defecto
- **Estado**: 📌 Apuntado en backlog para fase futura

---

## 📞 Contacto

Para dudas sobre especificaciones técnicas o entrega de assets:
- Repositorio: https://github.com/jlasolis/esbilla-cmp
- Documentación: `/docs/`

---

**Última actualización**: 2026-02-06
**Versión del documento**: 1.0
