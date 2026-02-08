// ============================================
// TIPOS PARA MODELO MULTI-TENANT JERÁRQUICO
// ============================================
// Arquitectura similar a Google Analytics:
// Platform (superadmin) → Organization → Site
//
// Jerarquía de permisos:
// - superadmin: acceso total a toda la plataforma
// - org_owner: propietario de organización (billing + gestión completa)
// - org_admin: admin de organización (gestión de sitios y usuarios)
// - org_viewer: lector de organización (acceso lectura a todos los sitios)
// - site_admin: admin de sitio específico
// - site_viewer: lector de sitio específico
// ============================================

/**
 * Configuración SMTP por organización
 * Para envío de emails de invitaciones y notificaciones
 */
export interface SmtpConfig {
  enabled: boolean;                   // Si false, usa el SMTP global de Esbilla
  host: string;                       // ej: smtp.acumbamail.com, smtp.gmail.com
  port: number;                       // 587 (STARTTLS) o 465 (SSL)
  secure: boolean;                    // true para 465, false para 587
  user: string;                       // usuario SMTP (normalmente un email)
  pass: string;                       // contraseña SMTP (almacenada encriptada)
  fromName: string;                   // Nombre del remitente (ej: "Acme Corp")
  fromEmail: string;                  // Email del remitente (ej: noreply@acme.com)
  replyTo?: string;                   // Email de respuesta (opcional)
}

/**
 * Organización (entidad fiscal con múltiples dominios)
 * Equivalente a "Cuenta" en Google Analytics
 */
export interface Organization {
  id: string;
  name: string;                       // Nombre de la organización/empresa
  legalName?: string;                 // Razón social
  taxId?: string;                     // NIF/CIF (opcional)

  // Tracking ID único para identificación (formato UUID)
  trackingId?: string;

  // Plan y límites
  plan: 'free' | 'pro' | 'enterprise';
  maxSites: number;
  maxConsentsPerMonth: number;

  // Facturación
  billingEmail: string;
  billingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
  };

  // Configuración SMTP personalizada (opcional)
  smtp?: SmtpConfig;

  // Metadatos
  createdAt: Date;
  createdBy: string;                  // UID del usuario que la creó
  updatedAt?: Date;
}

// ============================================
// ROLES Y PERMISOS JERÁRQUICOS
// ============================================

/**
 * Roles a nivel de plataforma (global)
 */
export type GlobalRole = 'superadmin' | 'pending';

/**
 * Roles a nivel de organización
 */
export type OrganizationRole = 'org_owner' | 'org_admin' | 'org_viewer';

/**
 * Roles a nivel de sitio
 */
export type SiteRole = 'site_admin' | 'site_viewer';

/**
 * Acceso de usuario a una organización
 */
export interface OrganizationAccess {
  organizationId: string;
  organizationName?: string;          // Cache para UI
  role: OrganizationRole;
  addedAt: Date;
  addedBy: string;                    // UID de quien otorgó el acceso
}

/**
 * Acceso de usuario a un sitio específico
 * Solo necesario si el usuario NO tiene acceso a nivel org
 */
export interface SiteAccess {
  siteId: string;
  siteName?: string;                  // Cache para UI
  organizationId: string;             // Referencia a la org del sitio
  role: SiteRole;
  addedAt: Date;
  addedBy: string;
}

/**
 * Roles a nivel de distribuidor
 * Los distribuidores gestionan organizaciones de clientes
 */
export type DistributorRole = 'distributor_admin' | 'distributor_manager' | 'distributor_viewer';

/**
 * Acceso de usuario como distribuidor de una organización
 * Un distribuidor puede gestionar múltiples organizaciones de clientes
 * IMPORTANTE: Un usuario puede ser org_owner de su propia org
 * Y ADEMÁS distributor de otras organizaciones
 */
export interface DistributorAccess {
  organizationId: string;
  organizationName?: string;          // Cache para UI
  role: DistributorRole;
  addedAt: Date;
  addedBy: string;                    // UID del superadmin que asignó
  notes?: string;                     // Notas sobre el acuerdo comercial
}

