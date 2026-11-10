export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      aura_songs: {
        Row: {
          id: string;
          title: string;
          artist: string;
          album: string | null;
          duration_seconds: number;
          genre: string | null;
          audio_url: string;
          cover_url: string;
          release_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist: string;
          album?: string | null;
          duration_seconds: number;
          genre?: string | null;
          audio_url: string;
          cover_url: string;
          release_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string;
          album?: string | null;
          duration_seconds?: number;
          genre?: string | null;
          audio_url?: string;
          cover_url?: string;
          release_date?: string;
          created_at?: string;
        };
      };
      aura_media: {
        Row: {
          id: string;
          song_id: string;
          file_url: string;
          file_size_bytes: number | null;
          bitrate_kbps: number;
          mime_type: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          file_url: string;
          file_size_bytes?: number | null;
          bitrate_kbps?: number;
          mime_type?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          file_url?: string;
          file_size_bytes?: number | null;
          bitrate_kbps?: number;
          mime_type?: string;
        };
      };
      aura_playlist_songs: {
        Row: {
          id: string;
          user_id: string;
          playlist_name: string;
          song_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          playlist_name?: string;
          song_id: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          playlist_name?: string;
          song_id?: string;
          position?: number;
          added_at?: string;
        };
      };
      aura_listening_events: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          event_type: string;
          duration_listened_ms: number;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          event_type?: string;
          duration_listened_ms: number;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          event_type?: string;
          duration_listened_ms?: number;
          timestamp?: string;
        };
      };
    };
    Functions: {
      delete_user_listening_data: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          success: boolean;
          user_id: string;
          deleted_events_count: number;
          purged_at: string;
          compliance_standard: string;
        };
      };
      get_user_listening_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          user_id: string;
          total_minutes_streamed: number;
          total_plays_count: number;
          top_artist: string;
          top_track: string;
          top_genre: string;
          percentile_badge: string;
          has_live_data: boolean;
          generated_at: string;
          aggregation_engine: string;
        };
      };
    };
  };
}

export type AuraSong = Database["public"]["Tables"]["aura_songs"]["Row"];
export type AuraMedia = Database["public"]["Tables"]["aura_media"]["Row"];
export type AuraPlaylistSong = Database["public"]["Tables"]["aura_playlist_songs"]["Row"];
export type AuraListeningEvent = Database["public"]["Tables"]["aura_listening_events"]["Row"];
