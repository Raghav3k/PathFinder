'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        const error_description = searchParams.get('error_description')

        if (error_description) {
          setError(error_description)
          setStatus('Authentication failed')
          return
        }

        if (access_token) {
          // Store tokens
          localStorage.setItem('supabase_access_token', access_token)
          if (refresh_token) {
            localStorage.setItem('supabase_refresh_token', refresh_token)
          }
          
          setStatus('Success! Redirecting...')
          
          // Redirect to profile after short delay
          setTimeout(() => {
            router.push('/profile/')
          }, 1500)
        } else {
          setStatus('Waiting for authentication...')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError('An error occurred during sign in.')
        setStatus('Error')
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Sign In Failed</h1>
        <p className="text-slate-400 mb-4">{error}</p>
        <Link href="/auth/signin/" className="btn-primary inline-block">
          Try Again
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{status}</h1>
      <p className="text-slate-400">Please wait while we complete your sign in.</p>
    </>
  )
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-[#0c0c12] flex items-center justify-center">
      <div className="text-center p-8">
        <Suspense fallback={
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
            <p className="text-slate-400">Please wait...</p>
          </>
        }>
          <CallbackHandler />
        </Suspense>
      </div>
    </main>
  )
}
