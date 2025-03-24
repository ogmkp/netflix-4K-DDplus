let getElementByXPath = function (xpath) {
	return document.evaluate(
		xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
	).singleNodeValue;
};

let fn = function () {

	const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
	if(!videoPlayer) {
		console.log("API Not Loading!");
		return false;
	}
	const player = videoPlayer.getVideoPlayerBySessionId(videoPlayer.getAllPlayerSessionIds()[0]);
	if(!player) {
		console.log("Video Not Loading!");
		return false;
	}
	if(!player.isPlaying()) {
		console.log("Video Not Playing!");
		return false;
	}

	const VIDEO_SELECT = getElementByXPath("//div[text()='Video Bitrate / VMAF']");
	const AUDIO_SELECT = getElementByXPath("//div[text()='Audio Bitrate']");
	const BUTTON = getElementByXPath("//button[text()='Override']");

	window.dispatchEvent(new KeyboardEvent('keydown', {
		keyCode: 66,
		ctrlKey: true,
		altKey: true,
		shiftKey: true,
	}));

	if (!(VIDEO_SELECT && AUDIO_SELECT && BUTTON)) {
		console.log("One or more elements not found!");
		return false;
	}

    for (let el of [VIDEO_SELECT, AUDIO_SELECT]) {
        let parent = el.parentElement;
        if (!parent) {
            console.log("Parent element not found for", el);
            return false;
        }

        let options = parent.querySelectorAll('select > option');

        let allOptionsEmpty = Array.from(options).every(option => option.textContent.trim() === "");
        if (allOptionsEmpty) {
            console.log("All options are empty!");
            return false;
        }

        options.forEach(option => option.removeAttribute('selected'));
        options[options.length - 1].setAttribute('selected', 'selected');
        
        console.log("All Done!");
    }

	console.log("Video Playing!");
    setTimeout(() => {
        BUTTON.click();
    }, 1000);

	return true;
};

let run = function () {
	fn() || setTimeout(run, 100)	
};

const WATCH_REGEXP = /netflix.com\/watch\/.*/;

let oldLocation;

if (window.globalOptions === undefined) {
    try {
        window.globalOptions = JSON.parse(document.getElementById("netflix-4k-5.1ddplus-settings").innerText);
    } catch(e) {
        console.error("Could not load settings:", e);
    }
}
if(window.globalOptions.setMaxBitrate ) {
	console.log("netflix_max_bitrate.js enabled");
	//setInterval(test, 500);
	setInterval(function () {
		
		let newLocation = window.location.toString();

		if (newLocation !== oldLocation) {
			oldLocation = newLocation;
			WATCH_REGEXP.test(newLocation) && run();
		}
  }, 500);
}
