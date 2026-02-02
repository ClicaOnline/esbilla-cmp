/**
 * ESBILLA CMP - SDK v0.6 (Modular con Personalización e Idiomes)
 * Lóxica separada de la presentación pa un hórreu téunicu llimpiu.
 */
(function() {
  const script = document.currentScript;
  const cmpId = script.getAttribute('data-id') || 'default-site';
  const gtmId = script.getAttribute('data-gtm');
  const apiBase = script.getAttribute('data-api') || script.src.replace('/sdk.js', '');

  let currentLang = 'es';
  let translations = {};
  let templateHtml = '';

  // Nomes de los idiomes pa mostrar nel selector
  const langNames = {
    ast: 'Asturianu',
    es: 'Español',
    en: 'English',
    fr: 'Français',
    pt: 'Português'
  };

  // 1. Consent Mode V2 Global (Deny by default)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { dataLayer.push(arguments); };

  gtag('consent', 'default', {
    'ad_storage': 'denied', 'ad_user_data': 'denied',
    'ad_personalization': 'denied', 'analytics_storage': 'denied',
    'wait_for_update': 500
  });

  // 2. Cargar GTM
  if (gtmId) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',gtmId);
  }

  // 3. Orquestación Modular
  async function init() {
    try {
      // Detectar idioma: primero localStorage, luego navegador
      const savedLang = localStorage.getItem('esbilla_lang');
      if (savedLang && langNames[savedLang]) {
        currentLang = savedLang;
      } else {
        const browserLang = navigator.language.split('-')[0];
        currentLang = langNames[browserLang] ? browserLang : 'es';
      }

      // A. Baxar testos y config
      const configRes = await fetch(`${apiBase}/i18n/config.json`);
      translations = await configRes.json();
      const t = translations[currentLang] || translations['es'];

      // B. Baxar la plantilla HTML escoyida
      const templateRes = await fetch(`${apiBase}/templates/${t.template}`);
      templateHtml = await templateRes.text();

      injectBaseStyles();

      if (localStorage.getItem('esbilla_consent')) {
        const oldConsent = JSON.parse(localStorage.getItem('esbilla_consent'));
        updateConsentMode(oldConsent);
        showMosca();
      } else {
        renderBanner();
      }
    } catch (err) {
      console.error('Error na sestaferia modular:', err);
    }
  }

  function getTranslatedHtml() {
    const t = translations[currentLang] || translations['es'];
    let html = templateHtml;
    Object.keys(t).forEach(key => {
      html = html.replaceAll(`{{${key}}}`, t[key]);
    });
    return html;
  }

  function injectBaseStyles() {
    if (document.getElementById('esbilla-base-styles')) return;
    const style = document.createElement('style');
    style.id = 'esbilla-base-styles';
    style.innerHTML = `
      /* Overlay de fondu */
      #esbilla-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }

      /* Banner principal */
      #esbilla-banner {
        background: linear-gradient(145deg, #FFFEF5 0%, #FFF8E1 100%);
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(61, 43, 31, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1);
        max-width: 480px;
        width: 90%;
        border: 2px solid #3D2B1F;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
      }

      .esbilla-inner {
        text-align: center;
      }

      .esbilla-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .esbilla-title {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #3D2B1F;
      }

      .esbilla-text {
        font-size: 15px;
        margin-bottom: 24px;
        color: #5D4037;
        line-height: 1.6;
      }

      /* Selector de idioma */
      .esbilla-lang-selector {
        position: absolute;
        top: 12px;
        right: 12px;
      }

      .esbilla-lang-btn {
        background: rgba(61, 43, 31, 0.08);
        border: 1px solid rgba(61, 43, 31, 0.2);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 13px;
        cursor: pointer;
        color: #3D2B1F;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }

      .esbilla-lang-btn:hover {
        background: rgba(61, 43, 31, 0.12);
      }

      .esbilla-lang-btn svg {
        width: 14px;
        height: 14px;
      }

      .esbilla-lang-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: white;
        border: 1px solid rgba(61, 43, 31, 0.2);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        z-index: 10;
        min-width: 120px;
      }

      .esbilla-lang-option {
        padding: 10px 14px;
        cursor: pointer;
        font-size: 13px;
        color: #3D2B1F;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .esbilla-lang-option:hover {
        background: rgba(255, 191, 0, 0.2);
      }

      .esbilla-lang-option.active {
        background: rgba(255, 191, 0, 0.3);
        font-weight: 600;
      }

      .esbilla-lang-option .check {
        opacity: 0;
        color: #FFBF00;
      }

      .esbilla-lang-option.active .check {
        opacity: 1;
      }

      /* Botones */
      .esbilla-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .btn-maiz {
        background: linear-gradient(145deg, #FFBF00, #FFA500);
        color: #3D2B1F;
        border: 2px solid #3D2B1F;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        font-size: 15px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 8px rgba(61, 43, 31, 0.2);
      }

      .btn-maiz:hover {
        background: linear-gradient(145deg, #FFA500, #FF8C00);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(61, 43, 31, 0.3);
      }

      .btn-stone {
        background: transparent;
        color: #3D2B1F;
        border: 2px solid #3D2B1F;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 15px;
        transition: all 0.2s ease;
      }

      .btn-stone:hover {
        background: rgba(61, 43, 31, 0.08);
        transform: translateY(-2px);
      }

      .btn-link {
        background: none;
        border: none;
        color: #795548;
        font-size: 14px;
        cursor: pointer;
        text-decoration: underline;
        padding: 8px 16px;
        transition: color 0.2s;
      }

      .btn-link:hover {
        color: #3D2B1F;
      }

      /* Panel de personalización */
      .esbilla-settings {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(61, 43, 31, 0.2);
        text-align: left;
      }

      .esbilla-settings-title {
        font-size: 16px;
        font-weight: 600;
        color: #3D2B1F;
        margin-bottom: 16px;
      }

      .esbilla-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(61, 43, 31, 0.1);
      }

      .esbilla-option:last-child {
        border-bottom: none;
      }

      .esbilla-option-info {
        flex: 1;
      }

      .esbilla-option-label {
        font-weight: 600;
        color: #3D2B1F;
        font-size: 14px;
      }

      .esbilla-option-desc {
        font-size: 12px;
        color: #795548;
        margin-top: 4px;
      }

      /* Toggle switch */
      .esbilla-toggle {
        position: relative;
        width: 48px;
        height: 26px;
        margin-left: 16px;
        flex-shrink: 0;
      }

      .esbilla-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .esbilla-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.3s;
        border-radius: 26px;
      }

      .esbilla-toggle-slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .esbilla-toggle input:checked + .esbilla-toggle-slider {
        background-color: #FFBF00;
      }

      .esbilla-toggle input:checked + .esbilla-toggle-slider:before {
        transform: translateX(22px);
      }

      .esbilla-toggle input:disabled + .esbilla-toggle-slider {
        background-color: #A5D6A7;
        cursor: not-allowed;
      }

      /* Mosca flotante */
      #esbilla-mosca {
        position: fixed;
        bottom: 20px;
        left: 20px;
        cursor: pointer;
        z-index: 999998;
        background: linear-gradient(145deg, #FFBF00, #FFA500);
        padding: 14px;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(61, 43, 31, 0.35);
        font-size: 26px;
        border: 2px solid #3D2B1F;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
      }

      #esbilla-mosca:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(61, 43, 31, 0.4);
      }

      .esbilla-hidden {
        display: none !important;
      }

      /* Animaciones */
      @keyframes esbillaFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      #esbilla-banner {
        animation: esbillaFadeIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

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

    // Insertar selector de idioma
    const banner = document.getElementById('esbilla-banner');
    if (banner) {
      renderLangSelector(banner);
    }

    // Listeners pa los botones definíos na plantilla
    const btnAccept = document.getElementById('esbilla-btn-accept');
    const btnReject = document.getElementById('esbilla-btn-reject');
    const btnSettings = document.getElementById('esbilla-btn-settings');

    if (btnAccept) {
      btnAccept.onclick = () => saveConsent({ analytics: true, marketing: true });
    }
    if (btnReject) {
      btnReject.onclick = () => saveConsent({ analytics: false, marketing: false });
    }
    if (btnSettings) {
      btnSettings.onclick = () => toggleSettings();
    }

    if (showSettings) {
      toggleSettings();
    }
  }

  function renderLangSelector(banner) {
    const availableLangs = Object.keys(translations);
    if (availableLangs.length < 2) return;

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
        ${availableLangs.map(lang => `
          <div class="esbilla-lang-option ${lang === currentLang ? 'active' : ''}" data-lang="${lang}">
            <span class="check">✓</span>
            <span>${langNames[lang] || lang}</span>
          </div>
        `).join('')}
      </div>
    `;

    banner.appendChild(selector);

    // Toggle dropdown
    const toggleBtn = document.getElementById('esbilla-lang-toggle');
    const dropdown = document.getElementById('esbilla-lang-dropdown');

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('esbilla-hidden');
    };

    // Cerrar al clickar fuera
    document.addEventListener('click', () => {
      dropdown.classList.add('esbilla-hidden');
    });

    // Seleccionar idioma
    dropdown.querySelectorAll('.esbilla-lang-option').forEach(opt => {
      opt.onclick = (e) => {
        e.stopPropagation();
        const newLang = opt.getAttribute('data-lang');
        if (newLang !== currentLang) {
          currentLang = newLang;
          localStorage.setItem('esbilla_lang', newLang);
          // Re-renderizar el banner con el nuevo idioma
          const settingsOpen = !!document.getElementById('esbilla-settings-panel');
          renderBanner(settingsOpen);
        }
        dropdown.classList.add('esbilla-hidden');
      };
    });
  }

  function toggleSettings() {
    const banner = document.getElementById('esbilla-banner');
    let settingsPanel = document.getElementById('esbilla-settings-panel');

    if (settingsPanel) {
      settingsPanel.remove();
      return;
    }

    const t = translations[currentLang] || translations['es'];
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
          <div class="esbilla-option-desc">${t.necessaryDesc || 'Imprescindibles para el funcionamiento del sitio'}</div>
        </div>
        <label class="esbilla-toggle">
          <input type="checkbox" checked disabled>
          <span class="esbilla-toggle-slider"></span>
        </label>
      </div>

      <div class="esbilla-option">
        <div class="esbilla-option-info">
          <div class="esbilla-option-label">${t.analyticsLabel || 'Analíticas'}</div>
          <div class="esbilla-option-desc">${t.analyticsDesc || 'Nos ayudan a entender cómo usas el sitio'}</div>
        </div>
        <label class="esbilla-toggle">
          <input type="checkbox" id="esbilla-opt-analytics" ${consent.analytics ? 'checked' : ''}>
          <span class="esbilla-toggle-slider"></span>
        </label>
      </div>

      <div class="esbilla-option">
        <div class="esbilla-option-info">
          <div class="esbilla-option-label">${t.marketingLabel || 'Marketing'}</div>
          <div class="esbilla-option-desc">${t.marketingDesc || 'Permiten personalizar anuncios'}</div>
        </div>
        <label class="esbilla-toggle">
          <input type="checkbox" id="esbilla-opt-marketing" ${consent.marketing ? 'checked' : ''}>
          <span class="esbilla-toggle-slider"></span>
        </label>
      </div>

      <div class="esbilla-actions" style="margin-top: 20px;">
        <button id="esbilla-btn-save" class="btn-maiz">${t.saveSettings || 'Guardar preferencias'}</button>
      </div>
    `;

    banner.appendChild(settingsPanel);

    document.getElementById('esbilla-btn-save').onclick = () => {
      const analytics = document.getElementById('esbilla-opt-analytics').checked;
      const marketing = document.getElementById('esbilla-opt-marketing').checked;
      saveConsent({ analytics, marketing });
    };
  }

  function showMosca() {
    if (document.getElementById('esbilla-mosca')) return;
    const mosca = document.createElement('div');
    mosca.id = 'esbilla-mosca';
    mosca.innerHTML = '🍪';
    mosca.title = translations[currentLang]?.moscaTitle || 'Configurar cookies';
    mosca.onclick = () => {
      mosca.remove();
      // Al calcar la mosca, re-generamos el banner con settings abierto
      renderBanner(true);
    };
    document.body.appendChild(mosca);
  }

  function saveConsent(choices) {
    updateConsentMode(choices);
    localStorage.setItem('esbilla_consent', JSON.stringify(choices));

    // Footprint: Log na BBDD d'Holanda
    fetch(`${apiBase}/api/consent/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmpId, choices, timestamp: new Date().toISOString() })
    }).catch(e => console.warn('Error na trazabilidá:', e));

    document.getElementById('esbilla-wrapper').classList.add('esbilla-hidden');
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

  init();
})();
