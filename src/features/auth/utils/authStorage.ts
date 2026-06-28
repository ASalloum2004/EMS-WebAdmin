import type { AuthSession } from "../types";

const AUTH_STORAGE_KEY = "auth_session";

export function getAuthSession(): AuthSession | null {
  try {
    const sessionStr = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionStr) return JSON.parse(sessionStr) as AuthSession;
    
    const localStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localStr) return JSON.parse(localStr) as AuthSession;

    return null;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function setAuthSession(session: AuthSession, rememberMe: boolean = false): void {
  clearAuthSession(); // prevent stale duplicated sessions
  try {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore write errors
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
