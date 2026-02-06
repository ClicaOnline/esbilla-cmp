/**
 * Taboola Pixel Module
 * @param {string} accountId - Taboola Account ID
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.taboola = function(accountId) {
  return `
    <!-- Taboola Pixel Code -->
    <script type='text/javascript'>
      window._tfa = window._tfa || [];
      window._tfa.push({notify: 'event', name: 'page_view', id: ${accountId}});
      !function (t, f, a, x) {
        if (!document.getElementById(x)) {
          t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
        }
      }(document.createElement('script'),
      document.getElementsByTagName('script')[0],
      '//cdn.taboola.com/libtrc/unip/${accountId}/tfa.js',
      'tb_tfa_script');
    </script>
    <noscript>
      <img src='https://trc.taboola.com/sg/${accountId}/log/3/unip?en=page_view' width='0' height='0' style='display:none'/>
    </noscript>
  `;
};
