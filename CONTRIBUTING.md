# Contribuir a Esbilla CMP 🌾

¡Bienvenido a la andecha de Esbilla! No importa si sabes programar o no; aquí cada mano cuenta para que el hórreo esté firme.

Esbilla CMP es una plataforma open-source de gestión de consentimientos GDPR, y estamos emocionados de que quieras contribuir.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Formas de Contribuir](#formas-de-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Proceso de Contribución](#proceso-de-contribución)
- [Guía de Estilo](#guía-de-estilo)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Comunidad](#comunidad)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta basado en el respeto mutuo y la colaboración constructiva. Al participar, te comprometes a:

- ✅ Ser respetuoso con todos los contribuidores
- ✅ Aceptar críticas constructivas con mente abierta
- ✅ Enfocarte en lo que es mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros de la comunidad
- ❌ No usar lenguaje sexualizado o imágenes inapropiadas
- ❌ No hacer ataques personales o comentarios despectivos
- ❌ No acosar o hacer bullying en ninguna forma

---

## 🤝 Formas de Contribuir

### 1. 💻 Programación
Añade funcionalidades o corrige bugs en nuestro repositorio de GitHub.

**Qué puedes hacer:**
- Implementar features del [backlog](./backlog.md)
- Corregir bugs reportados en Issues
- Mejorar el rendimiento del código existente
- Añadir tests automatizados
- Refactorizar código legacy

**Tecnologías principales:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4
- Backend: Node.js + Express.js
- Database: Firebase/Firestore
- Cloud: Google Cloud Run + Firebase Hosting
- CI/CD: GitHub Actions

### 2. 🌍 Traducciones
Ayúdanos a que Esbilla hable más lenguas y llegue a más pueblos.

**Idiomas actuales:** Asturiano, Español, Catalán, Gallego, Euskera, Inglés, Francés, Italiano, Portugués, Alemán

**Cómo traducir:**
1. Ve a `esbilla-public/src/i18n/languages/`
2. Copia `es.ts` y renómbralo con el código de tu idioma (ej: `ja.ts` para japonés)
3. Traduce todas las claves manteniendo la estructura
4. Añade el idioma a `esbilla-public/src/i18n/ui.ts`
5. Haz un Pull Request

### 3. 🎨 Recursos Gráficos
Mejora la interfaz o propón nuevos iconos para el maíz y la madera.

**Qué necesitamos:**
- Mejoras en el diseño del dashboard
- Nuevos iconos SVG para el sistema
- Ilustraciones para la landing page
- Diseño de plantillas de banner
- Mejoras de accesibilidad visual

**Herramientas recomendadas:** Figma, Sketch, Adobe XD, Inkscape

### 4. 🧪 Testing
Prueba las versiones beta y ayúdanos a encontrar fallos antes que nadie.

**Tipos de testing:**
- **Manual Testing**: Prueba flujos de usuario en diferentes navegadores
- **Bug Reporting**: Reporta bugs con pasos detallados para reproducirlos
- **Automated Testing**: Escribe tests unitarios y E2E
- **Performance Testing**: Identifica cuellos de botella

**Cómo reportar un bug:**
1. Ve a [Issues](https://github.com/ClicaOnline/esbilla-cmp/issues/new)
2. Usa la plantilla de bug report
3. Incluye: navegador, OS, pasos para reproducir, comportamiento esperado vs actual
4. Si es posible, adjunta screenshots o videos

### 5. 💡 Propón Ideas
Dinos qué características necesitas para tu hórreo digital.

**Cómo proponer una feature:**
1. Revisa el [backlog.md](./backlog.md) para ver si ya está planeada
2. Abre un Issue con la etiqueta `enhancement`
3. Describe el problema que resuelve
4. Propón una solución con mockups si es posible
5. Discute con la comunidad en los comentarios

### 6. ⚖️ Asesoría Legal
Ayúdanos a que los textos de privacidad sean claros y limpios para todos.

**Qué necesitamos:**
- Review de textos de políticas de privacidad
- Verificación de compliance GDPR/ePrivacy
- Traducción legal a otros idiomas
- Documentación de requisitos legales por país

---

## 🛠️ Configuración del Entorno

### Pre-requisitos

- [Node.js](https://nodejs.org/) v20 o superior
- [Git](https://git-scm.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Un editor de código (recomendado: [VS Code](https://code.visualstudio.com/))

### Setup Inicial

```bash
# 1. Fork el repositorio en GitHub
# 2. Clona tu fork
git clone https://github.com/TU_USUARIO/esbilla-cmp.git
cd esbilla-cmp

# 3. Añade el repositorio original como upstream
git remote add upstream https://github.com/ClicaOnline/esbilla-cmp.git

# 4. Instala dependencias
npm install

# 5. Copia archivos de entorno (ejemplo)
cd esbilla-dashboard
cp .env.development.example .env.development

# 6. Corre el proyecto localmente
npm run dev:public        # Landing page (puerto 4321)
npm run start -w esbilla-api    # API (puerto 3000)
cd esbilla-dashboard && npm run dev  # Dashboard (puerto 5173)
```

### Estructura del Proyecto

```
esbilla-cmp/
├── esbilla-public/          # Landing page (Astro)
├── esbilla-api/             # Backend API (Express.js)
├── esbilla-dashboard/       # Dashboard admin (React + Vite)
├── .github/workflows/       # CI/CD pipelines
├── Testing.md               # Estrategia de testing y deployment
├── SETUP.md                 # Guía de setup de entornos
├── backlog.md               # Backlog priorizado
└── CONTRIBUTING.md          # Este archivo
```

---

## 🔄 Proceso de Contribución

### 1. Encuentra o Crea un Issue

- Revisa los [Issues abiertos](https://github.com/ClicaOnline/esbilla-cmp/issues)
- Busca issues con la etiqueta `good first issue` si eres nuevo
- Comenta en el issue que quieres trabajar en él
- Espera confirmación antes de empezar (evita trabajo duplicado)

### 2. Crea una Rama

```bash
# Asegúrate de estar en develop actualizado
git checkout develop
git pull upstream develop

# Crea tu rama de feature
git checkout -b feature/nombre-descriptivo
# o para bugs
git checkout -b fix/nombre-del-bug
```

**Convención de nombres de ramas:**
- `feature/` - Nueva funcionalidad
- `fix/` - Corrección de bug
- `docs/` - Solo documentación
- `refactor/` - Refactorización sin cambio de funcionalidad
- `test/` - Añadir o mejorar tests

### 3. Haz tu Trabajo

- Escribe código limpio y bien documentado
- Sigue la [Guía de Estilo](#guía-de-estilo)
- Añade tests si aplica
- Actualiza documentación si es necesario

### 4. Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: añadir búsqueda avanzada en dashboard"
git commit -m "fix: corregir error en cálculo de estadísticas"
git commit -m "docs: actualizar guía de instalación"
```

Ver sección [Commit Guidelines](#commit-guidelines) para más detalles.

### 5. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/nombre-descriptivo

# Ve a GitHub y crea un Pull Request a la rama 'develop'
```

---

## 🎨 Guía de Estilo

### JavaScript/TypeScript

```typescript
// ✅ BIEN: Nombres descriptivos, tipos explícitos
async function getUsersWithOrgAccess(orgId: string): Promise<DashboardUser[]> {
  return users.filter(u => u.globalRole === 'superadmin' || orgId in (u.orgAccess || {}));
}

// ❌ MAL: Nombres crípticos, sin tipos
async function getUsers(id) {
  return users.filter(u => u.role === 'sa' || id in (u.org || {}));
}
```

**Reglas:**
- Usa `const` por defecto, `let` solo si necesitas reasignar
- Nunca uses `var`
- Nombres de variables en `camelCase`
- Nombres de componentes en `PascalCase`
- Funciones de menos de 50 líneas (idealmente <20)
- Un archivo por componente/clase

### React Components

```tsx
// ✅ BIEN: Componente funcional, tipos claros, desestructuración
interface UserCardProps {
  user: DashboardUser;
  onSelect: (userId: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div className="p-4 bg-stone-50 rounded-lg">
      <h3>{user.displayName}</h3>
      <button onClick={() => onSelect(user.id)}>Seleccionar</button>
    </div>
  );
}

// ❌ MAL: Props sin tipos, lógica compleja en el render
export function UserCard(props) {
  return (
    <div>
      <h3>{props.user.displayName}</h3>
      <button onClick={() => {
        // 50 líneas de lógica aquí... ❌
      }}>Seleccionar</button>
    </div>
  );
}
```

### CSS/Tailwind

```tsx
// ✅ BIEN: Clases ordenadas (layout → visual → interacciones)
<div className="flex items-center gap-4 p-6 bg-white rounded-xl border border-stone-200 hover:border-amber-500 transition-colors">

// ❌ MAL: Clases desordenadas, difícil de leer
<div className="hover:border-amber-500 p-6 transition-colors gap-4 border-stone-200 bg-white flex rounded-xl items-center border">
```

### Comentarios

```typescript
// ✅ BIEN: Explica el "por qué", no el "qué"
// Usamos debounce para evitar llamadas excesivas a la API durante el tipeo
const debouncedSearch = useDebounce(searchTerm, 300);

// ❌ MAL: Comentarios obvios
// Esta función suma dos números
function add(a, b) {
  return a + b; // Retorna la suma
}
```

---

## 📝 Commit Guidelines

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mantener un historial limpio y generar changelogs automáticos.

### Formato

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos

- `feat`: Nueva funcionalidad para el usuario
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma faltante, etc. (sin cambio de código)
- `refactor`: Refactorización sin cambio de funcionalidad
- `perf`: Mejora de performance
- `test`: Añadir o corregir tests
- `build`: Cambios en el sistema de build o dependencias
- `ci`: Cambios en CI/CD
- `chore`: Otros cambios que no modifican src o test

### Ejemplos

```bash
feat: añadir búsqueda por email en UserSearchSelector

feat(dashboard): implementar paginación en tabla de usuarios

fix: corregir cálculo de estadísticas en Sites

fix(api): resolver error 500 en endpoint de consentimiento

docs: actualizar guía de instalación con Firebase CLI

style(dashboard): formatear código con Prettier

refactor: extraer lógica de permisos a helper functions

test: añadir tests E2E para flujo de login

chore: actualizar dependencias a versiones latest
```

### Breaking Changes

Si tu cambio rompe compatibilidad, añade `BREAKING CHANGE:` en el footer:

```bash
feat!: cambiar estructura de organizaciones

BREAKING CHANGE: El campo `distributorId` ahora es obligatorio en organizations.
Los usuarios deben migrar sus datos antes de actualizar.
```

---

## 🔀 Pull Request Process

### Antes de Crear el PR

- ✅ Tu código pasa los tests locales: `npm test`
- ✅ El build funciona: `npm run build`
- ✅ Has actualizado la documentación si es necesario
- ✅ Tus commits siguen Conventional Commits
- ✅ Has resuelto conflictos con `develop` si los hay

### Crear el PR

1. Ve a GitHub y crea el Pull Request
2. Base: `develop` ← Compare: `tu-rama`
3. Completa la plantilla de PR:
   - **Descripción**: ¿Qué hace este PR?
   - **Tipo**: Feature / Bug fix / Docs / etc.
   - **Issue relacionado**: Cierra #123
   - **Screenshots**: Si aplica
   - **Testing**: ¿Cómo lo has probado?
   - **Checklist**: Marca todos los items

### Review Process

- Los PRs requieren **al menos 1 approval** antes de merge
- Los **tests automáticos** (CI) deben pasar
- Responde a los comentarios de review
- Haz commits adicionales para corregir feedback
- Una vez aprobado, un maintainer hará el merge

### Después del Merge

```bash
# Actualiza tu fork
git checkout develop
git pull upstream develop
git push origin develop

# Borra tu rama local y remota
git branch -d feature/nombre-descriptivo
git push origin --delete feature/nombre-descriptivo
```

---

## 👥 Comunidad

### Canales de Comunicación

- **GitHub Issues**: Para bugs, features y discusiones técnicas
- **GitHub Discussions**: Para preguntas generales y ayuda
- **Email**: esbilla@clicaonline.com para consultas privadas

### ¿Tienes Otra Idea?

Si tienes una forma distinta de ayudar que no esté en la lista, escríbenos. Estamos abiertos a todo tipo de contribuciones que fortalezcan la andecha.

---

## 📄 Licencia

Al contribuir a Esbilla CMP, aceptas que tus contribuciones serán licenciadas bajo la misma licencia que el proyecto (pendiente de definir, probablemente MIT).

---

## 🙏 Agradecimientos

Gracias por contribuir a Esbilla CMP. Cada línea de código, cada traducción, cada bug reportado hace que el hórreo digital sea más fuerte para todos.

**¡Unite al coleutivu!** 🌾
