/**
 * Edition Configuration - Open Core Model
 *
 * Community Edition (CE): Open Source, basic features
 * Enterprise Edition (EE): Premium, advanced features
 *
 * Set VITE_ESBILLA_EDITION environment variable to 'community' or 'enterprise'
 */

export type Edition = 'community' | 'enterprise';

export type FeatureName =
  | 'multiTenancy'
  | 'plans'
  | 'quotas'
  | 'invitations'
  | 'onboarding'
  | 'waitingList'
  | 'emailAuth'
  | 'advancedStats'
  | 'gtmGateway'
  | 'attribution'
  | 'crossDomain'
  | 'advancedIntegrations';

export interface EditionFeatures {
  // Dashboard Features
  multiTenancy: boolean;          // Organizations + users
  plans: boolean;                 // Plan tiers (Free/Pro/Enterprise)
  quotas: boolean;                // Plan limits enforcement
  invitations: boolean;           // Email invitations system
  onboarding: boolean;            // Onboarding wizard (3 steps)
  waitingList: boolean;           // Waiting list management
  emailAuth: boolean;             // Email/password login (+ Google SSO)
  advancedStats: boolean;         // Advanced analytics

  // SDK Features (for UI configuration)
  gtmGateway: boolean;            // GTM Gateway proxy configuration
  attribution: boolean;           // Marketing attribution (UTM, click IDs)
  crossDomain: boolean;           // Cross-domain footprint sync
  advancedIntegrations: boolean;  // 14 additional integrations (total 19)
}

/**
 * Current edition (from environment variable)
 * Defaults to 'enterprise' for current repo
 */
export const EDITION: Edition =
  (import.meta.env.VITE_ESBILLA_EDITION as Edition) || 'enterprise';

/**
 * Feature flags per edition
 */
export const FEATURES: Record<Edition, EditionFeatures> = {
  community: {
    // Dashboard Features
    multiTenancy: false,
    plans: false,
    quotas: false,
    invitations: false,
    onboarding: false,
    waitingList: false,
    emailAuth: false,
    advancedStats: false,

    // SDK Features
    gtmGateway: false,
    attribution: false,
    crossDomain: false,
    advancedIntegrations: false,
  },

  enterprise: {
    // Dashboard Features
    multiTenancy: true,
    plans: true,
    quotas: true,
    invitations: true,
    onboarding: true,
    waitingList: true,
    emailAuth: true,
    advancedStats: true,

    // SDK Features
    gtmGateway: true,
    attribution: true,
    crossDomain: true,
    advancedIntegrations: true,
  },
} as const;

/**
 * Get current edition
 */
export function getEdition(): Edition {
  return EDITION;
}

/**
 * Check if running Enterprise Edition
 */
export function isEnterprise(): boolean {
  return EDITION === 'enterprise';
}

/**
 * Check if running Community Edition
 */
export function isCommunity(): boolean {
  return EDITION === 'community';
}

/**
 * Check if a specific feature is available
 */
export function hasFeature(feature: FeatureName): boolean {
  return FEATURES[EDITION][feature] || false;
}

/**
 * Get all features for current edition
 */
export function getFeatures(): EditionFeatures {
  return FEATURES[EDITION];
}

/**
 * Require Enterprise Edition for a feature
 * Throws error if running CE and feature is not available
 */
export function requireEnterprise(feature: FeatureName, message?: string): void {
  if (!hasFeature(feature)) {
    const defaultMessage = `Feature '${feature}' requires Enterprise Edition`;
    throw new Error(message || defaultMessage);
  }
}

/**
 * React Hook: Check if feature is available
 * Usage: const hasMultiTenancy = useFeature('multiTenancy');
 */
export function useFeature(feature: FeatureName): boolean {
  return hasFeature(feature);
}

/**
 * Get edition display name
 */
export function getEditionName(): string {
  return isEnterprise() ? 'Enterprise' : 'Community';
}

/**
 * Get edition emoji
 */
export function getEditionEmoji(): string {
  return isEnterprise() ? '🏢' : '🌽';
}

/**
 * Log edition info to console
 */
export function logEditionInfo(): void {
  const emoji = getEditionEmoji();
  const name = getEditionName();

  console.log('');
  console.log(`${emoji}  Esbilla CMP - ${name} Edition`);
  console.log('');

  const features = getFeatures();
  const enabledFeatures = Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  if (enabledFeatures.length === 0) {
    console.log('Features: Basic only (CE)');
  } else {
    console.log('Features enabled:');
    enabledFeatures.forEach((feature) => {
      console.log(`  ✓ ${feature}`);
    });
  }

  console.log('');
}

// Log edition info on module load (dev only)
if (import.meta.env.DEV) {
  logEditionInfo();
}
