const ACCESS_KEY = "offer-tracker:access";
const REFRESH_KEY = "offer-tracker:refresh";
const EMAIL_KEY = "offer-tracker:email";

export function getAccessToken() { return localStorage.getItem(ACCESS_KEY); }
export function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }
export function getUserEmail() { return localStorage.getItem(EMAIL_KEY); }

export function saveTokens(accessToken: string, refreshToken: string, email: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
