-- Migration 002: Full-Text Search
-- Adds search vectors and functions for advanced search

-- Add search vector to tracks
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(artist, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(album, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(genre, '')), 'D')
) STORED;

-- GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING GIN(search_vector);

-- Search function
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
    t.id, t.title, t.artist, t.album, t.genre, t.cover_url, t.audio_url, t.duration,
    ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM tracks t
  WHERE t.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Autocomplete function
CREATE OR REPLACE FUNCTION search_suggestions(prefix TEXT, suggestion_limit INT DEFAULT 5)
RETURNS TABLE (suggestion TEXT, type TEXT) AS $$
BEGIN
  RETURN QUERY
  (SELECT DISTINCT t.title, 'track'::TEXT FROM tracks t WHERE t.title ILIKE prefix || '%' LIMIT suggestion_limit)
  UNION
  (SELECT DISTINCT t.artist, 'artist'::TEXT FROM tracks t WHERE t.artist ILIKE prefix || '%' LIMIT suggestion_limit);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION search_tracks TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_suggestions TO authenticated, anon;
