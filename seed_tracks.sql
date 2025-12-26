-- ================================
-- SEED DATA: Sample Tracks with WORKING Audio
-- ================================
-- These URLs are verified to work without CORS issues

-- Clear existing tracks
DELETE FROM tracks;

-- Insert demo tracks with WORKING audio URLs
INSERT INTO tracks (title, artist, album, genre, duration, audio_url, cover_url) VALUES

-- Using SoundHelix sample sounds (guaranteed to work)
('Fade Away', 'Electronic Dreams', 'Digital Horizons', 'Electronic', 245,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop'),

('Neon Lights', 'Synth Wave', 'Night Drive', 'Electronic', 198,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop'),

('Electric Dreams', 'Future Bass', 'Midnight Sessions', 'Electronic', 212,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'),

('Into The Night', 'Deep House', 'Club Essentials', 'Electronic', 267,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop'),

('Summer Vibes', 'Pop Stars', 'Feel Good Album', 'Pop', 223,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'),

('Dancing Tonight', 'The Groove', 'Party Anthems', 'Pop', 195,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop'),

('Stay With Me', 'Love Songs', 'Heartfelt', 'Pop', 234,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
 'https://images.unsplash.com/photo-1493305423159-c2d9c7027723?w=300&h=300&fit=crop'),

('City Lights', 'Urban Beats', 'Street Stories', 'Hip Hop', 201,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=300&fit=crop'),

('Midnight Flow', 'Smooth Beats', 'Late Night Sessions', 'Hip Hop', 256,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'),

('Rainy Days', 'Lo-Fi Chill', 'Study Beats', 'Lo-Fi', 287,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
 'https://images.unsplash.com/photo-1501999635878-71cb5379c2d8?w=300&h=300&fit=crop'),

('Coffee Shop', 'Ambient Sounds', 'Relaxation', 'Lo-Fi', 312,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=300&h=300&fit=crop'),

('Sunset Dreams', 'Chill Waves', 'Ocean Moods', 'Lo-Fi', 245,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop'),

('Breaking Free', 'Rock Nation', 'Rebellion', 'Rock', 234,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop'),

('Thunder Road', 'The Rebels', 'Highway Songs', 'Rock', 278,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'),

('Campfire Stories', 'Acoustic Soul', 'Folk Tales', 'Acoustic', 198,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&h=300&fit=crop'),

('Morning Light', 'Indie Folk', 'Sunrise Sessions', 'Acoustic', 267,
 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=300&h=300&fit=crop');

-- Verify
SELECT COUNT(*) as total_tracks FROM tracks;
SELECT title, audio_url FROM tracks LIMIT 3;
