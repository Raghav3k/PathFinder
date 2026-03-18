'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameGrid from './GameGrid'
import { generateOneMinGrid, validateSolution, findOptimalPath, Position, GameGrid as GameGridType } from '@/lib/game'
import { saveGameResult } from '@/lib/progress'

interface OneMinModeProps {
  userSignedIn: boolean
  onBack: () => void
}

type ViewState = 'menu' | 'playing' | 'gameOver'

const ONE_MINUTE = 60 // seconds

export default function OneMinMode({ userSignedIn, onBack }: OneMinModeProps) {
  const [viewState, setViewState] = useState<ViewState>('menu')
  const [level, setLevel] = useState(3)
  const [levelsCompleted, setLevelsCompleted] = useState(0)
  const [grid, setGrid] = useState<GameGridType | null>(null)
  const [selectedPath, setSelectedPath] = useState<Position[]>([])
  const [, setOptimalSum] = useState(0)
  const [, setCurrentSum] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(ONE_MINUTE)
  const [showTick, setShowTick] = useState(false)
  const [gridKey, setGridKey] = useState(0)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
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
  
  // Start new run
  const startGame = useCallback(() => {
    setLevel(3)
    setLevelsCompleted(0)
    setSelectedPath([])
    setShowTick(false)
    setGridKey(prev => prev + 1)
    setTimeRemaining(ONE_MINUTE)
    
    const newGrid = generateOneMinGrid(3)
    setGrid(newGrid)
    setViewState('playing')
  }, [])
  
  // Go to next level
  const goToNextLevel = useCallback(() => {
    const nextLevel = level + 1
    setLevel(nextLevel)
    setLevelsCompleted(prev => prev + 1)
    setSelectedPath([])
    setShowTick(false)
    setGridKey(prev => prev + 1)
    
    const newGrid = generateOneMinGrid(nextLevel)
    setGrid(newGrid)
  }, [level])
  
  // Handle path change
  const handlePathChange = useCallback((path: Position[]) => {
    setSelectedPath(path)
    
    if (grid && path.length > 0) {
      const lastPos = path[path.length - 1]
      if (lastPos.x === grid.endPos.x && lastPos.y === grid.endPos.y) {
        const validation = validateSolution(grid, path)
        
        if (validation.isOptimal) {
          setShowTick(true)
          
          if (userSignedIn) {
            saveGameResult({
              mode: 'classic',
              level: level,
              score: levelsCompleted + 1,
              completed: true,
              attempts: 1
            })
          }
          
          setTimeout(() => {
            setShowTick(false)
            goToNextLevel()
          }, 800) // Faster transition for speed mode
        }
      }
    }
  }, [grid, level, levelsCompleted, userSignedIn, goToNextLevel])
  
  // Reset path
  const handleReset = useCallback(() => {
    setSelectedPath([])
    setGridKey(prev => prev + 1)
  }, [])
  
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
          <div className="mb-6">
            <span className={`font-display text-6xl ${timeRemaining < 10 ? 'text-[oklch(55%_0.12_25)]' : 'text-text-primary'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="stat-pill flex items-center gap-3">
              <span className="text-text-muted text-xs uppercase tracking-wider">Grid</span>
              <span className="font-display text-2xl text-text-primary">{level}×{level}</span>
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
          
          {/* Grid */}
          <div className="relative">
            <GameGrid
              key={gridKey}
              grid={grid}
              selectedPath={selectedPath}
              onPathChange={handlePathChange}
              isComplete={false}
              showStartEndLabels={true}
            />
            
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
