'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameGrid from './GameGrid'
import { generateOneMinGrid, validateSolution, Position, GameGrid as GameGridType } from '@/lib/game'
import { saveGameResult } from '@/lib/progress'

interface OneMinModeProps {
  userSignedIn: boolean
  onBack: () => void
}

type ViewState = 'menu' | 'playing' | 'gameOver'
type ResetMode = 'manual' | 'auto'

const ONE_MINUTE = 60 // seconds

export default function OneMinMode({ userSignedIn, onBack }: OneMinModeProps) {
  const [viewState, setViewState] = useState<ViewState>('menu')
  const [resetMode, setResetMode] = useState<ResetMode>('manual')
  const [resetKey, setResetKey] = useState<string>('r')
  const [level, setLevel] = useState(3)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [grid, setGrid] = useState<GameGridType | null>(null)
  const [selectedPath, setSelectedPath] = useState<Position[]>([])
  const [timeRemaining, setTimeRemaining] = useState(ONE_MINUTE)
  const [gridKey, setGridKey] = useState(0)
  const [notOptimalMsg, setNotOptimalMsg] = useState('')
  const [levelChangeEffect, setLevelChangeEffect] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keyboard listener for reset key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewState === 'playing' && e.key.toLowerCase() === resetKey.toLowerCase()) {
        e.preventDefault()
        setSelectedPath([])
        setGridKey(prev => prev + 1)
        setNotOptimalMsg('')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewState, resetKey])
  
  // Timer effect - countdown for 1 minute mode
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
  
  // Start new game
  const startGame = useCallback(() => {
    setLevel(3)
    setLevelsCompleted(0)
    setSelectedPath([])
    setNotOptimalMsg('')
    setGridKey(prev => prev + 1)
    setTimeRemaining(ONE_MINUTE)
    setLevelChangeEffect(false)
    
    const newGrid = generateOneMinGrid(3)
    setGrid(newGrid)
    setViewState('playing')
  }, [])
  
  // Go to next level - INSTANT, no delay
  const goToNextLevel = useCallback(() => {
    const nextLevel = level + 1
    setLevel(nextLevel)
    setLevelsCompleted(prev => prev + 1)
    setSelectedPath([])
    setNotOptimalMsg('')
    setGridKey(prev => prev + 1)
    
    // Trigger level change animation
    setLevelChangeEffect(true)
    setTimeout(() => setLevelChangeEffect(false), 300)
    
    const newGrid = generateOneMinGrid(nextLevel)
    setGrid(newGrid)
  }, [level])
  
  // Handle path change
  const handlePathChange = useCallback((path: Position[]) => {
    setSelectedPath(path)
    setNotOptimalMsg('')
    
    if (grid && path.length > 0) {
      const lastPos = path[path.length - 1]
      if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
        const validation = validateSolution(grid, path)
        
        if (validation.isOptimal) {
          // INSTANT transition - no delay
          if (userSignedIn) {
            saveGameResult({
              mode: 'classic',
              level: level,
              score: levelsCompleted + 1,
              completed: true,
              attempts: 1
            })
          }
          
          goToNextLevel()
        } else {
          // Not optimal - show message
          setNotOptimalMsg(`Not optimal path (${validation.userSum} vs best ${validation.optimalSum})`)
          
          // Auto reset if enabled
          if (resetMode === 'auto') {
            setTimeout(() => {
              setSelectedPath([])
              setGridKey(prev => prev + 1)
              setNotOptimalMsg('')
            }, 400)
          }
        }
      }
    }
  }, [grid, level, levelsCompleted, userSignedIn, resetMode, goToNextLevel])
  
  // Menu view
  if (viewState === 'menu') {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="w-full max-w-4xl mx-auto px-6 pt-8 pb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl sm:text-6xl mb-4 text-gradient">1 Minute</h1>
            <p className="text-text-secondary text-lg">How many levels can you solve?</p>
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            <div className="game-card text-center mb-6">
              <p className="text-text-muted text-sm mb-2">Time Limit</p>
              <p className="font-display text-4xl text-accent">60 seconds</p>
              <p className="text-text-muted text-sm mt-2">Start at 3×3, grids get bigger</p>
            </div>
            
            {/* Settings */}
            <div className="game-card">
              <h3 className="text-text-primary font-medium mb-4">Settings</h3>
              
              {/* Reset Mode */}
              <div className="mb-4">
                <p className="text-text-muted text-sm mb-2">On wrong path:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetMode('manual')}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                      resetMode === 'manual' 
                        ? 'bg-accent text-bg-primary' 
                        : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Manual Reset
                  </button>
                  <button
                    onClick={() => setResetMode('auto')}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                      resetMode === 'auto' 
                        ? 'bg-accent text-bg-primary' 
                        : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Auto Reset
                  </button>
                </div>
              </div>
              
              {/* Reset Key */}
              <div>
                <p className="text-text-muted text-sm mb-2">Reset key:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resetKey}
                    onChange={(e) => setResetKey(e.target.value.slice(0, 1))}
                    className="w-12 h-10 bg-bg-elevated border border-white/10 rounded text-center text-text-primary font-mono uppercase"
                    maxLength={1}
                  />
                  <span className="text-text-muted text-sm">Press to reset path anytime</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={startGame}
              className="w-full btn-primary text-lg py-4"
            >
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Playing view
  if (viewState === 'playing' && grid) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Top Navigation */}
        <div className="w-full max-w-5xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit
          </button>
          
          {/* Level counter */}
          <div className="stat-pill">
            <span className="text-text-muted text-xs uppercase tracking-wider mr-2">Levels</span>
            <span className="font-display text-xl text-accent">{levelsCompleted}</span>
          </div>
        </div>
        
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Timer - Prominent */}
          <div className="mb-4">
            <span className={`font-display text-6xl ${timeRemaining < 10 ? 'text-[oklch(55%_0.12_25)]' : 'text-text-primary'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          {/* Grid Size with pop effect */}
          <div className="mb-4">
            <span 
              className={`font-display text-4xl text-text-muted transition-transform inline-block ${
                levelChangeEffect ? 'scale-150 text-accent' : 'scale-100'
              }`}
              style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              {level}×{level}
            </span>
          </div>
          
          {/* Grid */}
          <div className="relative mb-4">
            <GameGrid
              key={gridKey}
              grid={grid}
              selectedPath={selectedPath}
              onPathChange={handlePathChange}
              isComplete={false}
              showStartEndLabels={true}
            />
          </div>
          
          {/* Not Optimal Message */}
          {notOptimalMsg && (
            <div className="text-center animate-pulse">
              <p className="text-[oklch(55%_0.12_25)] font-medium">{notOptimalMsg}</p>
              {resetMode === 'manual' && (
                <p className="text-text-muted text-sm mt-1">
                  Press <kbd className="px-2 py-1 bg-bg-elevated rounded text-text-primary font-mono">{resetKey}</kbd> to reset
                </p>
              )}
            </div>
          )}
          
          {/* Reset hint */}
          {!notOptimalMsg && (
            <p className="text-text-muted text-sm">
              Press <kbd className="px-2 py-1 bg-bg-elevated rounded text-text-primary font-mono">{resetKey}</kbd> to reset path
            </p>
          )}
        </div>
      </div>
    )
  }
  
  // Game Over
  if (viewState === 'gameOver') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="game-card max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-3xl">⏱️</span>
          </div>
          <h2 className="font-display text-4xl mb-3 text-text-primary">Time&apos;s Up!</h2>
          
          <div className="mb-8">
            <span className="text-text-muted text-sm uppercase tracking-wider">You completed</span>
            <p className="font-display text-6xl text-accent mt-2">{levelsCompleted}</p>
            <p className="text-text-secondary">levels</p>
          </div>
          
          <div className="mb-8 text-text-muted text-sm">
            <p>Max grid size: {level}×{level}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="btn-primary w-full"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="btn-secondary w-full"
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
