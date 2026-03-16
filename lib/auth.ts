// Simple auth utility for static export
// VERSION: 2026-03-16-v3

export const AUTH_TOKEN_KEY = 'pf_token'
export const AUTH_REFRESH_KEY = 'pf_refresh'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string, refreshToken?: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_KEY, refreshToken)
  }
  // Dispatch event for cross-tab sync
  window.dispatchEvent(new Event('auth-change'))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
