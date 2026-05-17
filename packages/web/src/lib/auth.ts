const EMAIL_KEY = "offer-tracker:email";

export function getUserEmail() { return localStorage.getItem(EMAIL_KEY); }

export function saveSession(email: string) {
  localStorage.setItem(EMAIL_KEY, email);
  window.dispatchEvent(new CustomEvent("offer-tracker:auth-changed"));
}

export function clearSession() {
  localStorage.removeItem(EMAIL_KEY);
  window.dispatchEvent(new CustomEvent("offer-tracker:auth-changed"));
}

// extension logout → clear web session and redirect
window.addEventListener("offer-tracker:clear-tokens", () => {
  localStorage.removeItem(EMAIL_KEY);
  window.location.href = "/login";
});
