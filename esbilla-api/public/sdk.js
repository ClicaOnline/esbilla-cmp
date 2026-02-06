/**
 * ESBILLA CMP - SDK v1.7 (Dynamic Script Loading + Extended Integrations)
 * Arquitectura modular: estilos, plantillas y configuración externos
 * Incluye captura de atribución de marketing (UTM, click IDs)
 * v1.4: Eliminado data-key (seguridad basada en validación de dominio + rate limiting)
 * v1.5: Script Blocking automático - bloquea scripts de terceros hasta consentimiento
 * v1.6: Carga dinámica de scripts desde Dashboard - 3 modos (manual/simplified/gtm)
 * v1.7: Integraciones extendidas (20+ scripts) - Amplitude, Criteo, Google Ads, Microsoft Ads,
 *       Pinterest, Twitter, Taboola, HubSpot, Intercom, Zendesk, Crazy Egg, VWO, Optimizely
 */
(function() {
  const SDK_VERSION = '1.7.0';
  const script = document.currentScript;
  const cmpId = script.getAttribute('data-id') || 'default';
  const gtmId = script.getAttribute('data-gtm');
  const apiBase = script.getAttribute('data-api') || script.src.replace('/sdk.js', '');

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
      console.log('[Esbilla v1.7] Modo: GTM Integration');
      return;
    }

    // Si hay scriptConfig desde el Dashboard, usar modo simplified
    if (config.scriptConfig && Object.keys(config.scriptConfig).length > 0) {
      implementationMode = 'simplified';
      scriptConfig = config.scriptConfig;
      console.log('[Esbilla v1.7] Modo: Simplified (carga dinámica desde Dashboard)');
      return;
    }

    // Modo manual por defecto
    implementationMode = 'manual';
    console.log('[Esbilla v1.7] Modo: Manual (scripts con data-consent-category)');
  }

  /**
   * Plantillas de scripts para plataformas comunes
   * Cada función retorna el código JavaScript a inyectar
   */
  const scriptTemplates = {
    // Google Analytics 4
    googleAnalytics: (measurementId) => `
      <!-- Google Analytics 4 -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          'anonymize_ip': true,
          'cookie_flags': 'SameSite=None;Secure'
        });
      </script>
    `,

    // Facebook Pixel
    facebookPixel: (pixelId) => `
      <!-- Facebook Pixel -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
      /></noscript>
    `,

    // LinkedIn Insight Tag
    linkedinInsight: (partnerId) => `
      <!-- LinkedIn Insight Tag -->
      <script type="text/javascript">
        _linkedin_partner_id = "${partnerId}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
      </script>
      <script type="text/javascript">
        (function(l) {
          if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
          window.lintrk.q=[]}
          var s = document.getElementsByTagName("script")[0];
          var b = document.createElement("script");
          b.type = "text/javascript";b.async = true;
          b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b, s);})(window.lintrk);
      </script>
      <noscript>
        <img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=${partnerId}&fmt=gif" />
      </noscript>
    `,

    // TikTok Pixel
    tiktokPixel: (pixelId) => `
      <!-- TikTok Pixel -->
      <script>
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
          ttq.load('${pixelId}');
          ttq.page();
        }(window, document, 'ttq');
      </script>
    `,

    // Hotjar
    hotjar: (siteId) => `
      <!-- Hotjar Tracking Code -->
      <script>
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${siteId},hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      </script>
    `,

    // Amplitude Analytics
    amplitude: (apiKey) => `
      <!-- Amplitude Analytics -->
      <script type="text/javascript">
        (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
        ;r.type="text/javascript"
        ;r.integrity="sha384-+EO59vL/X7v6VE2s6/F4HxfHlK0nDUVWKVg8K9oUlvffAeeaShVBmbORTC2D3UF+"
        ;r.crossOrigin="anonymous";r.async=true
        ;r.src="https://cdn.amplitude.com/libs/amplitude-8.21.4-min.gz.js"
        ;r.onload=function(){if(!e.amplitude.runQueuedFunctions){
        console.log("[Amplitude] Error")}else{e.amplitude.runQueuedFunctions()}};
        var s=t.getElementsByTagName("script")[0];s.parentNode.insertBefore(r,s)
        ;function i(e,t){e.prototype[t]=function(){
        this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
        var o=function(){this._q=[];return this}
        ;var a=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove"]
        ;for(var c=0;c<a.length;c++){i(o,a[c])}n.Identify=o;var l=function(){this._q=[]
        ;return this}
        ;var u=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
        ;for(var p=0;p<u.length;p++){i(l,u[p])}n.Revenue=l
        ;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","onNewSessionStart","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId","getDeviceId","getUserId","setMinTimeBetweenSessionsMillis","setEventUploadThreshold","setUseDynamicConfig","setServerZone","setServerUrl","sendEvents","setLibrary","setTransport"]
        ;function v(t){function e(e){t[e]=function(){
        t._q.push([e].concat(Array.prototype.slice.call(arguments,0)))}}
        for(var n=0;n<d.length;n++){e(d[n])}}v(n);n.getInstance=function(e){
        e=(!e||e.length===0?"$default_instance":e).toLowerCase()
        ;if(!Object.prototype.hasOwnProperty.call(n._iq,e)){n._iq[e]={_q:[]};v(n._iq[e])
        }return n._iq[e]};e.amplitude=n})(window,document);
        amplitude.getInstance().init("${apiKey}");
      </script>
    `,

    // Crazy Egg Heatmaps
    crazyEgg: (accountNumber) => `
      <!-- Crazy Egg -->
      <script type="text/javascript" src="//script.crazyegg.com/pages/scripts/${accountNumber}.js" async="async"></script>
    `,

    // VWO (Visual Website Optimizer)
    vwo: (accountId) => `
      <!-- VWO Async SmartCode -->
      <script type='text/javascript' id='vwoCode'>
        window._vwo_code = window._vwo_code || (function(){
          var account_id=${accountId},
          version = 1.5,
          settings_tolerance=2000,
          library_tolerance=2500,
          use_existing_jquery=false,
          is_spa=1,
          hide_element='body',
          hide_element_style = 'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important',
          f=false,d=document,vwoCodeEl=d.querySelector('#vwoCode'),code={use_existing_jquery:function(){return use_existing_jquery},library_tolerance:function(){return library_tolerance},hide_element_style:function(){return'{'+hide_element_style+'}'},finish:function(){if(!f){f=true;var e=d.getElementById('_vis_opt_path_hides');if(e)e.parentNode.removeChild(e)}},finished:function(){return f},load:function(e){var t=d.createElement('script');t.fetchPriority='high';t.src=e;t.type='text/javascript';t.innerText;t.onerror=function(){_vwo_code.finish()};d.getElementsByTagName('head')[0].appendChild(t)},getVersion:function(){return version},getMatchedCookies:function(e){var t=[];if(document.cookie){t=document.cookie.match(e)||[]}return t},getCombinationCookie:function(){var e=code.getMatchedCookies(/(?:^|;)\\s?(_vis_opt_exp_\\d+_combi=[\\d,]+)/gi);e=e.map(function(e){try{var t=decodeURIComponent(e);if(!/_vis_opt_exp_\\d+_combi=(?:\\d+,?)+\\s*$/.test(t)){return''}return t}catch(e){return''}});var i=[];e.forEach(function(e){var t=e.match(/(\\d+),(\\d+)/);if(t&&t[1]){i.push(t[1]+'_'+t[2])}});return i.join('-')},init:function(){if(d.URL.indexOf('__vwo_disable__')>-1)return;window.settings_timer=setTimeout(function(){_vwo_code.finish()},settings_tolerance);var e=d.createElement('style'),t=hide_element?hide_element+'{'+hide_element_style+'}':'',i=d.getElementsByTagName('head')[0];e.setAttribute('id','_vis_opt_path_hides');e.setAttribute('nonce',d.querySelector('#vwoCode').nonce);e.setAttribute('type','text/css');if(e.styleSheet)e.styleSheet.cssText=t;else e.appendChild(d.createTextNode(t));i.appendChild(e);var n=this.getCombinationCookie();this.load('https://dev.visualwebsiteoptimizer.com/j.php?a='+account_id+'&u='+encodeURIComponent(d.URL)+'&f='+ +is_spa+'&vn='+version+(n?'&c='+n:''));return settings_timer}};window._vwo_settings_timer = code.init();return code;}());
      </script>
    `,

    // Optimizely
    optimizely: (projectId) => `
      <!-- Optimizely -->
      <script src="https://cdn.optimizely.com/js/${projectId}.js"></script>
    `,

    // Google Ads Conversion Tracking
    googleAds: (conversionId) => `
      <!-- Google Ads Conversion Tracking -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${conversionId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${conversionId}');
      </script>
    `,

    // Microsoft Ads UET (Universal Event Tracking)
    microsoftAds: (tagId) => `
      <!-- Microsoft Ads UET -->
      <script>
        (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${tagId}", enableAutoSpaTracking: true};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
      </script>
    `,

    // Criteo
    criteo: (accountId) => `
      <!-- Criteo OneTag -->
      <script type="text/javascript" src="//dynamic.criteo.com/js/ld/ld.js?a=${accountId}" async="true"></script>
      <script type="text/javascript">
        window.criteo_q = window.criteo_q || [];
        window.criteo_q.push(
          { event: "setAccount", account: ${accountId} },
          { event: "setSiteType", type: "d" },
          { event: "viewHome" }
        );
      </script>
    `,

    // Pinterest Tag
    pinterestTag: (tagId) => `
      <!-- Pinterest Tag -->
      <script>
        !function(e){if(!window.pintrk){window.pintrk = function () {
        window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
          n=window.pintrk;n.queue=[],n.version="3.0";var
          t=document.createElement("script");t.async=!0,t.src=e;var
          r=document.getElementsByTagName("script")[0];
          r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
        pintrk('load', '${tagId}', {em: '<user_email_address>'});
        pintrk('page');
      </script>
      <noscript>
        <img height="1" width="1" style="display:none;" alt=""
          src="https://ct.pinterest.com/v3/?event=init&tid=${tagId}&pd[em]=<hashed_email_address>&noscript=1" />
      </noscript>
    `,

    // Twitter Pixel
    twitterPixel: (pixelId) => `
      <!-- Twitter conversion tracking base code -->
      <script>
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('config','${pixelId}');
      </script>
    `,

    // Taboola
    taboola: (accountId) => `
      <!-- Taboola Pixel Code -->
      <script type='text/javascript'>
        window._tfa = window._tfa || [];
        window._tfa.push({notify: 'event', name: 'page_view', id: ${accountId}});
        !function (t, f, a, x) {
          if (!document.getElementById(x)) {
            t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
          }
        }(document.createElement('script'),
        document.getElementsByTagName('script')[0],
        '//cdn.taboola.com/libtrc/unip/${accountId}/tfa.js',
        'tb_tfa_script');
      </script>
      <noscript>
        <img src='https://trc.taboola.com/sg/${accountId}/log/3/unip?en=page_view' width='0' height='0' style='display:none'/>
      </noscript>
    `,

    // YouTube (Privacy-Enhanced Mode)
    youtube: (videoId) => `
      <!-- YouTube Privacy-Enhanced Embed -->
      <iframe width="560" height="315"
        src="https://www.youtube-nocookie.com/embed/${videoId}"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `,

    // HubSpot
    hubspot: (portalId) => `
      <!-- HubSpot Tracking Code -->
      <script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/${portalId}.js"></script>
    `,

    // Intercom (Funcional - Chat)
    intercom: (appId) => `
      <!-- Intercom -->
      <script>
        window.intercomSettings = {
          api_base: "https://api-iam.intercom.io",
          app_id: "${appId}"
        };
        (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${appId}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
      </script>
    `,

    // Zendesk (Funcional - Chat/Support)
    zendesk: (key) => `
      <!-- Zendesk Web Widget -->
      <script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=${key}"></script>
    `
  };

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
   * @param {Object} choices - { analytics: boolean, marketing: boolean }
   */
  function loadDynamicScripts(choices) {
    if (implementationMode !== 'simplified' || !scriptConfig) {
      return;
    }

    console.log('[Esbilla v1.7] Cargando scripts dinámicos...', choices);

    // ============================================
    // ANALYTICS / ESTADÍSTICA
    // ============================================
    if (choices.analytics && scriptConfig.analytics) {
      const analytics = scriptConfig.analytics;

      // Google Analytics 4
      if (analytics.googleAnalytics && scriptTemplates.googleAnalytics) {
        injectScript(scriptTemplates.googleAnalytics(analytics.googleAnalytics), 'analytics');
        console.log('[Esbilla v1.7] ✓ Google Analytics 4 cargado');
      }

      // Hotjar
      if (analytics.hotjar && scriptTemplates.hotjar) {
        injectScript(scriptTemplates.hotjar(analytics.hotjar), 'analytics');
        console.log('[Esbilla v1.7] ✓ Hotjar cargado');
      }

      // Amplitude
      if (analytics.amplitude && scriptTemplates.amplitude) {
        injectScript(scriptTemplates.amplitude(analytics.amplitude), 'analytics');
        console.log('[Esbilla v1.7] ✓ Amplitude cargado');
      }

      // Crazy Egg
      if (analytics.crazyEgg && scriptTemplates.crazyEgg) {
        injectScript(scriptTemplates.crazyEgg(analytics.crazyEgg), 'analytics');
        console.log('[Esbilla v1.7] ✓ Crazy Egg cargado');
      }

      // VWO (Visual Website Optimizer)
      if (analytics.vwo && scriptTemplates.vwo) {
        injectScript(scriptTemplates.vwo(analytics.vwo), 'analytics');
        console.log('[Esbilla v1.7] ✓ VWO cargado');
      }

      // Optimizely
      if (analytics.optimizely && scriptTemplates.optimizely) {
        injectScript(scriptTemplates.optimizely(analytics.optimizely), 'analytics');
        console.log('[Esbilla v1.7] ✓ Optimizely cargado');
      }
    }

    // ============================================
    // MARKETING / PUBLICIDAD
    // ============================================
    if (choices.marketing && scriptConfig.marketing) {
      const marketing = scriptConfig.marketing;

      // Facebook Pixel
      if (marketing.facebookPixel && scriptTemplates.facebookPixel) {
        injectScript(scriptTemplates.facebookPixel(marketing.facebookPixel), 'marketing');
        console.log('[Esbilla v1.7] ✓ Facebook Pixel cargado');
      }

      // LinkedIn Insight
      if (marketing.linkedinInsight && scriptTemplates.linkedinInsight) {
        injectScript(scriptTemplates.linkedinInsight(marketing.linkedinInsight), 'marketing');
        console.log('[Esbilla v1.7] ✓ LinkedIn Insight cargado');
      }

      // TikTok Pixel
      if (marketing.tiktokPixel && scriptTemplates.tiktokPixel) {
        injectScript(scriptTemplates.tiktokPixel(marketing.tiktokPixel), 'marketing');
        console.log('[Esbilla v1.7] ✓ TikTok Pixel cargado');
      }

      // Google Ads Conversion Tracking
      if (marketing.googleAds && scriptTemplates.googleAds) {
        injectScript(scriptTemplates.googleAds(marketing.googleAds), 'marketing');
        console.log('[Esbilla v1.7] ✓ Google Ads cargado');
      }

      // Microsoft Ads (UET)
      if (marketing.microsoftAds && scriptTemplates.microsoftAds) {
        injectScript(scriptTemplates.microsoftAds(marketing.microsoftAds), 'marketing');
        console.log('[Esbilla v1.7] ✓ Microsoft Ads cargado');
      }

      // Criteo
      if (marketing.criteo && scriptTemplates.criteo) {
        injectScript(scriptTemplates.criteo(marketing.criteo), 'marketing');
        console.log('[Esbilla v1.7] ✓ Criteo cargado');
      }

      // Pinterest Tag
      if (marketing.pinterestTag && scriptTemplates.pinterestTag) {
        injectScript(scriptTemplates.pinterestTag(marketing.pinterestTag), 'marketing');
        console.log('[Esbilla v1.7] ✓ Pinterest Tag cargado');
      }

      // Twitter Pixel
      if (marketing.twitterPixel && scriptTemplates.twitterPixel) {
        injectScript(scriptTemplates.twitterPixel(marketing.twitterPixel), 'marketing');
        console.log('[Esbilla v1.7] ✓ Twitter Pixel cargado');
      }

      // Taboola
      if (marketing.taboola && scriptTemplates.taboola) {
        injectScript(scriptTemplates.taboola(marketing.taboola), 'marketing');
        console.log('[Esbilla v1.7] ✓ Taboola cargado');
      }

      // YouTube (Privacy-Enhanced)
      if (marketing.youtube && scriptTemplates.youtube) {
        // YouTube puede ser marketing o funcional según el uso
        injectScript(scriptTemplates.youtube(marketing.youtube), 'marketing');
        console.log('[Esbilla v1.7] ✓ YouTube cargado');
      }

      // HubSpot
      if (marketing.hubspot && scriptTemplates.hubspot) {
        injectScript(scriptTemplates.hubspot(marketing.hubspot), 'marketing');
        console.log('[Esbilla v1.7] ✓ HubSpot cargado');
      }
    }

    // ============================================
    // FUNCIONAL (Chats, Soporte)
    // ============================================
    if (choices.functional && scriptConfig.functional) {
      const functional = scriptConfig.functional;

      // Intercom
      if (functional.intercom && scriptTemplates.intercom) {
        injectScript(scriptTemplates.intercom(functional.intercom), 'functional');
        console.log('[Esbilla v1.7] ✓ Intercom cargado');
      }

      // Zendesk
      if (functional.zendesk && scriptTemplates.zendesk) {
        injectScript(scriptTemplates.zendesk(functional.zendesk), 'functional');
        console.log('[Esbilla v1.7] ✓ Zendesk cargado');
      }
    }

    console.log('[Esbilla v1.7] Carga dinámica completada');
  }

  // ============================================
  // 2. CARGAR GTM
  // ============================================
  if (gtmId) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',gtmId);
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

        showMosca();
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

    // Estilo de botones (igual peso vs destacar aceptar)
    if (config.buttonStyle === 'acceptHighlight') {
      root.style.setProperty('--esbilla-btn-reject-bg', 'transparent');
      root.style.setProperty('--esbilla-btn-reject-border', '1px solid var(--esbilla-secondary, #6B7280)');
      root.style.setProperty('--esbilla-btn-reject-color', 'var(--esbilla-text, #1F2937)');
    }

    // Posición de la mosca
    if (config.mosca?.position) {
      const pos = manifest.moscaPositions?.[config.mosca.position];
      if (pos?.css) {
        Object.entries(pos.css).forEach(([prop, val]) => {
          root.style.setProperty(`--esbilla-mosca-${prop}`, val);
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
    html = html.replaceAll('{{icon}}', config.icon || '🌽');

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

    if (btnAccept) btnAccept.onclick = () => saveConsent({ analytics: true, marketing: true }, 'accept_all');
    if (btnReject) btnReject.onclick = () => saveConsent({ analytics: false, marketing: false }, 'reject_all');
    if (btnSettings) btnSettings.onclick = () => toggleSettings();
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
  // 10. MOSCA (BOTÓN FLOTANTE)
  // ============================================
  function showMosca() {
    if (!config.mosca?.enabled && config.mosca?.enabled !== undefined) return;
    if (document.getElementById('esbilla-mosca')) return;

    const t = translations[currentLang] || {};
    const showFootprint = config.mosca?.showFootprint !== false;

    const mosca = document.createElement('div');
    mosca.id = 'esbilla-mosca';
    mosca.title = t.moscaTitle || 'Configurar cookies';

    if (showFootprint) {
      mosca.classList.add('esbilla-mosca-expanded');
      mosca.innerHTML = `
        <span class="esbilla-mosca-icon">${config.mosca?.icon || '🍪'}</span>
        <span class="esbilla-mosca-footprint" style="display:none;">${footprintId}</span>
      `;
    } else {
      mosca.innerHTML = config.mosca?.icon || '🍪';
    }

    mosca.onclick = () => {
      mosca.remove();
      renderBanner(true);
    };
    document.body.appendChild(mosca);
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
      sdkVersion: SDK_VERSION,
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
    showMosca();
  }

  function updateConsentMode(choices) {
    gtag('consent', 'update', {
      'analytics_storage': choices.analytics ? 'granted' : 'denied',
      'ad_storage': choices.marketing ? 'granted' : 'denied',
      'ad_user_data': choices.marketing ? 'granted' : 'denied',
      'ad_personalization': choices.marketing ? 'granted' : 'denied'
    });

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
            <button id="esbilla-btn-settings" class="btn-secondary">{{settings}}</button>
            <button id="esbilla-btn-reject" class="btn-link">{{reject}}</button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // INICIAR
  // ============================================
  init();
})();
