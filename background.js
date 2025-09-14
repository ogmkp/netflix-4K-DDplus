chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) {
    if (tab.url.includes("netflix.com")) {
      chrome.action.enable(tabId);
    } else {
      chrome.action.disable(tabId);
    }
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url.includes("netflix.com")) {
      chrome.action.enable(tab.id);
    } else {
      chrome.action.disable(tab.id);
    }
  });
});