/**
 * Mapa de permisos efectivos del usuario
 * Calculado a partir de orgAccess, siteAccess y distributorAccess
 */
export interface EffectivePermissions {
  canManageOrganization: boolean;     // Puede editar org, ver billing
  canManageUsers: boolean;            // Puede aprobar/editar usuarios
  canManageSites: boolean;            // Puede crear/editar sitios
  canViewStats: boolean;              // Puede ver estadísticas
  canExportData: boolean;             // Puede exportar datos
}

/**
 * Configuración del banner de cookies
 */
export interface BannerSettings {
  layout: 'modal' | 'bar' | 'corner';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  font: 'system' | 'inter' | 'roboto' | 'opensans' | 'lato' | 'montserrat';
  buttonStyle: 'equal' | 'acceptHighlight';
  labels: {
    acceptAll: string;
    rejectAll: string;
    customize: string;
    acceptEssential: string;
  };
  legal: LegalInfo;
  // Categorías de cookies configurables
  categories: CookieCategory[];
  // CSS personalizado para el banner
  customCSS?: string;
}

/**
 * Información Legal Completa (GDPR Art. 13)
 */
export interface LegalInfo {
  // Campos Legacy (backward compatibility)
  title?: string;
  content?: string;

  // Responsable del Tratamiento (Art. 13.1.a)
  companyName?: string;           // "Acme Corp S.L."
  taxId?: string;                 // "B12345678"
  address?: string;               // "C/ Mayor 1, Madrid"
  contactEmail?: string;          // "legal@acme.com"

  // DPO - si aplica (Art. 13.1.b)
  dpoName?: string;               // "Juan Pérez"
  dpoEmail?: string;              // "dpo@acme.com"

  // Enlaces externos
  privacyPolicyUrl?: string;      // "https://acme.com/privacidad"
  cookiePolicyUrl?: string;       // "https://acme.com/cookies"

  // Texto personalizado para el banner
  bannerText?: string;            // Texto corto para el banner
  fullPolicyText?: string;        // Texto completo del modal

  // Cross-domain (si aplica)
  crossDomainEnabled?: boolean;
  relatedDomains?: string[];      // ["acme.com", "shop.acme.com"]

  // Plazos de conservación
  consentRetentionDays?: number;  // 1095 (3 años GDPR)

  // Autoridad de Control
  supervisoryAuthority?: string;  // "AEPD" (España), "CNIL" (Francia), etc.
  supervisoryAuthorityUrl?: string; // "https://www.aepd.es"
}

/**
 * Categoría de cookies
 */
export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;  // Las esenciales son requeridas
  defaultEnabled: boolean;
}

/**
 * Configuración del sitio (wrapper para diferentes tipos de settings)
 */
export interface SiteSettings {
  banner?: BannerSettings;
}

/**
 * Configuración de scripts de terceros (SDK v1.6)
 * Para modo "simplified" - el SDK carga automáticamente estos scripts
 */
export interface ScriptConfig {
  gtm?: {
    serverUrl?: string;              // URL del servidor GTM Server Side (ej: "https://gtm-server.tudominio.com")
    gatewayEnabled?: boolean;        // Habilitar GTM Gateway (carga script desde tu dominio)
    gatewayDomain?: string;          // Dominio del Gateway (ej: "gtm.tudominio.com")
    containerId?: string;            // Container ID (ej: "GTM-XXXXX")
  };
  analytics?: {
    googleAnalytics?: string;      // Measurement ID (ej: "G-XXXXXXXXXX")
    hotjar?: string;                // Site ID (ej: "12345")
    amplitude?: string;             // API Key
    crazyEgg?: string;              // Account Number (8 dígitos hex)
    vwo?: string;                   // Account ID (6 dígitos)
    optimizely?: string;            // Project ID (10 dígitos)
    clarity?: string;               // Project ID (Microsoft Clarity)
  };
  marketing?: {
    facebookPixel?: string;         // Pixel ID (ej: "123456789012345")
    linkedinInsight?: string;       // Partner ID (ej: "123456")
    tiktokPixel?: string;           // Pixel ID (ej: "ABCDEFGHIJK")
    googleAds?: string;             // Conversion ID (ej: "AW-123456789")
    microsoftAds?: string;          // UET Tag ID (8 dígitos)
    criteo?: string;                // Account ID (6 dígitos)
    pinterestTag?: string;          // Tag ID (13 dígitos, empieza con 261)
    twitterPixel?: string;          // Pixel ID (ej: "o1234")
    taboola?: string;               // Account ID (7 dígitos)
    youtube?: string;               // Video ID (11 caracteres)
    hubspot?: string;               // Portal ID (8 dígitos)
  };
  functional?: {
    intercom?: string;              // App ID (8 caracteres alfanuméricos)
    zendesk?: string;               // Snippet Key
  };
}

