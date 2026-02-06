/**
 * HubSpot Tracking Module
 * @param {string} portalId - HubSpot Portal ID
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.hubspot = function(portalId) {
  return `
    <!-- HubSpot Tracking Code -->
    <script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/${portalId}.js"></script>
  `;
};
