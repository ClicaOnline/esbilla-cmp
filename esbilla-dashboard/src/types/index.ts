// ============================================
// TIPOS PARA MODELO MULTI-TENANT
// ============================================

/**
 * Organización (para modelo SaaS)
 */
export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxSites: number;
  maxConsentsPerMonth: number;
  billingEmail: string;
  createdAt: Date;
  updatedAt?: Date;
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
  legal: {
    title: string;
    content: string;
  };
  // Categorías de cookies configurables
  categories: CookieCategory[];
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
 * Sitio/Dominio
 */
export interface Site {
  id: string;
  name: string;
  domains: string[];              // Dominios asociados ["example.com", "www.example.com"]
  organizationId?: string;        // Para SaaS

  // Configuración
  settings?: SiteSettings;

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
 * Roles de usuario en un sitio
 */
export type SiteRole = 'owner' | 'admin' | 'viewer';

/**
 * Acceso de usuario a un sitio
 */
export interface SiteAccess {
  role: SiteRole;
  siteId: string;
  siteName?: string;
  addedAt: Date;
  addedBy: string;
}

/**
 * Roles globales del sistema
 */
export type GlobalRole = 'superadmin' | 'admin' | 'viewer' | 'pending';

/**
 * Usuario del dashboard
 */
export interface DashboardUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;

  // Rol global (superadmin = acceso total, otros = basado en siteAccess)
  globalRole: GlobalRole;

  // Acceso a sitios específicos
  siteAccess: Record<string, SiteAccess>;

  // Para SaaS
  organizationId?: string;

  // Metadatos
  createdAt: Date;
  lastLogin: Date;
  createdBy?: string;
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
