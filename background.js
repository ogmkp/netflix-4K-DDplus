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
/*
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts();
    const has = existing.some(s => s.id === "netflix-graphql-blocker");
    if (has) {
      await chrome.scripting.unregisterContentScripts({ ids: ["netflix-graphql-blocker"] });
    }

    await chrome.scripting.registerContentScripts([{
      id: "netflix-graphql-blocker",
      js: ["netflix_skip_household.js"],
      matches: ["*://web.prod.cloud.netflix.com/*"],
      runAt: "document_start",
      world: "MAIN",
      allFrames: true,
      persistAcrossSessions: true
    }]);

    console.log("[Extension] Content script registered in MAIN world @ document_start");
  } catch (e) {
    console.error("[Extension] registerContentScripts error:", e);
  }
});*/


const CS_ID   = "netflix-graphql-blocker";
const MATCHES = ["*://web.prod.cloud.netflix.com/*"];
const FILES   = ["netflix_skip_household.js"];

async function registerCS() {
  await chrome.scripting.unregisterContentScripts({ ids: [CS_ID] }).catch(()=>{});
  await chrome.scripting.registerContentScripts([{
    id: CS_ID,
    js: FILES,
    matches: MATCHES,
    runAt: "document_start",
    world: "MAIN",
    allFrames: true,
    persistAcrossSessions: true
  }]);
  console.log("[Extension] Content script registered");
}

async function unregisterCS() {
  await chrome.scripting.unregisterContentScripts({ ids: [CS_ID] }).catch(()=>{});
  console.log("[Extension] Content script unregistered");
}

async function applyFkhouse() {
  const { fkhouse = false } = await chrome.storage.sync.get({ fkhouse: false });
  return fkhouse === true ? registerCS() : unregisterCS();
}

chrome.runtime.onInstalled.addListener(() => { applyFkhouse().catch(console.error); });
chrome.runtime.onStartup?.addListener(() => { applyFkhouse().catch(console.error); });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !("fkhouse" in changes)) return;
  applyFkhouse().catch(console.error);
});
