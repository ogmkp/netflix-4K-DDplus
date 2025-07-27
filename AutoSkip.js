(function waitForGlobalOptions() {
  if (window.globalOptions?.AutoSkip) {
    console.log("AutoSkip.js enabled");

    function click(selector) {
      const el = document.querySelector(selector);
      if (el && !el.disabled) el.click();
    }

    function clickNext() {
      click('[data-uia="next-episode-seamless-button"]') ||
      click('[data-uia="next-episode-seamless-button-draining"]');
    }

    function scan() {
      click('[data-uia="player-skip-intro"]');
      click('[data-uia="player-skip-recap"]');
      clickNext();
    }

    const observer = new MutationObserver(scan);

    function init() {
      if (!document.body) return;
      observer.observe(document.body, { childList: true, subtree: true });
      scan();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } else {
    setTimeout(waitForGlobalOptions, 100); // 100ms 后重试
  }
})();
