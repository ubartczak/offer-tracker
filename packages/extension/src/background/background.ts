import type { AuthTokens } from "../types";

declare const __API_URL__: string;
declare const __WEB_URL__: string;
const API_URL = __API_URL__;
const WEB_URL = __WEB_URL__;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = await chrome.storage.local.get("refreshToken");
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await chrome.storage.local.remove(["accessToken", "refreshToken"]);
    return null;
  }

  const data: AuthTokens = await res.json();
  await chrome.storage.local.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data.accessToken;
}

async function apiFetch(path: string, options: RequestInit): Promise<Response> {
  let { accessToken } = await chrome.storage.local.get("accessToken");

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    accessToken = await refreshAccessToken();
    if (!accessToken) throw new Error("UNAUTHENTICATED");

    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  }

  return res;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SYNC_COOKIES") {
    // Read httpOnly cookies set by the API and store as Bearer tokens
    Promise.all([
      chrome.cookies.get({ url: API_URL, name: "accessToken" }),
      chrome.cookies.get({ url: API_URL, name: "refreshToken" }),
    ]).then(([accessCookie, refreshCookie]) => {
      if (accessCookie && refreshCookie) {
        chrome.storage.local.set({
          accessToken: accessCookie.value,
          refreshToken: refreshCookie.value,
        });
      } else {
        chrome.storage.local.remove(["accessToken", "refreshToken"]);
      }
    });
    return false;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.get("refreshToken").then(async ({ refreshToken }) => {
      if (refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
      await chrome.storage.local.remove(["accessToken", "refreshToken"]);

      // tell web-bridge in open dashboard tabs to clear the web session
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url?.startsWith(WEB_URL)) {
          chrome.tabs.sendMessage(tab.id, { type: "CLEAR_TOKENS" }).catch(() => {});
        }
      }

      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "SAVE_APPLICATION") {
    apiFetch("/applications", {
      method: "POST",
      body: JSON.stringify(message.payload),
    })
      .then(async (res) => {
        const data = await res.json();
        sendResponse(res.ok ? { ok: true, data } : { ok: false, error: data.error });
      })
      .catch((err: Error) =>
        sendResponse({ ok: false, error: err.message })
      );
    return true;
  }

  if (message.type === "CHECK_AUTH") {
    chrome.storage.local.get("accessToken").then(({ accessToken }) =>
      sendResponse({ authenticated: !!accessToken })
    );
    return true;
  }
});
