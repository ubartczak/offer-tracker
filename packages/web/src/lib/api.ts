import axios from "axios";
import { clearSession } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send/receive httpOnly cookies
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
        try {
          await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          // new cookies set by server; notify extension to sync
          window.dispatchEvent(new CustomEvent("offer-tracker:auth-changed"));
        } catch {
          clearSession();
          window.location.href = "/login";
        } finally {
          refreshing = null;
        }
      })();
    }

    await refreshing;
    return api(original);
  }
);
