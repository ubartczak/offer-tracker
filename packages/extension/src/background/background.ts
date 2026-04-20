import type { AuthTokens } from "../types";

const API_URL = "http://localhost:3001";

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
  if (message.type === "LOGIN") {
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload),
    })
      .then((r) => r.json())
      .then(async (data: AuthTokens & { error?: string }) => {
        if (data.accessToken) {
          await chrome.storage.local.set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          sendResponse({ ok: true });
        } else {
          sendResponse({ ok: false, error: data.error ?? "Błąd logowania" });
        }
      })
      .catch(() => sendResponse({ ok: false, error: "Brak połączenia z API" }));
    return true;
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
