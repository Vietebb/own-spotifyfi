-- ============================================================================
-- AURA MUSIC: UNIFIED PRODUCTION SETUP & 21 TRACKS SEED MIGRATION
-- File: supabase/migrations/20260919000003_aura_complete_setup_and_21_tracks.sql
-- Lead System Architect: Balgyn Baikozhayev
-- Platform Concept: Sub-100ms Lightweight Music Streaming Architecture
-- Standards: ISO/IEC 27001:2022 ISMS & GDPR Article 17 (Right to Erasure)
--
-- INSTRUCTIONS FOR USER:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/your-project-id
-- 2. Go to "SQL Editor" on the left navigation bar.
-- 3. Click "New Query", paste this entire script, and click "Run".
-- 4. Safe & Idempotent: Can be run multiple times with ZERO duplication.
-- ============================================================================

-- Ensure pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. RELATIONAL ER SCHEMA (SAFE PREFIX: aura_*)
-- ----------------------------------------------------------------------------

-- Table 1: aura_songs (Master Track Catalog)
CREATE TABLE IF NOT EXISTS public.aura_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration_seconds INT NOT NULL,
  genre TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  release_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Unique index to prevent duplicate tracks on repeated runs
CREATE UNIQUE INDEX IF NOT EXISTS idx_aura_songs_title_artist 
  ON public.aura_songs (title, artist);

-- Table 2: aura_media (Technical Audio Specifications & Storage Mapping)
CREATE TABLE IF NOT EXISTS public.aura_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.aura_songs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  bitrate_kbps INT DEFAULT 320,
  mime_type TEXT DEFAULT 'audio/mpeg'
);

-- Unique index to prevent duplicate media rows per song
CREATE UNIQUE INDEX IF NOT EXISTS idx_aura_media_song_id_url 
  ON public.aura_media (song_id, file_url);

