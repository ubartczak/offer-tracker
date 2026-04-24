import axios from "axios";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (!refreshing) {
      refreshing = (async () => {
        const rt = getRefreshToken();
        if (!rt) { clearTokens(); window.location.href = "/login"; return; }
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: rt });
          saveTokens(data.accessToken, data.refreshToken, data.email ?? "");
        } catch {
          clearTokens();
          window.location.href = "/login";
        } finally {
          refreshing = null;
        }
      })();
    }

    await refreshing;
    original.headers.Authorization = `Bearer ${getAccessToken()}`;
    return api(original);
  }
);
