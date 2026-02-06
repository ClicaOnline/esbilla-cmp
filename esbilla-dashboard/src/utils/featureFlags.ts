/**
 * Feature Flags for Esbilla CMP
 * Controls behavior differences between SaaS and self-hosted modes
 */

export type EsbillaMode = 'saas' | 'selfhosted';

/**
 * Get current Esbilla mode from environment
 */
export const getEsbillaMode = (): EsbillaMode => {
  const mode = import.meta.env.VITE_ESBILLA_MODE;
  if (mode === 'saas' || mode === 'selfhosted') {
    return mode;
  }
  // Default to SaaS mode if not specified
  return 'saas';
};

/**
 * Check if running in SaaS mode
 */
export const isSaasMode = (): boolean => {
  return getEsbillaMode() === 'saas';
};

/**
 * Check if running in self-hosted mode
 */
export const isSelfHostedMode = (): boolean => {
  return getEsbillaMode() === 'selfhosted';
};

/**
 * Feature flags based on mode
 */
export const features = {
  /**
   * Allow self-registration with plan selection
   * SaaS: ✅ Enabled
   * Self-hosted: ❌ Disabled
   */
  allowSelfRegistration: isSaasMode(),

  /**
   * Show plan selection during registration
   * SaaS: ✅ Enabled
   * Self-hosted: ❌ Disabled
   */
  showPlanSelection: isSaasMode(),

  /**
   * Enforce plan limits (sites, consents)
   * SaaS: ✅ Enforced
   * Self-hosted: ❌ No limits
   */
  enforcePlanLimits: isSaasMode(),

  /**
   * Auto-promote first user to superadmin
   * SaaS: ❌ Disabled
   * Self-hosted: ✅ Enabled
   */
  autoPromoteFirstUser: isSelfHostedMode(),

  /**
   * Allow email/password authentication
   * Both modes: ✅ Enabled
   */
  allowEmailPasswordAuth: true,

  /**
   * Allow Google SSO authentication
   * Both modes: ✅ Enabled
   */
  allowGoogleAuth: true,

  /**
   * Allow invitations via email
   * Both modes: ✅ Enabled
   */
  allowInvitations: true,
};
