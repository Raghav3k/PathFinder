'use client'

import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#0c0c12]">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-slate-400">Sign in to save your progress and compete on leaderboards</p>
        </div>

        <div className="game-card space-y-4">
          {/* Google Sign In */}
          <button 
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors"
            onClick={() => {
              // TODO: Implement Google OAuth
              alert('Google Sign In coming soon!')
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
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

          {/* Magic Link */}
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button 
              className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
              onClick={() => {
                // TODO: Implement magic link
                alert('Magic link coming soon!')
              }}
            >
              Send Magic Link
            </button>
          </div>

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
          <Link href="/game">
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
            Track your stats and improvement
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Never lose your high scores
          </div>
        </div>

        {/* Back to game */}
        <div className="mt-8 text-center">
          <Link href="/game" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to game
          </Link>
        </div>
      </div>
    </main>
  )
}
