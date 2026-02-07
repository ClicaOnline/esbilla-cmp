/**
 * SealMetrics Analytics Module (Cookieless - Sin consentimiento requerido)
 * @param {string} siteId - SealMetrics Site ID
 * @returns {string} HTML script template
 *
 * SealMetrics es cookieless y cumple GDPR sin consentimiento
 * No usa cookies, no almacena IPs, no identifica usuarios
 * Captura 100% del tráfico de forma legal y segura
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.sealmetrics = function(siteId) {
  return `
    <!-- SealMetrics Analytics (Cookieless) -->
    <script>
      (function(s,e,a,l,m,t,r,i,c,s_){
        s_=s[e]||(s[e]=[]);
        s_.push({site: '${siteId}'});
        m=a.createElement(l);
        m.async=1;
        m.src=t+'?v='+Date.now();
        r=a.getElementsByTagName(l)[0];
        r.parentNode.insertBefore(m,r);
      })(window,'sealmetrics',document,'script','https://cdn.sealmetrics.com/sm.js');
    </script>
  `;
};
