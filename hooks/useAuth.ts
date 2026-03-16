'use client'

import { useState, useEffect } from 'react'
import { getAuthToken, isAuthenticated } from '@/lib/auth'

// VERSION: 2026-03-16-v3
export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check auth on mount
    const checkAuth = () => {
      setIsSignedIn(isAuthenticated())
      setIsLoading(false)
    }
    
    checkAuth()

    // Listen for auth changes from other tabs/components
    window.addEventListener('auth-change', checkAuth)
    
    // Also check periodically for the first few seconds after load
    // This handles the race condition after OAuth redirect
    const checks = [100, 500, 1000, 2000]
    const timeouts = checks.map(delay => 
      setTimeout(checkAuth, delay)
    )

    return () => {
      window.removeEventListener('auth-change', checkAuth)
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return { isSignedIn, isLoading }
}
