/**
 * Amplitude Analytics Module
 * @param {string} apiKey - Amplitude API Key
 * @returns {string} HTML script template
 */
window.EsbillaModules = window.EsbillaModules || {};
window.EsbillaModules.amplitude = function(apiKey) {
  return `
    <!-- Amplitude Analytics -->
    <script type="text/javascript">
      (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
      ;r.type="text/javascript"
      ;r.integrity="sha384-+EO59vL/X7v6VE2s6/F4HxfHlK0nDUVWKVg8K9oUlvffAeeaShVBmbORTC2D3UF+"
      ;r.crossOrigin="anonymous";r.async=true
      ;r.src="https://cdn.amplitude.com/libs/amplitude-8.21.4-min.gz.js"
      ;r.onload=function(){if(!e.amplitude.runQueuedFunctions){
      console.log("[Amplitude] Error")}else{e.amplitude.runQueuedFunctions()}};
      var s=t.getElementsByTagName("script")[0];s.parentNode.insertBefore(r,s)
      ;function i(e,t){e.prototype[t]=function(){
      this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
      var o=function(){this._q=[];return this}
      ;var a=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove"]
      ;for(var c=0;c<a.length;c++){i(o,a[c])}n.Identify=o;var l=function(){this._q=[]
      ;return this}
      ;var u=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
      ;for(var p=0;p<u.length;p++){i(l,u[p])}n.Revenue=l
      ;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","onNewSessionStart","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId","getDeviceId","getUserId","setMinTimeBetweenSessionsMillis","setEventUploadThreshold","setUseDynamicConfig","setServerZone","setServerUrl","sendEvents","setLibrary","setTransport"]
      ;function v(t){function e(e){t[e]=function(){
      t._q.push([e].concat(Array.prototype.slice.call(arguments,0)))}}
      for(var n=0;n<d.length;n++){e(d[n])}}v(n);n.getInstance=function(e){
      e=(!e||e.length===0?"$default_instance":e).toLowerCase()
      ;if(!Object.prototype.hasOwnProperty.call(n._iq,e)){n._iq[e]={_q:[]};v(n._iq[e])
      }return n._iq[e]};e.amplitude=n})(window,document);
      amplitude.getInstance().init("${apiKey}");
    </script>
  `;
};
