'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { getGuestUsername, getGuestStats, GuestStats } from '@/lib/guest'
import { getUser, onAuthStateChange, signOut } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Default stats
const defaultStats: GuestStats = {
  totalGames: 0,
  perfectSolves: 0,
  survivalHighScore: 0,
  survivalMaxLevel: 0,
  classicStars: {},
  playTimeMinutes: 0
}

export default function ProfilePage() {
  const [username, setUsername] = useState('Guest')
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<GuestStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = await getUser()
      setUser(currentUser)
      
      if (currentUser) {
        const displayName = currentUser.user_metadata?.username || 
                           currentUser.email?.split('@')[0] || 
                           'Player'
        setUsername(displayName)
        // TODO: Load stats from Supabase for signed-in users
        setStats(defaultStats)
      } else {
        setUsername(getGuestUsername())
        setStats(getGuestStats())
      }
      setIsLoading(false)
    }

    loadProfile()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((newUser) => {
      setUser(newUser)
      if (newUser) {
        const displayName = newUser.user_metadata?.username || 
                           newUser.email?.split('@')[0] || 
                           'Player'
        setUsername(displayName)
      } else {
        setUsername(getGuestUsername())
        setStats(getGuestStats())
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    setUsername(getGuestUsername())
    setStats(getGuestStats())
  }

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Calculate total stars from classicStars object
  const totalStars = Object.values(stats.classicStars).reduce((sum, stars) => sum + stars, 0)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0c0c12]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0c0c12]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12 text-gradient">Your Profile</h1>

        {/* Guest/Signed In Notice */}
        {!user ? (
          <div className="game-card mb-8 border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Playing as {username}</h3>
                <p className="text-slate-400 text-sm">
                  Your progress is saved locally. Sign in to sync across devices and appear on leaderboards.
                </p>
              </div>
              <Link href="/auth/signin">
                <button className="btn-primary text-sm whitespace-nowrap">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="game-card mb-8 border border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Welcome, {username}!</h3>
                <p className="text-slate-400 text-sm">
                  You&apos;re signed in. Your progress is saved to the cloud.
                </p>
              </div>
              <button 
                onClick={handleSignOut}
                className="py-2 px-4 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card p-6">
            <div className="stat-value">{stats.totalGames}</div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stat-card p-6">
            <div className="stat-value">{stats.perfectSolves}</div>
            <div className="stat-label">Perfect Solves</div>
          </div>
          <div className="stat-card p-6">
            <div className="stat-value">{formatPlayTime(stats.playTimeMinutes)}</div>
            <div className="stat-label">Play Time</div>
          </div>
        </div>

        {/* Classic Progress */}
        <div className="game-card mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Classic Mode Progress
          </h2>
          
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {[3, 4, 5, 6, 7, 8, 9, 10].map((size) => {
              const stars = stats.classicStars[size] || 0
              return (
                <div key={size} className="text-center">
                  <div className={`aspect-square rounded-xl flex flex-col items-center justify-center mb-2 ${
                    stars > 0 
                      ? 'bg-amber-500/20 border border-amber-500/30' 
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <span className="text-lg font-bold text-white">{size}x{size}</span>
                    <span className="text-xs">{stars > 0 ? '⭐'.repeat(stars) : '🔒'}</span>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-400">Total Stars: {totalStars}/24</span>
            <span className="text-amber-400">{Math.round((totalStars / 24) * 100)}% Complete</span>
          </div>
        </div>

        {/* Survival Stats */}
        <div className="game-card">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            Survival Mode Stats
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card p-4">
              <div className="stat-value text-yellow-400">{stats.survivalHighScore.toLocaleString()}</div>
              <div className="stat-label">High Score</div>
            </div>
            <div className="stat-card p-4">
              <div className="stat-value text-purple-400">{stats.survivalMaxLevel > 0 ? `${stats.survivalMaxLevel}x${stats.survivalMaxLevel}` : '—'}</div>
              <div className="stat-label">Max Level</div>
            </div>
            <div className="stat-card p-4">
              <div className="stat-value text-green-400">Top 15%</div>
              <div className="stat-label">Global Rank</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
