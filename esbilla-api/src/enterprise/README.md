# Enterprise Edition - Backend

Esta carpeta contiene código exclusivo de la **Enterprise Edition** de Esbilla CMP.

## ⚠️ Importante

- Este código **NO** se incluye en la Community Edition (CE)
- Requiere licencia Enterprise para uso en producción
- La configuración se controla mediante `ESBILLA_EDITION=enterprise`

## Contenido

### `/routes`
Endpoints de API exclusivos de EE:
- **invitations.js** - Sistema de invitaciones por email
  - `POST /api/invitations/send` - Enviar invitación
  - `GET /api/invitations/:id` - Obtener invitación
  - `POST /api/invitations/:id/accept` - Aceptar invitación

### `/services`
Servicios empresariales:
- **email.js** - Servicio de email con Nodemailer
  - Envío de invitaciones con templates HTML
  - Soporte multi-idioma (ES, EN, AST)
  - SMTP configurable

### `/middleware`
Middlewares específicos de EE:
- Validación de quotas (límites por plan)
- Multi-tenancy (organizaciones)
- Feature flags enforcement

## Feature Flags

Para verificar si una feature está disponible:

```javascript
const { hasFeature, featureMiddleware } = require('../config/edition.js');

// En lógica de negocio
if (hasFeature('invitations')) {
  // código EE
}

// Como middleware
router.post('/endpoint', featureMiddleware('invitations'), handler);
```

## Features Incluidas

- **multiTenancy**: Organizaciones + usuarios
- **quotas**: Límites por plan
- **invitations**: Sistema de invitaciones
- **sync**: Sincronización cross-domain
- **emailAuth**: Login con email/password
- **onboarding**: Wizard de onboarding
- **waitingList**: Lista de espera
- **advancedStats**: Estadísticas avanzadas
- **plans**: Planes de facturación (Free/Pro/Enterprise)

## Testing

Los tests de EE se encuentran junto a los archivos:
- `invitations.test.js` - Tests del sistema de invitaciones

## Exclusión en CE

Este directorio se excluye del build de CE mediante:
- Script `prepare-ce-repo.sh` elimina la carpeta
- `.gitignore` en el repo CE tiene `enterprise/`
