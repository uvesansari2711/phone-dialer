const AUTH_TOKEN_KEY = 'dialer-auth-token';
const AUTH_EMAIL_KEY = 'dialer-auth-email';

export function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthEmail(): string | null {
  return sessionStorage.getItem(AUTH_EMAIL_KEY);
}

export function setAuthSession(token: string, email: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_EMAIL_KEY, email);
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_EMAIL_KEY);
}

export const AUTH_LOGOUT_EVENT = 'dialer:auth-logout';

export function notifyAuthLogout(): void {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}