/**
 * Colores personalizables para la Panoya
 */
export interface PanoyaColors {
  primary: string;      // Color primario (#FFBF00 por defecto)
  secondary: string;    // Color secundario (#C2A561 por defecto)
  accent: string;       // Color de acento (#2F6E8D por defecto)
}

/**
 * Sitio/Dominio
 */
export interface Site {
  id: string;
  name: string;
  domains: string[];              // Dominios asociados ["example.com", "www.example.com"]
  organizationId?: string;        // Para SaaS

  // Configuración
  settings?: SiteSettings;

  // Configuración de scripts (SDK v1.7 - modo simplified con 20+ integraciones)
  scriptConfig?: ScriptConfig;

  // Google Consent Mode V2 - G100 (opt-in para GDPR compliance)
  // Si true, envía pings anónimos a GA4 antes del consentimiento
  // Si false, solo envía datos a GA4 después del consentimiento del usuario
  enableG100?: boolean;

  // Personalización del icono de la panoya en el banner
  panoyaVariant?: 'realista' | 'minimalista' | 'geometrica';  // Estilo del icono (default: 'realista')
  panoyaColors?: PanoyaColors;    // Colores personalizados (opcional)

  // Autenticación del SDK
  apiKey: string;

  // Estadísticas (denormalizadas para consultas rápidas)
  stats?: {
    totalConsents: number;
    lastConsentAt?: Date;
  };

  // Metadatos
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

/**
 * Usuario del dashboard con permisos jerárquicos
 */
export interface DashboardUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;

  // Rol a nivel de plataforma
  // superadmin = acceso total a todo
  // pending = esperando aprobación
  globalRole: GlobalRole;

  // Acceso a organizaciones (por orgId)
  // org_owner/org_admin/org_viewer dan acceso a TODOS los sitios de la org
  orgAccess: Record<string, OrganizationAccess>;

  // Acceso directo a sitios específicos (por siteId)
  // Solo necesario si el usuario NO tiene acceso a nivel de org
  // Útil para dar acceso a freelancers/agencias a sitios específicos
  siteAccess: Record<string, SiteAccess>;

  // Acceso como distribuidor a organizaciones de clientes (por orgId)
  // Los distribuidores gestionan organizaciones de terceros
  // Un usuario puede ser org_owner de su propia org Y distributor de otras
  distributorAccess: Record<string, DistributorAccess>;

  // Metadatos
  createdAt: Date;
  lastLogin: Date;
  createdBy?: string;                 // UID de quien creó/aprobó el usuario
}

// ============================================
// LEGACY SUPPORT (retrocompatibilidad)
// ============================================

/**
 * @deprecated Usar OrganizationRole o SiteRole
 */
export type LegacyGlobalRole = 'superadmin' | 'admin' | 'viewer' | 'pending';

/**
 * @deprecated Usar SiteAccess con el nuevo modelo
 */
export interface LegacySiteAccess {
  role: 'owner' | 'admin' | 'viewer';
  siteId: string;
  siteName?: string;
  addedAt: Date;
  addedBy: string;
}

/**
 * Opciones de consentimiento
 */
export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
  [key: string]: boolean;  // Categorías personalizadas
}

/**
 * Metadatos del consentimiento
 */
