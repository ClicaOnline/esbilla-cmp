/**
 * ESBILLA CMP - Pegoyu v2.1 (GDPR-Compliant G100)
 * Pegoyu: El pilar que sostiene el Hórreo (sistema de consent management)
 * Arquitectura modular: carga dinámica de integraciones bajo demanda
 * Incluye captura de atribución de marketing (UTM, click IDs)
 * v1.4: Eliminado data-key (seguridad basada en validación de dominio + rate limiting)
 * v1.5: Script Blocking automático - bloquea scripts de terceros hasta consentimiento
 * v1.6: Carga dinámica de scripts desde Dashboard - 3 modos (manual/simplified/gtm)
 * v1.7: Integraciones extendidas (20+ scripts) - Amplitude, Criteo, Google Ads, Microsoft Ads,
 *       Pinterest, Twitter, Taboola, HubSpot, Intercom, Zendesk, Crazy Egg, VWO, Optimizely
 * v1.8: GTM Gateway support - carga GTM desde dominio personalizado (evita ad blockers)
 * v2.0: Arquitectura modular - Pegoyu core ~58% más pequeño, módulos cargados bajo demanda
 * v2.1: G100 opt-in - Solo envía pings anónimos a GA4 si config.enableG100=true (GDPR compliant)
 */
