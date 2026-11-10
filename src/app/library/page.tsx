"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  Play,
  Pause,
  Clock,
  Music2,
  Sparkles,
  Zap,
  Flame,
  ListMusic,
  History,
  Trophy,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { FALLBACK_SONGS } from "@/lib/constants";
import { AuraSong } from "@/lib/supabase/types";
import { cn, formatTime } from "@/lib/utils";
import { getLocalTelemetry, LocalListeningTelemetry } from "@/lib/telemetry";

interface CollectiveStats {
  total_minutes_streamed: number;
  total_plays_count: number;
  top_artist: string;
  top_track: string;
  top_genre: string;
  percentile_badge: string;
}

export default function LibraryPage() {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    likedSongs,
    toggleLike,
    setStoryModalOpen,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<"liked" | "history" | "insights">("liked");
  const [stats, setStats] = useState<CollectiveStats>({
    total_minutes_streamed: 12450,
    total_plays_count: 3120,
    top_artist: "Olivia Rodrigo",
    top_track: "vampire",
    top_genre: "Pop Rock",
    percentile_badge: "Top 0.001% of Olivia Rodrigo fans",
  });
  const [localTelemetry, setLocalTelemetry] = useState<LocalListeningTelemetry | null>(null);
  const [allSongs, setAllSongs] = useState<AuraSong[]>(FALLBACK_SONGS);

  // Load local telemetry & global collective stats & uploaded songs
  useEffect(() => {
    // 1. Read local storage telemetry
    const local = getLocalTelemetry();
    setLocalTelemetry(local);

    // 2. Read any uploaded songs
    try {
      const uploadedRaw = typeof window !== "undefined" ? localStorage.getItem("aura_uploaded_songs") : null;
      if (uploadedRaw) {
        const uploadedList: AuraSong[] = JSON.parse(uploadedRaw);
        setAllSongs([...uploadedList, ...FALLBACK_SONGS]);
      }
    } catch {
      // ignore
    }

    // 3. Fetch collective stats from /api/stats
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data?.stats) {
          const localMinutes = Math.round((local.totalSecondsStreamed || 0) / 60);
          const localPlays = local.totalPlaysCount || 0;

          // Merge local sessions into collective total
          setStats({
            total_minutes_streamed: (data.stats.total_minutes_streamed || 12450) + localMinutes,
            total_plays_count: (data.stats.total_plays_count || 3120) + localPlays,
            top_artist: data.stats.top_artist || "Olivia Rodrigo",
            top_track: data.stats.top_track || "vampire",
            top_genre: data.stats.top_genre || "Pop Rock",
            percentile_badge: data.stats.percentile_badge || "Top 0.001% Global Listener",
          });
        }
      })
      .catch((err) => {
        console.debug("[Aura Library Collective Stats]", err);
      });
  }, []);

  // Filter only liked songs from master catalog
  const favoriteSongs = allSongs.filter((s) => likedSongs.has(s.id));

  // Map history song IDs to actual song objects
  const historyWithDetails = (localTelemetry?.recentHistory || []).map((item) => {
    const song = allSongs.find((s) => s.id === item.songId);
    return {
      ...item,
      song: song || allSongs[0],
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. Header Banner: Unified Collective & Local Library */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-aura-navy via-slate-900 to-aura-royal text-white shadow-xl relative overflow-hidden border border-pink-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-aura-pink/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aura-pink to-aura-blossom flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-aura-pink/30 shrink-0">
              <Music2 className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">
                  Your Library & Wrapped
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aura-pink/20 text-aura-blossom border border-aura-pink/30">
                  Collective Total
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                All listening activity is merged into your collective Wrapped result
              </p>
            </div>
          </div>

          {/* Action on Banner */}
          <button
            onClick={() => setStoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-aura-pink hover:bg-pink-600 text-white font-bold text-xs shadow-md shadow-aura-pink/40 hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-aura-blossom" />
            <span>Open Unwrapped Story</span>
          </button>
        </div>

        {/* Metric Counter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Liked Songs
            </span>
            <div className="text-xl font-extrabold text-aura-blossom font-mono">
              {likedSongs.size}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Total Streamed
            </span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              {stats.total_minutes_streamed.toLocaleString()} mins
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Top Artist
            </span>
            <div className="text-sm font-extrabold text-white truncate">
              {stats.top_artist}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Fan Status
            </span>
            <div className="text-xs font-extrabold text-aura-pink truncate">
              {stats.percentile_badge.replace("of Olivia Rodrigo fans", "")}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-pink-100 pb-2">
        <button
          onClick={() => setActiveTab("liked")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
            activeTab === "liked"
              ? "bg-aura-pink text-white shadow-md shadow-aura-pink/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          )}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Liked Songs ({likedSongs.size})</span>
        </button>

        <button
          onClick={() => setActiveTab("insights")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
            activeTab === "insights"
              ? "bg-aura-pink text-white shadow-md shadow-aura-pink/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Wrapped Insights</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all",
            activeTab === "history"
              ? "bg-aura-pink text-white shadow-md shadow-aura-pink/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          )}
        >
          <History className="w-3.5 h-3.5" />
          <span>Recent History ({historyWithDetails.length})</span>
        </button>
      </div>

      {/* 3. Tab: Liked Songs */}
      {activeTab === "liked" && (
        <div className="space-y-4">
          {favoriteSongs.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (favoriteSongs.length > 0) {
                      playSong(favoriteSongs[0], favoriteSongs);
                    }
                  }}
                  className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-aura-pink hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-aura-pink/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play All Liked Songs</span>
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  {favoriteSongs.length} favorites saved locally
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteSongs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playSong(song, favoriteSongs);
                        }
                      }}
                      className={cn(
                        "group flex items-center gap-3.5 p-3 rounded-2xl bg-white hover:bg-pink-50/50 border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer",
                        isCurrent
                          ? "border-aura-pink ring-2 ring-aura-pink/20 bg-pink-50/40"
                          : "border-pink-100 hover:border-aura-pink/40"
                      )}
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity",
                            isCurrentPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={cn(
                            "font-bold text-sm truncate leading-tight transition-colors",
                            isCurrent ? "text-aura-pink" : "text-slate-900 group-hover:text-aura-pink"
                          )}
                        >
                          {song.title}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {song.artist}
                        </p>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {formatTime(song.duration_seconds)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song.id);
                        }}
                        className="p-2 text-aura-pink transition-transform hover:scale-110 active:scale-95 shrink-0"
                        aria-label="Remove from liked"
                      >
                        <Heart className="w-4 h-4 fill-aura-pink" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-pink-100/90 shadow-sm space-y-3">
              <Heart className="w-12 h-12 text-pink-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No Liked Songs Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the heart icon on any song while listening to add it to your personal favorites library.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab: Wrapped Insights */}
      {activeTab === "insights" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-pink-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-aura-pink" />
              <span>Collective Streaming Activity</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600">Total Minutes Streamed</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {stats.total_minutes_streamed.toLocaleString()} mins
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600">Total Completed Plays</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {stats.total_plays_count.toLocaleString()} plays
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600">Top Track of the Year</span>
                <span className="text-sm font-bold text-aura-pink truncate">
                  "{stats.top_track}"
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-aura-navy to-slate-900 text-white shadow-sm space-y-4 border border-pink-500/20">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aura-blossom" />
              <span>Audience Tier & Badge</span>
            </h3>
            <p className="text-xs text-slate-300">
              Your combined listening metrics place you in the highest percentile of global listeners:
            </p>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center space-y-1">
              <div className="text-xs font-bold text-aura-blossom uppercase tracking-wider">
                Wrapped Identity Badge
              </div>
              <div className="text-xl font-black text-white">
                {stats.percentile_badge}
              </div>
            </div>
            <button
              onClick={() => setStoryModalOpen(true)}
              className="w-full py-3 rounded-full bg-aura-pink hover:bg-pink-600 text-white font-bold text-xs shadow-md shadow-aura-pink/30 transition-all hover:scale-102"
            >
              Export 9:16 Social Story Card
            </button>
          </div>
        </div>
      )}

      {/* 5. Tab: Recent History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {historyWithDetails.length > 0 ? (
            <div className="space-y-2">
              {historyWithDetails.map((item, idx) => (
                <div
                  key={`${item.songId}-${idx}`}
                  onClick={() => playSong(item.song, FALLBACK_SONGS)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-pink-50/50 border border-pink-100/90 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.song.cover_url}
                        alt={item.song.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 group-hover:text-aura-pink truncate transition-colors">
                        {item.song.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs text-slate-400">
                    <div>{Math.round(item.durationSeconds)}s streamed</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(item.playedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-pink-100/90 shadow-sm space-y-3">
              <History className="w-12 h-12 text-pink-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No Recent History Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Play any track from the Vault and your listening duration will be automatically recorded here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
