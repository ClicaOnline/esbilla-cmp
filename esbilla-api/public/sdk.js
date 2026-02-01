/**
 * ESBILLA CMP - SDK v0.4 (Modular)
 * Lóxica separada de la presentación pa un hórreu téunicu llimpiu.
 */
(function() {
  const script = document.currentScript;
  const cmpId = script.getAttribute('data-id') || 'default-site';
  const gtmId = script.getAttribute('data-gtm');
  const apiBase = script.getAttribute('data-api') || script.src.replace('/sdk.js', '');

  let currentLang = 'es';
  let translations = {};

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
      currentLang = navigator.language.startsWith('ast') ? 'ast' : 'es';
      
      // A. Baxar testos y config
      const configRes = await fetch(`${apiBase}/i18n/config.json`);
      translations = await configRes.json();
      const t = translations[currentLang];

      // B. Baxar la plantilla HTML escoyida
      const templateRes = await fetch(`${apiBase}/templates/${t.template}`);
      let html = await templateRes.text();

      // C. 'Esbillar' (reemplazar) testos na plantilla
      Object.keys(t).forEach(key => {
        html = html.replaceAll(`{{${key}}}`, t[key]);
      });

      injectBaseStyles();

      if (localStorage.getItem('esbilla_consent')) {
        const oldConsent = JSON.parse(localStorage.getItem('esbilla_consent'));
        updateConsentMode(oldConsent);
        showMosca();
      } else {
        renderBanner(html);
      }
    } catch (err) {
      console.error('Error na sestaferia modular:', err);
    }
  }

  function injectBaseStyles() {
    if (document.getElementById('esbilla-base-styles')) return;
    const style = document.createElement('style');
    style.id = 'esbilla-base-styles';
    style.innerHTML = `
      #esbilla-mosca { position: fixed; bottom: 20px; left: 20px; cursor: pointer; z-index: 999998; background: #FFBF00; padding: 12px; border-radius: 50%; box-shadow: 0 4px 10px rgba(61, 43, 31, 0.3); font-size: 24px; border: 2px solid #3D2B1F; transition: transform 0.2s; }
      #esbilla-mosca:hover { transform: scale(1.1); }
      .esbilla-hidden { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function renderBanner(html) {
    let container = document.getElementById('esbilla-wrapper');
    if (!container) {
      container = document.createElement('div');
      container.id = 'esbilla-wrapper';
      document.body.appendChild(container);
    }
    container.innerHTML = html;
    container.classList.remove('esbilla-hidden');

    // Listeners pa los botones definíos na plantilla
    document.getElementById('esbilla-btn-accept').onclick = () => saveConsent({ analytics: true, marketing: true });
    document.getElementById('esbilla-btn-reject').onclick = () => saveConsent({ analytics: false, marketing: false });
  }

  function showMosca() {
    if (document.getElementById('esbilla-mosca')) return;
    const mosca = document.createElement('div');
    mosca.id = 'esbilla-mosca';
    mosca.innerHTML = '🍪';
    mosca.onclick = () => {
      mosca.remove();
      // Al calcar la mosca, re-generamos el banner con la config actual
      const t = translations[currentLang];
      init(); 
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