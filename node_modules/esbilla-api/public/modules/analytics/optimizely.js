/**
 * Optimizely Module
 * @param {string} projectId - Optimizely Project ID
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.optimizely = function(projectId) {
  return `
    <!-- Optimizely -->
    <script src="https://cdn.optimizely.com/js/${projectId}.js"></script>
  `;
};
