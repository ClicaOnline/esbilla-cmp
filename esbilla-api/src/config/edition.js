/**
 * Edition Configuration - Open Core Model
 *
 * Community Edition (CE): Open Source, basic features
 * Enterprise Edition (EE): Premium, advanced features
 *
 * Set ESBILLA_EDITION environment variable to 'community' or 'enterprise'
 */

const EDITION = process.env.ESBILLA_EDITION || 'enterprise'; // Default to EE for current repo

/**
 * Feature flags por edición
 */
const FEATURES = {
  community: {
    // SDK Features
    attribution: false,           // Marketing attribution (UTM, click IDs)
    crossDomain: false,           // Cross-domain footprint sync
    gtmGateway: false,            // GTM Gateway proxy
    advancedIntegrations: false,  // 14 additional integrations (total 19)

    // Backend Features
    multiTenancy: false,          // Organizations + users
    quotas: false,                // Plan limits enforcement
    invitations: false,           // Email invitations system
    sync: false,                  // Cross-domain sync endpoint

    // Dashboard Features
    emailAuth: false,             // Email/password login
    onboarding: false,            // Onboarding wizard
    waitingList: false,           // Waiting list management
    advancedStats: false,         // Advanced analytics
    plans: false,                 // Plan tiers (Free/Pro/Enterprise)
  },

  enterprise: {
    // SDK Features
    attribution: true,
    crossDomain: true,
    gtmGateway: true,
    advancedIntegrations: true,

    // Backend Features
    multiTenancy: true,
    quotas: true,
    invitations: true,
    sync: true,

    // Dashboard Features
    emailAuth: true,
    onboarding: true,
    waitingList: true,
    advancedStats: true,
    plans: true,
  }
};

/**
 * Get current edition
 */
function getEdition() {
  return EDITION;
}

/**
 * Check if running Enterprise Edition
 */
function isEnterprise() {
  return EDITION === 'enterprise';
}

/**
 * Check if running Community Edition
 */
function isCommunity() {
  return EDITION === 'community';
}

/**
 * Check if a specific feature is available
 * @param {string} feature - Feature name from FEATURES object
 * @returns {boolean}
 */
function hasFeature(feature) {
  const editionFeatures = FEATURES[EDITION];
  if (!editionFeatures) {
    console.error(`[Edition] Unknown edition: ${EDITION}`);
    return false;
  }
  return editionFeatures[feature] || false;
}

/**
 * Get all features for current edition
 * @returns {Object}
 */
function getFeatures() {
  return FEATURES[EDITION] || {};
}

/**
 * Require Enterprise Edition for a feature
 * Throws error if running CE and feature is not available
 * @param {string} feature - Feature name
 * @param {string} message - Optional custom error message
 */
function requireEnterprise(feature, message) {
  if (!hasFeature(feature)) {
    const defaultMessage = `Feature '${feature}' requires Enterprise Edition`;
    throw new Error(message || defaultMessage);
  }
}

/**
 * Middleware to check if a feature is available
 * Returns 403 if feature is not available in current edition
 */
function featureMiddleware(feature) {
  return (req, res, next) => {
    if (!hasFeature(feature)) {
      return res.status(403).json({
        error: 'FEATURE_NOT_AVAILABLE',
        message: `This feature requires Enterprise Edition`,
        feature,
        edition: EDITION,
        upgrade: 'https://esbilla.com/pricing'
      });
    }
    next();
  };
}

/**
 * Log edition info on startup
 */
function logEditionInfo() {
  const emoji = isEnterprise() ? '🏢' : '🌽';
  const editionName = isEnterprise() ? 'Enterprise' : 'Community';

  console.log('');
  console.log(`${emoji}  Esbilla CMP - ${editionName} Edition`);
  console.log('');
  console.log('Features enabled:');

  const features = getFeatures();
  const enabledFeatures = Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  if (enabledFeatures.length === 0) {
    console.log('  - Basic features only (CE)');
  } else {
    enabledFeatures.forEach(feature => {
      console.log(`  ✓ ${feature}`);
    });
  }

  console.log('');
}

module.exports = {
  EDITION,
  FEATURES,
  getEdition,
  isEnterprise,
  isCommunity,
  hasFeature,
  getFeatures,
  requireEnterprise,
  featureMiddleware,
  logEditionInfo,
};
