/**
 * Uinterbox Marketing Pixel Module
 * @param {Object} config - Configuración de Uinterbox
 * @param {string} config.pixelId - Uinterbox Pixel ID
 * @param {string} config.subdomain - Subdominio (hyperion, feebbo, emas, etc.)
 * @returns {string} HTML script template
 *
 * Uinterbox: Plataforma de tracking para marketing de afiliados
 * Requiere consentimiento de marketing
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.uinterbox = function(config) {
  // Si config es string simple (pixelId), usar subdomain por defecto
  if (typeof config === 'string') {
    config = { pixelId: config, subdomain: 'hyperion' };
  }

  const { pixelId, subdomain = 'hyperion' } = config;

  return `
    <!-- Uinterbox Marketing Pixel -->
    <script>
      (function(u,i,n,t,e,r,b,o,x) {
        u[e]=u[e]||function(){(u[e].q=u[e].q||[]).push(arguments)};
        u[e].l=1*new Date();
        r=i.createElement(n);
        b=i.getElementsByTagName(n)[0];
        r.async=1;
        r.src='https://${subdomain}.uinterbox.com/pixel/${pixelId}.js';
        b.parentNode.insertBefore(r,b);
      })(window,document,'script',0,0,'uinterbox');

      // Inicializar tracking
      uinterbox('init', '${pixelId}');
      uinterbox('track', 'PageView');
    </script>
    <noscript>
      <img height="1" width="1" style="display:none"
           src="https://${subdomain}.uinterbox.com/pixel/${pixelId}/pageview" />
    </noscript>
  `;
};