(function() {
  const PEGOYU_VERSION = '2.1.0';
  const script = document.currentScript;
  const cmpId = script.getAttribute('data-id') || 'default';
  const gtmId = script.getAttribute('data-gtm');
  const apiBase = script.getAttribute('data-api') || script.src.replace('/pegoyu.js', '');

  // Estado global
  let config = {};
  let translations = {};
  let manifest = {};
  let currentLang = 'es';
  let templateHtml = '';
  let footprintId = '';

  // ============================================
  // MARKETING ATTRIBUTION - Parámetros de tráfico
  // ============================================
  // Lista de parámetros de marketing a capturar
  const MARKETING_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',      // Google Ads
    'fbclid',     // Facebook/Meta
    'ttclid',     // TikTok
    'msclkid',    // Microsoft/Bing Ads
    'li_fat_id',  // LinkedIn
    'twclid',     // Twitter/X
    'dclid'       // Google Display & Video 360
  ];

  const ATTRIBUTION_TEMP_KEY = 'esbilla_temp_attribution';
  const ATTRIBUTION_PERSISTENT_KEY = 'esbilla_attribution';

  /**
   * Captura los parámetros de marketing de la URL actual
   * Se ejecuta al inicio para no perder datos antes del consentimiento
   * Almacena temporalmente en sessionStorage (volátil)
   */
  function captureTrafficParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const attribution = {};
      let hasParams = false;

      // Extraer parámetros de marketing
      MARKETING_PARAMS.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          attribution[param] = value;
          hasParams = true;
        }
      });

      // Solo guardar si hay parámetros
      if (hasParams) {
        // Añadir metadata de contexto
        attribution._captured_at = new Date().toISOString();
        attribution._landing_page = window.location.href;
        attribution._referrer = document.referrer || null;

        // Guardar en sessionStorage (temporal, se borra al cerrar navegador)
        sessionStorage.setItem(ATTRIBUTION_TEMP_KEY, JSON.stringify(attribution));
        console.log('[Esbilla] Parámetros de atribución capturados:', attribution);
      }
    } catch (e) {
      console.warn('[Esbilla] Error capturando parámetros de tráfico:', e);
    }
  }

  /**
   * Obtiene los datos de atribución disponibles
   * Prioriza localStorage (persistido) sobre sessionStorage (temporal)
   * Siempre incluye el footprintId para cruce de datos
   */
  function getAttributionData() {
    try {
      // Primero intentar localStorage (datos ya consentidos)
      let data = localStorage.getItem(ATTRIBUTION_PERSISTENT_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.footprintId = footprintId;
        return parsed;
      }

      // Fallback a sessionStorage (datos temporales pre-consentimiento)
      data = sessionStorage.getItem(ATTRIBUTION_TEMP_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.footprintId = footprintId;
        return parsed;
      }
    } catch (e) {
      console.warn('[Esbilla] Error leyendo datos de atribución:', e);
    }
    return null;
  }

  /**
   * Maneja los datos de atribución según el consentimiento del usuario
   * @param {boolean} marketingConsented - Si el usuario aceptó marketing
   */
  function handleAttributionConsent(marketingConsented) {
    try {
      if (marketingConsented) {
        // Usuario aceptó marketing: mover datos a localStorage persistente
        const tempData = sessionStorage.getItem(ATTRIBUTION_TEMP_KEY);
        if (tempData) {
          localStorage.setItem(ATTRIBUTION_PERSISTENT_KEY, tempData);
          sessionStorage.removeItem(ATTRIBUTION_TEMP_KEY);
          console.log('[Esbilla] Atribución persistida en localStorage');
        }

        // Notificar al dataLayer que la atribución está lista
        pushAttributionToDataLayer();
      } else {
        // Usuario rechazó marketing: eliminar todos los datos de atribución
        sessionStorage.removeItem(ATTRIBUTION_TEMP_KEY);
        localStorage.removeItem(ATTRIBUTION_PERSISTENT_KEY);
        console.log('[Esbilla] Datos de atribución eliminados (marketing rechazado)');
      }
    } catch (e) {
      console.warn('[Esbilla] Error manejando consentimiento de atribución:', e);
    }
  }

  /**
   * Envía los datos de atribución al dataLayer de GTM
   * Solo se ejecuta cuando hay consentimiento de marketing
   */
  function pushAttributionToDataLayer() {
    const attribution = getAttributionData();
    if (!attribution) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'esbilla_attribution_ready',
      esbilla_attribution: {
        ...attribution,
        footprintId: footprintId,
        siteId: cmpId,
        timestamp: new Date().toISOString()
      }
    });
    console.log('[Esbilla] Atribución enviada al dataLayer');
  }

  // ============================================
  // CROSS-DOMAIN STORAGE - Cookies y localStorage
  // ============================================

  // Obtiene el dominio padre para cookies cross-subdomain
  // Ej: "app.empresa.com" -> ".empresa.com"
  function getParentDomain() {
    const hostname = window.location.hostname;
    // Si es localhost o IP, no usar dominio padre
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }
    const parts = hostname.split('.');
    // Si tiene más de 2 partes (ej: app.empresa.com), usar .empresa.com
    if (parts.length > 2) {
      return '.' + parts.slice(-2).join('.');
    }
    // Si son 2 partes (ej: empresa.com), usar .empresa.com
    if (parts.length === 2) {
      return '.' + hostname;
    }
    return null;
  }

  // Guarda un valor en cookie con dominio padre (cross-subdomain)
  function setCrossDomainCookie(name, value, days = 365) {
    const domain = getParentDomain();
    const expires = new Date();
    expires.setDate(expires.getDate() + days);

    let cookieStr = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    if (domain) {
      cookieStr += `;domain=${domain}`;
    }
    document.cookie = cookieStr;
  }

  // Lee un valor de cookie
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  // Guarda en localStorage Y en cookie cross-domain
  function setStorageItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Esbilla] localStorage non disponible:', e);
    }
    setCrossDomainCookie(key, value);
  }

  // Lee de cookie primero (cross-domain), fallback a localStorage
  function getStorageItem(key) {
    // Prioridad: cookie (cross-domain) > localStorage
    const cookieVal = getCookie(key);
    if (cookieVal) {
      // Sincronizar localStorage si difiere
      try {
        const localVal = localStorage.getItem(key);
        if (localVal !== cookieVal) {
          localStorage.setItem(key, cookieVal);
        }
      } catch (e) { /* ignorar */ }
      return cookieVal;
    }
    // Fallback a localStorage
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // SINCRONIZACIÓN CON SERVIDOR (CROSS-DOMAIN)
  // ============================================
  // Sincroniza el footprint y consentimiento con el servidor
  // para soportar cross-domain cuando hay múltiples dominios en el mismo tenant
  async function syncWithServer() {
    try {
      const localFootprint = getStorageItem('esbilla_footprint');

      const response = await fetch(`${apiBase}/api/consent/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: cmpId,
          footprintId: localFootprint,
          domain: window.location.hostname
        })
      });

      if (!response.ok) {
        return null;
      }

      const syncData = await response.json();

      // Guardar info del tenant para uso posterior
      if (syncData.tenantId) {
        config.tenantId = syncData.tenantId;
      }
      if (syncData.crossDomains) {
        config.crossDomains = syncData.crossDomains;
      }

      return syncData;
    } catch (err) {
      console.warn('[Esbilla] Error sincronizando con servidor:', err);
      return null;
    }
  }

  // ============================================
  // FOOTPRINT ID - Identificador único de usuario
  // ============================================
  function getFootprintId() {
    // Intentar recuperar el ID existente (cookie cross-domain o localStorage)
    let id = getStorageItem('esbilla_footprint');

    if (!id) {
      // Generar nuevo UUID y formatear como ESB-XXXXXXXX
      const uuid = crypto.randomUUID();
      id = 'ESB-' + uuid.split('-')[0].toUpperCase();
      setStorageItem('esbilla_footprint', id);
    } else {
      // Asegurar que está en ambos storages
      setStorageItem('esbilla_footprint', id);
    }

    return id;
  }

  // Nomes de los idiomes (fallback, sobrescríbese col manifest)
  const defaultLangNames = {
    ast: 'Asturianu', es: 'Español', en: 'English',
    fr: 'Français', pt: 'Português', de: 'Deutsch',
    it: 'Italiano', ca: 'Català', eu: 'Euskara', gl: 'Galego'
  };

  // ============================================
  // 1. CONSENT MODE V2 (Deny by default)
  // ============================================
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { dataLayer.push(arguments); };

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });

  // ============================================
  // 1.5 SCRIPT BLOCKING - GDPR Compliance
  // ============================================
  /**
   * Sistema de bloqueo de scripts de terceros antes del consentimiento
   * Los scripts deben usar: <script type="text/plain" data-consent-category="analytics|marketing">
   *
   * Ejemplo:
   * <script type="text/plain" data-consent-category="analytics">
   *   // Google Analytics code
   * </script>
   */
  const blockedScripts = new Set();
  const mutationObserver = typeof MutationObserver !== 'undefined' ? new MutationObserver(handleDOMChanges) : null;

  /**
   * Inicia el bloqueo de scripts y observa nuevos scripts añadidos dinámicamente
   */
  function initScriptBlocking() {
    // Bloquear scripts existentes
    blockExistingScripts();

    // Observar scripts añadidos dinámicamente
    if (mutationObserver) {
      mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    console.log('[Esbilla] Script blocking activo - scripts bloqueados hasta consentimiento');
  }

  /**
   * Bloquea todos los scripts existentes que requieren consentimiento
   */
  function blockExistingScripts() {
    const scripts = document.querySelectorAll('script[data-consent-category]');
    scripts.forEach(script => {
      const category = script.getAttribute('data-consent-category');
      const type = script.getAttribute('type');

      // Solo bloquear si no está ya bloqueado (type="text/plain")
      if (type !== 'text/plain') {
        console.warn(`[Esbilla] Script (${category}) requiere type="text/plain" para bloqueo correcto:`, script);
      }

      blockedScripts.add(script);
    });

    console.log(`[Esbilla] ${blockedScripts.size} scripts bloqueados`);
  }

  /**
   * Maneja cambios en el DOM para bloquear scripts añadidos dinámicamente
   */
  function handleDOMChanges(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'SCRIPT' && node.hasAttribute('data-consent-category')) {
          const type = node.getAttribute('type');
          const category = node.getAttribute('data-consent-category');

          // Si el script no está bloqueado (type no es text/plain), bloquearlo
          if (type !== 'text/plain') {
            node.setAttribute('type', 'text/plain');
            console.log(`[Esbilla] Script bloqueado automáticamente (${category}):`, node);
          }

          blockedScripts.add(node);
        }
      });
    });
  }

  /**
   * Desbloquea y ejecuta scripts basado en las categorías consentidas
   * @param {Object} choices - { analytics: boolean, marketing: boolean }
   */
  function unblockScripts(choices) {
    if (blockedScripts.size === 0) {
      console.log('[Esbilla] No hay scripts bloqueados para desbloquear');
      return;
    }

    let unblockedCount = 0;
    const categoriesToUnblock = [];

    if (choices.analytics) categoriesToUnblock.push('analytics');
    if (choices.marketing) categoriesToUnblock.push('marketing');
    if (choices.analytics || choices.marketing) categoriesToUnblock.push('functional'); // Functional siempre con cualquier consentimiento

    console.log('[Esbilla] Desbloqueando categorías:', categoriesToUnblock);

    blockedScripts.forEach(script => {
      const category = script.getAttribute('data-consent-category');

      if (categoriesToUnblock.includes(category)) {
        // Desbloquear script
        const newScript = document.createElement('script');

        // Copiar atributos
        Array.from(script.attributes).forEach(attr => {
          if (attr.name !== 'type' && attr.name !== 'data-consent-category') {
            newScript.setAttribute(attr.name, attr.value);
          }
        });

        // Copiar contenido o src
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }

        // Marcar como desbloqueado
        newScript.setAttribute('data-consent-unblocked', 'true');

        // Reemplazar script
        script.parentNode?.replaceChild(newScript, script);
        blockedScripts.delete(script);
        unblockedCount++;

        console.log(`[Esbilla] Script desbloqueado (${category}):`, newScript.src || 'inline');
      }
    });

    console.log(`[Esbilla] ${unblockedCount} scripts desbloqueados de ${unblockedCount + blockedScripts.size}`);
  }

  /**
   * Limpia el observer cuando ya no es necesario
   */
  function stopScriptBlocking() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
  }

  // ============================================
  // 1.6 DYNAMIC SCRIPT LOADING - Modo Simplified
  // ============================================
  /**
   * SDK v1.7: Carga dinámica de scripts desde configuración del Dashboard
   * Actúa como un GTM simplificado para cumplimiento GDPR automático
   */

  let implementationMode = 'manual'; // 'manual' | 'simplified' | 'gtm'
  let scriptConfig = null;

  /**
   * Detecta el modo de implementación basado en:
   * - Presencia de data-gtm-mode en script tag
   * - Configuración scriptConfig desde Dashboard
   * - Scripts con data-consent-category en HTML
   */
  function detectImplementationMode() {
    const gtmMode = script.getAttribute('data-gtm-mode');

    if (gtmMode === 'true') {
      implementationMode = 'gtm';
      console.log('[Esbilla v2.0] Modo: GTM Integration');
      return;
    }

    // Si hay scriptConfig desde el Dashboard, usar modo simplified
    if (config.scriptConfig && Object.keys(config.scriptConfig).length > 0) {
      implementationMode = 'simplified';
      scriptConfig = config.scriptConfig;
      console.log('[Esbilla v2.0] Modo: Simplified (carga dinámica modular desde Dashboard)');
      return;
    }

    // Modo manual por defecto
    implementationMode = 'manual';
    console.log('[Esbilla v2.0] Modo: Manual (scripts con data-consent-category)');
  }

  // ============================================
  // MODULE LOADER - Arquitectura Modular v2.0
  // ============================================
  /**
   * Sistema modular: carga scripts bajo demanda desde /modules/
   * Beneficios:
   * - Pegoyu core ~58% más pequeño (~25KB vs ~70KB)
   * - Mejor caching (módulos independientes)
   * - Mantenimiento simplificado
   * - Carga solo lo necesario
   */

  // Cache de módulos cargados en memoria
  window.EsbillaModules = window.EsbillaModules || {};
  const moduleCache = new Set(); // Tracking de módulos ya cargados

  /**
   * Mapeo de nombres de módulos a categorías y archivos
   * Basado en sdk-modules.json pero inline para performance
   */
  const moduleMap = {
    // Analytics
    googleAnalytics: { category: 'analytics', file: 'google-analytics.js' },
    hotjar: { category: 'analytics', file: 'hotjar.js' },
    microsoftClarity: { category: 'analytics', file: 'microsoft-clarity.js' },
    amplitude: { category: 'analytics', file: 'amplitude.js' },
    crazyEgg: { category: 'analytics', file: 'crazyegg.js' },
    vwo: { category: 'analytics', file: 'vwo.js' },
    optimizely: { category: 'analytics', file: 'optimizely.js' },

    // Marketing
    facebookPixel: { category: 'marketing', file: 'facebook-pixel.js' },
    linkedinInsight: { category: 'marketing', file: 'linkedin-insight.js' },
    tiktokPixel: { category: 'marketing', file: 'tiktok-pixel.js' },
    googleAds: { category: 'marketing', file: 'google-ads.js' },
    microsoftAds: { category: 'marketing', file: 'microsoft-ads.js' },
    criteo: { category: 'marketing', file: 'criteo.js' },
    pinterest: { category: 'marketing', file: 'pinterest.js' },
    twitterPixel: { category: 'marketing', file: 'twitter-pixel.js' },
    taboola: { category: 'marketing', file: 'taboola.js' },
    hubspot: { category: 'marketing', file: 'hubspot.js' },

    // Functional
    intercom: { category: 'functional', file: 'intercom.js' },
    zendesk: { category: 'functional', file: 'zendesk.js' }
  };

  /**
   * Carga un módulo de forma dinámica
   * @param {string} moduleName - Nombre del módulo (ej: 'googleAnalytics')
   * @returns {Promise<Function|null>} - Función del módulo o null si falla
   */
  async function loadModule(moduleName) {
    // Verificar si ya está cargado en window.EsbillaModules
    if (window.EsbillaModules[moduleName]) {
      return window.EsbillaModules[moduleName];
    }

    // Verificar si ya se intentó cargar (evitar reintentos fallidos)
    if (moduleCache.has(moduleName)) {
      return window.EsbillaModules[moduleName] || null;
    }

    const moduleInfo = moduleMap[moduleName];
    if (!moduleInfo) {
      console.warn(`[Esbilla] Módulo no encontrado: ${moduleName}`);
      return null;
    }

    try {
      const moduleUrl = `${apiBase}/modules/${moduleInfo.category}/${moduleInfo.file}`;

      // Cargar script de forma dinámica
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = moduleUrl;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load module: ${moduleName}`));
        document.head.appendChild(script);
      });

      // Marcar como cargado
      moduleCache.add(moduleName);

      // Verificar que el módulo se registró correctamente
      if (window.EsbillaModules[moduleName]) {
        console.log(`[Esbilla v2.0] ✓ Módulo cargado: ${moduleName}`);
        return window.EsbillaModules[moduleName];
      } else {
        console.warn(`[Esbilla] Módulo cargado pero no registrado: ${moduleName}`);
        return null;
      }
    } catch (err) {
      console.error(`[Esbilla] Error cargando módulo ${moduleName}:`, err);
      moduleCache.add(moduleName); // Marcar como intentado para no reintentar
      return null;
    }
  }

  // scriptTemplates removido - ahora usa arquitectura modular con loadModule()

  /**
   * Inyecta un script en el DOM
   * @param {string} scriptHTML - HTML del script a inyectar
   * @param {string} category - Categoría del script (analytics/marketing)
   */
  function injectScript(scriptHTML, category) {
    const container = document.createElement('div');
    container.innerHTML = scriptHTML.trim();
    container.setAttribute('data-esbilla-injected', category);

    // Inyectar todos los elementos (scripts, noscript, etc.)
    while (container.firstChild) {
      const element = container.firstChild;

      if (element.tagName === 'SCRIPT') {
        // Crear nuevo script para asegurar ejecución
        const newScript = document.createElement('script');

        // Copiar atributos
        Array.from(element.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copiar contenido o src
        if (element.src) {
          newScript.src = element.src;
        } else {
          newScript.textContent = element.textContent;
        }

        newScript.setAttribute('data-esbilla-dynamic', category);
        document.head.appendChild(newScript);
      } else {
        // Inyectar noscript u otros elementos
        document.head.appendChild(element);
      }

      container.removeChild(element);
    }
  }

  /**
   * Carga scripts dinámicamente basados en configuración y consentimiento
   * v2.0: Arquitectura modular - carga módulos bajo demanda
   * @param {Object} choices - { analytics: boolean, marketing: boolean }
   */
  async function loadDynamicScripts(choices) {
    if (implementationMode !== 'simplified' || !scriptConfig) {
      return;
    }

    console.log('[Esbilla v2.0] Cargando scripts dinámicos (arquitectura modular)...', choices);

    const loadPromises = [];

    // ============================================
    // ANALYTICS / ESTADÍSTICA
    // ============================================
    if (scriptConfig.analytics) {
      const analytics = scriptConfig.analytics;

      // Cargar cada módulo de analytics configurado
      Object.keys(analytics).forEach(async (moduleName) => {
        const configValue = analytics[moduleName];
        if (configValue) {
          // G100 (opcional): Google Analytics se carga sin consentimiento solo si config.enableG100 === true
          // SealMetrics: Se carga SIEMPRE (cookieless, sin consentimiento requerido)
          // Otros analytics solo con consentimiento
          const isGA4 = moduleName === 'googleAnalytics';
          const isSealMetrics = moduleName === 'sealmetrics';
          const enableG100 = config.enableG100 === true; // Opt-in para G100
          const shouldLoadWithoutConsent = isSealMetrics || (isGA4 && enableG100);
          const shouldLoad = shouldLoadWithoutConsent || choices.analytics;

          if (shouldLoad) {
            const promise = loadModule(moduleName).then(moduleFunc => {
              if (moduleFunc) {
                const scriptHTML = moduleFunc(configValue);
                injectScript(scriptHTML, 'analytics');
                if (isGA4 && !choices.analytics && enableG100) {
                  console.log('[Esbilla v2.0] ✓ GA4 cargado para G100 (pings anónimos - opt-in activado)');
                }
                if (isSealMetrics) {
                  console.log('[Esbilla v2.0] ✓ SealMetrics cargado (cookieless, sin consentimiento)');
                }
              }
            });
            loadPromises.push(promise);
          }
        }
      });
    }

    // ============================================
    // MARKETING / PUBLICIDAD
    // ============================================
    if (choices.marketing && scriptConfig.marketing) {
      const marketing = scriptConfig.marketing;

      // Cargar cada módulo de marketing configurado
      Object.keys(marketing).forEach(async (moduleName) => {
        const configValue = marketing[moduleName];
        if (configValue) {
          const promise = loadModule(moduleName).then(moduleFunc => {
            if (moduleFunc) {
              const scriptHTML = moduleFunc(configValue);
              injectScript(scriptHTML, 'marketing');
            }
          });
          loadPromises.push(promise);
        }
      });
    }

    // ============================================
    // FUNCIONAL (Chats, Soporte)
    // ============================================
    if (choices.functional && scriptConfig.functional) {
      const functional = scriptConfig.functional;

      // Cargar cada módulo funcional configurado
      Object.keys(functional).forEach(async (moduleName) => {
        const configValue = functional[moduleName];
        if (configValue) {
          const promise = loadModule(moduleName).then(moduleFunc => {
            if (moduleFunc) {
              const scriptHTML = moduleFunc(configValue);
              injectScript(scriptHTML, 'functional');
            }
          });
          loadPromises.push(promise);
        }
      });
    }

    // Esperar a que todos los módulos se carguen
    try {
      await Promise.all(loadPromises);
      console.log('[Esbilla v2.0] ✓ Carga modular completada');
    } catch (err) {
      console.error('[Esbilla v2.0] Error en carga modular:', err);
    }
  }

  // ============================================
  // 2. CARGAR GTM (moved to init() to support Gateway)
  // ============================================
  // GTM is now loaded after config is fetched to support Gateway Domain

  /**
   * Carga Google Tag Manager con soporte para Gateway Proxy Multi-Tenant (v1.8+)
   * Si config.scriptConfig.gtm.gatewayEnabled está activo y gtmGatewayDomain configurado,
   * carga el script desde el dominio personalizado del cliente (gtm.cliente.com) que apunta a Esbilla API.
   * Esto ayuda a evitar ad blockers (dominio propio) y mejora performance (cache + compresión).
   *
   * ARQUITECTURA MULTI-TENANT DNS-BASED PROXY (v1.8+):
   * - Cliente configura DNS: gtm.cliente.com → Esbilla API (Cloud Run + Load Balancer + CDN)
   * - Cliente carga: <script src="https://gtm.cliente.com/gtm.js"></script>
   * - Flujo: Cliente → gtm.cliente.com → Esbilla API → Google GTM → Cache → Compresión → Cliente
   * - Escalabilidad: Cloud CDN global + Load Balancer multi-región UE + Cloud Run auto-scaling
   * - Incluye: cache (TTL 5min), compresión Brotli/Gzip (75%), geolocalización, rate limiting
   *
   * Configuración Dashboard:
   * - gtmGatewayEnabled: true/false
   * - gtmGatewayDomain: "gtm.cliente.com" (obligatorio para evitar ad blockers)
   * - gtmContainerId: "GTM-XXXXX" o "G-XXXXX"
   */
  function loadGTM() {
    // Determinar Container ID: config > data-gtm attribute
    const containerId = config?.scriptConfig?.gtm?.containerId || gtmId;
    if (!containerId) return;

    // Verificar si GTM Gateway está habilitado en Dashboard
    const gtmGatewayEnabled = config?.scriptConfig?.gtm?.gatewayEnabled || false;

    // Determinar origen del script
    let scriptOrigin;
    if (gtmGatewayEnabled) {
      // MODO PROXY DNS-BASED: Usar dominio personalizado del cliente (configurado en Dashboard)
      const customDomain = config?.scriptConfig?.gtm?.gatewayDomain;

      if (customDomain) {
        // Cliente configuró DNS (gtm.cliente.com → Esbilla API)
        scriptOrigin = `https://${customDomain}`;
        console.log('[Esbilla] Loading GTM via custom gateway domain:', customDomain);
      } else {
        // Fallback: usar apiBase (menos efectivo contra ad blockers)
        scriptOrigin = apiBase;
        console.warn('[Esbilla] GTM Gateway enabled but no custom domain configured. Using API base as fallback. Configure gtmGatewayDomain in Dashboard for better ad-blocker evasion.');
      }
    } else {
      // MODO DIRECTO: cargar directamente desde Google (sin proxy)
      scriptOrigin = 'https://www.googletagmanager.com';
    }

    console.log('[Esbilla] Loading GTM:', {
      containerId,
      origin: scriptOrigin,
      usingGatewayProxy: gtmGatewayEnabled,
      customDomain: gtmGatewayEnabled ? (config?.scriptConfig?.gtm?.gatewayDomain || 'apiBase fallback') : 'N/A',
      mode: gtmGatewayEnabled ? 'Esbilla Proxy (DNS-based multi-tenant)' : 'Direct Google'
    });

    // Cargar GTM con el origen determinado
    (function(w,d,s,l,i,origin){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),
      dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src=origin+'/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',containerId,scriptOrigin);
  }

  // ============================================
  // 3. INICIALIZACIÓN MODULAR
  // ============================================
  async function init() {
    try {
      // A0. BLOQUEO DE SCRIPTS: Iniciar antes de cargar cualquier configuración
      // Esto asegura que ningún script de terceros se ejecute sin consentimiento
      initScriptBlocking();

      // A0.5. CAPTURA PREVENTIVA: Capturar parámetros de marketing ANTES de cualquier otra cosa
      // Esto asegura que no se pierdan los UTMs aunque el usuario tarde en dar consentimiento
      captureTrafficParams();

      // A. Cargar manifest de opciones disponibles
      const manifestRes = await fetch(`${apiBase}/config/manifest.json`);
      manifest = await manifestRes.json();

      // B. Cargar configuración del sitio
      const configRes = await fetch(`${apiBase}/api/config/${cmpId}`);
      config = await configRes.json();

      // B0.25. Merge con configuración inline (window.esbillaConfig)
      // Útil para plugins (WordPress, etc.) que necesitan pasar opciones sin modificar Firestore
      if (typeof window.esbillaConfig === 'object' && window.esbillaConfig !== null) {
        config = Object.assign({}, config, window.esbillaConfig);
        console.log('[Esbilla v2.1] ✓ Configuración inline aplicada:', window.esbillaConfig);
      }

      // B0.5. Cargar GTM con soporte para Gateway (v1.8)
      // Se carga después de obtener config para acceder a scriptConfig.gtm
      loadGTM();

      // B1. Detectar modo de implementación (v1.7)
      detectImplementationMode();

      // B2. Aplicar configuración de banner del dashboard
      applyBannerSettings();

      // C. Cargar traducciones
      const i18nRes = await fetch(`${apiBase}/i18n/config.json`);
      translations = await i18nRes.json();

      // D. Detectar idioma
      detectLanguage();

      // D2. Obtener/Generar footprintId
      footprintId = getFootprintId();

      // D3. Sincronizar con API (cross-domain)
      // Busca si hay consentimiento previo de otros dominios del mismo tenant
      const syncResult = await syncWithServer();

      // E. Cargar estilos (CSS externos)
      await loadStyles();

      // F. Cargar plantilla HTML
      await loadTemplate();

      // G. Aplicar variables CSS personalizadas
      applyCustomColors();

      // H. Renderizar o mostrar mosca
      // Prioridad: syncResult > localStorage/cookie
      let savedConsent = getStorageItem('esbilla_consent');

      // Si la sincronización trajo un consentimiento más reciente de otro dominio, usarlo
      if (syncResult?.lastConsent && !savedConsent) {
        savedConsent = JSON.stringify(syncResult.lastConsent.choices);
        setStorageItem('esbilla_consent', savedConsent);
        // También sincronizar el idioma si viene del servidor
        if (syncResult.lastConsent.language) {
          setStorageItem('esbilla_lang', syncResult.lastConsent.language);
          currentLang = syncResult.lastConsent.language;
        }
      }

      if (savedConsent) {
        const oldConsent = JSON.parse(savedConsent);
        updateConsentMode(oldConsent); // Esto también desbloquea scripts vía unblockScripts()

        // ATRIBUCIÓN: Si ya tiene consentimiento de marketing, procesar nuevos UTMs
        if (oldConsent.marketing) {
          // Mover cualquier dato temporal nuevo a persistente
          handleAttributionConsent(true);
        }

        showPanoya();
      } else {
        renderBanner();
      }
    } catch (err) {
      console.error('[Esbilla] Error na inicialización:', err);
      // Fallback: cargar estilos inline si falla
      injectFallbackStyles();
    }
  }

  function detectLanguage() {
    // 1. Preferencia guardada (cross-domain)
    const savedLang = getStorageItem('esbilla_lang');
    if (savedLang && translations[savedLang]) {
      currentLang = savedLang;
      return;
    }

    // 2. Idioma del navegador
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      currentLang = browserLang;
      return;
    }

    // 3. Idioma por defecto de la config
    currentLang = config.defaultLanguage || 'es';
  }

  // ============================================
  // APLICAR CONFIGURACIÓN DEL BANNER (DASHBOARD)
  // ============================================
  // Aplica la configuración personalizada del banner guardada en Firestore
  // desde el dashboard de administración.
  function applyBannerSettings() {
    const bannerSettings = config.settings?.banner;
    if (!bannerSettings) return;

    // Aplicar layout
    if (bannerSettings.layout) {
      config.layout = bannerSettings.layout;
    }

    // Aplicar colores (merge con existentes)
    if (bannerSettings.colors) {
      config.colors = {
        ...config.colors,
        primary: bannerSettings.colors.primary,
        secondary: bannerSettings.colors.secondary,
        background: bannerSettings.colors.background,
        text: bannerSettings.colors.text
      };
    }

    // Aplicar tipografía
    if (bannerSettings.font && bannerSettings.font !== 'system') {
      const fontMap = {
        'inter': '"Inter", sans-serif',
        'roboto': '"Roboto", sans-serif',
        'opensans': '"Open Sans", sans-serif',
        'lato': '"Lato", sans-serif',
        'montserrat': '"Montserrat", sans-serif'
      };
      config.typography = {
        ...config.typography,
        fontFamily: fontMap[bannerSettings.font] || null
      };
    }

    // Aplicar estilo de botones
    if (bannerSettings.buttonStyle) {
      config.buttonStyle = bannerSettings.buttonStyle;
    }

    // Aplicar etiquetas personalizadas
    if (bannerSettings.labels) {
      config.labels = bannerSettings.labels;
    }

    // Aplicar aviso legal
    if (bannerSettings.legal) {
      config.legal = bannerSettings.legal;
    }

    // Aplicar CSS personalizado
    if (bannerSettings.customCSS) {
      injectCustomCSS(bannerSettings.customCSS);
    }
  }

  /**
   * Inyecta CSS personalizado en el documento
   * @param {string} css - Código CSS personalizado
   */
  function injectCustomCSS(css) {
    if (!css || typeof css !== 'string') return;

    // Eliminar cualquier <style> personalizado anterior
    const existingStyle = document.getElementById('esbilla-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Crear nuevo elemento <style>
    const styleElement = document.createElement('style');
    styleElement.id = 'esbilla-custom-css';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    console.log('[Esbilla] CSS personalizado cargado');
  }

  // ============================================
  // 4. CARGA DE ESTILOS EXTERNOS
  // ============================================
  async function loadStyles() {
    const layout = config.layout || 'modal';
    const theme = config.theme || 'default';

    // Obtener lista de CSS del manifest
    const layoutConfig = manifest.layouts?.[layout] || manifest.layouts?.modal;
    const themeConfig = manifest.themes?.[theme] || {};

    const cssFiles = [
      ...(layoutConfig?.styles || ['base.css']),
      ...(themeConfig?.styles || [])
    ];

    // Cargar cada CSS
    for (const cssFile of cssFiles) {
      await loadCSS(`${apiBase}/styles/${cssFile}`);
    }
  }

  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      // Evitar duplicados
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = () => {
        console.warn(`[Esbilla] Non se pudo cargar: ${href}`);
        resolve(); // Continuar aunque falle
      };
      document.head.appendChild(link);
    });
  }

  // ============================================
  // 5. APLICAR COLORES PERSONALIZADOS
  // ============================================
  function applyCustomColors() {
    const root = document.documentElement;

    // Aplicar colores si existen
    if (config.colors) {
      const colors = config.colors;
      if (colors.primary) root.style.setProperty('--esbilla-primary', colors.primary);
      if (colors.primaryHover) root.style.setProperty('--esbilla-primary-hover', colors.primaryHover);
      if (colors.secondary) root.style.setProperty('--esbilla-secondary', colors.secondary);
      if (colors.background) root.style.setProperty('--esbilla-background', colors.background);
      if (colors.backgroundEnd) root.style.setProperty('--esbilla-background-end', colors.backgroundEnd);
      if (colors.text) root.style.setProperty('--esbilla-text', colors.text);
      if (colors.textMuted) root.style.setProperty('--esbilla-text-muted', colors.textMuted);
      if (colors.border) root.style.setProperty('--esbilla-border', colors.border);
      if (colors.overlay) root.style.setProperty('--esbilla-overlay', colors.overlay);
    }

    // Dimensiones personalizadas
    if (config.dimensions) {
      const dim = config.dimensions;
      if (dim.maxWidth) root.style.setProperty('--esbilla-max-width', dim.maxWidth);
      if (dim.padding) root.style.setProperty('--esbilla-padding', dim.padding);
      if (dim.borderRadius) root.style.setProperty('--esbilla-border-radius', dim.borderRadius);
      if (dim.borderWidth) root.style.setProperty('--esbilla-border-width', dim.borderWidth);
    }

    // Tipografía personalizada
    if (config.typography) {
      const typo = config.typography;
      if (typo.fontFamily) root.style.setProperty('--esbilla-font-family', typo.fontFamily);
      if (typo.titleSize) root.style.setProperty('--esbilla-font-size-title', typo.titleSize);
      if (typo.textSize) root.style.setProperty('--esbilla-font-size-text', typo.textSize);
    }

    // Posición de la panoya
    if (config.panoya?.position) {
      const pos = manifest.panoyaPositions?.[config.panoya.position];
      if (pos?.css) {
        Object.entries(pos.css).forEach(([prop, val]) => {
          root.style.setProperty(`--esbilla-panoya-${prop}`, val);
        });
      }
    }
  }

  // ============================================
  // 6. CARGA DE PLANTILLA HTML
  // ============================================
  async function loadTemplate() {
    const layout = config.layout || 'modal';
    const layoutConfig = manifest.layouts?.[layout] || manifest.layouts?.modal;
    const templateFile = layoutConfig?.template || 'modal.html';

    try {
      const res = await fetch(`${apiBase}/templates/${templateFile}`);
      templateHtml = await res.text();
    } catch (err) {
      console.warn('[Esbilla] Error cargando plantilla:', err);
      templateHtml = getFallbackTemplate();
    }
  }

  /**
   * Genera texto legal automáticamente desde campos estructurados (GDPR Art. 13)
   * @param {Object} legal - Objeto LegalInfo con campos estructurados
   * @param {Object} t - Traducciones actuales
   * @returns {string} Texto legal formateado
   */
  function generateLegalText(legal, t) {
    const parts = [];

    // 1. Responsable del Tratamiento (Art. 13.1.a)
    if (legal.companyName) {
      parts.push(`<strong>${t.dataController || 'Responsable del tratamiento'}:</strong> ${legal.companyName}` +
        (legal.taxId ? ` (${legal.taxId})` : ''));
      if (legal.address) parts.push(`<br>${legal.address}`);
      if (legal.contactEmail) parts.push(`<br>Email: ${legal.contactEmail}`);
    }

    // 2. DPO (Art. 13.1.b) - si aplica
    if (legal.dpoName || legal.dpoEmail) {
      parts.push('<br><br><strong>' + (t.dpo || 'Delegado de Protección de Datos') + ':</strong>');
      if (legal.dpoName) parts.push(`<br>${legal.dpoName}`);
      if (legal.dpoEmail) parts.push(`<br>Email: ${legal.dpoEmail}`);
    }

    // 3. Finalidades y base legal (texto genérico)
    parts.push(`<br><br><strong>${t.purpose || 'Finalidad'}:</strong> Personalización de contenido, analítica web, publicidad comportamental.`);
    parts.push(`<br><strong>${t.legalBasis || 'Base legal'}:</strong> Consentimiento (Art. 6.1.a GDPR).`);

    // 4. Plazo de conservación (Art. 13.2.a)
    if (legal.consentRetentionDays) {
      const days = legal.consentRetentionDays;
      const years = Math.floor(days / 365);
      parts.push(`<br><strong>${t.retention || 'Plazo de conservación'}:</strong> ${days} días (${years} años).`);
    }

    // 5. Derechos del interesado (Art. 13.2.b)
    parts.push(`<br><br><strong>${t.rights || 'Tus derechos'}:</strong> Acceso, rectificación, supresión, limitación, portabilidad y oposición.` +
      (legal.contactEmail ? ` Contacta en ${legal.contactEmail}` : ''));

    // 6. Derecho a reclamar ante autoridad (Art. 13.2.d)
    if (legal.supervisoryAuthority) {
      parts.push(`<br><strong>${t.complaint || 'Reclamaciones'}:</strong> ${legal.supervisoryAuthority}` +
        (legal.supervisoryAuthorityUrl ? ` (<a href="${legal.supervisoryAuthorityUrl}" target="_blank" rel="noopener">${legal.supervisoryAuthorityUrl}</a>)` : ''));
    }

    // 7. Cross-domain (si aplica)
    if (legal.crossDomainEnabled && legal.relatedDomains && legal.relatedDomains.length > 0) {
      parts.push(`<br><br><strong>${t.crossDomain || 'Consentimiento compartido'}:</strong> Tu consentimiento se comparte entre los siguientes dominios: ${legal.relatedDomains.join(', ')}`);
    }

    // 8. Enlaces externos
    if (legal.privacyPolicyUrl || legal.cookiePolicyUrl) {
      parts.push('<br><br><strong>' + (t.moreInfo || 'Más información') + ':</strong>');
      if (legal.privacyPolicyUrl) parts.push(`<br>• <a href="${legal.privacyPolicyUrl}" target="_blank" rel="noopener">${t.privacyPolicy || 'Política de Privacidad'}</a>`);
      if (legal.cookiePolicyUrl) parts.push(`<br>• <a href="${legal.cookiePolicyUrl}" target="_blank" rel="noopener">${t.cookiePolicy || 'Política de Cookies'}</a>`);
    }

    return parts.join('');
  }

  /**
   * Genera el SVG de la Panoya personalizada según configuración
   * Soporta 3 variantes: realista, minimalista, geometrica
   * @returns {string} HTML del SVG con colores personalizados
   */
  function generatePanoyaSvg() {
    const variant = config.panoyaVariant || 'realista';
    const colors = config.panoyaColors || {
      primary: '#FFBF00',
      secondary: '#C2A561',
      accent: '#2F6E8D'
    };

    // Debug: mostrar configuración de Panoya
    console.log('[Esbilla] Generando Panoya:', { variant, colors });

    // Asegurar que los colores existen con valores por defecto
    const primary = colors.primary || '#FFBF00';
    const secondary = colors.secondary || '#C2A561';
    const accent = colors.accent || '#2F6E8D';

    let svg = '';

    if (variant === 'realista') {
      svg = `
        <svg viewBox="0 0 1024 1024" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
          <path d="M512 900C300 900 200 700 200 400s150-300 312-350c162 50 312 50 312 350s-100 500-312 500z" fill="${accent}" opacity="0.8"/>
          <path d="M512 800c-80 0-120-100-120-300s40-400 120-400 120 200 120 400-40-300-120-300z" fill="${primary}"/>
          <circle cx="512" cy="400" r="15" fill="${secondary}"/>
          <circle cx="480" cy="450" r="15" fill="${secondary}"/>
          <circle cx="544" cy="450" r="15" fill="${secondary}"/>
        </svg>
      `;
    } else if (variant === 'minimalista') {
      svg = `
        <svg viewBox="0 0 128 128" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
          <path d="M64 120c-30 0-50-40-50-80S34 10 64 10s50 30 50 30-20 80-50 80z" fill="${accent}"/>
          <ellipse cx="64" cy="60" rx="25" ry="45" fill="${primary}"/>
        </svg>
      `;
    } else if (variant === 'geometrica') {
      svg = `
        <svg viewBox="0 0 128 128" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
          <path d="M64 15 L84 45 L64 75 L44 45 Z" fill="${primary}"/>
          <path d="M64 45 L84 75 L64 105 L44 75 Z" fill="${primary}" opacity="0.7"/>
          <path d="M64 105 L72 120 L56 120 Z" fill="${secondary}"/>
        </svg>
      `;
    }

    return svg;
  }

  function getTranslatedHtml() {
    const t = translations[currentLang] || translations['es'] || {};
    let html = templateHtml;

    // Reemplazar variables de traducción
    Object.keys(t).forEach(key => {
      html = html.replaceAll(`{{${key}}}`, t[key]);
    });

    // Aplicar etiquetas personalizadas del dashboard (sobrescriben traducciones)
    if (config.labels) {
      if (config.labels.acceptAll) {
        html = html.replaceAll('{{accept}}', config.labels.acceptAll);
      }
      if (config.labels.rejectAll) {
        html = html.replaceAll('{{reject}}', config.labels.rejectAll);
      }
      if (config.labels.customize) {
        html = html.replaceAll('{{settings}}', config.labels.customize);
      }
    }

    // Reemplazar icono de config
    // Prioridad: config.icon manual > Panoya personalizada > emoji fallback
    const iconHtml = config.icon || generatePanoyaSvg() || '🌽';
    html = html.replaceAll('{{icon}}', iconHtml);

    // Aplicar información legal (GDPR compliance - Art. 13)
    if (config.legal) {
      const legalTitle = config.legal.title || t.legalTitle || 'Política de Privacidad';

      // Priorizar fullPolicyText > content > auto-generado
      let legalContent = config.legal.fullPolicyText || config.legal.content;

      // Si no hay texto manual, generar automáticamente desde campos estructurados
      if (!legalContent && config.legal.companyName) {
        legalContent = generateLegalText(config.legal, t);
      }

      // Fallback final
      legalContent = legalContent || 'No se ha configurado la política de privacidad.';

      html = html.replaceAll('{{legalTitle}}', legalTitle);
      html = html.replaceAll('{{legalContent}}', legalContent.replaceAll('\n', '<br>'));
    } else {
      html = html.replaceAll('{{legalTitle}}', t.legalTitle || 'Política de Privacidad');
      html = html.replaceAll('{{legalContent}}', 'No se ha configurado la política de privacidad.');
    }

    return html;
  }

  // ============================================
  // 7. RENDERIZADO DEL BANNER
  // ============================================
  function renderBanner(showSettings = false) {
    const html = getTranslatedHtml();

    let container = document.getElementById('esbilla-wrapper');
    if (!container) {
      container = document.createElement('div');
      container.id = 'esbilla-wrapper';
      document.body.appendChild(container);
    }

    container.innerHTML = html;
    container.classList.remove('esbilla-hidden');

    // Insertar selector de idioma si está habilitado
    const banner = document.getElementById('esbilla-banner');
    if (banner && config.features?.languageSelector !== false) {
      renderLangSelector(banner);
    }

    // Event listeners
    bindEvents();

    if (showSettings) {
      toggleSettings();
    }
  }

  function bindEvents() {
    const btnAccept = document.getElementById('esbilla-btn-accept');
    const btnReject = document.getElementById('esbilla-btn-reject');
    const btnSettings = document.getElementById('esbilla-btn-settings');
    const legalLink = document.getElementById('esbilla-legal-link');
    const legalModal = document.getElementById('esbilla-legal-modal');
    const legalClose = document.getElementById('esbilla-legal-close');

    if (btnAccept) btnAccept.onclick = () => saveConsent({ analytics: true, marketing: true }, 'accept_all');
    if (btnReject) btnReject.onclick = () => saveConsent({ analytics: false, marketing: false }, 'reject_all');
    if (btnSettings) btnSettings.onclick = () => toggleSettings();

    // Event listeners para modal de política de privacidad
    if (legalLink && legalModal) {
      legalLink.onclick = (e) => {
        e.preventDefault();
        legalModal.style.display = 'flex';
        console.log('[Esbilla v2.1] ✓ Modal de política de privacidad abierto');
      };

      if (legalClose) {
        legalClose.onclick = () => {
          legalModal.style.display = 'none';
        };
      }

      // Cerrar al hacer clic en el overlay
      const overlay = legalModal.querySelector('.esbilla-legal-overlay');
      if (overlay) {
        overlay.onclick = () => {
          legalModal.style.display = 'none';
        };
      }

      // Cerrar con tecla ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && legalModal.style.display === 'flex') {
          legalModal.style.display = 'none';
        }
      });
    }
  }

  // ============================================
  // 8. SELECTOR DE IDIOMA
  // ============================================
  function renderLangSelector(banner) {
    const availableLangs = config.availableLanguages || Object.keys(translations);
    if (availableLangs.length < 2) return;

    const langNames = manifest.languages || defaultLangNames;

    const selector = document.createElement('div');
    selector.className = 'esbilla-lang-selector';
    selector.innerHTML = `
      <button class="esbilla-lang-btn" id="esbilla-lang-toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>${langNames[currentLang] || currentLang}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div class="esbilla-lang-dropdown esbilla-hidden" id="esbilla-lang-dropdown">
        ${availableLangs.filter(l => translations[l]).map(lang => `
          <div class="esbilla-lang-option ${lang === currentLang ? 'active' : ''}" data-lang="${lang}">
            <span class="check">✓</span>
            <span>${langNames[lang] || lang}</span>
          </div>
        `).join('')}
      </div>
    `;

    banner.appendChild(selector);

    // Event handlers
    const toggleBtn = document.getElementById('esbilla-lang-toggle');
    const dropdown = document.getElementById('esbilla-lang-dropdown');

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('esbilla-hidden');
    };

    document.addEventListener('click', () => dropdown.classList.add('esbilla-hidden'));

    dropdown.querySelectorAll('.esbilla-lang-option').forEach(opt => {
      opt.onclick = (e) => {
        e.stopPropagation();
        const newLang = opt.getAttribute('data-lang');
        if (newLang !== currentLang) {
          currentLang = newLang;
          if (config.features?.rememberLanguage !== false) {
            setStorageItem('esbilla_lang', newLang);
          }
          const settingsOpen = !!document.getElementById('esbilla-settings-panel');
          renderBanner(settingsOpen);
        }
        dropdown.classList.add('esbilla-hidden');
      };
    });
  }

  // ============================================
  // 9. PANEL DE CONFIGURACIÓN
  // ============================================
  function toggleSettings() {
    const banner = document.getElementById('esbilla-banner');
    let settingsPanel = document.getElementById('esbilla-settings-panel');

    if (settingsPanel) {
      settingsPanel.remove();
      return;
    }

    const t = translations[currentLang] || translations['es'] || {};
    const savedConsentStr = getStorageItem('esbilla_consent');
    const consent = savedConsentStr ? JSON.parse(savedConsentStr) : { analytics: false, marketing: false };

    settingsPanel = document.createElement('div');
    settingsPanel.id = 'esbilla-settings-panel';
    settingsPanel.className = 'esbilla-settings';
    settingsPanel.innerHTML = `
      <div class="esbilla-settings-title">${t.settingsTitle || 'Personaliza tus preferencias'}</div>

      <div class="esbilla-option">
        <div class="esbilla-option-info">
          <div class="esbilla-option-label">${t.necessaryLabel || 'Necesarias'}</div>
          <div class="esbilla-option-desc">${t.necessaryDesc || 'Imprescindibles para el funcionamiento'}</div>
        </div>
        <label class="esbilla-toggle">
          <input type="checkbox" checked disabled>
          <span class="esbilla-toggle-slider"></span>
        </label>
      </div>

      <div class="esbilla-option">
        <div class="esbilla-option-info">
          <div class="esbilla-option-label">${t.analyticsLabel || 'Analíticas'}</div>
          <div class="esbilla-option-desc">${t.analyticsDesc || 'Nos ayudan a mejorar'}</div>
        </div>
        <label class="esbilla-toggle">
          <input type="checkbox" id="esbilla-opt-analytics" ${consent.analytics ? 'checked' : ''}>
          <span class="esbilla-toggle-slider"></span>
        </label>
      </div>

      <div class="esbilla-option">
        <div class="esbilla-option-info">
          <div class="esbilla-option-label">${t.marketingLabel || 'Marketing'}</div>
          <div class="esbilla-option-desc">${t.marketingDesc || 'Anuncios personalizados'}</div>
        </div>
        <label class="esbilla-toggle">
          <input type="checkbox" id="esbilla-opt-marketing" ${consent.marketing ? 'checked' : ''}>
          <span class="esbilla-toggle-slider"></span>
        </label>
      </div>

      <div class="esbilla-actions" style="margin-top: 20px;">
        <button id="esbilla-btn-save" class="btn-primary">${t.saveSettings || 'Guardar'}</button>
      </div>

      <div class="esbilla-footprint">
        <span class="esbilla-footprint-label">${t.footprintLabel || 'Tu ID de privacidad'}:</span>
        <code class="esbilla-footprint-id">${footprintId}</code>
      </div>
    `;

    banner.appendChild(settingsPanel);

    document.getElementById('esbilla-btn-save').onclick = () => {
      const analytics = document.getElementById('esbilla-opt-analytics').checked;
      const marketing = document.getElementById('esbilla-opt-marketing').checked;
      saveConsent({ analytics, marketing });
    };
  }

  // ============================================
  // 10. PANOYA (BOTÓN FLOTANTE)
  // ============================================
  // Panoya: La mazorca (botón flotante de configuración)
  function showPanoya() {
    if (!config.panoya?.enabled && config.panoya?.enabled !== undefined) return;
    if (document.getElementById('esbilla-panoya')) return;

    const t = translations[currentLang] || {};
    const showFootprint = config.panoya?.showFootprint !== false;

    const panoya = document.createElement('div');
    panoya.id = 'esbilla-panoya';
    panoya.title = t.panoyaTitle || 'Configurar cookies';

    if (showFootprint) {
      panoya.classList.add('esbilla-panoya-expanded');
      panoya.innerHTML = `
        <span class="esbilla-panoya-icon">${config.panoya?.icon || '🌽'}</span>
        <span class="esbilla-panoya-footprint" style="display:none;">${footprintId}</span>
      `;
    } else {
      panoya.innerHTML = config.panoya?.icon || '🌽';
    }

    panoya.onclick = () => {
      panoya.remove();
      renderBanner(true);
    };
    document.body.appendChild(panoya);
  }

  // ============================================
  // 11. GUARDAR CONSENTIMIENTO
  // ============================================
  function saveConsent(choices, action = 'customize') {
    updateConsentMode(choices);

    const previousConsent = getStorageItem('esbilla_consent');
    const isUpdate = !!previousConsent;

    setStorageItem('esbilla_consent', JSON.stringify(choices));

    // Determinar acción si no se especificó
    let consentAction = action;
    if (action === 'customize' && !isUpdate) {
      // Si es desde el panel de settings, es customize
      consentAction = 'customize';
    } else if (isUpdate && action === 'customize') {
      consentAction = 'update';
    }

    // ATRIBUCIÓN: Manejar datos de marketing según consentimiento
    handleAttributionConsent(choices.marketing);

    // Metadata enriquecida
    const metadata = {
      domain: window.location.hostname,
      pageUrl: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      language: currentLang,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pegoyuVersion: PEGOYU_VERSION,
      consentVersion: config.consentVersion || '1.0'
    };

    // Preparar payload para la API
    const payload = {
      siteId: cmpId,
      footprintId,
      choices,
      action: consentAction,
      metadata,
      timestamp: new Date().toISOString()
    };

    // ATRIBUCIÓN: Incluir datos si marketing aceptado y hay datos disponibles
    if (choices.marketing) {
      const attribution = getAttributionData();
      if (attribution) {
        payload.attribution = attribution;
      }
    }

    // Log en el backend
    fetch(`${apiBase}/api/consent/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.warn('[Esbilla] Error logging consent:', e));

    document.getElementById('esbilla-wrapper')?.classList.add('esbilla-hidden');
    showPanoya();
  }

  function updateConsentMode(choices) {
    // ============================================
    // 1. GOOGLE CONSENT MODE V2 + G100 COMPLIANCE
    // ============================================
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': choices.analytics ? 'granted' : 'denied',
        'ad_storage': choices.marketing ? 'granted' : 'denied',
        'ad_user_data': choices.marketing ? 'granted' : 'denied',
        'ad_personalization': choices.marketing ? 'granted' : 'denied',
        'functionality_storage': choices.functional ? 'granted' : 'denied',
        'personalization_storage': choices.functional ? 'granted' : 'denied',
        'security_storage': 'granted' // Siempre granted (necesario para CSRF, etc.)
      });
      console.log('[Esbilla v2.0] ✓ Google Consent Mode V2 actualizado');

      // G100 (opcional): Enviar page_view después de actualizar consent
      // Si analytics_storage='denied': ping anónimo para modelado de conversiones (requiere enableG100=true)
      // Si analytics_storage='granted': hit normal con cookies (siempre se envía)
      if (window._esbilla_ga4_ready && window._esbilla_ga4_id) {
        // Solo enviar ping anónimo si G100 está activado O si hay consentimiento
        const enableG100 = config.enableG100 === true;
        if (choices.analytics || enableG100) {
          gtag('event', 'page_view', {
            'send_to': window._esbilla_ga4_id
          });
          console.log('[Esbilla v2.0] ✓ G100: page_view enviado (' +
            (choices.analytics ? 'hit con cookies' : 'ping anónimo con opt-in') + ')');
        }
      }
    }

    // ============================================
    // 2. META PIXEL CONSENT API (Facebook)
    // ============================================
    if (typeof fbq === 'function') {
      if (choices.marketing) {
        fbq('consent', 'grant');
        console.log('[Esbilla v1.7] ✓ Meta Pixel Consent: granted');
      } else {
        fbq('consent', 'revoke');
        console.log('[Esbilla v1.7] ✓ Meta Pixel Consent: revoked');
      }
    }

    // ============================================
    // 3. MICROSOFT UET CONSENT MODE
    // ============================================
    if (typeof window.uetq !== 'undefined') {
      window.uetq = window.uetq || [];
      window.uetq.push('consent', 'update', {
        'ad_storage': choices.marketing ? 'granted' : 'denied'
      });
      console.log('[Esbilla v1.7] ✓ Microsoft UET Consent actualizado');
    }

    // ============================================
    // 4. MICROSOFT CLARITY CONSENT API
    // ============================================
    if (typeof window.clarity === 'function') {
      if (choices.analytics) {
        window.clarity('consent');
        console.log('[Esbilla v1.7] ✓ Microsoft Clarity Consent: granted');
      } else {
        // Clarity no tiene método revoke explícito, se pausa el tracking
        window.clarity('stop');
        console.log('[Esbilla v1.7] ✓ Microsoft Clarity Consent: denied (stopped)');
      }
    }

    // ============================================
    // 5. SHOPIFY CUSTOMER PRIVACY API
    // ============================================
    if (typeof window.Shopify !== 'undefined' && window.Shopify.customerPrivacy) {
      window.Shopify.customerPrivacy.setTrackingConsent({
        analytics: choices.analytics,
        marketing: choices.marketing,
        preferences: choices.functional,
        sale_of_data: choices.marketing // CCPA compliance
      }, function() {
        console.log('[Esbilla v1.7] ✓ Shopify Customer Privacy API actualizado');
      });
    }

    // ============================================
    // 6. WORDPRESS CONSENT API
    // ============================================
    if (typeof wp !== 'undefined' && wp.hooks) {
      // Disparar hook de WordPress para que plugins escuchen
      wp.hooks.doAction('esbilla_consent_updated', choices);
      console.log('[Esbilla v1.7] ✓ WordPress Consent API: hook disparado');

      // Compatibilidad con wp-consent-api plugin
      if (typeof wp.consent !== 'undefined') {
        wp.consent.setConsent('analytics', choices.analytics ? 'allow' : 'deny');
        wp.consent.setConsent('marketing', choices.marketing ? 'allow' : 'deny');
        wp.consent.setConsent('preferences', choices.functional ? 'allow' : 'deny');
        console.log('[Esbilla v1.7] ✓ WP Consent API plugin actualizado');
      }
    }

    // ============================================
    // 7. CUSTOM EVENT (para integraciones personalizadas)
    // ============================================
    // Disparar evento global que otros scripts pueden escuchar
    if (typeof window.CustomEvent === 'function') {
      const consentEvent = new CustomEvent('esbillaConsentUpdate', {
        detail: {
          analytics: choices.analytics,
          marketing: choices.marketing,
          functional: choices.functional,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(consentEvent);
      console.log('[Esbilla v1.7] ✓ CustomEvent "esbillaConsentUpdate" disparado');
    }

    // ============================================
    // 8. DESBLOQUEO DE SCRIPTS Y CARGA DINÁMICA
    // ============================================
    // Desbloquear scripts de terceros basado en las categorías consentidas
    unblockScripts(choices);

    // v1.7: Cargar scripts dinámicos si está en modo simplified
    loadDynamicScripts(choices);
  }

  // ============================================
  // 12. FALLBACKS
  // ============================================
  function injectFallbackStyles() {
    if (document.getElementById('esbilla-fallback-styles')) return;
    loadCSS(`${apiBase}/styles/base.css`);
  }

  function getFallbackTemplate() {
    return `
      <div id="esbilla-banner">
        <div class="esbilla-inner">
          <div class="esbilla-icon">🍪</div>
          <div class="esbilla-title">{{title}}</div>
          <p class="esbilla-text">{{description}}</p>
          <div class="esbilla-actions">
            <button id="esbilla-btn-accept" class="btn-primary">{{accept}}</button>
            <button id="esbilla-btn-reject" class="btn-primary-outline">{{reject}}</button>
            <button id="esbilla-btn-settings" class="btn-link">{{settings}}</button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // API PÚBLICA (para testing y debugging)
  // ============================================
  window.Esbilla = {
    // Resetear el banner (útil para testing)
    resetConsent: function() {
      localStorage.removeItem('esbilla_consent');
      document.cookie = 'esbilla_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      console.log('[Esbilla] Consentimiento reseteado');
      // Ocultar panoya si existe
      const panoya = document.getElementById('esbilla-panoya');
      if (panoya) panoya.remove();
      // Mostrar el banner de nuevo
      init();
    },

    // Obtener el Footprint ID actual
    getFootprintId: function() {
      return localStorage.getItem('esbilla_footprint') || null;
    },

    // Obtener el consentimiento actual
    getConsent: function() {
      const consent = localStorage.getItem('esbilla_consent');
      return consent ? JSON.parse(consent) : null;
    },

    // Mostrar la panoya manualmente
    showPanoya: function() {
      if (typeof showPanoya === 'function') {
        showPanoya();
      }
    },

    // Versión del Pegoyu
    version: '2.0.0'
  };

  // ============================================
  // INICIAR
  // ============================================
  init();
})();
