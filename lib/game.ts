// PathFinder Game Logic

export interface Position {
  x: number
  y: number
}

export interface PathResult {
  path: Position[]
  sum: number
}

export interface GameGrid {
  size: number
  cells: number[][]
  startPos: Position
  endPos: Position
  optimalPath?: Position[]
  optimalSum?: number
}

// Generate a random grid with meaningful values
export function generateGrid(size: number, mode: 'corner' | 'center' = 'corner'): GameGrid {
  const cells: number[][] = []
  
  // Start and end positions
  const startPos: Position = mode === 'corner' 
    ? { x: 0, y: 0 }
    : { x: Math.floor(size / 2), y: Math.floor(size / 2) }
  
  const endPos: Position = { x: size - 1, y: size - 1 }
  
  // Generate random values (1-9, with lower values near start/end for better paths)
  for (let y = 0; y < size; y++) {
    cells[y] = []
    for (let x = 0; x < size; x++) {
      // Start and end cells get lower values
      if ((x === startPos.x && y === startPos.y) || (x === endPos.x && y === endPos.y)) {
        cells[y][x] = Math.floor(Math.random() * 3) + 1
      } else {
        cells[y][x] = Math.floor(Math.random() * 9) + 1
      }
    }
  }
  
  const grid: GameGrid = { size, cells, startPos, endPos }
  
  // Calculate optimal path immediately
  const optimal = findOptimalPath(grid)
  grid.optimalPath = optimal.path
  grid.optimalSum = optimal.sum
  
  return grid
}

// Dijkstra's algorithm to find minimum sum path
export function findOptimalPath(grid: GameGrid): PathResult {
  const { size, cells, startPos, endPos } = grid
  
  // Priority queue: [sum, position, path]
  type QueueItem = [number, Position, Position[]]
  const pq: QueueItem[] = [[cells[startPos.y][startPos.x], startPos, [startPos]]]
  
  const visited = new Set<string>()
  
  while (pq.length > 0) {
    // Sort by sum (priority queue)
    pq.sort((a, b) => a[0] - b[0])
    const [sum, pos, path] = pq.shift()!
    
    const key = `${pos.x},${pos.y}`
    if (visited.has(key)) continue
    visited.add(key)
    
    // Found the end!
    if (pos.x === endPos.x && pos.y === endPos.y) {
      return { path, sum }
    }
    
    // Check all 4 directions (up, down, left, right)
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]
    for (const [dx, dy] of directions) {
      const nx = pos.x + dx
      const ny = pos.y + dy
      
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        const newSum = sum + cells[ny][nx]
        const newPath = [...path, { x: nx, y: ny }]
        pq.push([newSum, { x: nx, y: ny }, newPath])
      }
    }
  }
  
  throw new Error('No path found')
}

// Validate if two positions are adjacent
export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return dx + dy === 1
}

// Calculate sum of a path
export function calculatePathSum(grid: GameGrid, path: Position[]): number {
  return path.reduce((sum, pos) => sum + grid.cells[pos.y][pos.x], 0)
}

// Check if user path is optimal
export function validateSolution(
  grid: GameGrid,
  userPath: Position[]
): {
  isOptimal: boolean
  isComplete: boolean
  userSum: number
  optimalSum: number
  difference: number
} {
  const userSum = calculatePathSum(grid, userPath)
  const optimalSum = grid.optimalSum!
  const isComplete = userPath.length > 0 && 
    userPath[userPath.length - 1].x === grid.endPos.x && 
    userPath[userPath.length - 1].y === grid.endPos.y
  
  return {
    isOptimal: userSum === optimalSum && isComplete,
    isComplete,
    userSum,
    optimalSum,
    difference: userSum - optimalSum
  }
}

// Survival mode scoring
export function calculateSurvivalScore(
  level: number,
  timeRemaining: number,
  isPerfect: boolean,
  combo: number
): number {
  const baseScore = level * 100
  const timeBonus = Math.floor(timeRemaining * 10)
  const perfectBonus = isPerfect ? 50 : 0
  const comboMultiplier = 1 + (combo * 0.1)
  
  return Math.floor((baseScore + timeBonus + perfectBonus) * comboMultiplier)
}

// Time limit for survival mode (decreases as level increases)
export function getSurvivalTimeLimit(level: number): number {
  // Level 3: 60s, Level 4: 55s, Level 5: 50s... minimum 20s
  return Math.max(20, 75 - (level * 5))
}
