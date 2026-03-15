'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'

// Simple direct Supabase client for this page only
const SUPABASE_URL = 'https://kcbvupdqgbevatxctlbb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnZ1cGRxZ2JldmF0eGN0bGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDM0MDUsImV4cCI6MjA4OTExOTQwNX0.gRFM_nFYe9URrzfJjUDGNDz0b8pybCePe6uLxcx9rFQ'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  // Check if already signed in on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        })
        if (response.ok) {
          router.push('/profile/')
        }
      } catch {
        // Not signed in, that's fine
      }
    }
    checkSession()
  }, [router])

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      // Get current URL for redirect
      const redirectTo = `${window.location.origin}/auth/callback/`
      
      // Construct Google OAuth URL
      const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
      
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (err) {
      console.error('Sign in error:', err)
      setMessage('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

  // Email Magic Link Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          create_user: true,
          gotrue_meta_security: {}
        })
      })
      
      if (response.ok) {
        setMessage(`Magic link sent to ${email}! Check your inbox.`)
      } else {
        setMessage('Failed to send magic link. Please try again.')
      }
    } catch {
      setMessage('Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0c12]">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-slate-400">Sign in to save your progress and compete on leaderboards</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg text-center ${
            message.includes('sent') 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="game-card space-y-4">
          {/* Google Sign In */}
          <button 
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors disabled:opacity-50"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1c1c26] text-slate-500">or</span>
            </div>
          </div>

          {/* Email Magic Link */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              required
            />
            <button 
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10 disabled:opacity-50"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1c1c26] text-slate-500">or</span>
            </div>
          </div>

          {/* Continue as Guest */}
          <Link href="/game/">
            <button className="w-full py-3 px-4 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-medium transition-colors">
              Continue as Guest
            </button>
          </Link>
        </div>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider text-center mb-4">
            Why sign in?
          </h3>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save progress across all your devices
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Compete on global leaderboards
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Track your stats over time
          </div>
        </div>

        {/* Back to game */}
        <div className="mt-8 text-center">
          <Link href="/game/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to game
          </Link>
        </div>
      </div>
    </main>
  )
}
