# Guía de Componentes Visuales - Esbilla CMP

Esta guía documenta los componentes visuales personalizados creados para Esbilla CMP, incluyendo iconos, badges e ilustraciones.

---

## 🌽 Panoya (Icono Personalizable)

### Ubicación
- **Astro**: `esbilla-public/src/components/icons/Panoya.astro`
- **SDK**: Renderizado dinámico en `esbilla-api/public/pegoyu.js`

### Props
```typescript
interface PanoyaProps {
  variant?: 'realista' | 'minimalista' | 'geometrica'; // Default: 'realista'
  size?: string | number;                               // Default: '128'
  class?: string;
  primary?: string;                                     // Default: '#FFBF00'
  secondary?: string;                                   // Default: '#C2A561'
  accent?: string;                                      // Default: '#2F6E8D'
}
```

### Uso en Astro
```astro
<Panoya variant="minimalista" size="64" primary="#FF5733" />
```

### Uso en SDK (Automático)
El SDK lee `panoyaVariant` y `panoyaColors` desde Firestore y renderiza automáticamente.

### Configuración en Dashboard
1. Ir a **Settings** → **Personalización del Icono**
2. Seleccionar variante visual
3. Personalizar colores con color pickers
4. Guardar cambios

---

## 🎯 FeatureIcon (Iconos de Características)

### Ubicación
`esbilla-public/src/components/icons/FeatureIcon.astro`

### Iconos Disponibles
- `cmp` - Escudo con checkmark
- `open-source` - Código bifurcado
- `gdpr-compliant` - Certificación europea
- `multi-idioma` - Globo con idiomas
- `analytics` - Gráficos/estadísticas
- `script-blocking` - Bloqueo de scripts
- `crossdomain` - Dominios enlazados
- `selfhosted` - Servidor propio
- `performance` - Rayo/velocidad
- `privacy-first` - Candado/privacidad
- `api-rest` - Conectores/API
- `dashboard` - Panel de control

### Props
```typescript
interface FeatureIconProps {
  name: string;   // Nombre del icono (ver lista arriba)
  class?: string;
}
```

### Uso
```astro
<FeatureIcon name="gdpr-compliant" />
```

### Estilo
- SVG 24x24px
- `stroke="currentColor"` (hereda color del texto)
- Stroke width: 2px
- Compatible con Tailwind classes

---

## 🏷️ BadgeEstado (Badges de Estado)

### Ubicación
- **Astro**: `esbilla-public/src/components/icons/BadgesEstado.astro`
- **React**: `esbilla-dashboard/src/components/BadgeEstado.tsx`

### Badges Disponibles
**Planes:**
- `plan-free` → 🌾 Hoja (gris)
- `plan-pro` → ⭐ Estrella (dorado)
- `plan-enterprise` → 🏢 Edificio (marrón)

**Email:**
- `email-verified` → ✓ Check (verde)
- `email-pending` → ⏱️ Reloj (gris)

**Configuración:**
- `smtp-configured` → ✉️ Sobre con check (azul)

### Props (React)
```typescript
interface BadgeEstadoProps {
  name: 'plan-free' | 'plan-pro' | 'plan-enterprise'
        | 'email-verified' | 'email-pending'
        | 'smtp-configured';
  label?: string;      // Override del texto
  className?: string;
}
```

### Uso en React
```tsx
import { BadgeEstado } from '../components/BadgeEstado';

// Badge de plan
<BadgeEstado name="plan-pro" />

// Badge con label custom
<BadgeEstado name="smtp-configured" label="SMTP Propio" />

// Badge condicional
<BadgeEstado
  name={user.emailVerified ? 'email-verified' : 'email-pending'}
/>
```

### Dónde se usa
- **Organizations.tsx**: Plan y SMTP de cada organización
- **Users.tsx**: Estado de verificación de email

---

## 🔌 IntegrationIcon (Logos de Integraciones)

### Ubicación
`esbilla-dashboard/src/components/IntegrationIcon.tsx`

### Dependencias
```bash
npm install simple-icons -w esbilla-dashboard
```

### Integraciones Soportadas

**Analytics (7):**
- `googleanalytics`, `hotjar`, `amplitude`, `crazyegg`, `vwo`, `optimizely`, `microsoftclarity`

**Marketing (11):**
- `facebook`, `linkedin`, `tiktok`, `googleads`, `microsoftbing`, `criteo`, `pinterest`, `x`, `taboola`, `youtube`, `hubspot`

