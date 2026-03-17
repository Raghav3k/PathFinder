'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameGrid from './GameGrid'
import { generateGrid, validateSolution, findOptimalPath, Position, GameGrid as GameGridType } from '@/lib/game'
import { saveGameResult } from '@/lib/progress'

interface SurvivalModeProps {
  userSignedIn: boolean
  onBack: () => void
}

type ViewState = 'menu' | 'playing' | 'notOptimal' | 'gameOver'

const SURVIVAL_RUN_KEY = 'pf_survival_run'

interface SurvivalRun {
  level: number
  lives: number
  timestamp: number
}

function getSurvivalRun(): SurvivalRun | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(SURVIVAL_RUN_KEY)
  if (!saved) return null
  try {
    const run = JSON.parse(saved)
    if (Date.now() - run.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SURVIVAL_RUN_KEY)
      return null
    }
    return run
  } catch {
    return null
  }
}

function saveSurvivalRun(run: Omit<SurvivalRun, 'timestamp'>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SURVIVAL_RUN_KEY, JSON.stringify({ ...run, timestamp: Date.now() }))
}

function clearSurvivalRun() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SURVIVAL_RUN_KEY)
}

function getSurvivalTime(level: number): number {
  if (level <= 3) return 30
  let time = 30
  for (let i = 4; i <= level; i++) time += i * 5
  return time
}

