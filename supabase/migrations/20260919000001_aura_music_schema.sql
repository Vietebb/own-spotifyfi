-- ============================================================================
-- AURA MUSIC: RELATIONAL ER SCHEMA & GDPR-COMPLIANT STORAGE MIGRATION
-- Migration: 20260919000001_aura_music_schema.sql
-- Lead System Architect: Balgyn Baikozhayev
-- Platform Concept: Sub-100ms Lightweight Music Streaming Architecture
-- Standards: ISO/IEC 27001:2022 ISMS & GDPR Article 17 (Right to Erasure)
--
-- CRITICAL ISOLATION RULE:
-- Uses safe prefixing ('aura_') and strict 'CREATE TABLE IF NOT EXISTS'.
-- Zero modifications to any existing database entities or external tables.
-- ============================================================================

-- Ensure standard UUID extension is active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. CORE RELATIONAL TABLES
-- ----------------------------------------------------------------------------

-- Table 1: aura_songs (Master Track Catalog)
CREATE TABLE IF NOT EXISTS aura_songs (
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

-- Table 2: aura_media (Technical Audio File Specs & Storage Mapping)
CREATE TABLE IF NOT EXISTS aura_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES aura_songs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  bitrate_kbps INT DEFAULT 320,
  mime_type TEXT DEFAULT 'audio/mpeg'
);

