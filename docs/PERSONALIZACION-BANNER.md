# Guía de Personalización del Banner de Cookies de Esbilla CMP

Esta guía te enseña cómo personalizar completamente el aspecto del banner de consentimiento de cookies de Esbilla CMP usando CSS personalizado.

## Índice

- [IDs y Clases Disponibles](#ids-y-clases-disponibles)
- [Ejemplos de Personalización](#ejemplos-de-personalización)
- [Casos de Uso Comunes](#casos-de-uso-comunes)
- [Mejores Prácticas](#mejores-prácticas)

---

## IDs y Clases Disponibles

Todos los elementos del banner tienen IDs y clases específicas que puedes usar para personalizar su aspecto:

### Estructura del Banner

```html
<div id="esbilla-wrapper">
  <div id="esbilla-banner" class="esbilla-banner">
    <div id="esbilla-banner-inner" class="esbilla-inner">
      <div id="esbilla-banner-icon" class="esbilla-icon">🌽</div>
      <div id="esbilla-banner-title" class="esbilla-title">...</div>
      <p id="esbilla-banner-description" class="esbilla-text">...</p>
      <div id="esbilla-banner-actions" class="esbilla-actions">
        <button id="esbilla-btn-accept" class="esbilla-btn esbilla-btn-primary">...</button>
        <button id="esbilla-btn-settings" class="esbilla-btn esbilla-btn-secondary">...</button>
        <button id="esbilla-btn-reject" class="esbilla-btn esbilla-btn-link">...</button>
      </div>
    </div>
  </div>
</div>
```

### IDs Principales

| ID | Descripción |
|---|---|
| `#esbilla-wrapper` | Contenedor global del banner |
| `#esbilla-banner` | Contenedor principal del banner |
| `#esbilla-banner-inner` | Contenedor interno con padding |
| `#esbilla-banner-icon` | Icono del banner (emoji 🌽 por defecto) |
| `#esbilla-banner-title` | Título del banner |
| `#esbilla-banner-description` | Texto descriptivo |
| `#esbilla-banner-actions` | Contenedor de botones |
| `#esbilla-banner-content` | Contenedor de contenido (solo layout bottom-bar) |

### IDs de Botones

| ID | Descripción |
|---|---|
| `#esbilla-btn-accept` | Botón "Aceptar todas" |
| `#esbilla-btn-reject` | Botón "Rechazar todas" |
| `#esbilla-btn-settings` | Botón "Personalizar" |

### Clases de Estilo

| Clase | Descripción |
|---|---|
| `.esbilla-btn` | Clase base de todos los botones |
| `.esbilla-btn-primary` | Estilo del botón primario (aceptar) |
| `.esbilla-btn-secondary` | Estilo del botón secundario (personalizar) |
| `.esbilla-btn-link` | Estilo del botón de texto (rechazar) |
| `.esbilla-hidden` | Clase para ocultar elementos |

---

## Ejemplos de Personalización

### 1. Estilo Moderno con Gradientes

```css
/* Banner con bordes redondeados y sombra suave */
#esbilla-banner {
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

/* Título con gradiente de color */
#esbilla-banner-title {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Botón de aceptar con gradiente */
.esbilla-btn.esbilla-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
  padding: 14px 32px;
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.esbilla-btn.esbilla-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}
```

### 2. Estilo Minimalista

```css
/* Banner minimalista con bordes finos */
#esbilla-banner {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 24px;
}

/* Título simple y elegante */
#esbilla-banner-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

/* Descripción con espaciado */
#esbilla-banner-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
}

/* Botones con bordes */
.esbilla-btn {
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.esbilla-btn.esbilla-btn-primary {
  background: #111827;
  border: none;
  color: #ffffff;
}

.esbilla-btn.esbilla-btn-secondary {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.esbilla-btn.esbilla-btn-link {
  background: transparent;
  color: #6b7280;
  text-decoration: underline;
}
```

### 3. Estilo Oscuro (Dark Mode)

```css
/* Banner en modo oscuro */
#esbilla-banner {
  background: #1f2937;
  border: 1px solid #374151;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

#esbilla-banner-title {
  color: #f9fafb;
}

#esbilla-banner-description {
  color: #d1d5db;
}

/* Botones adaptados al modo oscuro */
.esbilla-btn.esbilla-btn-primary {
  background: #3b82f6;
  color: #ffffff;
}

.esbilla-btn.esbilla-btn-primary:hover {
  background: #2563eb;
}

.esbilla-btn.esbilla-btn-secondary {
  background: #374151;
  color: #f9fafb;
  border: 1px solid #4b5563;
}

.esbilla-btn.esbilla-btn-link {
  color: #9ca3af;
}
```

### 4. Estilo Empresarial

```css
/* Banner corporativo con colores de marca */
#esbilla-banner {
  background: #1e3a8a;
  color: #ffffff;
  border-radius: 12px;
  padding: 32px;
}

#esbilla-banner-title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

#esbilla-banner-description {
  color: #dbeafe;
  font-size: 1rem;
}

/* Botón con color corporativo */
.esbilla-btn.esbilla-btn-primary {
  background: #fbbf24;
  color: #1e3a8a;
  font-weight: 700;
  border-radius: 8px;
}

.esbilla-btn.esbilla-btn-primary:hover {
  background: #f59e0b;
}

.esbilla-btn.esbilla-btn-secondary {
  background: transparent;
  color: #ffffff;
  border: 2px solid #ffffff;
}

.esbilla-btn.esbilla-btn-link {
  color: #dbeafe;
}
```

### 5. Animaciones y Transiciones

```css
/* Banner con entrada animada */
#esbilla-banner {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Botones con efectos hover suaves */
.esbilla-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.esbilla-btn:hover {
  transform: scale(1.05);
}

/* Icono con rotación al hover */
#esbilla-banner-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

#esbilla-banner:hover #esbilla-banner-icon {
  transform: rotate(15deg) scale(1.1);
}
```

---

## Casos de Uso Comunes

### Cambiar Solo los Colores

```css
/* Cambiar el color principal del botón */
.esbilla-btn.esbilla-btn-primary {
  background: #10b981;
}

.esbilla-btn.esbilla-btn-primary:hover {
  background: #059669;
}

/* Cambiar el color del texto */
#esbilla-banner-title {
  color: #10b981;
}
```

### Ajustar el Tamaño del Banner

```css
/* Banner más grande */
#esbilla-banner {
  padding: 40px;
  max-width: 600px;
}

#esbilla-banner-title {
  font-size: 2rem;
}

#esbilla-banner-description {
  font-size: 1.125rem;
}
```

### Cambiar la Tipografía

```css
/* Usar una fuente personalizada */
#esbilla-banner {
  font-family: 'Montserrat', sans-serif;
}

#esbilla-banner-title {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
}
```

### Ocultar o Modificar el Icono

```css
/* Ocultar el icono */
#esbilla-banner-icon {
  display: none;
}

/* O cambiar su tamaño */
#esbilla-banner-icon {
  font-size: 3rem;
}
```

### Reorganizar Botones

```css
/* Botones en columna */
#esbilla-banner-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.esbilla-btn {
  width: 100%;
}
```

---

## Mejores Prácticas

### 1. Usa Especificidad Adecuada

Usa IDs para mayor especificidad cuando necesites sobrescribir estilos base:

```css
/* ✅ Correcto - usa ID para especificidad */
#esbilla-btn-accept {
  background: #10b981;
}

/* ❌ Evitar - puede no sobrescribir estilos base */
.esbilla-btn-primary {
  background: #10b981;
}
```

### 2. Mantén la Accesibilidad

Asegúrate de mantener buenos contrastes de color:

```css
/* ✅ Buen contraste */
#esbilla-banner {
  background: #ffffff;
  color: #111827;
}

/* ❌ Mal contraste - difícil de leer */
#esbilla-banner {
  background: #f3f4f6;
  color: #e5e7eb;
}
```

### 3. Diseño Responsivo

Añade media queries para dispositivos móviles:

```css
/* Desktop */
#esbilla-banner {
  max-width: 500px;
  padding: 32px;
}

/* Mobile */
@media (max-width: 640px) {
  #esbilla-banner {
    max-width: 90vw;
    padding: 20px;
  }

  #esbilla-banner-title {
    font-size: 1.25rem;
  }

  #esbilla-banner-actions {
    flex-direction: column;
  }
}
```

### 4. Testea en Diferentes Navegadores

El CSS personalizado debe funcionar en:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Navegadores móviles

### 5. No Sobrescribas Funcionalidad

Evita eliminar propiedades que puedan romper la funcionalidad:

```css
/* ❌ Evitar - puede romper la funcionalidad */
#esbilla-banner {
  display: none !important;
}

/* ✅ Correcto - solo cambia estilos visuales */
#esbilla-banner {
  opacity: 0.95;
}
```

---

## Aplicar el CSS Personalizado

### En el Dashboard de Esbilla

1. Ve a **Settings** (Configuración)
2. Selecciona tu sitio en el selector
3. Desplázate hasta la sección **CSS Personalizado**
4. Pega tu código CSS
5. Haz clic en **Guardar**

### En el Plugin de WordPress

1. Ve a **Configuración → Esbilla CMP**
2. Desplázate hasta la sección **Personalización**
3. Pega tu código CSS en el campo **CSS Personalizado**
4. Haz clic en **Guardar cambios**

---

## Recursos Adicionales

- [Documentación del SDK](https://github.com/ClicaOnline/esbilla-cmp)
- [Plantillas del Banner](https://github.com/ClicaOnline/esbilla-cmp/tree/main/esbilla-api/public/templates)
- [Estilos Base](https://github.com/ClicaOnline/esbilla-cmp/tree/main/esbilla-api/public/styles)

---

## Soporte

¿Necesitas ayuda con la personalización?

- **Email**: esbilla@clicaonline.com
- **GitHub Issues**: [https://github.com/ClicaOnline/esbilla-cmp/issues](https://github.com/ClicaOnline/esbilla-cmp/issues)
- **Comunidad**: [https://esbilla.com/community](https://esbilla.com/community)

---

© 2026 Clica Online Soluciones S.L. - Esbilla CMP
