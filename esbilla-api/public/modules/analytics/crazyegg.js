/**
 * Crazy Egg Heatmaps Module
 * @param {string} accountNumber - Crazy Egg Account Number
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.crazyEgg = function(accountNumber) {
  return `
    <!-- Crazy Egg -->
    <script type="text/javascript" src="//script.crazyegg.com/pages/scripts/${accountNumber}.js" async="async"></script>
  `;
};