-- Table 3: aura_playlist_songs (User Playlist & Favorite Curation)
CREATE TABLE IF NOT EXISTS public.aura_playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_name TEXT NOT NULL DEFAULT 'My Favorites',
  song_id UUID NOT NULL REFERENCES public.aura_songs(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Table 4: aura_listening_events (Asynchronous Playback Telemetry Stream)
CREATE TABLE IF NOT EXISTS public.aura_listening_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.aura_songs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'EndSong',
  duration_listened_ms INT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. HIGH-PERFORMANCE QUERY INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_aura_songs_artist ON public.aura_songs (artist);
CREATE INDEX IF NOT EXISTS idx_aura_songs_genre ON public.aura_songs (genre);
CREATE INDEX IF NOT EXISTS idx_aura_media_song_id ON public.aura_media (song_id);
CREATE INDEX IF NOT EXISTS idx_aura_playlist_songs_user ON public.aura_playlist_songs (user_id, playlist_name);
CREATE INDEX IF NOT EXISTS idx_aura_listening_events_user ON public.aura_listening_events (user_id);
CREATE INDEX IF NOT EXISTS idx_aura_listening_events_timestamp ON public.aura_listening_events (timestamp DESC);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.aura_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_listening_events ENABLE ROW LEVEL SECURITY;

-- aura_songs: Public Read
DROP POLICY IF EXISTS "Allow public read access on aura_songs" ON public.aura_songs;
CREATE POLICY "Allow public read access on aura_songs"
  ON public.aura_songs FOR SELECT
  USING (true);

-- aura_media: Public Read
DROP POLICY IF EXISTS "Allow public read access on aura_media" ON public.aura_media;
CREATE POLICY "Allow public read access on aura_media"
  ON public.aura_media FOR SELECT
  USING (true);

-- aura_listening_events: User insert & select
DROP POLICY IF EXISTS "Allow authenticated insert on aura_listening_events" ON public.aura_listening_events;
CREATE POLICY "Allow authenticated insert on aura_listening_events"
  ON public.aura_listening_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user read own listening events" ON public.aura_listening_events;
CREATE POLICY "Allow user read own listening events"
  ON public.aura_listening_events FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. GDPR ARTICLE 17 RIGHT TO ERASURE (PRIVACY BY DESIGN)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_user_listening_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'GDPR Authorization Violation: You are only permitted to purge your own telemetry data.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM aura_listening_events
  WHERE user_id = target_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Personal listening history permanently erased in accordance with GDPR Article 17.',
    'user_id', target_user_id,
    'purged_records_count', deleted_count,
    'timestamp', timezone('utc'::text, now())
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. ASYNCHRONOUS STATS AGGREGATION RPC (AURA UNWRAPPED)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_listening_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_minutes INTEGER := 0;
  v_total_plays INTEGER := 0;
  v_top_artist TEXT := 'Olivia Rodrigo';
  v_top_track TEXT := 'vampire';
  v_top_genre TEXT := 'Pop Rock';
  v_percentile_badge TEXT;
  v_has_data BOOLEAN := false;
BEGIN
  -- 1. Calculate aggregated minutes & play count
  SELECT 
    COALESCE(SUM(duration_listened_ms) / 60000, 0),
    COUNT(*)
  INTO v_total_minutes, v_total_plays
  FROM aura_listening_events
  WHERE user_id = p_user_id;

  IF v_total_plays > 0 THEN
    v_has_data := true;

    -- 2. Calculate Top Artist by listen count
    SELECT s.artist
    INTO v_top_artist
    FROM aura_listening_events e
    JOIN aura_songs s ON e.song_id = s.id
    WHERE e.user_id = p_user_id
    GROUP BY s.artist
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- 3. Calculate Top Track
    SELECT s.title
    INTO v_top_track
    FROM aura_listening_events e
    JOIN aura_songs s ON e.song_id = s.id
    WHERE e.user_id = p_user_id
    GROUP BY s.title
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- 4. Calculate Top Genre
    SELECT COALESCE(s.genre, 'Pop Rock')
    INTO v_top_genre
    FROM aura_listening_events e
    JOIN aura_songs s ON e.song_id = s.id
    WHERE e.user_id = p_user_id
    GROUP BY s.genre
    ORDER BY COUNT(*) DESC
    LIMIT 1;
  ELSE
    -- Graceful baseline profile (from University ICT Proposal slide 12)
    v_total_minutes := 12450;
    v_total_plays := 3120;
    v_top_artist := 'Olivia Rodrigo';
    v_top_track := 'vampire';
    v_top_genre := 'Pop Rock';
  END IF;

  -- 5. Calculated Percentile Badge
  IF v_total_minutes >= 10000 THEN
    v_percentile_badge := 'Top 0.001% of ' || v_top_artist || ' fans';
  ELSIF v_total_minutes >= 5000 THEN
    v_percentile_badge := 'Top 0.01% of ' || v_top_artist || ' fans';
  ELSIF v_total_minutes >= 1000 THEN
    v_percentile_badge := 'Top 0.1% of ' || v_top_artist || ' fans';
  ELSIF v_total_minutes >= 100 THEN
    v_percentile_badge := 'Top 1% of ' || v_top_artist || ' fans';
  ELSE
    v_percentile_badge := 'Rising Listener of ' || v_top_artist;
  END IF;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'total_minutes_streamed', v_total_minutes,
    'total_plays_count', v_total_plays,
    'top_artist', v_top_artist,
    'top_track', v_top_track,
    'top_genre', v_top_genre,
    'percentile_badge', v_percentile_badge,
    'has_live_data', v_has_data,
    'timestamp', timezone('utc'::text, now())
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. IDEMPOTENT INSERTION OF ALL 21 TRACKS INTO public.aura_songs
-- ----------------------------------------------------------------------------
INSERT INTO public.aura_songs (title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
SELECT v.title, v.artist, v.album, v.duration_seconds, v.genre, v.audio_url, v.cover_url, v.release_date::date
FROM (
  VALUES
    -- 1. Unreleased / Vault
    (
      'MOM, I QUIT (Unreleased)',
      'Olivia Rodrigo',
      'Unreleased Vault',
      165,
      'Pop / Alternative',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20%20MOM,%20I%20QUIT%20%20unreleased.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2024-01-01'
    ),
    -- 2. GUTS
    (
      'all-american bitch',
      'Olivia Rodrigo',
      'GUTS',
      165,
      'Pop Punk',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20all-american%20bitch.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 3. GUTS
    (
      'bad idea right?',
      'Olivia Rodrigo',
      'GUTS',
      184,
      'Pop Rock',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20bad%20idea%20right.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-08-11'
    ),
    -- 4. GUTS
    (
      'ballad of a homeschooled girl',
      'Olivia Rodrigo',
      'GUTS',
      203,
      'Alt-Rock',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20ballad%20of%20a%20homeschooled%20girl.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 5. SOUR
    (
      'deja vu',
      'Olivia Rodrigo',
      'SOUR',
      215,
      'Indie Pop',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20Deja%20Vu.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202025-11-13%20190549.png',
      '2021-04-01'
    ),
    -- 6. SOUR
    (
      'favorite crime',
      'Olivia Rodrigo',
      'SOUR',
      152,
      'Indie Folk',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20favorite%20crime.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202025-11-13%20190549.png',
      '2021-05-21'
    ),
    -- 7. GUTS
    (
      'get him back!',
      'Olivia Rodrigo',
      'GUTS',
      211,
      'Pop Punk',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20get%20him%20back!.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 8. SOUR
    (
      'jealousy, jealousy',
      'Olivia Rodrigo',
      'SOUR',
      173,
      'Alt-Pop',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20jealousy%20jealousy.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202025-11-13%20190549.png',
      '2021-05-21'
    ),
    -- 9. GUTS
    (
      'lacy',
      'Olivia Rodrigo',
      'GUTS',
      177,
      'Acoustic Pop',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20lacy.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 10. GUTS
    (
      'love is embarrassing',
      'Olivia Rodrigo',
      'GUTS',
      154,
      'New Wave / Pop Rock',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20love%20is%20embarrassing.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 11. GUTS
    (
      'making the bed',
      'Olivia Rodrigo',
      'GUTS',
      198,
      'Pop Ballad',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20making%20the%20bed.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 12. GUTS (spilled)
    (
      'obsessed (mashup)',
      'Olivia Rodrigo',
      'GUTS (spilled)',
      170,
      'Pop Rock',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20Obsessed%20mashups.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2024-03-22'
    ),
    -- 13. GUTS (spilled)
    (
      'so american',
      'Olivia Rodrigo',
      'GUTS (spilled)',
      169,
      'Pop Rock',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20so%20american.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2024-03-22'
    ),
    -- 14. GUTS
    (
      'teenage dream',
      'Olivia Rodrigo',
      'GUTS',
      222,
      'Piano Ballad',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20teenage%20dream.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-09-08'
    ),
    -- 15. GUTS
    (
      'vampire',
      'Olivia Rodrigo',
      'GUTS',
      219,
      'Pop Rock',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20-%20vampire.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg',
      '2023-06-30'
    ),
    -- 16. Live
    (
      'Tiny Desk Concert (NPR Music)',
      'Olivia Rodrigo',
      'Live Sessions',
      1080,
      'Live Acoustic',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo%20Tiny%20Desk%20Concert%20-%20NPR%20Music.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2023-12-11'
    ),
    -- 17. Live
    (
      'Tiny Desk (Home) Concert',
      'Olivia Rodrigo',
      'Live Sessions',
      960,
      'Live Acoustic',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia%20Rodrigo_%20Tiny%20Desk%20(Home)%20Concert.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2021-12-07'
    ),
    -- 18. Unreleased
    (
      'baby is you (Unreleased)',
      'Olivia Rodrigo',
      'Unreleased Vault',
      180,
      'Acoustic Pop',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia_Rodrigo_baby_is_you_Lyric_Video_Olivia_Updates_Bras.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2022-01-01'
    ),
    -- 19. Unreleased
    (
      'I can''t wait to fall in love again',
      'Olivia Rodrigo',
      'Unreleased Vault',
      175,
      'Folk Pop',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia_Rodrigo_I_cant_wait_to_fall_in_love_again_unreleased_song.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2021-01-01'
    ),
    -- 20. Unreleased
    (
      'wish you cheated (Unreleased)',
      'Olivia Rodrigo',
      'Unreleased Vault',
      190,
      'Pop Ballad',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Olivia_Rodrigo_wish_you_cheated_Unreleased_Song_Super_Lo.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2021-01-01'
    ),
    -- 21. Unreleased
    (
      'Strangers Again (Unreleased)',
      'Olivia Rodrigo',
      'Unreleased Vault',
      185,
      'Pop / Indie',
      'https://your-project.supabase.co/storage/v1/object/public/audio-tracks/Strangers%20Again%20%20Olivia%20Rodrigo%20%20unreleased%20%20lyrics%20video.mp3',
      'https://your-project.supabase.co/storage/v1/object/public/album-covers/Screenshot%202026-06-25%20112745.png',
      '2022-06-01'
    )
) AS v(title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.aura_songs s
  WHERE s.title = v.title AND s.artist = v.artist
);

-- ----------------------------------------------------------------------------
-- 7. RELATIONAL MEDIA LINKING: POPULATE public.aura_media
-- ----------------------------------------------------------------------------
INSERT INTO public.aura_media (song_id, file_url, bitrate_kbps, mime_type)
SELECT s.id, s.audio_url, 320, 'audio/mpeg'
FROM public.aura_songs s
WHERE NOT EXISTS (
  SELECT 1 FROM public.aura_media m
  WHERE m.song_id = s.id AND m.file_url = s.audio_url
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 
  COUNT(*) AS total_aura_songs,
  (SELECT COUNT(*) FROM public.aura_media) AS total_aura_media
FROM public.aura_songs;
