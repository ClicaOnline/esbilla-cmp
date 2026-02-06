/**
 * Google Analytics 4 Module
 * @param {string} measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.googleAnalytics = function(measurementId) {
  return `
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
  `;
};
