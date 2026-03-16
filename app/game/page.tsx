'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import GameGrid from '@/components/game/GameGrid'
import { generateGrid, calculatePathSum, validateSolution, Position, GameGrid as GameGridType, getSurvivalTimeLimit, calculateSurvivalScore } from '@/lib/game'
import { incrementGuestLevelsPlayed, shouldShowLoginPrompt, markLoginPromptShown } from '@/lib/guest'
import { saveGameResult, saveClassicProgress } from '@/lib/progress'
import { isAuthenticated } from '@/lib/auth'
import { saveGameState, loadGameState, clearGameState } from '@/lib/gameState'

type GameMode = 'classic' | 'survival'
type GameState = 'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'loginPrompt'

function GameContent() {
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get('mode') as GameMode) || 'classic'
  
  // Game mode selection
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode)
  
  // Classic mode state
  const [classicLevel, setClassicLevel] = useState(3)
  const [classicStars, setClassicStars] = useState<Record<number, number>>({})
  
  // Survival mode state
  const [survivalLevel, setSurvivalLevel] = useState(3)
  const [survivalLives, setSurvivalLives] = useState(3)
  const [survivalScore, setSurvivalScore] = useState(0)
  const [survivalCombo, setSurvivalCombo] = useState(0)
  
  // Current game state
  const [gameState, setGameState] = useState<GameState>('menu')
  const [grid, setGrid] = useState<GameGridType | null>(null)
  const [selectedPath, setSelectedPath] = useState<Position[]>([])
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState<{
    isOptimal: boolean
    userSum: number
    optimalSum: number
  } | null>(null)
  
  // Check if user is signed in
  const [userSignedIn, setUserSignedIn] = useState(false)
  
  // Load saved state on mount
  useEffect(() => {
    const savedState = loadGameState()
    if (savedState && savedState.gameState !== 'menu') {
      console.log('[DEBUG] Restoring saved game state:', savedState)
      setSelectedMode(savedState.selectedMode)
      setClassicLevel(savedState.classicLevel)
      setClassicStars(savedState.classicStars)
      setSurvivalLevel(savedState.survivalLevel)
      setSurvivalLives(savedState.survivalLives)
      setSurvivalScore(savedState.survivalScore)
      setSurvivalCombo(savedState.survivalCombo)
      setGameState(savedState.gameState)
      setAttempts(savedState.attempts)
      
      // Regenerate grid for the current level
      const level = savedState.selectedMode === 'classic' ? savedState.classicLevel : savedState.survivalLevel
      const newGrid = generateGrid(level, 'corner')
      setGrid(newGrid)
      
      if (savedState.selectedMode === 'survival') {
        setTimeRemaining(getSurvivalTimeLimit(level))
      }
    }
    
    setUserSignedIn(isAuthenticated())
  }, [])

  // Save state whenever it changes (but not for menu)
  useEffect(() => {
    if (gameState !== 'menu' && typeof window !== 'undefined') {
      saveGameState({
        selectedMode,
        classicLevel,
        classicStars,
        survivalLevel,
        survivalLives,
        survivalScore,
        survivalCombo,
        gameState,
        attempts
      })
    }
  }, [selectedMode, classicLevel, classicStars, survivalLevel, survivalLives, survivalScore, survivalCombo, gameState, attempts])

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing' || selectedMode !== 'survival') return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setGameState('gameOver')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gameState, selectedMode])

  const startGame = useCallback((mode: GameMode) => {
    // Clear any saved state when starting fresh
    clearGameState()
    
    setSelectedMode(mode)
    setGameState('playing')
    setSelectedPath([])
    setAttempts(0)
    setResult(null)
    
    if (mode === 'classic') {
      const newGrid = generateGrid(classicLevel, 'corner')
      setGrid(newGrid)
    } else {
      const newGrid = generateGrid(survivalLevel, 'corner')
      setGrid(newGrid)
      setTimeRemaining(getSurvivalTimeLimit(survivalLevel))
    }
  }, [classicLevel, survivalLevel])

  const handleCheckSolution = useCallback(async (path: Position[] = selectedPath) => {
    if (!grid) return
    
    const validation = validateSolution(grid, path)
    setResult(validation)
    setAttempts(prev => prev + 1)
    
    if (validation.isOptimal) {
      // Success!
      if (selectedMode === 'classic') {
        // Calculate stars
        const stars = attempts === 0 ? 3 : attempts === 1 ? 2 : 1
        setClassicStars(prev => ({ ...prev, [classicLevel]: Math.max(prev[classicLevel] || 0, stars) }))
        
        // Save progress if signed in
        if (userSignedIn) {
          await saveClassicProgress(classicLevel, stars)
          await saveGameResult({
            mode: 'classic',
            level: classicLevel,
            score: validation.userSum,
            stars: stars,
            completed: true,
            attempts: attempts + 1
          })
        }
        
        setGameState('levelComplete')
      } else {
        // Survival mode
        const score = calculateSurvivalScore(survivalLevel, timeRemaining, true, survivalCombo)
        setSurvivalScore(prev => prev + score)
        setSurvivalCombo(prev => prev + 1)
        
        // Save progress if signed in
        if (userSignedIn) {
          await saveGameResult({
            mode: 'survival',
            level: survivalLevel,
            score: score,
            completed: true,
            attempts: attempts + 1
          })
        }
        
        setGameState('levelComplete')
      }
    } else {
      // Not optimal
      if (selectedMode === 'survival') {
        setSurvivalLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            // Save final score if signed in
            if (userSignedIn) {
              saveGameResult({
                mode: 'survival',
                level: survivalLevel,
                score: survivalScore,
                completed: false,
                attempts: attempts + 1
              })
            }
            setGameState('gameOver')
          }
          return newLives
        })
        setSurvivalCombo(0)
      }
    }
  }, [grid, selectedPath, selectedMode, attempts, classicLevel, survivalLevel, timeRemaining, survivalCombo, survivalScore, userSignedIn])

  const handlePathChange = useCallback((path: Position[]) => {
    setSelectedPath(path)
    
    // Auto-check if reached end
    if (grid && path.length > 0) {
      const lastPos = path[path.length - 1]
      if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
        handleCheckSolution(path)
      }
    }
  }, [grid, handleCheckSolution])

  const handleNextLevel = () => {
    // Only track guest levels and show login prompt for guests (not signed in users)
    if (!userSignedIn) {
      incrementGuestLevelsPlayed()
      
      // Check if we should show login prompt (after 5 levels)
      if (shouldShowLoginPrompt()) {
        markLoginPromptShown()
        setGameState('loginPrompt')
        return
      }
    }
    
    if (selectedMode === 'classic') {
      if (classicLevel < 10) {
        setClassicLevel(prev => prev + 1)
        const newGrid = generateGrid(classicLevel + 1, 'corner')
        setGrid(newGrid)
        setSelectedPath([])
        setAttempts(0)
        setResult(null)
        setGameState('playing')
      } else {
        // Max level reached
        clearGameState()
        setGameState('menu')
      }
    } else {
      // Survival mode - continue to next level
      setSurvivalLevel(prev => prev + 1)
      const newGrid = generateGrid(survivalLevel + 1, 'corner')
      setGrid(newGrid)
      setSelectedPath([])
      setAttempts(0)
      setResult(null)
      setTimeRemaining(getSurvivalTimeLimit(survivalLevel + 1))
      setGameState('playing')
    }
  }

  const handleRetry = () => {
    setSelectedPath([])
    setAttempts(0)
    setResult(null)
    setGameState('playing')
    
    if (selectedMode === 'survival') {
      setTimeRemaining(getSurvivalTimeLimit(survivalLevel))
    }
  }

  const handleReset = () => {
    clearGameState()
    setGameState('menu')
    setSelectedPath([])
    setResult(null)
    
    if (selectedMode === 'survival') {
      setSurvivalLevel(3)
      setSurvivalLives(3)
      setSurvivalScore(0)
      setSurvivalCombo(0)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Menu Screen
  if (gameState === 'menu') {
    return (
      <main className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-12 text-gradient">Choose Game Mode</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Classic Mode */}
            <button
              onClick={() => startGame('classic')}
              className="game-card text-left hover:border-cyan-500/30 transition-all group"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Classic Mode</h2>
                  <p className="text-gray-400 text-sm">Progressive difficulty</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Start at 3×3 grids and work your way up to 10×10. Earn stars based on your efficiency.
              </p>
              <div className="flex items-center text-cyan-400 group-hover:translate-x-2 transition-transform">
                <span className="font-semibold">Play Now</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Survival Mode */}
            <button
              onClick={() => startGame('survival')}
              className="game-card text-left hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Survival Mode</h2>
                  <p className="text-gray-400 text-sm">Test your limits</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Start at 3×3 with 3 lives. Advance through infinite levels with decreasing time limits.
              </p>
              <div className="flex items-center text-purple-400 group-hover:translate-x-2 transition-transform">
                <span className="font-semibold">Play Now</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Game Screen
  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {selectedMode === 'classic' ? 'Classic Mode' : 'Survival Mode'}
              </h1>
              <p className="text-gray-400">
                {selectedMode === 'classic' 
                  ? `Level ${classicLevel}×${classicLevel}` 
                  : `Level ${survivalLevel}×${survivalLevel}`
                }
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {selectedMode === 'survival' && (
              <>
                <div className="stat-card px-4 py-2">
                  <div className="text-2xl font-bold text-red-400">{'❤️'.repeat(survivalLives)}</div>
                  <div className="text-xs text-gray-500 uppercase">Lives</div>
                </div>
                <div className="stat-card px-4 py-2">
                  <div className="text-2xl font-bold text-yellow-400">{survivalScore.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 uppercase">Score</div>
                </div>
                <div className="stat-card px-4 py-2">
                  <div className={`text-2xl font-bold ${timeRemaining < 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Time</div>
                </div>
              </>
            )}
            {selectedMode === 'classic' && (
              <div className="stat-card px-4 py-2">
                <div className="text-yellow-400">
                  {'⭐'.repeat(classicStars[classicLevel] || 0)}
                  {'☆'.repeat(3 - (classicStars[classicLevel] || 0))}
                </div>
                <div className="text-xs text-gray-500 uppercase">Stars</div>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Grid */}
          <div className="flex-1 flex justify-center">
            {grid && (
              <GameGrid
                grid={grid}
                selectedPath={selectedPath}
                onPathChange={handlePathChange}
                isComplete={gameState !== 'playing'}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            {/* Current Stats */}
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Current Path</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sum:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {grid ? calculatePathSum(grid, selectedPath) : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Length:</span>
                  <span className="font-mono font-bold text-white">{selectedPath.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Attempts:</span>
                  <span className="font-mono font-bold text-white">{attempts}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedPath([])}
                className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Path
              </button>
              
              {selectedMode === 'classic' && attempts > 0 && !result?.isOptimal && (
                <button
                  onClick={handleRetry}
                  className="w-full py-3 px-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium transition-colors border border-yellow-500/30"
                >
                  Try Again
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="game-card p-4 text-sm text-gray-400">
              <p className="mb-2">
                <span className="text-cyan-400 font-semibold">Goal:</span> Find the path from 
                <span className="text-green-400"> green</span> to <span className="text-red-400">red</span> with the lowest sum.
              </p>
              <p>
                <span className="text-cyan-400 font-semibold">How:</span> Click or drag to select cells. Must be adjacent (no diagonals).
              </p>
            </div>
          </div>
        </div>

        {/* Result Modal */}
        {result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="game-card max-w-md w-full text-center">
              {result.isOptimal ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Perfect!</h2>
                  <p className="text-gray-400 mb-6">You found the optimal path!</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="stat-card p-3">
                      <div className="text-2xl font-bold text-cyan-400">{result.userSum}</div>
                      <div className="text-xs text-gray-500">Your Sum</div>
                    </div>
                    <div className="stat-card p-3">
                      <div className="text-2xl font-bold text-green-400">{result.optimalSum}</div>
                      <div className="text-xs text-gray-500">Best Possible</div>
                    </div>
                  </div>

                  {selectedMode === 'classic' && (
                    <div className="mb-6">
                      <p className="text-gray-400 mb-2">Stars Earned:</p>
                      <div className="text-4xl">
                        {'⭐'.repeat(attempts === 0 ? 3 : attempts === 1 ? 2 : 1)}
                      </div>
                    </div>
                  )}

                  {selectedMode === 'survival' && (
                    <div className="mb-6">
                      <p className="text-gray-400 mb-2">Level Complete!</p>
                      <p className="text-2xl font-bold text-yellow-400">+{calculateSurvivalScore(survivalLevel, timeRemaining, true, survivalCombo).toLocaleString()} points</p>
                      {survivalCombo > 0 && (
                        <p className="text-purple-400">🔥 {survivalCombo + 1}x Combo!</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleNextLevel}
                    className="btn-primary w-full"
                  >
                    {selectedMode === 'classic' && classicLevel >= 10 ? 'Finish' : 'Next Level'}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Not Quite Optimal</h2>
                  <p className="text-gray-400 mb-6">
                    Your sum is {result.userSum}, but the best possible is {result.optimalSum}.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex-1 btn-primary"
                    >
                      Try Again
                    </button>
                    {selectedMode === 'classic' && (
                      <button
                        onClick={handleNextLevel}
                        className="flex-1 btn-secondary"
                      >
                        Skip (-1 Star)
                      </button>
                    )}
                  </div>
                  
                  {selectedMode === 'survival' && (
                    <p className="mt-4 text-red-400">❤️ Lost 1 life!</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'gameOver' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="game-card max-w-md w-full text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
              <p className="text-gray-400 mb-6">
                {survivalLives <= 0 ? 'You ran out of lives!' : 'Time ran out!'}
              </p>
              
              <div className="stat-card p-4 mb-6">
                <div className="text-4xl font-bold text-yellow-400 mb-1">{survivalScore.toLocaleString()}</div>
                <div className="text-sm text-gray-500 uppercase">Final Score</div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    clearGameState()
                    setSurvivalLevel(3)
                    setSurvivalLives(3)
                    setSurvivalScore(0)
                    setSurvivalCombo(0)
                    startGame('survival')
                  }}
                  className="btn-primary w-full"
                >
                  Play Again
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Prompt Modal - Only for guests after 5 levels */}
        {gameState === 'loginPrompt' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="game-card max-w-md w-full text-center border-amber-500/30">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You&apos;re on a Roll!</h2>
              <p className="text-gray-400 mb-6">
                You&apos;ve completed 5 levels! Sign in to save your progress and compete on the leaderboard.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save progress across devices
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Compete on global leaderboards
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track your stats over time
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/auth/signin">
                  <button className="btn-primary w-full">
                    Sign In with Google
                  </button>
                </Link>
                <button
                  onClick={() => {
                    // Continue as guest - go to next level
                    if (selectedMode === 'classic') {
                      if (classicLevel < 10) {
                        setClassicLevel(prev => prev + 1)
                        const newGrid = generateGrid(classicLevel + 1, 'corner')
                        setGrid(newGrid)
                        setSelectedPath([])
                        setAttempts(0)
                        setResult(null)
                        setGameState('playing')
                      } else {
                        setGameState('menu')
                      }
                    } else {
                      setSurvivalLevel(prev => prev + 1)
                      const newGrid = generateGrid(survivalLevel + 1, 'corner')
                      setGrid(newGrid)
                      setSelectedPath([])
                      setAttempts(0)
                      setResult(null)
                      setTimeRemaining(getSurvivalTimeLimit(survivalLevel + 1))
                      setGameState('playing')
                    }
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


// Loading fallback for Suspense
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

// Main export with Suspense wrapper
export default function GamePage() {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameContent />
    </Suspense>
  )
}
