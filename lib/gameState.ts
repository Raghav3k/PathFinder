// Persist game state to survive page refreshes
// VERSION: 2026-03-16-v7

const GAME_STATE_KEY = 'pathfinder_game_state'

export interface SavedGameState {
  selectedMode: 'classic' | 'survival'
  classicLevel: number
  classicStars: Record<number, number>
  survivalLevel: number
  survivalLives: number
  survivalScore: number
  survivalCombo: number
  gameState: 'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'loginPrompt'
  attempts: number
  timestamp: number
}

// Save current game state
export function saveGameState(state: Omit<SavedGameState, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  
  const stateWithTimestamp: SavedGameState = {
    ...state,
    timestamp: Date.now()
  }
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateWithTimestamp))
}

// Load saved game state (returns null if expired or not found)
export function loadGameState(): SavedGameState | null {
  if (typeof window === 'undefined') return null
  
  const saved = localStorage.getItem(GAME_STATE_KEY)
  if (!saved) return null
  
  try {
    const state = JSON.parse(saved) as SavedGameState
    
    // Check if state is expired (older than 1 hour)
    const oneHour = 60 * 60 * 1000
    if (Date.now() - state.timestamp > oneHour) {
      clearGameState()
      return null
    }
    
    return state
  } catch {
    return null
  }
}

// Clear saved game state
export function clearGameState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GAME_STATE_KEY)
}

// Check if there's a valid saved game state
export function hasSavedGameState(): boolean {
  return loadGameState() !== null
}
