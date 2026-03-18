// PathFinder Game Logic
// VERSION: 2026-03-18-v2 - Added difficulty modes and path patterns

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

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type PathPattern = 'straight' | 'simple_zigzag' | 'complex_zigzag' | 'snake' | 'random'

// Generate a random grid with meaningful values
export function generateGrid(
  size: number, 
  mode: 'corner' | 'center' = 'corner',
  difficulty: Difficulty = 'medium'
): GameGrid {
  // Start and end positions
  const startPos: Position = mode === 'corner' 
    ? { x: 0, y: 0 }
    : { x: Math.floor(size / 2), y: Math.floor(size / 2) }
  
  const endPos: Position = { x: size - 1, y: size - 1 }
  
  // Generate based on difficulty
  const grid = generateMazeGrid(size, startPos, endPos, difficulty)
  
  // Calculate optimal path immediately
  const optimal = findOptimalPath(grid)
  grid.optimalPath = optimal.path
  grid.optimalSum = optimal.sum
  
  return grid
}

// Generate grid with maze-like structure (branches/traps)
function generateMazeGrid(
  size: number,
  startPos: Position,
  endPos: Position,
  difficulty: Difficulty
): GameGrid {
  const cells: number[][] = Array(size).fill(null).map(() => Array(size).fill(0))
  
  // Determine number of trap branches based on difficulty
  const trapCount = {
    'easy': 0,
    'medium': 1,
    'hard': 2,
    'expert': 3
  }[difficulty]
  
  // First, create the optimal path
  const optimalPath = generateComplexZigzagPath(size, startPos, endPos)
  
  // Place values on optimal path (medium values - 3-5)
  for (const pos of optimalPath) {
    cells[pos.y][pos.x] = Math.floor(Math.random() * 3) + 3 // 3-5
  }
  
  // Create trap branches
  for (let i = 0; i < trapCount; i++) {
    createTrapBranch(cells, size, startPos, endPos, optimalPath)
  }
  
  // Fill remaining cells with higher values (6-9) to discourage wandering
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y][x] === 0) {
        cells[y][x] = Math.floor(Math.random() * 4) + 6 // 6-9
      }
    }
  }
  
  return { size, cells, startPos, endPos }
}

// Generate complex zigzag path (for 1 Min Mode and as base for maze)
function generateComplexZigzagPath(
  size: number,
  startPos: Position,
  endPos: Position
): Position[] {
  const path: Position[] = [{ ...startPos }]
  let current = { ...startPos }
  
  // Use a biased random walk that tends toward end but zigzags
  while (current.x !== endPos.x || current.y !== endPos.y) {
    const possible: Position[] = []
    
    // Can we move right?
    if (current.x < endPos.x) {
      possible.push({ x: current.x + 1, y: current.y })
    }
    // Can we move down?
    if (current.y < endPos.y) {
      possible.push({ x: current.x, y: current.y + 1 })
    }
    // Can we move left? (for zigzag)
    if (current.x > 0 && Math.random() < 0.3) {
      possible.push({ x: current.x - 1, y: current.y })
    }
    // Can we move up? (for zigzag)
    if (current.y > 0 && Math.random() < 0.3) {
      possible.push({ x: current.x, y: current.y - 1 })
    }
    
    // Filter out visited positions
    const unvisited = possible.filter(p => 
      !path.some(visited => visited.x === p.x && visited.y === p.y)
    )
    
    if (unvisited.length === 0) {
      // Dead end - backtrack (shouldn't happen often with this logic)
      break
    }
    
    // Prefer moves toward end, but allow zigzag
    const next = unvisited[Math.floor(Math.random() * unvisited.length)]
    path.push(next)
    current = next
  }
  
  return path
}

// Create a trap branch (path that looks good but leads to high numbers)
function createTrapBranch(
  cells: number[][],
  size: number,
  startPos: Position,
  endPos: Position,
  optimalPath: Position[]
): void {
  // Find a point on optimal path to branch from (not start or end)
  const branchIndex = Math.floor(Math.random() * (optimalPath.length - 2)) + 1
  const branchPoint = optimalPath[branchIndex]
  
  // Create a short tempting path with low values
  const trapLength = Math.floor(Math.random() * 2) + 2 // 2-3 cells
  let current = { ...branchPoint }
  
  for (let i = 0; i < trapLength; i++) {
    // Find adjacent unvisited cell
    const adjacent: Position[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].filter(p => 
      p.x >= 0 && p.x < size && 
      p.y >= 0 && p.y < size &&
      cells[p.y][p.x] === 0 &&
      !optimalPath.some(op => op.x === p.x && op.y === p.y)
    )
    
    if (adjacent.length === 0) break
    
    const next = adjacent[Math.floor(Math.random() * adjacent.length)]
    
    // Place tempting low value (1-2)
    cells[next.y][next.x] = Math.floor(Math.random() * 2) + 1
    
    current = next
  }
  
  // End with a high value to make it a trap
  if (current.x !== branchPoint.x || current.y !== branchPoint.y) {
    const endAdjacent: Position[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].filter(p => 
      p.x >= 0 && p.x < size && 
      p.y >= 0 && p.y < size &&
      cells[p.y][p.x] === 0
    )
    
    if (endAdjacent.length > 0) {
      const trapEnd = endAdjacent[Math.floor(Math.random() * endAdjacent.length)]
      cells[trapEnd.y][trapEnd.x] = 9 // Dead end with high value
    }
  }
}

// Generate grid for 1 Min Mode (complex zigzag, no dead ends)
export function generateOneMinGrid(size: number): GameGrid {
  const startPos: Position = { x: 0, y: 0 }
  const endPos: Position = { x: size - 1, y: size - 1 }
  const cells: number[][] = Array(size).fill(null).map(() => Array(size).fill(0))
  
  // Generate complex zigzag path
  const path = generateComplexZigzagPath(size, startPos, endPos)
  
  // Place medium values on path (3-5)
  for (const pos of path) {
    cells[pos.y][pos.x] = Math.floor(Math.random() * 3) + 3
  }
  
  // Fill rest with higher values (6-9)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y][x] === 0) {
        cells[y][x] = Math.floor(Math.random() * 4) + 6
      }
    }
  }
  
  const grid: GameGrid = { size, cells, startPos, endPos }
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

// Get difficulty display name
export function getDifficultyName(difficulty: Difficulty): string {
  const names: Record<Difficulty, string> = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard',
    'expert': 'Expert'
  }
  return names[difficulty]
}