export interface ConsentMetadata {
  domain: string;           // Dominio exacto donde se dio el consentimiento
  pageUrl: string;          // URL completa de la página
  referrer?: string;        // De dónde vino el usuario
  userAgent: string;
  language: string;
  country?: string;         // Detectado por IP (desde el servidor)
  region?: string;
  city?: string;
  sdkVersion: string;       // Versión del SDK
  consentVersion: string;   // Versión de la política de cookies
}

/**
 * Registro de consentimiento
 */
export interface Consent {
  id: string;
  siteId: string;
  footprintId: string;

  // Elecciones del usuario
  choices: ConsentChoices;

  // Tipo de acción
  action: 'accept_all' | 'reject_all' | 'customize' | 'update';

  // Metadatos enriquecidos
  metadata: ConsentMetadata;

  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: Date;         // Para recordar cuándo pedir consentimiento de nuevo
}

/**
 * Estadísticas diarias por sitio
 */
export interface DailyStats {
  siteId: string;
  date: string;             // Formato: YYYY-MM-DD
  total: number;
  accepted: number;
  rejected: number;
  customized: number;
  byDomain: Record<string, number>;  // Desglose por dominio
}

// ============================================
// HELPERS DE TIPOS
// ============================================

/**
 * Categorías de cookies por defecto
 */
export const DEFAULT_COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Esenciales',
    description: 'Cookies necesarias para el funcionamiento del sitio',
    required: true,
    defaultEnabled: true,
  },
  {
    id: 'analytics',
    name: 'Analíticas',
    description: 'Cookies para analizar el uso del sitio',
    required: false,
    defaultEnabled: false,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Cookies para publicidad personalizada',
    required: false,
    defaultEnabled: false,
  },
];

/**
 * Configuración por defecto del banner
 */
export const DEFAULT_BANNER_SETTINGS: BannerSettings = {
  layout: 'modal',
  colors: {
    primary: '#FFBF00',
    secondary: '#E5E7EB',
    background: '#FFFFFF',
    text: '#1C1917',
  },
  font: 'system',
  buttonStyle: 'equal',
  labels: {
    acceptAll: 'Aceptar todas',
    rejectAll: 'Rechazar todas',
    customize: 'Personalizar',
    acceptEssential: 'Solo esenciales',
  },
  legal: {
    title: 'Aviso Legal',
    content: '',
  },
  categories: DEFAULT_COOKIE_CATEGORIES,
  customCSS: '',
};

/**
 * Genera un API key aleatorio para un sitio
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'esb_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Genera un ID de sitio
 */
export function generateSiteId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'site_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Genera un ID de organización
 */
export function generateOrgId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'org_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// FUNCIONES DE PERMISOS
// ============================================

/**
 * Verifica si un usuario tiene acceso a una organización
 */
export function hasOrgAccess(user: DashboardUser, orgId: string): boolean {
  if (user.globalRole === 'superadmin') return true;
  return orgId in user.orgAccess;
}

/**
 * Verifica si un usuario tiene acceso a un sitio
 */
export function hasSiteAccess(user: DashboardUser, siteId: string, site?: Site): boolean {
  // Superadmin tiene acceso a todo
  if (user.globalRole === 'superadmin') return true;

  // Acceso directo al sitio
  if (siteId in user.siteAccess) return true;

  // Acceso vía organización (si conocemos la org del sitio)
  if (site?.organizationId && site.organizationId in user.orgAccess) {
    return true;
  }

  return false;
}

/**
 * Obtiene el rol efectivo de un usuario en una organización
 */
export function getOrgRole(user: DashboardUser, orgId: string): OrganizationRole | 'superadmin' | null {
  if (user.globalRole === 'superadmin') return 'superadmin';
  return user.orgAccess[orgId]?.role || null;
}

/**
 * Obtiene el rol efectivo de un usuario en un sitio
 */
export function getSiteRole(
  user: DashboardUser,
  siteId: string,
  site?: Site
): OrganizationRole | SiteRole | 'superadmin' | null {
  // Superadmin tiene acceso total
  if (user.globalRole === 'superadmin') return 'superadmin';

  // Primero verificar acceso a nivel de organización (hereda a todos los sitios)
  if (site?.organizationId && user.orgAccess[site.organizationId]) {
    return user.orgAccess[site.organizationId].role;
  }

  // Acceso directo al sitio
  return user.siteAccess[siteId]?.role || null;
}

