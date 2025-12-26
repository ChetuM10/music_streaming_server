-- Migration 001: Initial Schema
-- Safe to run multiple times - handles existing objects

-- Users table is managed by Supabase Auth

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  duration INTEGER DEFAULT 0,
  audio_url TEXT,
  cover_url TEXT,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  host TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Podcast episodes
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  episode_number INTEGER,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist tracks (junction table)
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Listening history
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);

-- Enable RLS (safe to run multiple times)
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe if they don't exist)
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
DROP POLICY IF EXISTS "Users can manage own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own history" ON history;

-- Create RLS Policies
CREATE POLICY "Tracks are viewable by everyone" ON tracks FOR SELECT USING (true);
CREATE POLICY "Users can manage own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own history" ON history FOR ALL USING (auth.uid() = user_id);

-- Success message
SELECT 'Migration 001 complete!' as status;
