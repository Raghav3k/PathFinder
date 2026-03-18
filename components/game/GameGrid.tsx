'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Position, GameGrid as GameGridType } from '@/lib/game'

interface GameGridProps {
  grid: GameGridType
  selectedPath: Position[]
  onPathChange: (path: Position[]) => void
  isComplete?: boolean
  showOptimal?: boolean
  showStartEndLabels?: boolean
}

export default function GameGrid({
  grid,
  selectedPath,
  onPathChange,
  isComplete = false,
  showOptimal = false,
  showStartEndLabels = false,
}: GameGridProps) {
  const [isDragging, setIsDragging] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Reset dragging state when grid changes or completes
  useEffect(() => {
    setIsDragging(false)
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
      className += 'opacity-40 '
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
    setIsDragging(true)
    handleCellInteraction(x, y)
  }

  const handleMouseEnter = (x: number, y: number) => {
    if (!isDragging) return
    handleCellInteraction(x, y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (x: number, y: number) => {
    setIsDragging(true)
    handleCellInteraction(x, y)
  }

  // Dynamic cell size based on grid size
  const getCellSize = () => {
    if (grid.size <= 4) return 'w-16 h-16 sm:w-20 sm:h-20 text-2xl'
    if (grid.size <= 6) return 'w-14 h-14 sm:w-16 sm:h-16 text-xl'
    if (grid.size <= 8) return 'w-12 h-12 sm:w-14 sm:h-14 text-lg'
    return 'w-10 h-10 sm:w-12 sm:h-12 text-base'
  }

  return (
    <div 
      ref={gridRef}
      className="inline-block p-5 rounded-xl bg-bg-paper/50 border border-white/5 select-none"
      onMouseLeave={() => {
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
            const isEnd = x === grid.endPos.x && y === grid.endPos.y
            
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
                {showStartEndLabels && isStart ? (
                  'START'
                ) : showStartEndLabels && isEnd ? (
                  'END'
                ) : (
                  value
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
