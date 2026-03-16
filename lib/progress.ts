// Progress tracking for signed-in users
// VERSION: 2026-03-16-v6 - Fixed column names to match schema

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

interface GameRecord {
  id: string
  mode: string
  grid_size: number
  score: number
  is_perfect: boolean
  created_at: string
}

// Save game result to Supabase (using game_results table)
export async function saveGameResult(result: GameResult): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/game_results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        mode: result.mode,
        grid_size: result.level, // schema uses grid_size
        score: result.score,
        is_perfect: result.completed && result.attempts === 1,
        time_seconds: 0,
        path_length: 0,
        created_at: new Date().toISOString()
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
    // Check if there's an existing record - schema uses grid_size not level
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/classic_progress?grid_size=eq.${level}&mode=eq.corner`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    const existing = await checkResponse.json() as Array<{ stars: number; id: string; attempts: number; perfect_solves: number }>
    const bestStars = existing.length > 0 ? Math.max(existing[0].stars, stars) : stars
    const isPerfect = stars === 3
    
    // Build the upsert data
    const upsertData = {
      grid_size: level, // schema uses grid_size
      mode: 'corner',
      stars: bestStars,
      attempts: existing.length > 0 ? existing[0].attempts + 1 : 1,
      perfect_solves: existing.length > 0 
        ? existing[0].perfect_solves + (isPerfect ? 1 : 0)
        : (isPerfect ? 1 : 0),
      updated_at: new Date().toISOString()
    }

    // Use POST with merge-duplicates for upsert
    const response = await fetch(`${SUPABASE_URL}/rest/v1/classic_progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(upsertData)
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
    // Fetch total games played from game_results
    const scoresResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/game_results?select=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    const scores = await scoresResponse.json() as Array<{ score: number }>
    
    // Fetch classic progress - schema uses grid_size
    const progressResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/classic_progress?select=grid_size,stars`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    const progress = await progressResponse.json() as Array<{ grid_size: number; stars: number }>

    const totalGames = scores.length
    const levelsCompleted = progress.length
    const bestScore = scores.length > 0 
      ? Math.max(...scores.map(s => s.score))
      : 0

    const classicProgress: Record<string, number> = {}
    progress.forEach(p => {
      classicProgress[p.grid_size] = p.stars
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
export async function fetchRecentGames(limit: number = 10): Promise<GameRecord[]> {
  const token = getAuthToken()
  if (!token) return []

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/game_results?order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      }
    )

    return await response.json() as GameRecord[]
  } catch (err) {
    console.error('Failed to fetch recent games:', err)
    return []
  }
}
