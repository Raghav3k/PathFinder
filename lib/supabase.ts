import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database

export type GameMode = 'classic' | 'survival'

export type GameResult = {
  id?: string
  user_id?: string
  session_id?: string
  mode: GameMode
  grid_size: number
  score: number
  is_perfect: boolean
  time_seconds: number
  path_length: number
  created_at?: string
}

export type UserStats = {
  user_id: string
  stats: {
    classic_stars: number
    survival_high_score: number
    survival_max_level: number
    total_games: number
    perfect_solves: number
  }
}

// Game functions
export async function saveGameResult(result: GameResult) {
  const { data, error } = await supabase
    .from('game_results')
    .insert(result)
    .select()
  
  if (error) {
    console.error('Error saving game result:', error)
    throw error
  }
  
  return data
}

export async function getLeaderboard(mode: GameMode, limit = 10) {
  const { data, error } = await supabase
    .from('game_results')
    .select('*, profiles(username)')
    .eq('mode', mode)
    .order('score', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
  
  return data
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching user stats:', error)
    throw error
  }
  
  return data
}
