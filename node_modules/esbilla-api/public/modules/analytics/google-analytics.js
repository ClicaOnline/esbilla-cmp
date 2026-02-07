/**
 * Google Analytics 4 Module (G100 Compliant)
 * @param {string} measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 * @returns {string} HTML script template
 *
 * G100 Compliance: Carga gtag.js siempre para enviar pings anónimos
 * cuando analytics_storage está en 'denied' (modelado de conversiones)
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.googleAnalytics = function(measurementId) {
  return `
    <!-- Google Analytics 4 (G100 Compliant) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      // G100: send_page_view: false - Se enviará manualmente después del consent
      gtag('config', '${measurementId}', {
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure',
        'send_page_view': false
      });

      // Marcar que GA4 está listo para recibir el page_view
      window._esbilla_ga4_ready = true;
      window._esbilla_ga4_id = '${measurementId}';
    </script>
  `;
};
