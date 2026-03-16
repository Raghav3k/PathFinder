// Progress tracking for signed-in users
// VERSION: 2026-03-16-v4

import { getAuthToken } from './auth'

const SUPABASE_URL = 'https://kcbvupdqgbevatxctlbb.supabase.co'

interface GameResult {
  mode: 'classic' | 'survival'
  level: number
  score: number
  stars?: number
  completed: boolean
  attempts: number
}

interface UserStats {
  totalGames: number
  levelsCompleted: number
  bestScore: number
  classicProgress: Record<string, number>
}

// Save game result to Supabase
export async function saveGameResult(result: GameResult): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_scores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        game_mode: result.mode,
        level: result.level,
        score: result.score,
        stars: result.stars || null,
        completed: result.completed,
        attempts: result.attempts,
        played_at: new Date().toISOString()
      })
    })

    return response.ok
  } catch (err) {
    console.error('Failed to save game result:', err)
    return false
  }
}

// Save classic mode progress
export async function saveClassicProgress(level: number, stars: number): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false

  try {
    // First check if there's an existing record
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/classic_progress?level=eq.${level}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    const existing = await checkResponse.json()
    const bestStars = existing.length > 0 ? Math.max(existing[0].stars, stars) : stars

    const response = await fetch(`${SUPABASE_URL}/rest/v1/classic_progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        level: level,
        stars: bestStars,
        completed_at: new Date().toISOString()
      })
    })

    return response.ok
  } catch (err) {
    console.error('Failed to save classic progress:', err)
    return false
  }
}

// Fetch user stats
export async function fetchUserStats(): Promise<UserStats | null> {
  const token = getAuthToken()
  if (!token) return null

  try {
    // Fetch total games played
    const scoresResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_scores?select=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    const scores = await scoresResponse.json()
    
    // Fetch classic progress
    const progressResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/classic_progress?select=level,stars`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    const progress = await progressResponse.json()

    const totalGames = scores.length
    const levelsCompleted = progress.length
    const bestScore = scores.length > 0 
      ? Math.max(...scores.map((s: { score: number }) => s.score))
      : 0

    const classicProgress: Record<string, number> = {}
    progress.forEach((p: { level: number; stars: number }) => {
      classicProgress[p.level] = p.stars
    })

    return {
      totalGames,
      levelsCompleted,
      bestScore,
      classicProgress
    }
  } catch (err) {
    console.error('Failed to fetch user stats:', err)
    return null
  }
}

// Fetch recent games
export async function fetchRecentGames(limit: number = 10): Promise<any[]> {
  const token = getAuthToken()
  if (!token) return []

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_scores?order=played_at.desc&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    return await response.json()
  } catch (err) {
    console.error('Failed to fetch recent games:', err)
    return []
  }
}
