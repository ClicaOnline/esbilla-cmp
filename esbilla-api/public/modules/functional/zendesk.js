/**
 * Zendesk Web Widget Module
 * @param {string} key - Zendesk Widget Key
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.zendesk = function(key) {
  return `
    <!-- Zendesk Web Widget -->
    <script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=${key}"></script>
  `;
};
