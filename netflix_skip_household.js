(() => {
  'use strict';

  if (window.__NetflixBlockerPatched) return;
  window.__NetflixBlockerPatched = true;

  const targetUrl = "web.prod.cloud.netflix.com/graphql";

  function shouldBlock(json) {
    if (!json || !json.data) return false;
    return (
      Object.prototype.hasOwnProperty.call(json.data, 'clcsInterstitialLolomo') ||
      Object.prototype.hasOwnProperty.call(json.data, 'clcsInterstitialPlaybackV2')
    );
  }

  // ---------- Patch fetch ----------
  const originalFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
  if (originalFetch) {
    window.fetch = async function(input, init) {
      let url;
      try {
        url = typeof input === 'string' ? input : input && input.url;
      } catch {}
      const isTarget = url && String(url).includes(targetUrl);

      const resp = await originalFetch(input, init);
      if (!isTarget) return resp;

      try {
        const ct = resp.headers && resp.headers.get && resp.headers.get('content-type');
        const clone = resp.clone();
        const text = await clone.text();
        const looksJson = (ct && ct.includes('application/json')) || (/^[\s]*[{[]/.test(text));
        if (looksJson) {
          const json = JSON.parse(text);
          if (shouldBlock(json)) {
            console.log("[NetflixBlocker] Blocked fetch with target field(s)");
            return new Response("{}", {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
      } catch (e) {
         console.warn("[NetflixBlocker] Fetch intercept error:", e);
      }
      return resp;
    };
  } else {
    console.warn("[NetflixBlocker] window.fetch not available at injection time");
  }


  const OriginalXHR = window.XMLHttpRequest;
  if (!OriginalXHR || !OriginalXHR.prototype) {
    console.warn("[NetflixBlocker] XMLHttpRequest not available at injection time");
    return;
  }

  const origOpen = OriginalXHR.prototype.open;
  const origSend = OriginalXHR.prototype.send;

  OriginalXHR.prototype.open = function(method, url, ...args) {
    try {
      this.__nb_url = String(url || '');
    } catch {
      this.__nb_url = '';
    }
    return origOpen.call(this, method, url, ...args);
  };

  OriginalXHR.prototype.send = function(body) {
    if (this.__nb_url && this.__nb_url.includes(targetUrl)) {
      const self = this;
      let overridden = false;

      const origOnReady = self.onreadystatechange;

      self.onreadystatechange = function() {
        try {
          if (!overridden && self.readyState === 4 && self.status === 200) {
            let json = null;
            try {
              const respText = typeof self.responseText === 'string' ? self.responseText : '';
              if (/^[\s]*[{[]/.test(respText)) {
                json = JSON.parse(respText);
              }
            } catch {
              json = null;
            }

            if (shouldBlock(json)) {
              console.log("[NetflixBlocker] Blocked XHR with target field(s)");
              try {
                const fake = '{}';
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
        } finally {
          if (typeof origOnReady === 'function') {
            try { origOnReady.apply(this, arguments); } catch {}
          }
        }
      };
    }

    return origSend.call(this, body);
  };

  console.log("[NetflixBlocker] patched fetch & XHR prototypes in MAIN world @ document_start");
})();
