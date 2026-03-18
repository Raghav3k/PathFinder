'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameGrid from './GameGrid'
import { generateGrid, validateSolution, findOptimalPath, Position, GameGrid as GameGridType } from '@/lib/game'
import { saveGameResult, saveCurrentRun, loadCurrentRun, deleteCurrentRun } from '@/lib/progress'

interface SurvivalModeProps {
  userSignedIn: boolean
  onBack: () => void
}

type ViewState = 'menu' | 'settings' | 'playing' | 'notOptimal' | 'gameOver'
type ResetMode = 'manual' | 'auto'

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
  const [resetMode, setResetMode] = useState<ResetMode>('manual')
  const [resetKey, setResetKey] = useState<string>('r')
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
  const [notOptimalMsg, setNotOptimalMsg] = useState('')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keyboard listener for reset key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((viewState === 'playing' || viewState === 'notOptimal') && e.key.toLowerCase() === resetKey.toLowerCase()) {
        e.preventDefault()
        setSelectedPath([])
        setGridKey(prev => prev + 1)
        setNotOptimalMsg('')
        if (viewState === 'notOptimal') {
          setViewState('playing')
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewState, resetKey])
  
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
  const startNewRun = useCallback(async () => {
    clearSurvivalRun()
    
    // Clear Supabase if signed in
    if (userSignedIn) {
      await deleteCurrentRun('survival')
    }
    
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
    
    // Save to Supabase for cross-device sync
    if (userSignedIn) {
      await saveCurrentRun({
        mode: 'survival',
        survivalLevel: 3,
        survivalLives: 3,
        survivalScore: 0,
        gridState: newGrid,
        selectedPath: [newGrid.startPos],
        attempts: 0,
        timerSeconds: getSurvivalTime(3)
      })
    }
  }, [userSignedIn])
  
  // Continue run
  const continueRun = useCallback(async () => {
    // Try Supabase first if signed in
    if (userSignedIn) {
      const supabaseRun = await loadCurrentRun('survival')
      if (supabaseRun?.gridState) {
        setLevel(supabaseRun.survivalLevel || 3)
        setLives(supabaseRun.survivalLives || 3)
        setSelectedPath(supabaseRun.selectedPath || [supabaseRun.gridState.startPos])
        setAttempts(supabaseRun.attempts || 0)
        setShowTick(false)
        setGridKey(prev => prev + 1)
        setGrid(supabaseRun.gridState)
        setTimeRemaining(supabaseRun.timerSeconds || getSurvivalTime(supabaseRun.survivalLevel || 3))
        setViewState('playing')
        return
      }
    }
    
    // Fall back to localStorage
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
  }, [userSignedIn])
  
  // Go to next level
  const goToNextLevel = useCallback(async () => {
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
    
    // Update Supabase for cross-device sync
    if (userSignedIn) {
      await saveCurrentRun({
        mode: 'survival',
        survivalLevel: nextLevel,
        survivalLives: lives,
        gridState: newGrid,
        selectedPath: [newGrid.startPos],
        attempts: 0,
        timerSeconds: getSurvivalTime(nextLevel)
      })
    }
  }, [level, lives, userSignedIn])
  
  // Handle path change
  const handlePathChange = useCallback(async (path: Position[]) => {
    setSelectedPath(path)
    
    // Save to Supabase for cross-device sync (mid-path)
    if (userSignedIn && grid && path.length > 0) {
      const lastPos = path[path.length - 1]
      const isComplete = lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y
      
      if (!isComplete) {
        await saveCurrentRun({
          mode: 'survival',
          survivalLevel: level,
          survivalLives: lives,
          gridState: grid,
          selectedPath: path,
          attempts,
          timerSeconds: timeRemaining
        })
      }
    }
    
    if (grid && path.length > 0) {
      const lastPos = path[path.length - 1]
      if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
        const validation = validateSolution(grid, path)
        
        if (validation.isOptimal) {
          setShowTick(true)
          
          if (userSignedIn) {
            saveGameResult({
              mode: 'survival',
              level: level,
              score: 0,
              completed: true,
              attempts: attempts + 1
            })
          }
          
          setTimeout(() => {
            setShowTick(false)
            goToNextLevel()
          }, 1500)
        } else {
          const newLives = lives - 1
          setLives(newLives)
          setAttempts(prev => prev + 1)
          
          // Set not optimal message
          setNotOptimalMsg(`Not optimal path (${validation.userSum} vs best ${validation.optimalSum})`)
          
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
            // Auto reset if enabled, otherwise show notOptimal screen
            if (resetMode === 'auto') {
              setTimeout(() => {
                setSelectedPath([])
                setGridKey(prev => prev + 1)
                setNotOptimalMsg('')
              }, 600)
            } else {
              setViewState('notOptimal')
            }
          }
        }
      }
    }
  }, [grid, level, lives, attempts, timeRemaining, userSignedIn, goToNextLevel, resetMode])
  
  // Reset path
  const handleReset = useCallback(async () => {
    setSelectedPath([])
    setGridKey(prev => prev + 1)
    setNotOptimalMsg('')
    
    // If in notOptimal state, go back to playing
    if (viewState === 'notOptimal') {
      setViewState('playing')
    }
    
    // Sync reset to Supabase
    if (userSignedIn && grid) {
      await saveCurrentRun({
        mode: 'survival',
        survivalLevel: level,
        survivalLives: lives,
        gridState: grid,
        selectedPath: [],
        attempts,
        timerSeconds: timeRemaining
      })
    }
  }, [userSignedIn, grid, level, lives, attempts, timeRemaining, viewState])
  
  // Try again
  const handleTryAgain = useCallback(() => {
    setSelectedPath([])
    setViewState('playing')
    setGridKey(prev => prev + 1)
  }, [])
  
  // Skip to next
  const handleSkip = useCallback(() => {
    goToNextLevel()
  }, [goToNextLevel])
  
  // Check saved run
  const savedRun = getSurvivalRun()
  const hasSavedRun = savedRun !== null
  
  // Settings view
  if (viewState === 'settings') {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="w-full max-w-4xl mx-auto px-6 pt-8 pb-6">
          <button
            onClick={() => setViewState('menu')}
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
            <h1 className="font-display text-4xl sm:text-5xl mb-4 text-gradient">Settings</h1>
            <p className="text-text-secondary text-lg">Configure your game</p>
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            {/* Settings Card */}
            <div className="game-card">
              <h3 className="text-text-primary font-medium mb-4">Game Options</h3>
              
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
              <div className="mb-6">
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
              onClick={startNewRun}
              className="w-full btn-primary text-lg py-4"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    )
  }
  
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
            <h1 className="font-display text-5xl sm:text-6xl mb-4 text-gradient">Survival</h1>
            <p className="text-text-secondary text-lg">Race against time with limited lives</p>
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => setViewState('settings')}
              className="w-full game-card text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display text-text-primary mb-1">
                    {hasSavedRun ? 'New Run' : 'Play'}
                  </h2>
                  <p className="text-text-muted text-sm">3 lives • Timer</p>
                </div>
                <svg className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            {hasSavedRun && (
              <button
                onClick={continueRun}
                className="w-full game-card text-left border-accent/30 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display text-text-primary mb-1">Continue</h2>
                    <p className="text-text-muted text-sm">
                      Level {savedRun?.level}×{savedRun?.level} • {savedRun?.lives} ❤️
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </button>
            )}
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
          
          {/* Lives indicator */}
          <div className="flex items-center gap-1">
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} className="text-lg">❤️</span>
            ))}
          </div>
        </div>
        
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Instruction */}
          <p className="text-text-secondary text-sm mb-6 tracking-wide">
            Find the lowest sum path from <span className="text-[oklch(65%_0.1_145)] font-medium">START</span> to <span className="text-[oklch(55%_0.12_25)] font-medium">END</span>
          </p>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Best</span>
              <span className="font-display text-2xl text-[oklch(65%_0.1_145)]">{optimalSum}</span>
            </div>
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Your</span>
              <span className="font-display text-2xl text-accent">{currentSum}</span>
            </div>
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Time</span>
              <span className={`font-display text-2xl ${timeRemaining < 10 ? 'text-[oklch(55%_0.12_25)]' : 'text-text-primary'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="stat-pill p-2 hover:bg-bg-elevated transition-colors"
              title="Reset path"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Grid with level indicator */}
          <div className="relative flex items-start gap-4">
            <GameGrid
              key={gridKey}
              grid={grid}
              selectedPath={selectedPath}
              onPathChange={handlePathChange}
              isComplete={false}
              showStartEndLabels={true}
            />
            
            {/* Level indicator */}
            <div className="pt-6">
              <span className="font-display text-3xl text-text-muted">{level}×{level}</span>
            </div>
            
            {/* Success tick */}
            {showTick && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg 
                  className="w-20 h-20 text-[oklch(65%_0.1_145)] animate-fade-out" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Attempts and reset hint */}
          <div className="mt-6 text-center">
            {notOptimalMsg ? (
              <p className="text-[oklch(55%_0.12_25)] font-medium animate-pulse mb-1">{notOptimalMsg}</p>
            ) : null}
            <p className="text-text-muted text-sm">
              Attempt {attempts + 1} • Press <kbd className="px-2 py-1 bg-bg-elevated rounded text-text-primary font-mono">{resetKey}</kbd> to reset
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Not optimal view
  if (viewState === 'notOptimal' && grid) {
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
          
          {/* Lives - one less */}
          <div className="flex items-center gap-1">
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} className="text-lg">❤️</span>
            ))}
          </div>
        </div>
        
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Stats Bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Best</span>
              <span className="font-display text-2xl text-[oklch(65%_0.1_145)]">{optimalSum}</span>
            </div>
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Your</span>
              <span className="font-display text-2xl text-accent">{currentSum}</span>
            </div>
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Time</span>
              <span className="font-display text-2xl text-text-primary">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          
          {/* Grid */}
          <div className="relative flex items-start gap-4 mb-8">
            <GameGrid
              key={gridKey}
              grid={grid}
              selectedPath={selectedPath}
              onPathChange={() => {}}
              isComplete={true}
              showStartEndLabels={true}
            />
            <div className="pt-6">
              <span className="font-display text-3xl text-text-muted">{level}×{level}</span>
            </div>
          </div>
          
          {/* Message and actions */}
          <div className="text-center">
            {notOptimalMsg && (
              <p className="text-[oklch(55%_0.12_25)] font-medium mb-2 animate-pulse">{notOptimalMsg}</p>
            )}
            <p className="text-text-secondary mb-2">Lost a life! Try a different route?</p>
            <p className="text-text-muted text-sm mb-4">
              Press <kbd className="px-2 py-1 bg-bg-elevated rounded text-text-primary font-mono">{resetKey}</kbd> to reset
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleTryAgain}
                className="btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={handleSkip}
                className="btn-secondary"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Game Over
  if (viewState === 'gameOver') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="game-card max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[oklch(55%_0.12_25)]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[oklch(55%_0.12_25)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-display text-4xl mb-3 text-text-primary">Game Over</h2>
          <p className="text-text-secondary mb-8">
            {timeRemaining <= 0 ? 'Time ran out!' : 'Out of lives!'}
          </p>
          
          <div className="mb-8">
            <span className="text-text-muted text-sm uppercase tracking-wider">You reached</span>
            <p className="font-display text-5xl text-text-primary mt-2">{level}×{level}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { clearSurvivalRun(); startNewRun(); }}
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