**Functional (2):**
- `intercom`, `zendesk`

### Props
```typescript
interface IntegrationIconProps {
  name: string;        // Nombre de la integración (ver lista)
  size?: number;       // Default: 32px
  className?: string;
}
```

### Uso
```tsx
import { IntegrationIcon, IntegrationBadge } from '../components/IntegrationIcon';

// Solo icono
<IntegrationIcon name="googleanalytics" size={32} />

// Con badge y label
<IntegrationBadge name="facebook" label="Meta Pixel" showLabel={true} />
```

### Colores
Los iconos usan los colores oficiales de cada marca (proporcionados por Simple Icons).

---

## 🎨 Ilustraciones "Cómo Funciona"

### Ubicación
`esbilla-public/public/images/illustrations/`

### Archivos
1. **installation-script.svg** - Editor de código con tag `<script>` resaltado
2. **user-consent.svg** - Silueta de usuario frente a banner con botones
3. **dashboard-stats.svg** - Gráfico de barras con métricas de aceptación
4. **gdpr-compliance.svg** - Escudo EU con candado y checkmark

### Características
- **Formato**: SVG vectorial escalable
- **Paleta**: Colores Esbilla (Maíz `#FFBF00`, Madera `#3D2B1F`)
- **Tamaño**: < 2KB cada uno
- **Estilo**: Flat Design minimalista

### Uso en Landing Page
```astro
<img
  src="/images/illustrations/installation-script.svg"
  alt="Instalación del script Esbilla"
  class="w-full h-full object-contain"
/>
```

### Dónde se usa
Sección "¿Cómo Funciona?" en la landing page ([lang]/index.astro)

---

## 🎨 Paleta de Colores Esbilla

### Colores Principales
```css
--esbilla-primary: #FFBF00;    /* Maíz - Amarillo dorado */
--esbilla-secondary: #C2A561;  /* Dorado */
--esbilla-accent: #2F6E8D;     /* Azul verdoso */
```

### Colores de Marca
```css
--madera: #3D2B1F;   /* Marrón oscuro (texto, fondos oscuros) */
--maiz: #FFBF00;     /* Amarillo (CTA, highlights) */
```

### Grises
```css
--stone-50: #F5F5F4;
--stone-100: #E7E5E4;
--stone-600: #78716C;
--stone-800: #44403C;
```

---

## 📐 Guía de Estilo

### Iconos
- **Tamaño mínimo**: 16px
- **Tamaño recomendado**: 24px (features), 32px (dashboard)
- **Stroke width**: 2px
- **Border radius**: 8-12px para contenedores

### Badges
- **Padding**: `px-2 py-1`
- **Border radius**: `rounded-full`
- **Font size**: `text-xs` (0.75rem)
- **Font weight**: `font-semibold` (600)

### Ilustraciones
- **Aspect ratio**: 4:3 (400x300 viewBox)
- **Contenedor**: Fondo stone-50 con border-2 stone-200
- **Padding interno**: p-4

---

## 🔄 Flujo de Personalización

### 1. Usuario configura en Dashboard
```
Settings → Personalización del Icono
  ↓
Selecciona variante + colores
  ↓
Guarda en Firestore (sites/{siteId})
```

### 2. SDK carga configuración
```
pegoyu.js → GET /api/config/{siteId}
  ↓
Lee panoyaVariant y panoyaColors
  ↓
Renderiza SVG personalizado en banner
```

### 3. Usuario ve banner customizado
```
Banner de cookies con Panoya personalizada
```

---

## 🧪 Testing

### Componentes a testear
- [ ] BadgeEstado.tsx - Verifica renderizado de 6 badges
- [ ] IntegrationIcon.tsx - Verifica carga desde simple-icons
- [ ] Panoya (Settings) - Verifica color pickers y preview

### Tests E2E
- [ ] Configurar panoya en Settings → Verificar en banner
- [ ] Crear organización → Verificar badge de plan
- [ ] Verificar email de usuario → Verificar badge verde

---

## 📚 Recursos Adicionales

- [Simple Icons](https://simpleicons.org/) - Librería de logos
- [Lucide Icons](https://lucide.dev/) - Iconos base del Dashboard
- [Tailwind CSS v4](https://tailwindcss.com/docs) - Framework de estilos
- [GRAPHIC-RESOURCES.md](./GRAPHIC-RESOURCES.md) - Especificaciones completas

---

**Última actualización**: 2026-02-06
**Versión**: 1.0
