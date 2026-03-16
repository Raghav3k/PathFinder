// Progress tracking for signed-in users
// VERSION: 2026-03-16-v7 - Added debug logging

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
  console.log('[DEBUG] saveGameResult called, token exists:', !!token)
  
  if (!token) {
    console.log('[DEBUG] No token, skipping save')
    return false
  }

  const payload = {
    mode: result.mode,
    grid_size: result.level,
    score: result.score,
    is_perfect: result.completed && result.attempts === 1,
    time_seconds: 0,
    path_length: 0,
    created_at: new Date().toISOString()
  }
  console.log('[DEBUG] Saving game result:', payload)

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/game_results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    })

    console.log('[DEBUG] game_results response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DEBUG] game_results error:', errorText)
    }
    return response.ok
  } catch (err) {
    console.error('[DEBUG] Failed to save game result:', err)
    return false
  }
}

// Save classic mode progress
export async function saveClassicProgress(level: number, stars: number): Promise<boolean> {
  const token = getAuthToken()
  console.log('[DEBUG] saveClassicProgress called, token exists:', !!token)
  
  if (!token) {
    console.log('[DEBUG] No token, skipping save')
    return false
  }

  try {
    // Check if there's an existing record
    const checkUrl = `${SUPABASE_URL}/rest/v1/classic_progress?grid_size=eq.${level}&mode=eq.corner`
    console.log('[DEBUG] Checking existing progress:', checkUrl)
    
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    })

    const existing = await checkResponse.json() as Array<{ stars: number; id: string; attempts: number; perfect_solves: number }>
    console.log('[DEBUG] Existing progress:', existing)
    
    const bestStars = existing.length > 0 ? Math.max(existing[0].stars, stars) : stars
    const isPerfect = stars === 3
    
    // Build the upsert data
    const upsertData = {
      grid_size: level,
      mode: 'corner',
      stars: bestStars,
      attempts: existing.length > 0 ? existing[0].attempts + 1 : 1,
      perfect_solves: existing.length > 0 
        ? existing[0].perfect_solves + (isPerfect ? 1 : 0)
        : (isPerfect ? 1 : 0),
      updated_at: new Date().toISOString()
    }
    console.log('[DEBUG] Upserting progress:', upsertData)

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

    console.log('[DEBUG] classic_progress response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DEBUG] classic_progress error:', errorText)
    }
    return response.ok
  } catch (err) {
    console.error('[DEBUG] Failed to save classic progress:', err)
    return false
  }
}

// Fetch user stats
export async function fetchUserStats(): Promise<UserStats | null> {
  const token = getAuthToken()
  console.log('[DEBUG] fetchUserStats called, token exists:', !!token)
  
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
    console.log('[DEBUG] Fetched scores count:', scores.length)
    
    // Fetch classic progress
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
    console.log('[DEBUG] Fetched progress count:', progress.length)

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
    console.error('[DEBUG] Failed to fetch user stats:', err)
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
    console.error('[DEBUG] Failed to fetch recent games:', err)
    return []
  }
}
