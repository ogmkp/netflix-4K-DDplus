(function waitForGlobalOptions() {
    if (window.globalOptions?.AutoSkip) {
		console.log("netflix_auto_skip.js enabled");
        const selectors = [
            '[data-uia="player-skip-intro"]',
            '[data-uia="player-skip-recap"]',
            '[data-uia="player-skip-preplay"]',
            '[data-uia="next-episode-seamless-button"]',
            '[data-uia="next-episode-seamless-button-draining"]'
        ];

        function click(selector) {
            const el = document.querySelector(selector);
            if (el && !el.disabled)
                el.click();
        }

        function scan() {
            selectors.forEach(click);
        }

        const observer = new MutationObserver(scan);

        function init() {
            if (!document.body)
                return setTimeout(init, 100);
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            scan();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    } else {
        setTimeout(waitForGlobalOptions, 100);
    }
})();
