'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { getAuthToken, clearAuth } from '@/lib/auth'
import { fetchUserStats, fetchRecentGames } from '@/lib/progress'

interface GameRecord {
  id: string
  game_mode: string
  level: number
  score: number
  completed: boolean
  played_at: string
}

interface UserStats {
  totalGames: number
  levelsCompleted: number
  bestScore: number
  classicProgress: Record<string, number>
}

// VERSION: 2026-03-16-v4
export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentGames, setRecentGames] = useState<GameRecord[]>([])

  useEffect(() => {
    // Check auth with retry for OAuth redirect race condition
    const checkAuth = async () => {
      const token = getAuthToken()
      if (token) {
        setIsAuthenticated(true)
        // Fetch user stats
        const userStats = await fetchUserStats()
        setStats(userStats)
        const games = await fetchRecentGames(5)
        setRecentGames(games)
        setIsLoading(false)
        return true
      }
      return false
    }

    // Initial check
    checkAuth().then(found => {
      if (!found) {
        // Retry after short delays (OAuth redirect timing issue)
        const delays = [200, 500, 1000, 2000]
        delays.forEach((delay, index) => {
          setTimeout(() => {
            checkAuth().then(retryFound => {
              if (retryFound && index < delays.length - 1) {
                // Found it, no need for more checks
              }
            })
          }, delay)
        })
        
        // Final check - if still not authenticated, show sign in
        setTimeout(() => {
          setIsLoading(false)
        }, 2500)
      }
    })
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
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Total Games */}
          <div className="game-card text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">{stats?.totalGames || 0}</div>
            <div className="text-sm text-slate-400 uppercase">Games Played</div>
          </div>

          {/* Levels Completed */}
          <div className="game-card text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">{stats?.levelsCompleted || 0}</div>
            <div className="text-sm text-slate-400 uppercase">Levels Completed</div>
          </div>

          {/* Best Score */}
          <div className="game-card text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">{stats?.bestScore?.toLocaleString() || 0}</div>
            <div className="text-sm text-slate-400 uppercase">Best Score</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Classic Progress */}
          <div className="game-card">
            <h2 className="text-xl font-semibold text-white mb-4">Classic Mode Progress</h2>
            {stats && Object.keys(stats.classicProgress).length > 0 ? (
              <div className="space-y-3">
                {[3, 4, 5, 6, 7, 8, 9, 10].map(level => {
                  const stars = stats.classicProgress[level] || 0
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-slate-300">Level {level}×{level}</span>
                      <div className="text-yellow-400">
                        {stars > 0 ? '⭐'.repeat(stars) : <span className="text-slate-600">☆☆☆</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-slate-400">No classic mode progress yet. Start playing!</p>
            )}
            <Link href="/game/?mode=classic" className="btn-primary block mt-4 text-center py-2">
              Play Classic Mode
            </Link>
          </div>

          {/* Account Card */}
          <div className="game-card">
            <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Signed in with Google</p>
                  <p className="text-slate-500 text-sm">Your progress is saved</p>
                </div>
              </div>
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
          <h2 className="text-xl font-semibold text-white mb-4">Recent Games</h2>
          {recentGames.length > 0 ? (
            <div className="space-y-3">
              {recentGames.map((game, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white capitalize">{game.game_mode} Mode</p>
                    <p className="text-slate-500 text-sm">Level {game.level} • {new Date(game.played_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{game.score.toLocaleString()}</p>
                    {game.completed ? (
                      <span className="text-green-400 text-xs">✓ Completed</span>
                    ) : (
                      <span className="text-red-400 text-xs">✗ Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No recent games. Start playing!</p>
          )}
          <Link href="/game/" className="btn-primary inline-block mt-4 px-6 py-2">
            Play Now
          </Link>
        </div>
      </div>
    </main>
  )
}
