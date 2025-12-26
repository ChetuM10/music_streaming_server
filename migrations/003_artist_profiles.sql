-- Migration 003: Artist Profiles
-- Adds multi-tenancy support for artist accounts

-- Artist profiles table
CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  artist_name TEXT NOT NULL,
  bio TEXT,
  profile_image TEXT,
  banner_image TEXT,
  verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  monthly_listeners INTEGER DEFAULT 0,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link tracks to artists
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES artist_profiles(id);

-- Artist analytics
CREATE TABLE IF NOT EXISTS artist_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  plays INTEGER DEFAULT 0,
  unique_listeners INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  UNIQUE(artist_id, date)
);

-- Artist followers
CREATE TABLE IF NOT EXISTS artist_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_user ON artist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_analytics_artist ON artist_analytics(artist_id, date);

-- RLS
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_followers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Artist profiles viewable by everyone" ON artist_profiles FOR SELECT USING (true);
CREATE POLICY "Artists can update own profile" ON artist_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Artists can view own analytics" ON artist_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM artist_profiles WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "Users can follow artists" ON artist_followers FOR ALL USING (auth.uid() = user_id);

-- Function to check if user is an artist
CREATE OR REPLACE FUNCTION is_artist(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM artist_profiles WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get artist stats
CREATE OR REPLACE FUNCTION get_artist_stats(p_artist_id UUID)
RETURNS TABLE (
  total_plays BIGINT,
  total_likes BIGINT,
  total_tracks BIGINT,
  total_followers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(t.play_count), 0)::BIGINT as total_plays,
    (SELECT COUNT(*) FROM favorites f JOIN tracks tr ON f.track_id = tr.id WHERE tr.artist_id = p_artist_id)::BIGINT as total_likes,
    (SELECT COUNT(*) FROM tracks WHERE artist_id = p_artist_id)::BIGINT as total_tracks,
    (SELECT COUNT(*) FROM artist_followers WHERE artist_id = p_artist_id)::BIGINT as total_followers
  FROM tracks t
  WHERE t.artist_id = p_artist_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION is_artist TO authenticated;
GRANT EXECUTE ON FUNCTION get_artist_stats TO authenticated;
