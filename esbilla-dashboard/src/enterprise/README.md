# Enterprise Edition - Dashboard

Esta carpeta contiene componentes exclusivos de la **Enterprise Edition** de Esbilla CMP.

## ⚠️ Importante

- Este código **NO** se incluye en la Community Edition (CE)
- Requiere licencia Enterprise para uso en producción
- La configuración se controla mediante `VITE_ESBILLA_EDITION=enterprise`

## Contenido

### `/pages`
Páginas exclusivas de EE:

**Onboarding & Auth:**
- **Register.tsx** - Registro con selección de plan (SaaS)
- **OnboardingSetup.tsx** - Wizard de 3 pasos (Org → Site → Code)
- **PendingApproval.tsx** - Pantalla de espera de aprobación
- **AcceptInvite.tsx** - Aceptar invitación por email

**Multi-tenancy:**
- **Organizations.tsx** - Gestión de organizaciones
- **Users.tsx** - Gestión de usuarios con invitaciones
- **WaitingList.tsx** / **Waitlist.tsx** - Lista de espera

### `/components`
Componentes reutilizables de EE:
- Modales de invitación
- Selectores de plan
- Indicadores de quota

### `/hooks`
React hooks personalizados de EE:
- `useOrganization()` - Gestión de organizaciones
- `useInvitations()` - Sistema de invitaciones
- `usePlans()` - Gestión de planes

## Feature Flags

Para condicionar renderizado en componentes:

```typescript
import { hasFeature, useFeature } from '@/config/edition';

// En lógica de componente
function MyComponent() {
  const hasMultiTenancy = useFeature('multiTenancy');

  if (!hasMultiTenancy) {
    return <BasicView />;
  }

  return <EnterpriseView />;
}

// En rutas (App.tsx)
{hasFeature('multiTenancy') && (
  <Route path="/organizations" element={<OrganizationsPage />} />
)}
```

## Features Incluidas

- **multiTenancy**: Sistema de organizaciones
- **plans**: Planes Free/Pro/Enterprise
- **quotas**: Límites y uso
- **invitations**: Invitaciones por email
- **onboarding**: Wizard de configuración
- **waitingList**: Lista de espera
- **emailAuth**: Login email/password
- **advancedStats**: Analytics avanzados
- **gtmGateway**: Configuración GTM Gateway (UI)
- **attribution**: UI de atribución de marketing
- **crossDomain**: UI de sincronización cross-domain
- **advancedIntegrations**: 14 integraciones adicionales (total 19)

## Estructura de Datos

### Organization Document
```typescript
{
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxSites: number;
  maxConsentsPerMonth: number;
  billingEmail: string;
  createdAt: Timestamp;
  createdBy: string; // uid
}
```

### User Document (con orgAccess)
```typescript
{
  id: string;
  email: string;
  displayName: string;
  globalRole: 'superadmin' | 'pending';
  orgAccess: {
    [orgId: string]: {
      organizationId: string;
      organizationName: string;
      role: 'org_owner' | 'org_admin' | 'org_viewer';
      addedAt: Timestamp;
      addedBy: string; // uid
    }
  };
  siteAccess: { ... };
  onboardingCompleted: boolean;
  createdAt: Timestamp;
}
```

## Testing

Los tests de componentes EE usan:
- Vitest + Testing Library
- Mocks de Firebase Auth
- Mocks de Firestore

## Exclusión en CE

Este directorio se excluye del build de CE mediante:
- Script `prepare-ce-repo.sh` elimina la carpeta
- Imports condicionales basados en feature flags
- `.gitignore` en el repo CE tiene `enterprise/`
