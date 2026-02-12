/**
 * Cross-Domain Sync Module (Enterprise Edition)
 *
 * Synchronizes user footprint ID across multiple domains
 * Enables unified consent tracking for multi-domain websites
 *
 * Flow:
 * 1. Domain A: User consents, footprintId stored in localStorage
 * 2. Domain A: Sync footprintId to API
 * 3. User navigates to Domain B
 * 4. Domain B: Checks URL params for footprintId (esbilla_fid)
 * 5. Domain B: If found, stores locally and syncs to API
 * 6. Domain B: If not found, checks API for existing footprintId
 *
 * URL parameter: ?esbilla_fid={footprintId}
 * API endpoint: POST /api/consent/sync
 */

(function() {
  'use strict';

  const FOOTPRINT_KEY = 'esbilla_footprint_id';
  const URL_PARAM = 'esbilla_fid';
  const SYNC_ENDPOINT = '/api/consent/sync';

  let apiUrl = null;
  let siteId = null;
  let syncEnabled = false;

  /**
   * Initialize cross-domain sync
   * @param {Object} config - Configuration object
   * @param {string} config.apiUrl - API base URL
   * @param {string} config.siteId - Site ID
   * @param {boolean} config.enabled - Enable cross-domain sync
   */
  function init(config) {
    apiUrl = config.apiUrl;
    siteId = config.siteId;
    syncEnabled = config.enabled !== false;

    if (!syncEnabled) {
      console.log('[Esbilla CrossDomain] Sync disabled');
      return;
    }

    if (!apiUrl || !siteId) {
      console.error('[Esbilla CrossDomain] Missing apiUrl or siteId');
      return;
    }

    // Check URL parameter first
    checkUrlParameter();

    // Then check API for existing footprint
    syncFromApi();

    console.log('[Esbilla CrossDomain] Initialized');
  }

  /**
   * Get footprint ID from localStorage
   */
  function getLocalFootprintId() {
    try {
      return localStorage.getItem(FOOTPRINT_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Save footprint ID to localStorage
   */
  function saveLocalFootprintId(footprintId) {
    try {
      localStorage.setItem(FOOTPRINT_KEY, footprintId);
      return true;
    } catch (e) {
      console.error('[Esbilla CrossDomain] Error saving footprint:', e);
      return false;
    }
  }

  /**
   * Check URL parameter for footprint ID
   */
  function checkUrlParameter() {
    const params = new URLSearchParams(window.location.search);
    const urlFootprintId = params.get(URL_PARAM);

    if (urlFootprintId) {
      console.log('[Esbilla CrossDomain] Found footprintId in URL:', urlFootprintId);

      const localFootprintId = getLocalFootprintId();

      // If different from local, update local and sync to API
      if (urlFootprintId !== localFootprintId) {
        saveLocalFootprintId(urlFootprintId);
        syncToApi(urlFootprintId);
      }

      // Clean URL (remove parameter)
      cleanUrl();
    }
  }

  /**
   * Remove esbilla_fid parameter from URL without reload
   */
  function cleanUrl() {
    if (!window.history || !window.history.replaceState) return;

    const url = new URL(window.location.href);
    if (url.searchParams.has(URL_PARAM)) {
      url.searchParams.delete(URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  }

  /**
   * Sync footprint ID to API
   * @param {string} footprintId - Footprint ID to sync
   */
  async function syncToApi(footprintId) {
    if (!syncEnabled || !apiUrl || !siteId) return;

    try {
      const response = await fetch(`${apiUrl}${SYNC_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          footprintId,
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      console.log('[Esbilla CrossDomain] Synced to API:', footprintId);
    } catch (error) {
      console.error('[Esbilla CrossDomain] Sync error:', error);
    }
  }

  /**
   * Fetch footprint ID from API based on user hash
   */
  async function syncFromApi() {
    if (!syncEnabled || !apiUrl || !siteId) return;

    const localFootprintId = getLocalFootprintId();
    if (localFootprintId) {
      // Already have local footprint, no need to sync from API
      return;
    }

    try {
      // Get user hash (from cookie or generate)
      const userHash = getUserHash();
      if (!userHash) return;

      const response = await fetch(`${apiUrl}${SYNC_ENDPOINT}?siteId=${siteId}&userHash=${userHash}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No existing footprint for this user
          return;
        }
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.footprintId) {
        console.log('[Esbilla CrossDomain] Fetched footprintId from API:', data.footprintId);
        saveLocalFootprintId(data.footprintId);
      }
    } catch (error) {
      console.error('[Esbilla CrossDomain] Fetch error:', error);
    }
  }

  /**
   * Get or generate user hash (simple client-side fingerprint)
   * In production, this should use a more robust fingerprinting library
   */
  function getUserHash() {
    try {
      // Try to get from cookie first
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'esbilla_user_hash') {
          return value;
        }
      }

      // Generate simple hash based on User-Agent + screen resolution
      const ua = navigator.userAgent;
      const screen = `${window.screen.width}x${window.screen.height}`;
      const raw = `${ua}|${screen}`;

      // Simple hash function (for demo, use crypto.subtle.digest in production)
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      const userHash = Math.abs(hash).toString(36);

      // Store in cookie (30 days)
      document.cookie = `esbilla_user_hash=${userHash}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;

      return userHash;
    } catch (e) {
      console.error('[Esbilla CrossDomain] Error generating user hash:', e);
      return null;
    }
  }

  /**
   * Add footprint ID to outbound links
   * @param {string} targetDomain - Domain to add parameter to (optional, adds to all if not specified)
   */
  function decorateLinks(targetDomain) {
    const footprintId = getLocalFootprintId();
    if (!footprintId) return;

    const links = document.querySelectorAll('a[href^="http"]');

    links.forEach(link => {
      try {
        const url = new URL(link.href);

        // Skip same-domain links
        if (url.hostname === window.location.hostname) return;

        // If targetDomain specified, only decorate matching domains
        if (targetDomain && url.hostname !== targetDomain) return;

        // Add parameter if not already present
        if (!url.searchParams.has(URL_PARAM)) {
          url.searchParams.set(URL_PARAM, footprintId);
          link.href = url.toString();
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });

    console.log('[Esbilla CrossDomain] Decorated links with footprintId');
  }

  /**
   * Public API
   */
  window.EsbillaCrossDomain = {
    init,
    getFootprintId: getLocalFootprintId,
    syncToApi,
    decorateLinks,
  };

  console.log('[Esbilla] Cross-domain module loaded (EE)');
})();
