## Sistema de Hooks CE/EE

Sistema que permite al código base (Community Edition) tener puntos de extensión donde se pueden inyectar features Enterprise Edition sin modificar el core.

## Filosofía

- **CE (Community Edition)**: Código base con hooks vacíos
- **EE (Enterprise Edition)**: Implementa los hooks con lógica empresarial
- **Carga dinámica**: Los hooks EE solo se cargan si `ESBILLA_EDITION=enterprise`

## Tipos de Hooks

### 1. Hooks de Validación (before)

Se ejecutan **antes** de una operación para validar o enriquecer datos.

#### `beforeCreateSite(req, res, siteData)`

Se ejecuta antes de crear un site.

**Retorna:**
```javascript
{
  valid: boolean,
  data?: Object,    // Datos enriquecidos del site
  error?: {
    status: number,
    code: string,
    message: string
  }
}
```

**Ejemplo de uso:**
```javascript
const { beforeCreateSite } = require('./hooks');

app.post('/api/sites', async (req, res) => {
  const siteData = {
    name: req.body.name,
    domain: req.body.domain,
    organizationId: req.body.organizationId  // Solo en EE
  };

  // Hook: Validar organización y enriquecer datos (EE)
  const hookResult = await beforeCreateSite(req, res, siteData);

  if (!hookResult.valid) {
    return res.status(hookResult.error.status).json({
      error: hookResult.error.code,
      message: hookResult.error.message
    });
  }

  // Usar datos enriquecidos por el hook
  const enrichedData = hookResult.data;

  // Crear site en Firestore
  const siteId = generateId();
  await db.collection('sites').doc(siteId).set({
    id: siteId,
    ...enrichedData,
    createdAt: FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: siteId });
});
```

**Comportamiento:**
- **CE**: Retorna `{ valid: true, data: siteData }` sin cambios
- **EE**: Valida `organizationId`, verifica quotas, añade `organizationName` y `plan`

#### `beforeLogConsent(req, res, consentData)`

Se ejecuta antes de guardar un consent.

**Retorna:** Mismo formato que `beforeCreateSite`

**Ejemplo de uso:**
```javascript
const { beforeLogConsent } = require('./hooks');

app.post('/api/consent/log', async (req, res) => {
  const consentData = {
    siteId: req.body.siteId,
    choices: req.body.choices,
    footprintId: req.body.footprintId,
    userHash: req.body.userHash,
    ipHash: hashIP(req.ip),
    userAgent: req.headers['user-agent']
  };

  // Hook: Enriquecer con organizationId (EE)
  const hookResult = await beforeLogConsent(req, res, consentData);

  if (!hookResult.valid) {
    return res.status(hookResult.error.status).json({
      error: hookResult.error.code,
      message: hookResult.error.message
    });
  }

  // Guardar consent enriquecido
  const consentId = generateId();
  await db.collection('consents').doc(consentId).set({
    id: consentId,
    ...hookResult.data,
    createdAt: FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: consentId });
});
```

**Comportamiento:**
- **CE**: Retorna datos sin cambios
- **EE**: Añade `organizationId` obtenido del site para facilitar queries

#### `beforeDeleteSite(req, res, siteId)`

Se ejecuta antes de eliminar un site.

**Retorna:**
```javascript
{
  valid: boolean,
  error?: Object
}
```

**Ejemplo de uso:**
```javascript
const { beforeDeleteSite } = require('./hooks');

app.delete('/api/sites/:id', async (req, res) => {
  const siteId = req.params.id;

  // Hook: Validar permisos EE
  const hookResult = await beforeDeleteSite(req, res, siteId);

  if (!hookResult.valid) {
    return res.status(hookResult.error.status).json({
      error: hookResult.error.code,
      message: hookResult.error.message
    });
  }

  // Eliminar site
  await db.collection('sites').doc(siteId).delete();

  res.status(204).send();
});
```

**Comportamiento:**
- **CE**: Permite eliminar sin restricciones
- **EE**: Valida que el usuario tenga permisos en la organización

