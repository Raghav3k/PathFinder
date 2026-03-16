'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { setAuthToken } from '@/lib/auth'

// VERSION: 2026-03-16-v3
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    const handleCallback = () => {
      // Check URL for access token (Supabase sends it in hash)
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        // Save tokens - this also dispatches auth-change event
        setAuthToken(accessToken, refreshToken || undefined)
        setStatus('Success! Redirecting...')
        
        // Wait a bit longer to ensure localStorage is written
        setTimeout(() => {
          window.location.replace('/profile/')
        }, 1500)
      } else {
        // Check for error
        const error = params.get('error_description')
        if (error) {
          setStatus('Sign in failed: ' + error)
        } else {
          setStatus('No auth data found. Please try again.')
        }
      }
    }

    handleCallback()
  }, [])

  const isError = status.includes('failed') || status.includes('No auth')

  return (
    <main className="min-h-screen bg-[#0c0c12] flex items-center justify-center">
      <div className="text-center p-8">
        {isError ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Sign In Failed</h1>
            <p className="text-slate-400 mb-4">{status}</p>
            <Link href="/auth/signin/" className="btn-primary inline-block px-6 py-2">
              Try Again
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">{status}</h1>
            <p className="text-slate-400">Please wait...</p>
          </>
        )}
      </div>
    </main>
  )
}
