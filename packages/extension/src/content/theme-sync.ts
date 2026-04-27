// Sync theme from web app's localStorage to chrome.storage on page load
const saved = localStorage.getItem("jam-theme");
if (saved) {
  chrome.storage.local.set({ "jam-theme": saved });
}

// Sync on live theme changes sent via postMessage from ThemeContext
window.addEventListener("message", (e: MessageEvent) => {
  if (
    e.origin === window.location.origin &&
    e.data?.type === "JAM_SET_THEME" &&
    (e.data.theme === "persimmon" || e.data.theme === "blueberry")
  ) {
    chrome.storage.local.set({ "jam-theme": e.data.theme });
  }
});
