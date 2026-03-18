'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import Navbar from '@/components/ui/Navbar'
import ClassicMode from '@/components/game/ClassicMode'
import SurvivalMode from '@/components/game/SurvivalMode'
import OneMinMode from '@/components/game/OneMinMode'
import { isAuthenticated } from '@/lib/auth'

type GameState = 'menu' | 'classic' | 'survival' | 'onemin'

function GameContent() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode')
  
  const [gameState, setGameState] = useState<GameState>(initialMode === 'classic' ? 'classic' : initialMode === 'survival' ? 'survival' : initialMode === 'onemin' ? 'onemin' : 'menu')
  const [userSignedIn, setUserSignedIn] = useState(false)
  
  // Check auth on mount
  isAuthenticated().then(signedIn => {
    setUserSignedIn(signedIn)
  })
  
  // Render Classic Mode
  if (gameState === 'classic') {
    return (
      <main className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <ClassicMode 
          userSignedIn={userSignedIn} 
          onBack={() => setGameState('menu')} 
        />
      </main>
    )
  }
  
  // Render Survival Mode
  if (gameState === 'survival') {
    return (
      <main className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <SurvivalMode 
          userSignedIn={userSignedIn} 
          onBack={() => setGameState('menu')} 
        />
      </main>
    )
  }
  
  // Render 1 Minute Mode
  if (gameState === 'onemin') {
    return (
      <main className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <OneMinMode 
          userSignedIn={userSignedIn} 
          onBack={() => setGameState('menu')} 
        />
      </main>
    )
  }
  
  // Render Main Menu
  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12 text-gradient">Choose Game Mode</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setGameState('classic')}
            className="game-card text-left hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Classic</h2>
                <p className="text-gray-400 text-sm">Maze puzzles</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Navigate through maze-like grids with trap paths. Easy to Expert difficulties.
            </p>
          </button>

          <button
            onClick={() => setGameState('survival')}
            className="game-card text-left hover:border-purple-500/30 transition-all group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Survival</h2>
                <p className="text-gray-400 text-sm">3 lives, timer</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Maze mode with limited lives. How far can you go before running out?
            </p>
          </button>

          <button
            onClick={() => setGameState('onemin')}
            className="game-card text-left hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">1 Minute</h2>
                <p className="text-gray-400 text-sm">Speed challenge</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Solve as many levels as possible in 60 seconds. Pure speed, no maze traps.
            </p>
          </button>
        </div>
      </div>
    </main>
  )
}

// Loading fallback
function GameLoading() {
  return (
    <main className="min-h-screen bg-[#0c0c12]">
      <Navbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameContent />
    </Suspense>
  )
}