### 2. Hooks de Acción (after)

Se ejecutan **después** de una operación para realizar acciones adicionales.

#### `afterUserCreated(userData)`

Se ejecuta después de crear un usuario.

**Ejemplo de uso:**
```javascript
const { afterUserCreated } = require('./hooks');

app.post('/api/users', async (req, res) => {
  const userData = {
    id: req.user.uid,
    email: req.user.email,
    displayName: req.body.displayName
  };

  // Crear usuario en Firestore
  await db.collection('users').doc(userData.id).set(userData);

  // Hook: Acciones post-creación (EE: enviar email bienvenida, asignar a org)
  await afterUserCreated(userData);

  res.status(201).json(userData);
});
```

**Comportamiento:**
- **CE**: No hace nada
- **EE**: Puede enviar email de bienvenida, auto-asignar a organización, etc.

### 3. Middlewares

Middlewares que se aplican a rutas completas.

#### `validateOrganizationAccess`

Valida que el usuario tenga acceso a la organización especificada.

**Uso:**
```javascript
const { validateOrganizationAccess, requireRole } = require('./hooks');

// Aplicar a una ruta específica
app.get('/api/organizations/:organizationId/sites',
  authMiddleware,  // Primero validar token
  validateOrganizationAccess,  // Luego validar acceso a org
  async (req, res) => {
    // req.userRole estará disponible
    // req.organizationId estará disponible

    const sites = await db.collection('sites')
      .where('organizationId', '==', req.organizationId)
      .get();

    res.json(sites.docs.map(d => d.data()));
  }
);

// Con validación de rol específico
app.post('/api/organizations/:organizationId/sites',
  authMiddleware,
  validateOrganizationAccess,
  requireRole('org_owner', 'org_admin'),  // Solo owners y admins
  async (req, res) => {
    // Crear site
  }
);
```

**Comportamiento:**
- **CE**: Continúa sin validar (no hay multi-tenancy)
- **EE**: Valida que el usuario tenga `orgAccess[organizationId]`, establece `req.userRole`

#### `enforceQuotas`

Valida que no se excedan los límites del plan.

**Uso:**
```javascript
const { enforceQuotas } = require('./hooks');

// Aplicar a rutas que consumen recursos
app.post('/api/sites',
  authMiddleware,
  validateOrganizationAccess,
  enforceQuotas,  // Validar límite de sites
  async (req, res) => {
    // Si llega aquí, no se excedió la quota
  }
);

app.post('/api/consent/log',
  validateRequestMiddleware,
  enforceQuotas,  // Validar límite de consents/mes
  async (req, res) => {
    // Guardar consent
  }
);
```

**Comportamiento:**
- **CE**: Continúa sin validar (sin límites)
- **EE**: Retorna 403 si se excede `maxSites` o `maxConsentsPerMonth`

#### `requireRole(...allowedRoles)`

Factory que crea un middleware que valida roles.

**Uso:**
```javascript
const { requireRole } = require('./hooks');

// Solo org_owner puede eliminar organizaciones
app.delete('/api/organizations/:id',
  authMiddleware,
  requireRole('org_owner'),
  async (req, res) => {
    // Eliminar
  }
);

// Viewers y admins pueden leer, solo admins pueden escribir
app.get('/api/sites', requireRole('org_viewer', 'org_admin', 'org_owner'), handler);
app.post('/api/sites', requireRole('org_admin', 'org_owner'), handler);
```

**Comportamiento:**
- **CE**: Continúa sin validar (sin roles)
- **EE**: Retorna 403 si `req.userRole` no está en `allowedRoles`

## Utilidades

### `getMiddleware(name)`

Obtiene un middleware específico por nombre.

```javascript
const { getMiddleware } = require('./hooks');

const customMiddleware = getMiddleware('customEEMiddleware');
app.use('/api/ee-route', customMiddleware);
```

### `hasEEMiddleware(name)`

Verifica si un middleware EE está disponible.

