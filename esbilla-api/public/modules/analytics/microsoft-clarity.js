/**
 * Microsoft Clarity Module
 * @param {string} projectId - Clarity Project ID
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.microsoftClarity = function(projectId) {
  return `
    <!-- Microsoft Clarity -->
    <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");
    </script>
  `;
};
