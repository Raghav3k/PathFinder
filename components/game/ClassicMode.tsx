'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import GameGrid from './GameGrid'
import { generateGrid, validateSolution, findOptimalPath, Position, GameGrid as GameGridType, Difficulty, getDifficultyName } from '@/lib/game'
import { saveGameResult, saveClassicProgress, saveCurrentRun, loadCurrentRun, deleteCurrentRun } from '@/lib/progress'
import { incrementGuestLevelsPlayed, shouldShowLoginPrompt, markLoginPromptShown } from '@/lib/guest'

interface ClassicModeProps {
  userSignedIn: boolean
  onBack: () => void
}

type ViewState = 'menu' | 'difficulty' | 'settings' | 'playing' | 'notOptimal' | 'loginPrompt'

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
  timer?: number
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

async function saveGameState(state: Omit<GameState, 'timestamp'>, signedIn: boolean, currentTimer?: number) {
  if (typeof window === 'undefined') return
  
  // Always save to localStorage (for quick recovery)
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }))
  
  // If signed in, also save to Supabase for cross-device sync
  if (signedIn) {
    await saveCurrentRun({
      mode: 'classic',
      classicLevel: state.level,
      gridState: state.grid,
      selectedPath: state.selectedPath,
      attempts: state.attempts,
      timerSeconds: currentTimer
    })
  }
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
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [level, setLevel] = useState(3)
  const [grid, setGrid] = useState<GameGridType | null>(null)
  const [selectedPath, setSelectedPath] = useState<Position[]>([])
  const [attempts, setAttempts] = useState(0)
  const [optimalSum, setOptimalSum] = useState(0)
  const [currentSum, setCurrentSum] = useState(0)
  const [timer, setTimer] = useState(0)
  const [showTick, setShowTick] = useState(false)
  const [gridKey, setGridKey] = useState(0)
  const [resetKey, setResetKey] = useState<string>('r')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keyboard listener for reset key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((viewState === 'playing' || viewState === 'notOptimal') && e.key.toLowerCase() === resetKey.toLowerCase()) {
        e.preventDefault()
        setSelectedPath([])
        setGridKey(prev => prev + 1)
        if (viewState === 'notOptimal') {
          setViewState('playing')
        }
        if (grid) {
          saveGameState({
            level,
            grid,
            selectedPath: [],
            attempts
          }, userSignedIn, timer)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewState, resetKey, level, grid, attempts, userSignedIn, timer])
  
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
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [viewState])
  
  // Calculate optimal sum (excluding start and end cells)
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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start new game
  const startNewGame = useCallback(async () => {
    clearProgress()
    clearGameState()
    
    // Clear Supabase current run if signed in
    if (userSignedIn) {
      await deleteCurrentRun('classic')
    }
    setLevel(3)
    setSelectedPath([])
    setAttempts(0)
    setTimer(0)
    setShowTick(false)
    setGridKey(prev => prev + 1)
    
    const newGrid = generateGrid(3, 'corner', difficulty)
    setGrid(newGrid)
    setViewState('playing')
    
    saveProgress({ level: 3 })
    saveGameState({
      level: 3,
      grid: newGrid,
      selectedPath: [],
      attempts: 0
    }, userSignedIn)
  }, [userSignedIn, difficulty])
  
  // Continue/resume game
  const continueGame = useCallback(async () => {
    // Try Supabase first if signed in (for cross-device sync)
    if (userSignedIn) {
      const supabaseRun = await loadCurrentRun('classic')
      if (supabaseRun?.gridState) {
        setLevel(supabaseRun.classicLevel || 3)
        setGrid(supabaseRun.gridState)
        setSelectedPath(supabaseRun.selectedPath || [supabaseRun.gridState.startPos])
        setAttempts(supabaseRun.attempts || 0)
        setTimer(supabaseRun.timerSeconds || 0)
        setShowTick(false)
        setGridKey(prev => prev + 1)
        setViewState('playing')
        
        // Also sync to localStorage for offline fallback
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify({
          level: supabaseRun.classicLevel || 3,
          grid: supabaseRun.gridState,
          selectedPath: supabaseRun.selectedPath || [supabaseRun.gridState.startPos],
          attempts: supabaseRun.attempts || 0,
          timestamp: Date.now()
        }))
        return
      }
    }
    
    // Fall back to localStorage
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
      
      const newGrid = generateGrid(startLevel, 'corner', difficulty)
      setGrid(newGrid)
      setViewState('playing')
      
      saveGameState({
        level: startLevel,
        grid: newGrid,
        selectedPath: [],
        attempts: 0
      }, userSignedIn)
    }
  }, [userSignedIn, difficulty])
  
  // Go to next level
  const goToNextLevel = useCallback(async () => {
    if (!userSignedIn) {
      incrementGuestLevelsPlayed()
      if (shouldShowLoginPrompt()) {
        markLoginPromptShown()
        setViewState('loginPrompt')
        return
      }
    }
    
    // Clear current run from Supabase when completing level
    if (userSignedIn) {
      await deleteCurrentRun('classic')
    }
    
    if (level < 10) {
      const nextLevel = level + 1
      setLevel(nextLevel)
      setSelectedPath([])
      setAttempts(0)
      setTimer(0)
      setShowTick(false)
      setGridKey(prev => prev + 1)
      
      const newGrid = generateGrid(nextLevel, 'corner', difficulty)
      setGrid(newGrid)
      setViewState('playing')
      
      saveProgress({ level: nextLevel })
      saveGameState({
        level: nextLevel,
        grid: newGrid,
        selectedPath: [],
        attempts: 0
      }, userSignedIn)
    } else {
      clearProgress()
      clearGameState()
      onBack()
    }
  }, [level, userSignedIn, onBack, difficulty])
  
  // Handle path change
  const handlePathChange = useCallback((path: Position[]) => {
    setSelectedPath(path)
    
    if (grid) {
      saveGameState({
        level,
        grid,
        selectedPath: path,
        attempts
      }, userSignedIn, timer)
      
      if (path.length > 0) {
        const lastPos = path[path.length - 1]
        if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
          const validation = validateSolution(grid, path)
          
          if (validation.isOptimal) {
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
            
            setTimeout(() => {
              setShowTick(false)
              goToNextLevel()
            }, 1500)
          } else {
            setAttempts(prev => prev + 1)
            setViewState('notOptimal')
          }
        }
      }
    }
  }, [grid, level, attempts, timer, userSignedIn, goToNextLevel])
  
  // Reset path
  const handleReset = useCallback(() => {
    setSelectedPath([])
    setGridKey(prev => prev + 1)
    
    // If in notOptimal state, go back to playing
    if (viewState === 'notOptimal') {
      setViewState('playing')
    }
    
    if (grid) {
      saveGameState({
        level,
        grid,
        selectedPath: [],
        attempts
      }, userSignedIn, timer)
    }
  }, [grid, level, attempts, timer, userSignedIn, viewState])
  
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
  
  // Check saved states
  const savedGameState = getGameState()
  const savedProgress = getSavedProgress()
  const hasSavedGame = savedProgress !== null
  const hasInProgressGame = savedGameState !== null
  
  // Menu view - Editorial style
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
            <h1 className="font-display text-5xl sm:text-6xl mb-4 text-gradient">Classic</h1>
            <p className="text-text-secondary text-lg">Progressive difficulty pathfinding</p>
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => setViewState('difficulty')}
              className="w-full game-card text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display text-text-primary mb-1">New Game</h2>
                  <p className="text-text-muted text-sm">Choose difficulty and start fresh</p>
                </div>
                <svg className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            {hasSavedGame && (
              <button
                onClick={continueGame}
                className="w-full game-card text-left border-accent/30 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display text-text-primary mb-1">
                      {hasInProgressGame ? 'Resume' : 'Continue'}
                    </h2>
                    <p className="text-text-muted text-sm">
                      {hasInProgressGame 
                        ? `Level ${savedGameState?.level}×${savedGameState?.level} in progress`
                        : `Resume from level ${savedProgress?.level}×${savedProgress?.level}`
                      }
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
  
  // Difficulty selector view
  if (viewState === 'difficulty') {
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
            <h1 className="font-display text-4xl sm:text-5xl mb-4 text-gradient">Select Difficulty</h1>
            <p className="text-text-secondary text-lg">Choose your challenge level</p>
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  setDifficulty(diff)
                  startNewGame()
                }}
                className={`w-full game-card text-left group transition-all ${
                  difficulty === diff ? 'border-accent/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display text-text-primary mb-1 capitalize">{getDifficultyName(diff)}</h2>
                    <p className="text-text-muted text-sm">
                      {diff === 'easy' && 'Straight path, no traps'}
                      {diff === 'medium' && 'Occasional branches'}
                      {diff === 'hard' && 'Multiple trap paths'}
                      {diff === 'expert' && 'Complex maze navigation'}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            
            {/* Reset Key Setting */}
            <div className="game-card mt-6">
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
        </div>
      </div>
    )
  }
  
  // Playing view - Editorial layout
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
              <span className="font-display text-2xl text-text-primary">{formatTime(timer)}</span>
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
        </div>
        
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Stats Bar - Frozen */}
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
              <span className="font-display text-2xl text-text-primary">{formatTime(timer)}</span>
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
            <p className="text-text-secondary mb-2">Not the optimal path. Try a different route?</p>
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
  
  // Login prompt
  if (viewState === 'loginPrompt') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm p-6">
        <div className="game-card max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="font-display text-3xl mb-3 text-text-primary">On a Roll!</h2>
          <p className="text-text-secondary mb-8">
            You&apos;ve completed 5 levels! Sign in to save your progress.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/signin">
              <button className="btn-primary w-full">
                Sign In
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
                  }, userSignedIn)
                }
              }}
              className="btn-secondary w-full"
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