/**
 * Calcula los permisos efectivos de un usuario para una organización
 */
export function getOrgPermissions(user: DashboardUser, orgId: string): EffectivePermissions {
  const role = getOrgRole(user, orgId);

  if (!role) {
    return {
      canManageOrganization: false,
      canManageUsers: false,
      canManageSites: false,
      canViewStats: false,
      canExportData: false,
    };
  }

  switch (role) {
    case 'superadmin':
    case 'org_owner':
      return {
        canManageOrganization: true,
        canManageUsers: true,
        canManageSites: true,
        canViewStats: true,
        canExportData: true,
      };
    case 'org_admin':
      return {
        canManageOrganization: false,  // No puede cambiar billing
        canManageUsers: true,
        canManageSites: true,
        canViewStats: true,
        canExportData: true,
      };
    case 'org_viewer':
      return {
        canManageOrganization: false,
        canManageUsers: false,
        canManageSites: false,
        canViewStats: true,
        canExportData: true,
      };
    default:
      return {
        canManageOrganization: false,
        canManageUsers: false,
        canManageSites: false,
        canViewStats: false,
        canExportData: false,
      };
  }
}

/**
 * Calcula los permisos efectivos de un usuario para un sitio
 */
export function getSitePermissions(
  user: DashboardUser,
  siteId: string,
  site?: Site
): EffectivePermissions {
  const role = getSiteRole(user, siteId, site);

  if (!role) {
    return {
      canManageOrganization: false,
      canManageUsers: false,
      canManageSites: false,
      canViewStats: false,
      canExportData: false,
    };
  }

  // Si el rol viene de la organización, usa permisos de org
  if (role === 'superadmin' || role === 'org_owner' || role === 'org_admin' || role === 'org_viewer') {
    return {
      canManageOrganization: role === 'superadmin' || role === 'org_owner',
      canManageUsers: role === 'superadmin' || role === 'org_owner' || role === 'org_admin',
      canManageSites: role !== 'org_viewer',
      canViewStats: true,
      canExportData: true,
    };
  }

  // Permisos a nivel de sitio
  switch (role) {
    case 'site_admin':
      return {
        canManageOrganization: false,
        canManageUsers: false,          // Solo puede gestionar el sitio, no usuarios de la org
        canManageSites: true,
        canViewStats: true,
        canExportData: true,
      };
    case 'site_viewer':
      return {
        canManageOrganization: false,
        canManageUsers: false,
        canManageSites: false,
        canViewStats: true,
        canExportData: false,
      };
    default:
      return {
        canManageOrganization: false,
        canManageUsers: false,
        canManageSites: false,
        canViewStats: false,
        canExportData: false,
      };
  }
}

/**
 * Verifica si un usuario puede gestionar a otro usuario
 * (solo puede gestionar usuarios de nivel igual o inferior)
 */
export function canManageUser(
  manager: DashboardUser,
  target: DashboardUser,
  context: { orgId?: string; siteId?: string }
): boolean {
  // Superadmin puede gestionar a cualquiera
  if (manager.globalRole === 'superadmin') return true;

  // Nadie puede gestionar a un superadmin
  if (target.globalRole === 'superadmin') return false;

  // Verificar contexto de organización
  if (context.orgId) {
    const managerRole = getOrgRole(manager, context.orgId);
    const targetRole = getOrgRole(target, context.orgId);

    // Solo org_owner y org_admin pueden gestionar usuarios
    if (managerRole !== 'org_owner' && managerRole !== 'org_admin') return false;

    // org_owner puede gestionar a cualquiera en su org
    if (managerRole === 'org_owner') return true;

    // org_admin puede gestionar viewers y site-level users
    if (managerRole === 'org_admin') {
      return targetRole !== 'org_owner' && targetRole !== 'org_admin';
    }
  }

  return false;
}

