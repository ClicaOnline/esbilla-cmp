/**
 * GTM Gateway Module (Enterprise Edition)
 *
 * Loads Google Tag Manager from a custom domain (GTM Gateway)
 * Benefits:
 * - Bypass ad blockers (first-party domain)
 * - Improved privacy (no direct connection to google.com)
 * - Better control over analytics
 *
 * Configuration:
 * - gtmContainerId: GTM-XXXXX
 * - gtmGatewayDomain: gtm.yourdomain.com
 *
 * Flow:
 * 1. Load gtm.js from custom domain instead of googletagmanager.com
 * 2. Initialize dataLayer
 * 3. Push GTM container ID
 * 4. Handle Consent Mode v2 integration
 */

(function() {
  'use strict';

  let gtmContainerId = null;
  let gtmGatewayDomain = null;
  let isLoaded = false;

  /**
   * Initialize GTM Gateway
   * @param {Object} config - Configuration object
   * @param {string} config.containerId - GTM container ID (GTM-XXXXX)
   * @param {string} config.gatewayDomain - Custom domain for GTM proxy
   */
  function init(config) {
    if (isLoaded) {
      console.warn('[Esbilla GTM Gateway] Already loaded');
      return;
    }

    gtmContainerId = config.containerId;
    gtmGatewayDomain = config.gatewayDomain;

    if (!gtmContainerId) {
      console.error('[Esbilla GTM Gateway] Missing containerId');
      return;
    }

    if (!gtmGatewayDomain) {
      console.error('[Esbilla GTM Gateway] Missing gatewayDomain');
      return;
    }

    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];

    // GTM initialization snippet (adapted for custom domain)
    (function(w, d, s, l, i, g) {
      w[l] = w[l] || [];
      w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });

      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';

      j.async = true;
      j.src = 'https://' + g + '/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', gtmContainerId, gtmGatewayDomain);

    isLoaded = true;
    console.log('[Esbilla GTM Gateway] Loaded:', {
      containerId: gtmContainerId,
      gatewayDomain: gtmGatewayDomain
    });
  }

  /**
   * Push event to dataLayer
   * @param {Object} event - Event object
   */
  function pushEvent(event) {
    if (!window.dataLayer) {
      console.error('[Esbilla GTM Gateway] dataLayer not initialized');
      return;
    }

    window.dataLayer.push(event);
  }

  /**
   * Update Google Consent Mode
   * @param {Object} consent - Consent object
   * @param {string} consent.analytics - 'granted' | 'denied'
   * @param {string} consent.marketing - 'granted' | 'denied'
   */
  function updateConsent(consent) {
    if (!window.dataLayer) {
      console.error('[Esbilla GTM Gateway] dataLayer not initialized');
      return;
    }

    // Google Consent Mode v2
    window.dataLayer.push({
      event: 'consent_update',
      consent_analytics: consent.analytics,
      consent_marketing: consent.marketing
    });

    // Also update gtag consent (if gtag is loaded)
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': consent.analytics,
        'ad_storage': consent.marketing,
        'ad_user_data': consent.marketing,
        'ad_personalization': consent.marketing,
      });
    }

    console.log('[Esbilla GTM Gateway] Consent updated:', consent);
  }

  /**
   * Set default consent state (should be called before GTM loads)
   * @param {Object} defaultConsent - Default consent object
   */
  function setDefaultConsent(defaultConsent) {
    window.dataLayer = window.dataLayer || [];

    // Google Consent Mode v2 defaults
    window.dataLayer.push({
      event: 'consent_default',
      consent_analytics: defaultConsent.analytics || 'denied',
      consent_marketing: defaultConsent.marketing || 'denied'
    });

    // Also set gtag defaults (if gtag is available)
    if (window.gtag) {
      window.gtag('consent', 'default', {
        'analytics_storage': defaultConsent.analytics || 'denied',
        'ad_storage': defaultConsent.marketing || 'denied',
        'ad_user_data': defaultConsent.marketing || 'denied',
        'ad_personalization': defaultConsent.marketing || 'denied',
        'wait_for_update': 500 // Wait 500ms for consent banner
      });
    }

    console.log('[Esbilla GTM Gateway] Default consent set:', defaultConsent);
  }

  /**
   * Get GTM container ID
   */
  function getContainerId() {
    return gtmContainerId;
  }

  /**
   * Get GTM gateway domain
   */
  function getGatewayDomain() {
    return gtmGatewayDomain;
  }

  /**
   * Check if GTM is loaded
   */
  function isGtmLoaded() {
    return isLoaded && window.google_tag_manager !== undefined;
  }

  /**
   * Public API
   */
  window.EsbillaGTM = {
    init,
    pushEvent,
    updateConsent,
    setDefaultConsent,
    getContainerId,
    getGatewayDomain,
    isLoaded: isGtmLoaded,
  };

  console.log('[Esbilla] GTM Gateway module loaded (EE)');
})();
