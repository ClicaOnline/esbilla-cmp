/**
 * Criteo OneTag Module
 * @param {string} accountId - Criteo Account ID
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.criteo = function(accountId) {
  return `
    <!-- Criteo OneTag -->
    <script type="text/javascript" src="//dynamic.criteo.com/js/ld/ld.js?a=${accountId}" async="true"></script>
    <script type="text/javascript">
      window.criteo_q = window.criteo_q || [];
      window.criteo_q.push(
        { event: "setAccount", account: ${accountId} },
        { event: "setSiteType", type: "d" },
        { event: "viewHome" }
      );
    </script>
  `;
};
