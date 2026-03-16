'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, onAuthChange } from '@/lib/auth'

// VERSION: 2026-03-16-v8
export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check auth on mount
    const checkAuth = async () => {
      const signedIn = await isAuthenticated()
      setIsSignedIn(signedIn)
      setIsLoading(false)
    }
    
    checkAuth()

    // Subscribe to auth changes
    const unsubscribe = onAuthChange((signedIn) => {
      setIsSignedIn(signedIn)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { isSignedIn, isLoading }
}
