// Auth utilities - uses Supabase client for auto token refresh
// VERSION: 2026-03-16-v8

import { supabase } from './supabase'

const AUTH_TOKEN_KEY = 'pf_token'
const AUTH_REFRESH_KEY = 'pf_refresh'

// Legacy: Get token from localStorage (for backwards compatibility)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

// Check if user is authenticated using Supabase session
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Legacy localStorage functions for OAuth callback
export function setAuthToken(token: string, refreshToken?: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_KEY, refreshToken)
  }
  window.dispatchEvent(new Event('auth-change'))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_KEY)
  supabase.auth.signOut()
  window.dispatchEvent(new Event('auth-change'))
}

// Subscribe to auth changes
export function onAuthChange(callback: (isSignedIn: boolean) => void) {
  const handler = async () => {
    const signedIn = await isAuthenticated()
    callback(signedIn)
  }
  
  window.addEventListener('auth-change', handler)
  
  // Also subscribe to Supabase auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(!!session)
  })
  
  return () => {
    window.removeEventListener('auth-change', handler)
    subscription.unsubscribe()
  }
}
