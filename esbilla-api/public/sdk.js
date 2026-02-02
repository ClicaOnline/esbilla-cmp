/**
 * ESBILLA CMP - SDK v1.1 (Modular & Configurable)
 * Arquitectura modular: estilos, plantillas y configuración externos
 */
(function() {
  const SDK_VERSION = '1.1.0';
  const script = document.currentScript;
  const cmpId = script.getAttribute('data-id') || 'default';
  const siteApiKey = script.getAttribute('data-key') || '';
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
  // FOOTPRINT ID - Identificador único de usuario
  // ============================================
  function getFootprintId() {
    // Intentar recuperar el ID existente
    let id = localStorage.getItem('esbilla_footprint');

    if (!id) {
      // Generar nuevo UUID y formatear como ESB-XXXXXXXX
      const uuid = crypto.randomUUID();
      id = 'ESB-' + uuid.split('-')[0].toUpperCase();
      localStorage.setItem('esbilla_footprint', id);
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
      // A. Cargar manifest de opciones disponibles
      const manifestRes = await fetch(`${apiBase}/config/manifest.json`);
      manifest = await manifestRes.json();

      // B. Cargar configuración del sitio
      const configRes = await fetch(`${apiBase}/api/config/${cmpId}`);
      config = await configRes.json();

      // C. Cargar traducciones
      const i18nRes = await fetch(`${apiBase}/i18n/config.json`);
      translations = await i18nRes.json();

      // D. Detectar idioma
      detectLanguage();

      // D2. Obtener/Generar footprintId
      footprintId = getFootprintId();

      // E. Cargar estilos (CSS externos)
      await loadStyles();

      // F. Cargar plantilla HTML
      await loadTemplate();

      // G. Aplicar variables CSS personalizadas
      applyCustomColors();

      // H. Renderizar o mostrar mosca
      if (localStorage.getItem('esbilla_consent')) {
        const oldConsent = JSON.parse(localStorage.getItem('esbilla_consent'));
        updateConsentMode(oldConsent);
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
    // 1. Preferencia guardada
    const savedLang = localStorage.getItem('esbilla_lang');
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
    if (!config.colors) return;

    const root = document.documentElement;
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
            localStorage.setItem('esbilla_lang', newLang);
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
    const savedConsent = localStorage.getItem('esbilla_consent');
    const consent = savedConsent ? JSON.parse(savedConsent) : { analytics: false, marketing: false };

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

    const previousConsent = localStorage.getItem('esbilla_consent');
    const isUpdate = !!previousConsent;

    localStorage.setItem('esbilla_consent', JSON.stringify(choices));

    // Determinar acción si no se especificó
    let consentAction = action;
    if (action === 'customize' && !isUpdate) {
      // Si es desde el panel de settings, es customize
      consentAction = 'customize';
    } else if (isUpdate && action === 'customize') {
      consentAction = 'update';
    }

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

    // Log en el backend
    fetch(`${apiBase}/api/consent/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: cmpId,
        apiKey: siteApiKey,
        footprintId,
        choices,
        action: consentAction,
        metadata,
        timestamp: new Date().toISOString()
      })
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