```javascript
const { hasEEMiddleware } = require('./hooks');

if (hasEEMiddleware('validateOrganizationAccess')) {
  console.log('Running in Enterprise Edition');
}
```

## Patrón de Implementación

### 1. En el código CE (app.js, routes, etc.)

**SIEMPRE** llamar a los hooks:

```javascript
const hooks = require('./hooks');

// Antes de crear
const result = await hooks.beforeCreateSite(req, res, data);
if (!result.valid) {
  return res.status(result.error.status).json(result.error);
}

// Usar datos enriquecidos
const enrichedData = result.data;

// ... crear recurso ...

// Después de crear
await hooks.afterUserCreated(userData);
```

### 2. En el código EE (enterprise/middleware/index.js)

Implementar la lógica real:

```javascript
async function beforeCreateSite(req, res, siteData) {
  // Validar organización
  if (!siteData.organizationId) {
    return {
      valid: false,
      error: { status: 400, code: 'MISSING_ORG', message: '...' }
    };
  }

  // Enriquecer datos
  const org = await getOrganization(siteData.organizationId);
  return {
    valid: true,
    data: {
      ...siteData,
      organizationName: org.name,
      plan: org.plan
    }
  };
}

module.exports = { beforeCreateSite, ... };
```

### 3. En hooks.js (loader)

Cargar condicionalmente:

```javascript
let eeMiddleware = null;

if (isEnterprise()) {
  eeMiddleware = require('./enterprise/middleware/index.js');
}

async function beforeCreateSite(req, res, siteData) {
  if (eeMiddleware?.beforeCreateSite) {
    return await eeMiddleware.beforeCreateSite(req, res, siteData);
  }

  // Fallback CE
  return { valid: true, data: siteData };
}
```

## Ventajas

✅ **Un solo codebase**: CE y EE comparten el mismo código base
✅ **Sin duplicación**: No hay `if (isEnterprise())` esparcidos por todo el código
✅ **Fácil mantenimiento**: Cambios en CE automáticamente benefician a EE
✅ **Testeable**: Los hooks se pueden mockear en tests
✅ **Extensible**: Fácil añadir nuevos hooks sin modificar el core
✅ **Performance**: En CE, los hooks son funciones síncronas casi sin overhead

## Testing

### Mockear hooks en tests

```javascript
const hooks = require('./hooks');

// Mock para CE
jest.mock('./hooks', () => ({
  beforeCreateSite: jest.fn((req, res, data) => ({ valid: true, data })),
  enforceQuotas: (req, res, next) => next()
}));

// Mock para EE
jest.mock('./hooks', () => ({
  beforeCreateSite: jest.fn(async (req, res, data) => {
    if (!data.organizationId) {
      return { valid: false, error: { status: 400, code: 'MISSING_ORG' } };
    }
    return { valid: true, data: { ...data, organizationName: 'Test Org' } };
  })
}));
```

## Ejemplos Reales

Ver implementaciones en:
- `esbilla-api/src/app.js` - Uso de middlewares en rutas
- `esbilla-api/src/enterprise/middleware/index.js` - Implementación EE
- `esbilla-api/src/hooks.js` - Sistema de carga

## Añadir Nuevos Hooks

1. **Definir en `hooks.js`**:
```javascript
async function beforeUpdateSite(req, res, siteId, updates) {
  if (eeMiddleware?.beforeUpdateSite) {
    return await eeMiddleware.beforeUpdateSite(req, res, siteId, updates);
  }
  return { valid: true, data: updates };
}
```

2. **Implementar en `enterprise/middleware/index.js`**:
```javascript
async function beforeUpdateSite(req, res, siteId, updates) {
  // Validaciones EE
  return { valid: true, data: enrichedUpdates };
}
```

3. **Usar en código CE**:
```javascript
const result = await hooks.beforeUpdateSite(req, res, siteId, updates);
if (!result.valid) return res.status(400).json(result.error);
await db.collection('sites').doc(siteId).update(result.data);
```
