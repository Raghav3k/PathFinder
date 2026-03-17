'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import GameGrid from './GameGrid'
import { generateGrid, validateSolution, findOptimalPath, Position, GameGrid as GameGridType } from '@/lib/game'
import { saveGameResult, saveClassicProgress } from '@/lib/progress'
import { incrementGuestLevelsPlayed, shouldShowLoginPrompt, markLoginPromptShown } from '@/lib/guest'

interface ClassicModeProps {
  userSignedIn: boolean
  onBack: () => void
}

type ViewState = 'menu' | 'playing' | 'notOptimal' | 'loginPrompt'

interface SavedProgress {
  level: number
}

const PROGRESS_KEY = 'pf_classic_progress'
const GAME_STATE_KEY = 'pf_classic_game_state'

interface GameState {
  level: number
  grid: GameGridType
  selectedPath: Position[]
  attempts: number
  timestamp: number
}

function getSavedProgress(): SavedProgress | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(PROGRESS_KEY)
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

function saveProgress(progress: SavedProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

function clearProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PROGRESS_KEY)
}

function saveGameState(state: Omit<GameState, 'timestamp'>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }))
}

function getGameState(): GameState | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(GAME_STATE_KEY)
  if (!saved) return null
  try {
    const state = JSON.parse(saved)
    if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(GAME_STATE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

function clearGameState() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GAME_STATE_KEY)
}

