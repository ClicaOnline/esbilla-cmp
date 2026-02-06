/**
 * SaaS Plan Definitions for Esbilla CMP
 */

export type PlanId = 'free' | 'pro' | 'enterprise';

export interface PlanPrice {
  monthly: number | null;
  yearly: number | null;
}

export interface PlanName {
  ast: string;
  es: string;
  en: string;
}

export interface Plan {
  id: PlanId;
  name: PlanName;
  maxSites: number; // -1 = unlimited
  maxConsentsPerMonth: number; // -1 = unlimited
  price: PlanPrice;
  features: string[]; // Key features for this plan
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: {
      ast: 'De baldre',
      es: 'Gratuito',
      en: 'Free',
    },
    maxSites: 1,
    maxConsentsPerMonth: 5000,
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      '1 sitio web',
      '5,000 consentimientos/mes',
      'Banner personalizable',
      'Google Consent Mode v2',
      'Soporte por email',
    ],
  },
  pro: {
    id: 'pro',
    name: {
      ast: 'Profesional',
      es: 'Profesional',
      en: 'Professional',
    },
    maxSites: 10,
    maxConsentsPerMonth: 100000,
    price: {
      monthly: 19,
      yearly: 190, // ~2 meses gratis
    },
    features: [
      'Hasta 10 sitios web',
      '100,000 consentimientos/mes',
      'Multi-organización',
      'Gestión de usuarios',
      'Estadísticas avanzadas',
      'Historial completo (Footprint)',
      'Soporte prioritario',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: {
      ast: 'Empresa',
      es: 'Empresa',
      en: 'Enterprise',
    },
    maxSites: -1, // ilimitado
    maxConsentsPerMonth: -1, // ilimitado
    price: {
      monthly: null, // contactar
      yearly: null, // contactar
    },
    features: [
      'Sitios ilimitados',
      'Consentimientos ilimitados',
      'Multi-tenancy completo',
      'SLA garantizado',
      'Soporte dedicado 24/7',
      'Onboarding personalizado',
      'Infraestructura dedicada (opcional)',
      'Integración personalizada',
    ],
  },
};

/**
 * Get plan by ID
 */
export const getPlan = (planId: PlanId): Plan => {
  return PLANS[planId];
};

/**
 * Get all available plans
 */
export const getAllPlans = (): Plan[] => {
  return Object.values(PLANS);
};

/**
 * Check if a plan allows a specific number of sites
 */
export const canAddSite = (planId: PlanId, currentSites: number): boolean => {
  const plan = getPlan(planId);
  if (plan.maxSites === -1) return true; // unlimited
  return currentSites < plan.maxSites;
};

/**
 * Check if a plan allows a specific number of consents
 */
export const canAddConsents = (planId: PlanId, currentConsentsThisMonth: number): boolean => {
  const plan = getPlan(planId);
  if (plan.maxConsentsPerMonth === -1) return true; // unlimited
  return currentConsentsThisMonth < plan.maxConsentsPerMonth;
};

/**
 * Get plan name in specific language
 */
export const getPlanName = (planId: PlanId, language: 'ast' | 'es' | 'en'): string => {
  return getPlan(planId).name[language];
};

/**
 * Format plan price for display
 */
export const formatPlanPrice = (planId: PlanId, billing: 'monthly' | 'yearly', language: 'ast' | 'es' | 'en'): string => {
  const plan = getPlan(planId);
  const price = plan.price[billing];

  if (price === null) {
    return language === 'es' ? 'Contactar' : language === 'en' ? 'Contact us' : 'Contautar';
  }

  if (price === 0) {
    return language === 'es' ? 'Gratis' : language === 'en' ? 'Free' : 'De baldre';
  }

  return `${price}€/${billing === 'monthly' ? (language === 'es' ? 'mes' : language === 'en' ? 'month' : 'mes') : (language === 'es' ? 'año' : language === 'en' ? 'year' : 'añu')}`;
};
