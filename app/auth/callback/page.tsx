'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// VERSION: 2026-03-16-v2
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    // Check URL for access token
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken) {
      // Save tokens
      localStorage.setItem('pf_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('pf_refresh', refreshToken)
      }
      setStatus('Success! Redirecting...')
      
      // Redirect to profile
      setTimeout(() => {
        window.location.href = '/profile/'
      }, 1000)
    } else {
      // Check for error
      const error = params.get('error_description')
      if (error) {
        setStatus('Sign in failed: ' + error)
      } else {
        setStatus('Processing...')
      }
    }
  }, [])

  const isError = status.includes('failed')

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
