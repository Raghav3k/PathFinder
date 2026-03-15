-- PathFinder Database Schema
-- Run this in your Supabase SQL Editor

-- Game results table (stores every game played)
CREATE TABLE game_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- for anonymous users
  mode TEXT NOT NULL CHECK (mode IN ('classic', 'survival')),
  grid_size INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  is_perfect BOOLEAN DEFAULT false,
  time_seconds INTEGER DEFAULT 0,
  path_length INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats (aggregated data per user)
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stats JSONB DEFAULT '{
    "classic_stars": 0,
    "survival_high_score": 0,
    "survival_max_level": 0,
    "total_games": 0,
    "perfect_solves": 0,
    "play_time_minutes": 0
  }'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classic mode progress (stars per level)
CREATE TABLE classic_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_size INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'corner',
  stars INTEGER DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  best_time INTEGER, -- seconds
  attempts INTEGER DEFAULT 0,
  perfect_solves INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, grid_size, mode)
);

-- Profiles (extends auth.users with game data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_mode ON game_results(mode);
CREATE INDEX idx_game_results_score ON game_results(score DESC);
CREATE INDEX idx_game_results_created_at ON game_results(created_at);
CREATE INDEX idx_classic_progress_user_id ON classic_progress(user_id);
