// Runs on the dashboard page. Tells the background to sync httpOnly cookies
// from the API domain into chrome.storage.local whenever auth state changes.

function requestSync() {
  chrome.runtime.sendMessage({ type: "SYNC_COOKIES" }).catch(() => {});
}

requestSync();
window.addEventListener("storage", requestSync);
window.addEventListener("offer-tracker:auth-changed", requestSync);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CLEAR_TOKENS") {
    window.dispatchEvent(new CustomEvent("offer-tracker:clear-tokens"));
  }
});
