'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Position, GameGrid as GameGridType } from '@/lib/game'

interface GameGridProps {
  grid: GameGridType
  selectedPath: Position[]
  onPathChange: (path: Position[]) => void
  isComplete?: boolean
  showOptimal?: boolean
}

// VERSION: 2026-03-16-v11 - Fixed event handling and state reset
export default function GameGrid({
  grid,
  selectedPath,
  onPathChange,
  isComplete = false,
  showOptimal = false,
}: GameGridProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [, setHoveredCell] = useState<Position | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Reset dragging state when grid changes or completes
  useEffect(() => {
    setIsDragging(false)
    setHoveredCell(null)
  }, [grid, isComplete])

  const getCellClassName = (x: number, y: number): string => {
    const isStart = x === grid.startPos.x && y === grid.startPos.y
    const isEnd = x === grid.endPos.x && y === grid.endPos.y
    
    const pathIndex = selectedPath.findIndex(p => p.x === x && p.y === y)
    const isInPath = pathIndex !== -1
    const isLastInPath = pathIndex === selectedPath.length - 1 && pathIndex > 0
    
    const isOptimal = showOptimal && grid.optimalPath?.some(p => p.x === x && p.y === y)

    let className = 'grid-cell '
    
    if (isStart) {
      className += 'start '
    } else if (isEnd) {
      className += 'end '
    } else if (isLastInPath && !isComplete) {
      className += 'selected '
    } else if (isInPath) {
      className += 'path '
    }
    
    if (isOptimal && !isInPath) {
      className += 'opacity-50 '
    }

    return className
  }

  const isAdjacentToLast = useCallback((pos: Position): boolean => {
    if (selectedPath.length === 0) return false
    const last = selectedPath[selectedPath.length - 1]
    const dx = Math.abs(pos.x - last.x)
    const dy = Math.abs(pos.y - last.y)
    return dx + dy === 1
  }, [selectedPath])

  const handleCellInteraction = useCallback((x: number, y: number) => {
    if (isComplete) return

    const pos = { x, y }
    const existingIndex = selectedPath.findIndex(p => p.x === x && p.y === y)

    // Starting fresh - must click start cell
    if (selectedPath.length === 0) {
      if (x === grid.startPos.x && y === grid.startPos.y) {
        onPathChange([pos])
      }
      return
    }

    // Clicking on existing path - truncate to that point
    if (existingIndex !== -1) {
      onPathChange(selectedPath.slice(0, existingIndex + 1))
      return
    }

    // Must be adjacent to add
    if (!isAdjacentToLast(pos)) {
      return
    }

    // Add to path
    onPathChange([...selectedPath, pos])
  }, [selectedPath, onPathChange, grid.startPos, isComplete, isAdjacentToLast])

  const handleMouseDown = (x: number, y: number) => {
    if (isComplete) return
    setIsDragging(true)
    handleCellInteraction(x, y)
  }

  const handleMouseEnter = (x: number, y: number) => {
    if (isComplete) return
    setHoveredCell({ x, y })
    if (isDragging) {
      handleCellInteraction(x, y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (x: number, y: number) => {
    if (isComplete) return
    handleCellInteraction(x, y)
  }

  // Global mouse up handler - clean up on unmount
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchend', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchend', handleGlobalMouseUp)
    }
  }, [])

  // Calculate cell size based on grid size
  const getCellSize = () => {
    if (grid.size <= 4) return 'w-16 h-16 sm:w-20 sm:h-20 text-xl'
    if (grid.size <= 6) return 'w-14 h-14 sm:w-16 sm:h-16 text-lg'
    if (grid.size <= 8) return 'w-12 h-12 sm:w-14 sm:h-14 text-base'
    return 'w-10 h-10 sm:w-12 sm:h-12 text-sm'
  }

  return (
    <div 
      ref={gridRef}
      className="inline-block p-4 rounded-2xl bg-[#12121a] border border-white/10 select-none"
      onMouseLeave={() => {
        setHoveredCell(null)
        setIsDragging(false)
      }}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div 
        className="grid gap-2"
        style={{ 
          gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))`,
        }}
      >
        {grid.cells.map((row, y) =>
          row.map((value, x) => {
            const isStart = x === grid.startPos.x && y === grid.startPos.y
            
            return (
              <button
                key={`${grid.size}-${x}-${y}`}
                className={`${getCellClassName(x, y)} ${getCellSize()}`}
                onMouseDown={() => handleMouseDown(x, y)}
                onMouseEnter={() => handleMouseEnter(x, y)}
                onMouseUp={handleMouseUp}
                onTouchStart={(e) => {
                  e.preventDefault()
                  handleTouchStart(x, y)
                }}
                onTouchMove={(e) => {
                  // Handle touch drag
                  if (!isDragging) return
                  const touch = e.touches[0]
                  const element = document.elementFromPoint(touch.clientX, touch.clientY)
                  if (element && element.hasAttribute('data-x') && element.hasAttribute('data-y')) {
                    const touchX = parseInt(element.getAttribute('data-x') || '0')
                    const touchY = parseInt(element.getAttribute('data-y') || '0')
                    handleCellInteraction(touchX, touchY)
                  }
                }}
                disabled={isComplete}
                data-x={x}
                data-y={y}
              >
                {isStart ? (
                  <span className="text-xs sm:text-sm font-bold">START</span>
                ) : (
                  <span>{value}</span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