export default function SurvivalMode({ userSignedIn, onBack }: SurvivalModeProps) {
  const [viewState, setViewState] = useState<ViewState>('menu')
  const [level, setLevel] = useState(3)
  const [lives, setLives] = useState(3)
  const [grid, setGrid] = useState<GameGridType | null>(null)
  const [selectedPath, setSelectedPath] = useState<Position[]>([])
  const [attempts, setAttempts] = useState(0)
  const [optimalSum, setOptimalSum] = useState(0)
  const [currentSum, setCurrentSum] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [showTick, setShowTick] = useState(false)
  const [gridKey, setGridKey] = useState(0)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Calculate optimal sum (excluding start/end)
  useEffect(() => {
    if (grid) {
      const optimal = findOptimalPath(grid)
      let pathSum = 0
      for (let i = 1; i < optimal.path.length - 1; i++) {
        const pos = optimal.path[i]
        pathSum += grid.cells[pos.y][pos.x]
      }
      setOptimalSum(pathSum)
    }
  }, [grid])
  
  // Update current sum (excluding start/end)
  useEffect(() => {
    if (grid && selectedPath.length > 0) {
      let sum = 0
      for (const pos of selectedPath) {
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
  
  // Timer effect - countdown for survival
  useEffect(() => {
    if (viewState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setViewState('gameOver')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [viewState])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start new run
  const startNewRun = useCallback(() => {
    clearSurvivalRun()
    setLevel(3)
    setLives(3)
    setSelectedPath([])
    setAttempts(0)
    setShowTick(false)
    setGridKey(prev => prev + 1)
    
    const newGrid = generateGrid(3, 'corner')
    setGrid(newGrid)
    setTimeRemaining(getSurvivalTime(3))
    setViewState('playing')
    
    saveSurvivalRun({ level: 3, lives: 3 })
  }, [])
  
  // Continue run
  const continueRun = useCallback(() => {
    const saved = getSurvivalRun()
    
    if (saved) {
      setLevel(saved.level)
      setLives(saved.lives)
      setSelectedPath([])
      setAttempts(0)
      setShowTick(false)
      setGridKey(prev => prev + 1)
      
      const newGrid = generateGrid(saved.level, 'corner')
      setGrid(newGrid)
      setTimeRemaining(getSurvivalTime(saved.level))
      setViewState('playing')
    }
  }, [])
  
  // Go to next level
  const goToNextLevel = useCallback(() => {
    const nextLevel = level + 1
    setLevel(nextLevel)
    setSelectedPath([])
    setAttempts(0)
    setShowTick(false)
    setGridKey(prev => prev + 1)
    
    const newGrid = generateGrid(nextLevel, 'corner')
    setGrid(newGrid)
    setTimeRemaining(getSurvivalTime(nextLevel))
    setViewState('playing')
    
    saveSurvivalRun({ level: nextLevel, lives })
  }, [level, lives])
  
  // Handle path change
  const handlePathChange = useCallback((path: Position[]) => {
    setSelectedPath(path)
    
    if (grid && path.length > 0) {
      const lastPos = path[path.length - 1]
      if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
        const validation = validateSolution(grid, path)
        
        if (validation.isOptimal) {
          // Success
          setShowTick(true)
          
          if (userSignedIn) {
            saveGameResult({
              mode: 'survival',
              level: level,
              score: 0, // No score system for now
              completed: true,
              attempts: attempts + 1
            })
          }
          
          // Auto advance after animation
          setTimeout(() => {
            setShowTick(false)
            goToNextLevel()
          }, 1500)
        } else {
          // Wrong answer - lose life
          const newLives = lives - 1
          setLives(newLives)
          setAttempts(prev => prev + 1)
          
          if (newLives <= 0) {
            if (userSignedIn) {
              saveGameResult({
                mode: 'survival',
                level: level,
                score: 0,
                completed: false,
                attempts: attempts + 1
              })
            }
            setViewState('gameOver')
          } else {
            setViewState('notOptimal')
          }
        }
      }
    }
  }, [grid, level, lives, attempts, userSignedIn, goToNextLevel])
  
  // Reset path
  const handleReset = useCallback(() => {
    setSelectedPath([])
    setGridKey(prev => prev + 1)
  }, [])
  
  // Try again
  const handleTryAgain = useCallback(() => {
    setSelectedPath([])
    setViewState('playing')
    setGridKey(prev => prev + 1)
  }, [])
  
  // Skip to next (with life penalty already applied)
  const handleSkip = useCallback(() => {
    goToNextLevel()
  }, [goToNextLevel])
  
  // Check saved run
  const savedRun = getSurvivalRun()
  const hasSavedRun = savedRun !== null
  
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
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gradient">Survival Mode</h1>
        
        <div className="space-y-4">
          <button
            onClick={startNewRun}
            className="w-full game-card text-left hover:border-purple-500/30 transition-all"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              {hasSavedRun ? 'New Run' : 'Play'}
            </h2>
            <p className="text-gray-400 text-sm">Start with 3 lives</p>
          </button>
          
          {hasSavedRun && (
            <button
              onClick={continueRun}
              className="w-full game-card text-left hover:border-green-500/30 transition-all border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Continue Run</h2>
              </div>
              <p className="text-gray-400 text-sm">
                Level {savedRun?.level}×{savedRun?.level} • {savedRun?.lives} ❤️
              </p>
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Game view (playing or notOptimal)
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
          <div className="w-10" />
        </div>
        
        {/* Instructions */}
        <p className="text-sm text-gray-400 mb-4 text-center">
          Find the lowest sum path from <span className="text-green-400 font-semibold">START</span> to <span className="text-red-400 font-semibold">END</span>
        </p>
        
        {/* Status Bar */}
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
            <span className="text-xl font-bold text-yellow-400">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
            <span className="text-xl font-bold text-red-400">{'❤️'.repeat(lives)}</span>
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
        
        {/* Grid Container */}
        <div className="relative flex items-start gap-4">
          <GameGrid
            key={gridKey}
            grid={grid}
            selectedPath={selectedPath}
            onPathChange={viewState === 'notOptimal' ? () => {} : handlePathChange}
            isComplete={viewState === 'notOptimal'}
            showStartEndLabels={true}
          />
          
          {/* Level Indicator */}
          <div className="text-gray-400 text-sm pt-2">
            {level}×{level}
          </div>
          
          {/* Success Tick */}
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
        
        {/* Bottom Section */}
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
  
  // Game Over
  if (viewState === 'gameOver') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="game-card max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
          <p className="text-gray-400 mb-6">
            {timeRemaining <= 0 ? 'Time ran out!' : 'You ran out of lives!'}
          </p>
          
          <div className="mb-4">
            <p className="text-lg text-white">You reached Level {level}×{level}</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => { clearSurvivalRun(); startNewRun(); }}
              className="btn-primary w-full"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}
