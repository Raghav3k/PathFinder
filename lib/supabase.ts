import { createBrowserClient } from '@supabase/ssr'
import type { Session, User } from '@supabase/supabase-js'

// Types for our database
export type GameMode = 'classic' | 'survival'

export type GameResult = {
  id?: number
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
    play_time_minutes: number
  }
}

// Create Supabase client
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Game functions
export async function saveGameResult(result: GameResult) {
  const supabase = createClient()
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
  const supabase = createClient()
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
  const supabase = createClient()
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

// Auth functions
export async function signInWithGoogle() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
  
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

// Listen for auth changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = createClient()
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}