export default function ClassicMode({ userSignedIn, onBack }: ClassicModeProps) {
  const [viewState, setViewState] = useState<ViewState>('menu')
  const [level, setLevel] = useState(3)
  const [grid, setGrid] = useState<GameGridType | null>(null)
  const [selectedPath, setSelectedPath] = useState<Position[]>([])
  const [attempts, setAttempts] = useState(0)
  const [optimalSum, setOptimalSum] = useState(0)
  const [currentSum, setCurrentSum] = useState(0)
  const [timer, setTimer] = useState(0)
  const [showTick, setShowTick] = useState(false)
  const [gridKey, setGridKey] = useState(0)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = getSavedProgress()
    if (savedProgress) {
      setLevel(savedProgress.level)
    }
  }, [])
  
  // Timer effect - only runs when playing
  useEffect(() => {
    if (viewState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } else {
      // Pause timer when not playing (optimal found or notOptimal state)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [viewState])
  
  // Calculate optimal sum when grid changes (excluding start and end cells)
  useEffect(() => {
    if (grid) {
      const optimal = findOptimalPath(grid)
      // Calculate sum excluding start and end cells
      let pathSum = 0
      for (let i = 1; i < optimal.path.length - 1; i++) {
        const pos = optimal.path[i]
        pathSum += grid.cells[pos.y][pos.x]
      }
      setOptimalSum(pathSum)
    }
  }, [grid])
  
  // Update current sum when path changes (excluding START and END cells)
  useEffect(() => {
    if (grid && selectedPath.length > 0) {
      let sum = 0
      for (const pos of selectedPath) {
        // Skip START and END cells - only count middle cells
        const isStart = pos.x === grid.startPos.x && pos.y === grid.startPos.y
        const isEnd = pos.x === grid.endPos.x && pos.y === grid.endPos.y
        if (!isStart && !isEnd) {
          sum += grid.cells[pos.y][pos.x]
        }
      }
      setCurrentSum(sum)
    } else {
      setCurrentSum(0)
    }
  }, [grid, selectedPath])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start new game
  const startNewGame = useCallback(() => {
    clearProgress()
    clearGameState()
    setLevel(3)
    setSelectedPath([])
    setAttempts(0)
    setTimer(0)
    setShowTick(false)
    setGridKey(prev => prev + 1)
    
    const newGrid = generateGrid(3, 'corner')
    setGrid(newGrid)
    setViewState('playing')
    
    saveProgress({ level: 3 })
    saveGameState({
      level: 3,
      grid: newGrid,
      selectedPath: [],
      attempts: 0
    })
  }, [])
  
  // Continue/resume game
  const continueGame = useCallback(() => {
    const gameState = getGameState()
    const savedProgress = getSavedProgress()
    
    if (gameState) {
      setLevel(gameState.level)
      setGrid(gameState.grid)
      setSelectedPath(gameState.selectedPath)
      setAttempts(gameState.attempts)
      setTimer(0)
      setShowTick(false)
      setGridKey(prev => prev + 1)
      setViewState('playing')
    } else if (savedProgress) {
      const startLevel = savedProgress.level
      setLevel(startLevel)
      setSelectedPath([])
      setAttempts(0)
      setTimer(0)
      setShowTick(false)
      setGridKey(prev => prev + 1)
      
      const newGrid = generateGrid(startLevel, 'corner')
      setGrid(newGrid)
      setViewState('playing')
      
      saveGameState({
        level: startLevel,
        grid: newGrid,
        selectedPath: [],
        attempts: 0
      })
    }
  }, [])
  
  // Go to next level
  const goToNextLevel = useCallback(() => {
    if (!userSignedIn) {
      incrementGuestLevelsPlayed()
      if (shouldShowLoginPrompt()) {
        markLoginPromptShown()
        setViewState('loginPrompt')
        return
      }
    }
    
    if (level < 10) {
      const nextLevel = level + 1
      setLevel(nextLevel)
      setSelectedPath([])
      setAttempts(0)
      setTimer(0)
      setShowTick(false)
      setGridKey(prev => prev + 1)
      
      const newGrid = generateGrid(nextLevel, 'corner')
      setGrid(newGrid)
      setViewState('playing')
      
      saveProgress({ level: nextLevel })
      saveGameState({
        level: nextLevel,
        grid: newGrid,
        selectedPath: [],
        attempts: 0
      })
    } else {
      clearProgress()
      clearGameState()
      onBack()
    }
  }, [level, userSignedIn, onBack])
  
  // Handle path change
  const handlePathChange = useCallback((path: Position[]) => {
    setSelectedPath(path)
    
    if (grid) {
      saveGameState({
        level,
        grid,
        selectedPath: path,
        attempts
      })
      
      if (path.length > 0) {
        const lastPos = path[path.length - 1]
        if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
          const validation = validateSolution(grid, path)
          
          if (validation.isOptimal) {
            // Success - show tick and auto-advance
            setShowTick(true)
            
            if (userSignedIn) {
              saveClassicProgress(level, 3)
              saveGameResult({
                mode: 'classic',
                level: level,
                score: validation.userSum,
                completed: true,
                attempts: attempts + 1
              })
            }
            
            clearGameState()
            
            // Auto advance after animation
            setTimeout(() => {
              setShowTick(false)
              goToNextLevel()
            }, 1500)
          } else {
            // Not optimal - show options but keep layout
            setAttempts(prev => prev + 1)
            setViewState('notOptimal')
          }
        }
      }
    }
  }, [grid, level, attempts, userSignedIn, goToNextLevel])
  
  // Reset path
  const handleReset = useCallback(() => {
    setSelectedPath([])
    setGridKey(prev => prev + 1)
    if (grid) {
      saveGameState({
        level,
        grid,
        selectedPath: [],
        attempts
      })
    }
  }, [grid, level, attempts])
  
  // Try again (reset path and continue)
  const handleTryAgain = useCallback(() => {
    setSelectedPath([])
    setViewState('playing')
    setGridKey(prev => prev + 1)
  }, [])
  
  // Skip to next (accept non-optimal)
  const handleSkip = useCallback(() => {
    goToNextLevel()
  }, [goToNextLevel])
  
  // Check saved states
  const savedGameState = getGameState()
  const savedProgress = getSavedProgress()
  const hasSavedGame = savedProgress !== null
  const hasInProgressGame = savedGameState !== null
  
  // Menu view
  if (viewState === 'menu') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gradient">Classic Mode</h1>
        
        <div className="space-y-4">
          <button
            onClick={startNewGame}
            className="w-full game-card text-left hover:border-cyan-500/30 transition-all"
          >
            <h2 className="text-xl font-bold text-white mb-2">New Game</h2>
            <p className="text-gray-400 text-sm">Start fresh from Level 3×3</p>
          </button>
          
          {hasSavedGame && (
            <button
              onClick={continueGame}
              className="w-full game-card text-left hover:border-green-500/30 transition-all border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold text-white">
                  {hasInProgressGame ? 'Resume Game' : 'Continue'}
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                {hasInProgressGame 
                  ? `Resume Level ${savedGameState?.level}×${savedGameState?.level} - same puzzle!`
                  : `Resume from Level ${savedProgress?.level || 3}×${savedProgress?.level || 3}`
                }
              </p>
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Game view (playing or notOptimal) - LOCKED POSITION
  if ((viewState === 'playing' || viewState === 'notOptimal') && grid) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center px-4 pt-8">
        {/* Top Navigation */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
        
        {/* Instructions - TOP CENTER */}
        <p className="text-sm text-gray-400 mb-4 text-center">
          Find the lowest sum path from <span className="text-green-400 font-semibold">START</span> to <span className="text-red-400 font-semibold">END</span>
        </p>
        
        {/* Status Bar - LOCKED POSITION */}
        <div className="flex items-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
            <span className="text-gray-400">Best:</span>
            <span className="text-xl font-bold text-green-400">{optimalSum}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
            <span className="text-gray-400">Your:</span>
            <span className="text-xl font-bold text-cyan-400">{currentSum}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
            <span className="text-xl font-bold text-yellow-400">{formatTime(timer)}</span>
          </div>
          <button
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* Grid Container with Level Indicator - LOCKED POSITION */}
        <div className="relative flex items-start gap-4">
          {/* Grid */}
          <GameGrid
            key={gridKey}
            grid={grid}
            selectedPath={selectedPath}
            onPathChange={viewState === 'notOptimal' ? () => {} : handlePathChange}
            isComplete={viewState === 'notOptimal'}
            showStartEndLabels={true}
          />
          
          {/* Level Indicator - Beside START (top right of grid) */}
          <div className="text-gray-400 text-sm pt-2">
            {level}×{level}
          </div>
          
          {/* Success Tick Overlay */}
          {showTick && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg 
                className="w-24 h-24 text-green-400" 
                style={{ animation: 'fadeOut 1.5s ease-out forwards' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Bottom Section - LOCKED POSITION */}
        <div className="mt-8 h-24 flex flex-col items-center justify-center">
          {viewState === 'playing' ? (
            <div className="text-gray-500 text-sm">
              Attempts: {attempts}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Not the optimal path. Try again?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleTryAgain}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Login prompt
  if (viewState === 'loginPrompt') {
    return (
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
          
          <div className="space-y-3">
            <Link href="/auth/signin">
              <button className="btn-primary w-full mb-3">
                Sign In with Google
              </button>
            </Link>
            <button
              onClick={() => {
                const nextLevel = level + 1
                if (nextLevel <= 10) {
                  setLevel(nextLevel)
                  setSelectedPath([])
                  setAttempts(0)
                  setTimer(0)
                  setGridKey(prev => prev + 1)
                  
                  const newGrid = generateGrid(nextLevel, 'corner')
                  setGrid(newGrid)
                  setViewState('playing')
                  
                  saveProgress({ level: nextLevel })
                  saveGameState({
                    level: nextLevel,
                    grid: newGrid,
                    selectedPath: [],
                    attempts: 0
                  })
                }
              }}
              className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}
