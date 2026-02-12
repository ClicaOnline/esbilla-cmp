/**
 * Attribution Module (Enterprise Edition)
 *
 * Marketing attribution tracking:
 * - UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
 * - Click IDs: gclid (Google), fbclid (Facebook), msclkid (Microsoft), ttclid (TikTok)
 * - Referrer tracking
 * - First-touch and last-touch attribution
 *
 * Storage: localStorage with 30-day expiration
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'esbilla_attribution';
  const EXPIRATION_DAYS = 30;

  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const CLICK_IDS = {
    gclid: 'google',      // Google Ads
    fbclid: 'facebook',   // Facebook
    msclkid: 'microsoft', // Microsoft Ads
    ttclid: 'tiktok',     // TikTok
    li_fat_id: 'linkedin', // LinkedIn
    twclid: 'twitter',    // Twitter/X
    pin_id: 'pinterest',  // Pinterest
    ctc: 'criteo',        // Criteo
  };

  /**
   * Extract URL parameters
   */
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const data = {};

    // UTM parameters
    UTM_PARAMS.forEach(param => {
      const value = params.get(param);
      if (value) {
        data[param] = value;
      }
    });

    // Click IDs
    Object.keys(CLICK_IDS).forEach(clickId => {
      const value = params.get(clickId);
      if (value) {
        data.clickId = clickId;
        data.clickIdValue = value;
        data.platform = CLICK_IDS[clickId];
      }
    });

    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Get referrer information
   */
  function getReferrer() {
    const referrer = document.referrer;
    if (!referrer) return null;

    try {
      const url = new URL(referrer);
      const hostname = url.hostname.replace('www.', '');

      // Skip same-domain referrers
      if (hostname === window.location.hostname.replace('www.', '')) {
        return null;
      }

      return {
        url: referrer,
        domain: hostname,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Load attribution data from localStorage
   */
  function loadAttribution() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Check expiration
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save attribution data to localStorage
   */
  function saveAttribution(data) {
    try {
      const expiresAt = Date.now() + (EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
      const payload = {
        ...data,
        expiresAt,
        updatedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('[Esbilla Attribution] Error saving data:', e);
    }
  }

  /**
   * Update attribution with current URL parameters
   */
  function updateAttribution() {
    const urlParams = getUrlParams();
    const referrer = getReferrer();
    const existing = loadAttribution();

    // If no new attribution data, keep existing
    if (!urlParams && !referrer && existing) {
      return existing;
    }

    // First touch: only save if no existing data
    const firstTouch = existing?.firstTouch || {
      timestamp: Date.now(),
      url: window.location.href,
      ...urlParams,
      referrer,
    };

    // Last touch: always update if new data
    const lastTouch = urlParams || referrer ? {
      timestamp: Date.now(),
      url: window.location.href,
      ...urlParams,
      referrer,
    } : existing?.lastTouch || firstTouch;

    const attribution = {
      firstTouch,
      lastTouch,
    };

    saveAttribution(attribution);
    return attribution;
  }

  /**
   * Get current attribution data
   */
  function getAttribution() {
    return loadAttribution() || updateAttribution();
  }

  /**
   * Clear attribution data
   */
  function clearAttribution() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[Esbilla Attribution] Error clearing data:', e);
    }
  }

  /**
   * Public API
   */
  window.EsbillaAttribution = {
    get: getAttribution,
    update: updateAttribution,
    clear: clearAttribution,
  };

  // Auto-update on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAttribution);
  } else {
    updateAttribution();
  }

  console.log('[Esbilla] Attribution module loaded (EE)');
})();
