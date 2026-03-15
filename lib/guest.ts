// Guest user management - Zero friction approach

const GUEST_ID_KEY = 'pathfinder_guest_id'
const GUEST_USERNAME_KEY = 'pathfinder_guest_username'
const GUEST_STATS_KEY = 'pathfinder_guest_stats'
const GUEST_LEVELS_PLAYED_KEY = 'pathfinder_guest_levels_played'
const HAS_SEEN_LOGIN_PROMPT_KEY = 'pathfinder_seen_login_prompt'

// Generate a random guest username like "Guest8921"
export function generateGuestUsername(): string {
  const random = Math.floor(1000 + Math.random() * 9000)
  return `Guest${random}`
}

// Get or create guest ID
export function getGuestId(): string {
  if (typeof window === 'undefined') return ''
  
  let guestId = localStorage.getItem(GUEST_ID_KEY)
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(GUEST_ID_KEY, guestId)
  }
  return guestId
}

// Get or create guest username
export function getGuestUsername(): string {
  if (typeof window === 'undefined') return 'Guest'
  
  let username = localStorage.getItem(GUEST_USERNAME_KEY)
  if (!username) {
    username = generateGuestUsername()
    localStorage.setItem(GUEST_USERNAME_KEY, username)
  }
  return username
}

// Track levels played as guest
export function incrementGuestLevelsPlayed(): number {
  if (typeof window === 'undefined') return 0
  
  const current = parseInt(localStorage.getItem(GUEST_LEVELS_PLAYED_KEY) || '0')
  const newCount = current + 1
  localStorage.setItem(GUEST_LEVELS_PLAYED_KEY, newCount.toString())
  return newCount
}

export function getGuestLevelsPlayed(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(GUEST_LEVELS_PLAYED_KEY) || '0')
}

// Check if we should show login prompt (after 5 levels)
export function shouldShowLoginPrompt(): boolean {
  if (typeof window === 'undefined') return false
  
  const levelsPlayed = getGuestLevelsPlayed()
  const hasSeenPrompt = localStorage.getItem(HAS_SEEN_LOGIN_PROMPT_KEY) === 'true'
  
  // Show prompt at level 5, and every 10 levels after that (15, 25, etc)
  if (levelsPlayed === 5 || (levelsPlayed > 5 && levelsPlayed % 10 === 5)) {
    return !hasSeenPrompt
  }
  return false
}

export function markLoginPromptShown(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HAS_SEEN_LOGIN_PROMPT_KEY, 'true')
}

export function resetLoginPrompt(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HAS_SEEN_LOGIN_PROMPT_KEY)
}

// Guest stats interface
export interface GuestStats {
  totalGames: number
  perfectSolves: number
  survivalHighScore: number
  survivalMaxLevel: number
  classicStars: Record<number, number>
  playTimeMinutes: number
}

// Get guest stats
export function getGuestStats(): GuestStats {
  if (typeof window === 'undefined') {
    return {
      totalGames: 0,
      perfectSolves: 0,
      survivalHighScore: 0,
      survivalMaxLevel: 0,
      classicStars: {},
      playTimeMinutes: 0
    }
  }
  
  const saved = localStorage.getItem(GUEST_STATS_KEY)
  if (saved) {
    return JSON.parse(saved)
  }
  
  return {
    totalGames: 0,
    perfectSolves: 0,
    survivalHighScore: 0,
    survivalMaxLevel: 0,
    classicStars: {},
    playTimeMinutes: 0
  }
}

// Save guest stats
export function saveGuestStats(stats: GuestStats): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(stats))
}

// Clear guest data (when user signs in)
export function clearGuestData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_ID_KEY)
  localStorage.removeItem(GUEST_USERNAME_KEY)
  localStorage.removeItem(GUEST_STATS_KEY)
  localStorage.removeItem(GUEST_LEVELS_PLAYED_KEY)
  localStorage.removeItem(HAS_SEEN_LOGIN_PROMPT_KEY)
}

// Check if user is signed in
export function isSignedIn(): boolean {
  if (typeof window === 'undefined') return false
  return false
}

// Get display name
export function getDisplayName(): string {
  if (isSignedIn()) {
    return 'Player'
  }
  return getGuestUsername()
}
