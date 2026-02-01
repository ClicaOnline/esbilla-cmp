/**
 * ESBILLA CMP - SDK LOADER v0.2
 * Mentalidá de sestaferia: llimpiu, tresparente y soberanu.
 */
(function() {
  const script = document.currentScript;
  const cmpId = script.getAttribute('data-id');
  const gtmId = script.getAttribute('data-gtm');
  // Si nun se especifica, busca l'API nel mesmu subdominiu del script
  const apiBase = script.getAttribute('data-api') || script.src.replace('/sdk.js', '');

  // 1. Inicializar Consent Mode V2 (Deny by default)
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });

  // 2. Cargar GTM si existe el ID
  if (gtmId) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',gtmId);
  }


  // 3. Llamar al Hórreu (Back-end) pa baxar la "collecha" (configuración)
  fetch(`${apiBase}/api/config/${cmpId}`)
    .then(res => res.json())
    .then(config => {
      // Equí inyectamos el banner y los estilos que vengan del back
      console.log('Esbilla: Configuración cargada dende l\'hórreu.');
      initializeBanner(config);
    })
    .catch(err => console.error('Error na sestaferia de datos:', err));

  function initializeBanner(config) {
    // 1. Verificar si yá hai consentimientu nel hórreu (localStorage)
    if (localStorage.getItem('esbilla_consent')) return;

    // 2. Inyectar los Estilos (CSS)
    // Usamos los tos colores de madera y maíz con contraste WCAG 2 AA
    const style = document.createElement('style');
    style.innerHTML = `
      #esbilla-banner {
        position: fixed; bottom: 20px; left: 20px; right: 20px;
        background: #F8F5F0; border: 2px solid #3D2B1F;
        border-radius: 1.5rem; z-index: 999999; padding: 1.5rem;
        box-shadow: 0 10px 25px -5px rgba(61, 43, 31, 0.2);
        font-family: sans-serif;
      }
      .esbilla-title { color: #3D2B1F; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
      .esbilla-text { color: #66615E; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; }
      .esbilla-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
      .btn-maiz { background: #FFBF00; color: #3D2B1F; border: none; font-weight: bold; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; }
      .btn-stone { background: #E5E7EB; color: #3D2B1F; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; }
      .btn-link { background: none; border: none; color: #3D2B1F; text-decoration: underline; cursor: pointer; font-size: 0.875rem; }
      .esbilla-hidden { display: none; }
      #esbilla-settings { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; }
      .esbilla-toggle { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.875rem; color: #3D2B1F; }
    `;
    document.head.appendChild(style);

    // 3. Inyectar el HTML
    const bannerWrapper = document.createElement('div');
    bannerWrapper.id = 'esbilla-banner';
    bannerWrapper.innerHTML = `
      <div class="esbilla-content">
        <div class="esbilla-title">${config.texts.title}</div>
        <p class="esbilla-text">
          Como cuando separes la panoya de la fueya, equí tu decides qué datos dexas pasar. 
          Usamos cookies pa que la web funcione y, si tu quies, pa saber cómo ameyorar l'hórreu.
        </p>
        
        <div id="esbilla-settings" class="esbilla-hidden">
          <label class="esbilla-toggle"><span>Necesaries</span><input type="checkbox" checked disabled></label>
          <label class="esbilla-toggle"><span>Estadística</span><input type="checkbox" id="esbilla-opt-analytics"></label>
          <label class="esbilla-toggle"><span>Marketing</span><input type="checkbox" id="esbilla-opt-marketing"></label>
        </div>

        <div class="esbilla-actions">
          <button id="esbilla-btn-accept" class="btn-maiz">Aceptar Toa</button>
          <button id="esbilla-btn-reject" class="btn-stone">Refugar</button>
          <button id="esbilla-btn-settings" class="btn-link">Configurar</button>
        </div>
      </div>
    `;
    document.body.appendChild(bannerWrapper);

    // 4. Lóxica de Botones (la que yá teníes)
    document.getElementById('esbilla-btn-accept').onclick = () => {
      saveConsent({ analytics: true, marketing: true });
    };

    document.getElementById('esbilla-btn-reject').onclick = () => {
      saveConsent({ analytics: false, marketing: false });
    };

    document.getElementById('esbilla-btn-settings').onclick = () => {
      document.getElementById('esbilla-settings').classList.toggle('esbilla-hidden');
    };

    function saveConsent(choices) {
      // Actualizamos Consent Mode V2
      const updates = {
        'analytics_storage': choices.analytics ? 'granted' : 'denied',
        'ad_storage': choices.marketing ? 'granted' : 'denied',
        'ad_user_data': choices.marketing ? 'granted' : 'denied',
        'ad_personalization': choices.marketing ? 'granted' : 'denied'
      };
      gtag('consent', 'update', updates);
      
      // Guardamos nel hórreu llocal
      localStorage.setItem('esbilla_consent', JSON.stringify(choices));
      
      // Unviamos el log al Back-end de forma asíncrona
      fetch(`${apiBase}/api/consent/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmpId, choices, timestamp: new Date().toISOString() })
      });

      bannerWrapper.remove();
    }
  }
})();