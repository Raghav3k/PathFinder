'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { getAuthToken, clearAuth } from '@/lib/auth'

// VERSION: 2026-03-16-v3
export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check auth with retry for OAuth redirect race condition
    const checkAuth = () => {
      const token = getAuthToken()
      if (token) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return true
      }
      return false
    }

    // Initial check
    if (!checkAuth()) {
      // Retry after short delays (OAuth redirect timing issue)
      const delays = [200, 500, 1000, 2000]
      delays.forEach((delay, index) => {
        setTimeout(() => {
          if (checkAuth() && index < delays.length - 1) {
            // Found it, no need for more checks
          }
        }, delay)
      })
      
      // Final check - if still not authenticated, show sign in
      setTimeout(() => {
        setIsLoading(false)
      }, 2500)
    }
  }, [])

  const handleSignOut = () => {
    clearAuth()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0c0c12]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 mt-4">Loading profile...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0c0c12]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="game-card text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
            <p className="text-slate-400 mb-6">Please sign in to view your profile and track your progress.</p>
            <div className="space-y-3">
              <Link href="/auth/signin/" className="btn-primary block py-3">
                Sign In
              </Link>
              <Link href="/game/" className="text-slate-400 hover:text-white text-sm">
                Continue as Guest →
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0c0c12]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stats Card */}
          <div className="game-card">
            <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Games Played</span>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Levels Completed</span>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Best Score</span>
                <span className="text-white font-medium">-</span>
              </div>
            </div>
          </div>

          {/* Account Card */}
          <div className="game-card">
            <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
            <div className="space-y-4">
              <p className="text-slate-400">Signed in with Google</p>
              <button 
                onClick={handleSignOut}
                className="btn-secondary w-full py-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 game-card">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <p className="text-slate-400">No recent games. Start playing!</p>
          <Link href="/game/" className="btn-primary inline-block mt-4 px-6 py-2">
            Play Now
          </Link>
        </div>
      </div>
    </main>
  )
}
