-- ================================
-- Full-Text Search Configuration
-- ================================
-- Run this in Supabase SQL Editor

-- Add search vector columns to tracks
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(artist, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(album, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(genre, '')), 'D')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING GIN(search_vector);

-- Add search vector to podcasts (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'podcasts') THEN
    ALTER TABLE podcasts 
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(host, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED;
    
    CREATE INDEX IF NOT EXISTS idx_podcasts_search ON podcasts USING GIN(search_vector);
  END IF;
END $$;

-- ================================
-- Full-Text Search Function
-- ================================

-- Function to search tracks
CREATE OR REPLACE FUNCTION search_tracks(search_query TEXT, result_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  album TEXT,
  genre TEXT,
  cover_url TEXT,
  audio_url TEXT,
  duration INT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.artist,
    t.album,
    t.genre,
    t.cover_url,
    t.audio_url,
    t.duration,
    ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM tracks t
  WHERE t.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- Autocomplete Function
-- ================================

-- Function for search suggestions
CREATE OR REPLACE FUNCTION search_suggestions(prefix TEXT, suggestion_limit INT DEFAULT 5)
RETURNS TABLE (
  suggestion TEXT,
  type TEXT
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT DISTINCT t.title as suggestion, 'track'::TEXT as type
    FROM tracks t
    WHERE t.title ILIKE prefix || '%'
    LIMIT suggestion_limit
  )
  UNION
  (
    SELECT DISTINCT t.artist as suggestion, 'artist'::TEXT as type
    FROM tracks t
    WHERE t.artist ILIKE prefix || '%'
    LIMIT suggestion_limit
  )
  LIMIT suggestion_limit * 2;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_tracks TO authenticated;
GRANT EXECUTE ON FUNCTION search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION search_tracks TO anon;
GRANT EXECUTE ON FUNCTION search_suggestions TO anon;

-- Verify
SELECT 'Full-text search enabled!' as status;
