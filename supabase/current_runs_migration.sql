-- PathFinder: Create current_runs table for cross-device sync
-- Run this in Supabase SQL Editor

-- Drop table if exists (for clean restart during development)
DROP TABLE IF EXISTS current_runs;

-- Create current_runs table for cross-device sync
CREATE TABLE current_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('classic', 'survival')),
  
  -- Classic mode fields
  classic_level INTEGER,
  classic_stars JSONB DEFAULT '{}',
  
  -- Survival mode fields
  survival_level INTEGER,
  survival_lives INTEGER DEFAULT 3,
  survival_score INTEGER DEFAULT 0,
  
  -- Shared fields
  grid_state JSONB,           -- The actual puzzle grid (cells, size, start/end positions)
  selected_path JSONB,        -- Current path user has selected
  attempts INTEGER DEFAULT 0,
  timer_seconds INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can only have one current run per mode
  UNIQUE(user_id, mode)
);

-- Create indexes for performance
CREATE INDEX idx_current_runs_user_id ON current_runs(user_id);
CREATE INDEX idx_current_runs_mode ON current_runs(mode);

-- Enable Row Level Security
ALTER TABLE current_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own runs
CREATE POLICY "Users can only access their own runs"
  ON current_runs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE current_runs IS 'Stores in-progress game state for cross-device synchronization';
