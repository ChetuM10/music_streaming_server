-- =============================================
-- 🎵 Music Streaming Web App - Database Schema
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. TRACKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  duration INTEGER, -- in seconds
  cover_url TEXT,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Policies for tracks
CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert tracks" ON tracks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update tracks" ON tracks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can delete tracks" ON tracks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- 3. PODCASTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  host TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Policies for podcasts
CREATE POLICY "Podcasts are viewable by everyone" ON podcasts
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert podcasts" ON podcasts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update podcasts" ON podcasts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can delete podcasts" ON podcasts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- 4. EPISODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  audio_url TEXT NOT NULL,
  episode_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Policies for episodes
CREATE POLICY "Episodes are viewable by everyone" ON episodes
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert episodes" ON episodes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update episodes" ON episodes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can delete episodes" ON episodes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- 5. PLAYLISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Policies for playlists
CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. PLAYLIST_TRACKS TABLE (Junction)
-- =============================================
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Enable RLS
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Policies for playlist_tracks
CREATE POLICY "Users can view playlist tracks for accessible playlists" ON playlist_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND (playlists.user_id = auth.uid() OR playlists.is_public = true)
    )
  );

CREATE POLICY "Users can add tracks to own playlists" ON playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tracks from own playlists" ON playlist_tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- =============================================
-- 7. RECENTLY_PLAYED TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recently_played (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0 -- in seconds
);

-- Enable RLS
ALTER TABLE recently_played ENABLE ROW LEVEL SECURITY;

-- Policies for recently_played
CREATE POLICY "Users can view own history" ON recently_played
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own history" ON recently_played
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON recently_played
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON recently_played
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 8. FAVORITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INDEXES for better performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_episodes_podcast ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_recently_played_user ON recently_played(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Sample tracks (using placeholder audio URLs)
INSERT INTO tracks (title, artist, album, genre, duration, cover_url, audio_url) VALUES
('Midnight Dreams', 'Luna Wave', 'Nocturnal', 'Electronic', 210, 'https://ui-avatars.com/api/?name=MD&background=1DB954&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
('Summer Vibes', 'The Sunsetters', 'Golden Hour', 'Pop', 185, 'https://ui-avatars.com/api/?name=SV&background=FF6B6B&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
('Jazz Café', 'Blue Notes Trio', 'Coffee Sessions', 'Jazz', 320, 'https://ui-avatars.com/api/?name=JC&background=4ECDC4&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
('Rock Anthem', 'Thunder Strike', 'Electric Storm', 'Rock', 245, 'https://ui-avatars.com/api/?name=RA&background=9B59B6&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
('Classical Sunrise', 'Vienna Orchestra', 'Morning Light', 'Classical', 480, 'https://ui-avatars.com/api/?name=CS&background=F39C12&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'),
('Hip Hop Flow', 'MC Rhythm', 'Street Poetry', 'Hip Hop', 195, 'https://ui-avatars.com/api/?name=HF&background=E74C3C&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'),
('Acoustic Morning', 'Sarah Woods', 'Unplugged', 'Acoustic', 225, 'https://ui-avatars.com/api/?name=AM&background=27AE60&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'),
('EDM Party', 'DJ Pulse', 'Nightclub Hits', 'Electronic', 190, 'https://ui-avatars.com/api/?name=EP&background=8E44AD&color=fff&size=200', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');

-- Sample podcasts
INSERT INTO podcasts (title, host, description, category, cover_url) VALUES
('Tech Talk Daily', 'Alex Chen', 'Daily insights into the world of technology, startups, and innovation.', 'Technology', 'https://ui-avatars.com/api/?name=TT&background=3498DB&color=fff&size=200'),
('Mind & Wellness', 'Dr. Sarah Miller', 'Exploring mental health, mindfulness, and personal growth.', 'Health', 'https://ui-avatars.com/api/?name=MW&background=1ABC9C&color=fff&size=200'),
('Comedy Hour', 'Mike & Dave', 'Laugh out loud with the funniest conversations and sketches.', 'Comedy', 'https://ui-avatars.com/api/?name=CH&background=E67E22&color=fff&size=200');

-- Sample episodes
INSERT INTO episodes (podcast_id, title, description, duration, audio_url, episode_number) 
SELECT 
  p.id,
  'Episode 1: Getting Started',
  'Introduction to the podcast and what to expect.',
  1800,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  1
FROM podcasts p WHERE p.title = 'Tech Talk Daily';

INSERT INTO episodes (podcast_id, title, description, duration, audio_url, episode_number) 
SELECT 
  p.id,
  'Episode 2: AI Revolution',
  'Discussing the impact of artificial intelligence on society.',
  2100,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  2
FROM podcasts p WHERE p.title = 'Tech Talk Daily';

INSERT INTO episodes (podcast_id, title, description, duration, audio_url, episode_number) 
SELECT 
  p.id,
  'Episode 1: Finding Your Zen',
  'Introduction to mindfulness and meditation practices.',
  1500,
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  1
FROM podcasts p WHERE p.title = 'Mind & Wellness';