-- Table 3: aura_playlist_songs (User Playlist Associations & Curation)
CREATE TABLE IF NOT EXISTS aura_playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_name TEXT NOT NULL DEFAULT 'My Favorites',
  song_id UUID NOT NULL REFERENCES aura_songs(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Table 4: aura_listening_events (Asynchronous Playback Telemetry Stream)
CREATE TABLE IF NOT EXISTS aura_listening_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES aura_songs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'EndSong',
  duration_listened_ms INT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. HIGH-PERFORMANCE QUERY INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_aura_songs_artist ON aura_songs (artist);
CREATE INDEX IF NOT EXISTS idx_aura_songs_genre ON aura_songs (genre);
CREATE INDEX IF NOT EXISTS idx_aura_media_song_id ON aura_media (song_id);
CREATE INDEX IF NOT EXISTS idx_aura_playlist_songs_user ON aura_playlist_songs (user_id, playlist_name);
CREATE INDEX IF NOT EXISTS idx_aura_listening_events_user ON aura_listening_events (user_id);
CREATE INDEX IF NOT EXISTS idx_aura_listening_events_timestamp ON aura_listening_events (timestamp DESC);

-- ----------------------------------------------------------------------------
-- 3. GDPR PRIVACY BY DESIGN (Article 17 Right to Erasure)
-- ----------------------------------------------------------------------------
-- Secure stored procedure allowing users to completely purge their listening telemetry.
-- Security Definer with strict authorization boundary ensuring users can only purge their own records.
CREATE OR REPLACE FUNCTION delete_user_listening_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- GDPR Article 17 Authorization Verification:
  -- Only the authenticated owner or service_role can purge personal listening data
  IF auth.uid() IS NOT NULL AND auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'GDPR Authorization Violation: You are only permitted to purge your own telemetry data.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM aura_listening_events
  WHERE user_id = target_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'deleted_events_count', deleted_count,
    'purged_at', timezone('utc'::text, now()),
    'compliance_standard', 'GDPR Article 17 (Right to Erasure)'
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION delete_user_listening_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_listening_data(UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- A. aura_songs RLS
ALTER TABLE aura_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view aura songs" ON aura_songs;
CREATE POLICY "Public can view aura songs"
  ON aura_songs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role manages aura songs" ON aura_songs;
CREATE POLICY "Service role manages aura songs"
  ON aura_songs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- B. aura_media RLS
ALTER TABLE aura_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view aura media specs" ON aura_media;
CREATE POLICY "Public can view aura media specs"
  ON aura_media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role manages aura media" ON aura_media;
CREATE POLICY "Service role manages aura media"
  ON aura_media FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- C. aura_playlist_songs RLS
ALTER TABLE aura_playlist_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own playlist items" ON aura_playlist_songs;
CREATE POLICY "Users can view own playlist items"
  ON aura_playlist_songs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add items to own playlist" ON aura_playlist_songs;
CREATE POLICY "Users can add items to own playlist"
  ON aura_playlist_songs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playlist items" ON aura_playlist_songs;
CREATE POLICY "Users can update own playlist items"
  ON aura_playlist_songs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove items from own playlist" ON aura_playlist_songs;
CREATE POLICY "Users can remove items from own playlist"
  ON aura_playlist_songs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- D. aura_listening_events RLS
ALTER TABLE aura_listening_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own listening telemetry" ON aura_listening_events;
CREATE POLICY "Users can view own listening telemetry"
  ON aura_listening_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record own listening telemetry" ON aura_listening_events;
CREATE POLICY "Users can record own listening telemetry"
  ON aura_listening_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can purge own listening telemetry" ON aura_listening_events;
CREATE POLICY "Users can purge own listening telemetry"
  ON aura_listening_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to telemetry" ON aura_listening_events;
CREATE POLICY "Service role full access to telemetry"
  ON aura_listening_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 5. SEED DATA (5 Realistic Master Tracks with High-Fidelity Streaming URLs)
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_vampire_id UUID := '00000000-0000-0000-0000-000000000001';
  v_drivers_id UUID := '00000000-0000-0000-0000-000000000002';
  v_summer_id  UUID := '00000000-0000-0000-0000-000000000003';
  v_lights_id  UUID := '00000000-0000-0000-0000-000000000004';
  v_espresso_id UUID := '00000000-0000-0000-0000-000000000005';
BEGIN

  -- 1. vampire - Olivia Rodrigo
  IF NOT EXISTS (SELECT 1 FROM aura_songs WHERE id = v_vampire_id) THEN
    INSERT INTO aura_songs (id, title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
    VALUES (
      v_vampire_id,
      'vampire',
      'Olivia Rodrigo',
      'GUTS',
      219,
      'Pop Rock',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
      '2023-06-30'
    );

    INSERT INTO aura_media (song_id, file_url, file_size_bytes, bitrate_kbps, mime_type)
    VALUES (
      v_vampire_id,
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      8760000,
      320,
      'audio/mpeg'
    );
  END IF;

  -- 2. drivers license - Olivia Rodrigo
  IF NOT EXISTS (SELECT 1 FROM aura_songs WHERE id = v_drivers_id) THEN
    INSERT INTO aura_songs (id, title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
    VALUES (
      v_drivers_id,
      'drivers license',
      'Olivia Rodrigo',
      'SOUR',
      242,
      'Indie Pop',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
      '2021-01-08'
    );

    INSERT INTO aura_media (song_id, file_url, file_size_bytes, bitrate_kbps, mime_type)
    VALUES (
      v_drivers_id,
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      9680000,
      320,
      'audio/mpeg'
    );
  END IF;

  -- 3. Cruel Summer - Taylor Swift
  IF NOT EXISTS (SELECT 1 FROM aura_songs WHERE id = v_summer_id) THEN
    INSERT INTO aura_songs (id, title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
    VALUES (
      v_summer_id,
      'Cruel Summer',
      'Taylor Swift',
      'Lover',
      178,
      'Synth-Pop',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
      '2019-08-23'
    );

    INSERT INTO aura_media (song_id, file_url, file_size_bytes, bitrate_kbps, mime_type)
    VALUES (
      v_summer_id,
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      7120000,
      320,
      'audio/mpeg'
    );
  END IF;

  -- 4. Blinding Lights - The Weeknd
  IF NOT EXISTS (SELECT 1 FROM aura_songs WHERE id = v_lights_id) THEN
    INSERT INTO aura_songs (id, title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
    VALUES (
      v_lights_id,
      'Blinding Lights',
      'The Weeknd',
      'After Hours',
      200,
      'Synthwave',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      '2019-11-29'
    );

    INSERT INTO aura_media (song_id, file_url, file_size_bytes, bitrate_kbps, mime_type)
    VALUES (
      v_lights_id,
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      8000000,
      320,
      'audio/mpeg'
    );
  END IF;

  -- 5. Espresso - Sabrina Carpenter
  IF NOT EXISTS (SELECT 1 FROM aura_songs WHERE id = v_espresso_id) THEN
    INSERT INTO aura_songs (id, title, artist, album, duration_seconds, genre, audio_url, cover_url, release_date)
    VALUES (
      v_espresso_id,
      'Espresso',
      'Sabrina Carpenter',
      'Short n'' Sweet',
      175,
      'Dance Pop',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600&auto=format&fit=crop',
      '2024-04-11'
    );

    INSERT INTO aura_media (song_id, file_url, file_size_bytes, bitrate_kbps, mime_type)
    VALUES (
      v_espresso_id,
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      7000000,
      320,
      'audio/mpeg'
    );
  END IF;

END $$;
