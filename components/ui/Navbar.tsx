'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getGuestUsername } from '@/lib/guest'
import { useAuth } from '@/hooks/useAuth'
import { clearAuth } from '@/lib/auth'

// VERSION: 2026-03-16-v9 - Fixed sign out
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [username, setUsername] = useState('Guest')
  const { isSignedIn, isLoading } = useAuth()

  useEffect(() => {
    // Set username based on auth state
    if (isSignedIn) {
      setUsername('Player')
    } else {
      setUsername(getGuestUsername())
    }
  }, [isSignedIn])

  const handleSignOut = async () => {
    await clearAuth()
    // Force page reload to clear all state and redirect to home
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0c0c12]/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PF</span>
            </div>
            <span className="text-xl font-bold text-gradient">PathFinder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">Home</Link>
            <Link href="/game/" className="text-slate-300 hover:text-white transition-colors">Play</Link>
            <Link href="/leaderboard/" className="text-slate-300 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/profile/" className="text-slate-300 hover:text-white transition-colors">Profile</Link>
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && !isSignedIn ? (
              <>
                <span className="text-sm text-slate-400">{username}</span>
                <Link href="/auth/signin/">
                  <button className="btn-primary text-sm py-2 px-4">Sign In</button>
                </Link>
              </>
            ) : isSignedIn ? (
              <>
                <span className="text-sm text-slate-300">{username}</span>
                <button 
                  onClick={handleSignOut}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              // Loading state - show nothing or a spinner
              <div className="w-20 h-8 bg-white/5 rounded animate-pulse" />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link href="/" className="block text-slate-300 hover:text-white">Home</Link>
            <Link href="/game/" className="block text-slate-300 hover:text-white">Play</Link>
            <Link href="/leaderboard/" className="block text-slate-300 hover:text-white">Leaderboard</Link>
            <Link href="/profile/" className="block text-slate-300 hover:text-white">Profile</Link>
            
            <div className="pt-4 border-t border-white/10">
              {!isLoading && !isSignedIn ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{username}</span>
                  <Link href="/auth/signin/">
                    <button className="btn-primary text-sm py-2 px-4">Sign In</button>
                  </Link>
                </div>
              ) : isSignedIn ? (
                <button 
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-white"
                >
                  Sign Out
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
