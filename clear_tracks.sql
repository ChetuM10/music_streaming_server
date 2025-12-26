-- Empty all tracks from the database
-- Run this in Supabase SQL Editor

-- Delete all tracks (this will cascade to related tables)
DELETE FROM tracks;

-- Verify deletion
SELECT 'All tracks deleted!' as status, COUNT(*) as remaining FROM tracks;
