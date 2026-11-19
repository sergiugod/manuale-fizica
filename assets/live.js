/* Legătura cu Google Apps Script (total comun pe ecran).
   Adresa scriptului se setează o singură dată: în bara prezentării (butonul ⚙) sau în assets/config.js.
   Comunicarea folosește JSONP, care funcționează din GitHub Pages fără setări CORS. */
(function(){
  const KEY = "fa_live_url";
  function getUrl(){
    try{ const u = localStorage.getItem(KEY); if(u) return u; }catch(e){}
    return (window.LIVE_CONFIG && window.LIVE_CONFIG.url) || "";
  }
  function setUrl(u){ try{ localStorage.setItem(KEY, u.trim()); }catch(e){} }
  let n = 0;
  function jsonp(params, timeout){
    return new Promise((resolve, reject) => {
      const base = getUrl();
      if(!base){ reject(new Error("no-url")); return; }
      const cb = "__fa_cb" + (++n) + "_" + Date.now();
      const s = document.createElement("script");
      const t = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, timeout || 8000);
      function cleanup(){ clearTimeout(t); try{ delete window[cb]; }catch(e){ window[cb]=undefined; } s.remove(); }
      window[cb] = (data) => { cleanup(); resolve(data); };
      const qs = new URLSearchParams(Object.assign({}, params, {callback: cb, _: Date.now()}));
      s.src = base + (base.includes("?") ? "&" : "?") + qs.toString();
      s.onerror = () => { cleanup(); reject(new Error("network")); };
      document.head.appendChild(s);
    });
  }
  function deviceId(){
    try{
      let d = localStorage.getItem("fa_dev");
      if(!d){ d = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("fa_dev", d); }
      return d;
    }catch(e){ return "anon"; }
  }
  window.Live = {
    getUrl, setUrl, deviceId,
    enabled: () => !!getUrl(),
    vote: (q, a) => jsonp({action:"vote", q, a, d: deviceId()}),
    results: (q) => jsonp({action:"results", q}),
    reset: (q, pin) => jsonp({action:"reset", q, pin})
  };
})();
