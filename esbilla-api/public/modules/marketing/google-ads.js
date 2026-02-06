/**
 * Google Ads Conversion Tracking Module
 * @param {string} conversionId - Google Ads Conversion ID (AW-XXXXXXXXXX)
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.googleAds = function(conversionId) {
  return `
    <!-- Google Ads Conversion Tracking -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${conversionId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${conversionId}');
    </script>
  `;
};
