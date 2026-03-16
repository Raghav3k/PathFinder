// Progress tracking for signed-in users
// VERSION: 2026-03-16-v9 - Include user_id in inserts

import { supabase } from './supabase'

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
  console.log('[DEBUG] saveGameResult called')
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('[DEBUG] No user found')
      return false
    }
    
    console.log('[DEBUG] Saving for user:', user.id)
    
    const { error } = await supabase
      .from('game_results')
      .insert({
        user_id: user.id,  // <-- IMPORTANT: Include user_id
        mode: result.mode,
        grid_size: result.level,
        score: result.score,
        is_perfect: result.completed && result.attempts === 1,
        time_seconds: 0,
        path_length: 0,
      })

    if (error) {
      console.error('[DEBUG] game_results error:', error)
      return false
    }
    
    console.log('[DEBUG] game_results saved successfully')
    return true
  } catch (err) {
    console.error('[DEBUG] Failed to save game result:', err)
    return false
  }
}

// Save classic mode progress
export async function saveClassicProgress(level: number, stars: number): Promise<boolean> {
  console.log('[DEBUG] saveClassicProgress called')
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('[DEBUG] No user found')
      return false
    }
    
    console.log('[DEBUG] Saving progress for user:', user.id)
    
    // Check if there's an existing record
    const { data: existing, error: checkError } = await supabase
      .from('classic_progress')
      .select('stars, attempts, perfect_solves')
      .eq('user_id', user.id)  // <-- Filter by user_id
      .eq('grid_size', level)
      .eq('mode', 'corner')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('[DEBUG] Error checking existing progress:', checkError)
    }
    
    const bestStars = existing ? Math.max(existing.stars, stars) : stars
    const isPerfect = stars === 3
    
    // Upsert the progress
    const { error } = await supabase
      .from('classic_progress')
      .upsert({
        user_id: user.id,  // <-- IMPORTANT: Include user_id
        grid_size: level,
        mode: 'corner',
        stars: bestStars,
        attempts: existing ? existing.attempts + 1 : 1,
        perfect_solves: existing 
          ? existing.perfect_solves + (isPerfect ? 1 : 0)
          : (isPerfect ? 1 : 0),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,grid_size,mode'
      })

    if (error) {
      console.error('[DEBUG] classic_progress error:', error)
      return false
    }
    
    console.log('[DEBUG] classic_progress saved successfully')
    return true
  } catch (err) {
    console.error('[DEBUG] Failed to save classic progress:', err)
    return false
  }
}

// Fetch user stats
export async function fetchUserStats(): Promise<UserStats | null> {
  console.log('[DEBUG] fetchUserStats called')
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('[DEBUG] No user found')
      return null
    }
    
    // Fetch total games played from game_results
    const { data: scores, error: scoresError } = await supabase
      .from('game_results')
      .select('score')
      .eq('user_id', user.id)  // <-- Filter by user_id

    if (scoresError) {
      console.error('[DEBUG] Error fetching scores:', scoresError)
    }
    
    // Fetch classic progress
    const { data: progress, error: progressError } = await supabase
      .from('classic_progress')
      .select('grid_size,stars')
      .eq('user_id', user.id)  // <-- Filter by user_id

    if (progressError) {
      console.error('[DEBUG] Error fetching progress:', progressError)
    }

    const totalGames = scores?.length || 0
    const levelsCompleted = progress?.length || 0
    const bestScore = scores && scores.length > 0 
      ? Math.max(...scores.map(s => s.score))
      : 0

    const classicProgress: Record<string, number> = {}
    progress?.forEach(p => {
      classicProgress[p.grid_size] = p.stars
    })

    console.log('[DEBUG] Stats fetched:', { totalGames, levelsCompleted, bestScore })

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
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('game_results')
      .select('*')
      .eq('user_id', user.id)  // <-- Filter by user_id
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[DEBUG] Error fetching recent games:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[DEBUG] Failed to fetch recent games:', err)
    return []
  }
}
