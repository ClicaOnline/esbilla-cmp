/**
 * Twitter/X Pixel Module
 * @param {string} pixelId - Twitter Pixel ID
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.twitterPixel = function(pixelId) {
  return `
    <!-- Twitter conversion tracking base code -->
    <script>
      !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
      },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
      a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
      twq('config','${pixelId}');
    </script>
  `;
};