// ============================================
// FUNCIONES DE PERMISOS DE DISTRIBUIDOR
// ============================================

/**
 * Verifica si un usuario tiene acceso como distribuidor a una organización
 */
export function hasDistributorAccess(user: DashboardUser, orgId: string): boolean {
  if (user.globalRole === 'superadmin') return true;
  return orgId in (user.distributorAccess || {});
}

/**
 * Obtiene el rol de distribuidor de un usuario en una organización
 */
export function getDistributorRole(
  user: DashboardUser,
  orgId: string
): DistributorRole | 'superadmin' | null {
  if (user.globalRole === 'superadmin') return 'superadmin';
  return user.distributorAccess?.[orgId]?.role || null;
}

/**
 * Calcula los permisos efectivos de un usuario como distribuidor
 */
export function getDistributorPermissions(
  user: DashboardUser,
  orgId: string
): EffectivePermissions {
  const role = getDistributorRole(user, orgId);

  if (!role) {
    return {
      canManageOrganization: false,
      canManageUsers: false,
      canManageSites: false,
      canViewStats: false,
      canExportData: false,
    };
  }

  switch (role) {
    case 'superadmin':
    case 'distributor_admin':
      return {
        canManageOrganization: true,     // Puede gestionar la org del cliente
        canManageUsers: true,            // Puede gestionar usuarios del cliente
        canManageSites: true,            // Puede gestionar sitios del cliente
        canViewStats: true,
        canExportData: true,
      };
    case 'distributor_manager':
      return {
        canManageOrganization: false,    // NO puede editar billing del cliente
        canManageUsers: true,
        canManageSites: true,
        canViewStats: true,
        canExportData: true,
      };
    case 'distributor_viewer':
      return {
        canManageOrganization: false,
        canManageUsers: false,
        canManageSites: false,
        canViewStats: true,              // Solo lectura
        canExportData: true,
      };
    default:
      return {
        canManageOrganization: false,
        canManageUsers: false,
        canManageSites: false,
        canViewStats: false,
        canExportData: false,
      };
  }
}

/**
 * Verifica si un usuario tiene ALGÚN tipo de acceso a una organización
 * (como owner, admin, viewer O como distribuidor)
 */
export function hasAnyAccessToOrg(user: DashboardUser, orgId: string): boolean {
  if (user.globalRole === 'superadmin') return true;
  return hasOrgAccess(user, orgId) || hasDistributorAccess(user, orgId);
}

/**
 * Obtiene el rol efectivo más alto de un usuario en una organización
 * Considera tanto roles de org como roles de distribuidor
 */
export function getEffectiveOrgRole(
  user: DashboardUser,
  orgId: string
): OrganizationRole | DistributorRole | 'superadmin' | null {
  if (user.globalRole === 'superadmin') return 'superadmin';

  // Prioridad 1: Rol de organización (owner/admin)
  const orgRole = getOrgRole(user, orgId);
  if (orgRole) return orgRole;

  // Prioridad 2: Rol de distribuidor
  const distRole = getDistributorRole(user, orgId);
  if (distRole) return distRole;

  return null;
}

// ============================================
// WAITING LIST (LISTA DE ESPERA)
// ============================================

export interface WaitingListEntry {
  id: string;                         // ID del documento
  email: string;                      // Email del interesado
  name?: string;                      // Nombre opcional
  plan: 'free' | 'starter' | 'growth' | 'agency';  // Plan seleccionado
  company?: string;                   // Nombre de empresa (opcional)
  website?: string;                   // URL del sitio web (opcional)
  message?: string;                   // Mensaje adicional (opcional)
  status: 'pending' | 'contacted' | 'converted' | 'rejected';  // Estado
  notes?: string;                     // Notas internas (solo superadmin)
  contactedAt?: Date;                 // Fecha de contacto
  contactedBy?: string;               // UID de quien contactó
  convertedAt?: Date;                 // Fecha de conversión
  source?: string;                    // Origen: 'landing', 'referral', 'other'
  locale?: string;                    // Idioma preferido (es, en, ast, etc.)
  createdAt: Date;                    // Fecha de registro
}
