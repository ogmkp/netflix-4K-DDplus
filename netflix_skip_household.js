(() => {
  'use strict';

  const targetUrl = "web.prod.cloud.netflix.com/graphql";

  function shouldBlock(json) {
    if (!json || !json.data) return false;
    return (
      Object.prototype.hasOwnProperty.call(json.data, 'clcsInterstitialLolomo') ||
      Object.prototype.hasOwnProperty.call(json.data, 'clcsInterstitialPlaybackV2')
    );
  }

  // ---- Patch fetch ----
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;

  if (originalFetch) {
    window.fetch = async function(input, init) {
      try {
        const url = typeof input === 'string' ? input : input?.url;
        if (url && url.includes(targetUrl)) {
          return originalFetch(input, init).then(async resp => {
            try {
              const clone = resp.clone();
              const text = await clone.text();
              const json = JSON.parse(text);
              if (shouldBlock(json)) {
                console.log("[NetflixBlocker] Blocked fetch with target field(s)");
                return new Response("{}", {
                  status: 200,
                  headers: { "Content-Type": "application/json" }
                });
              }
            } catch (e) {
              // console.warn("[NetflixBlocker] Fetch intercept error:", e);
            }
            return resp;
          });
        }
      } catch (e) {
        console.warn("[NetflixBlocker] fetch wrapper error:", e);
      }
      return originalFetch(input, init);
    };
  } else {
    console.warn("[NetflixBlocker] window.fetch not available at injection time");
  }

  // ---- Patch XMLHttpRequest ----
  const OriginalXHR = window.XMLHttpRequest;
  function XHRProxy() {
    const xhr = new OriginalXHR();
    let requestUrl = '';
    let overridden = false;

    const open = xhr.open;
    xhr.open = function(method, url, ...args) {
      try { requestUrl = String(url || ''); } catch { requestUrl = ''; }
      return open.call(this, method, url, ...args);
    };

    const send = xhr.send;
    xhr.send = function(body) {
      if (requestUrl && requestUrl.includes(targetUrl)) {
        const self = this;
        const origOnReadyStateChange = self.onreadystatechange;

        self.onreadystatechange = function() {
          try {
            if (!overridden && self.readyState === 4 && self.status === 200) {
              let json = null;
              try {
                json = JSON.parse(self.responseText);
              } catch {
                json = null;
              }
              if (shouldBlock(json)) {
                console.log("[NetflixBlocker] Blocked XHR with target field(s)");

                try {
                  const fake = '{}';
                  // responseText
                  Object.defineProperty(self, 'responseText', {
                    configurable: true,
                    get() { return fake; }
                  });
                  Object.defineProperty(self, 'response', {
                    configurable: true,
                    get() { return fake; }
                  });
                  overridden = true;
                } catch (e) {
                  console.warn("[NetflixBlocker] defineProperty on XHR failed:", e);
                }
              }
            }
          } catch (e) {
            console.warn("[NetflixBlocker] XHR intercept error:", e);
          }
          if (typeof origOnReadyStateChange === 'function') {
            try { origOnReadyStateChange.apply(this, arguments); } catch {}
          }
        };
      }
      return send.call(this, body);
    };

    return xhr;
  }
  window.XMLHttpRequest = XHRProxy;

  console.log("[NetflixBlocker] injected in MAIN world @ document_start");
})();
