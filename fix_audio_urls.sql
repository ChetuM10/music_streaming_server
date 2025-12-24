-- =============================================
-- 🔧 FIX V2: Update audio URLs to Internet Archive (truly public)
-- Run this in Supabase SQL Editor
-- =============================================

-- Internet Archive hosts public domain audio that allows CORS
UPDATE tracks SET audio_url = 'https://archive.org/download/78_blue-moon_billy-eckstine-leo-moore-rogers-hart_gbia0001628a/Blue%20Moon%20-%20Billy%20Eckstine.mp3' WHERE title = 'Midnight Dreams';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_temptation_jo-stafford-paul-weston-and-his-orchestra-freed-brown_gbia0001642b/Temptation%20-%20Jo%20Stafford.mp3' WHERE title = 'Summer Vibes';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_the-nearness-of-you_dinah-shore-hoagy-carmichael-ned-washington_gbia0001652a/The%20Nearness%20Of%20You%20-%20Dinah%20Shore.mp3' WHERE title = 'Jazz Café';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_begin-the-beguine_artie-shaw-and-his-orchestra-cole-porter_gbia0001506b/Begin%20The%20Beguine%20-%20Artie%20Shaw.mp3' WHERE title = 'Rock Anthem';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_moonlight-serenade_glenn-miller-and-his-orchestra-mitchell-parish-glenn-miller_gbia0001603a/Moonlight%20Serenade%20-%20Glenn%20Miller.mp3' WHERE title = 'Classical Sunrise';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_in-the-mood_glenn-miller-and-his-orchestra-joe-garland_gbia0001599a/In%20The%20Mood%20-%20Glenn%20Miller.mp3' WHERE title = 'Hip Hop Flow';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_stardust_artie-shaw-and-his-orchestra-hoagy-carmichael-mitchell-parish_gbia0001514a/Stardust%20-%20Artie%20Shaw.mp3' WHERE title = 'Acoustic Morning';
UPDATE tracks SET audio_url = 'https://archive.org/download/78_tuxedo-junction_glenn-miller-and-his-orchestra-erskine-hawkins-william-johnson_gbia0001612a/Tuxedo%20Junction%20-%20Glenn%20Miller.mp3' WHERE title = 'EDM Party';

-- Update episode audio URLs
UPDATE episodes SET audio_url = 'https://archive.org/download/78_chattanooga-choo-choo_glenn-miller-and-his-orchestra-tex-beneke-paula-kelly-the-m_gbia0001595a/Chattanooga%20Choo%20Choo%20-%20Glenn%20Miller.mp3' WHERE title LIKE '%Getting Started%';
UPDATE episodes SET audio_url = 'https://archive.org/download/78_a-string-of-pearls_glenn-miller-and-his-orchestra-eddie-de-lange-jerry-gray_gbia0001594a/A%20String%20Of%20Pearls%20-%20Glenn%20Miller.mp3' WHERE title LIKE '%AI Revolution%';
UPDATE episodes SET audio_url = 'https://archive.org/download/78_pennsylvania-6-5000_glenn-miller-and-his-orchestra-carl-sigman-jerry-gray_gbia0001608a/Pennsylvania%206-5000%20-%20Glenn%20Miller.mp3' WHERE title LIKE '%Finding Your Zen%';

-- Verify the updates
SELECT title, audio_url FROM tracks;
