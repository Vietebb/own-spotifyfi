"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  Share2,
  Heart,
  Play,
  Pause,
  Zap,
  BarChart3,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime } from "@/lib/utils";

interface ListeningStats {
  total_minutes_streamed: number;
  total_plays_count: number;
  top_artist: string;
  top_track: string;
  top_genre: string;
  percentile_badge: string;
  has_live_data?: boolean;
}

export function StoryModal() {
  const {
    isStoryModalOpen,
    setStoryModalOpen,
    currentSong,
    isPlaying,
    togglePlay,
    progress,
    duration,
    likedSongs,
    toggleLike,
  } = usePlayer();

  const [stats, setStats] = useState<ListeningStats>({
    total_minutes_streamed: 12450,
    total_plays_count: 3120,
    top_artist: "Olivia Rodrigo",
    top_track: "vampire",
    top_genre: "Pop Rock",
    percentile_badge: "Top 0.001% of Olivia Rodrigo fans",
  });

  useEffect(() => {
    if (isStoryModalOpen) {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data?.stats) {
            setStats(data.stats);
          }
        })
        .catch((err) => {
          console.debug("[Aura Story Stats Sync]", err);
        });
    }
  }, [isStoryModalOpen]);

  if (!isStoryModalOpen || !currentSong) return null;

  const isLiked = likedSongs.has(currentSong.id);
  const progressRatio = duration > 0 ? (progress / duration) * 100 : 0;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Aura Unwrapped: ${currentSong.title}`,
          text: `I'm in the ${stats.percentile_badge} with ${stats.total_minutes_streamed.toLocaleString()} minutes streamed on Aura Music!`,
          url: window.location.href,
        });
      } catch (err) {
        console.debug("Share closed", err);
      }
    } else {
      alert("Aura Story badge copied! Ready to paste into Instagram or TikTok Stories.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click to close */}
      <div
        className="absolute inset-0"
        onClick={() => setStoryModalOpen(false)}
      />

      {/* 9:16 Smartphone Vertical Story Card Container */}
      <div className="relative z-10 w-full max-w-[340px] aspect-[9/16] rounded-3xl bg-gradient-to-b from-aura-obsidian via-slate-950 to-aura-navy border-2 border-aura-pink/50 shadow-2xl p-5 flex flex-col justify-between overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 -right-16 w-48 h-48 rounded-full bg-aura-pink/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-16 w-48 h-48 rounded-full bg-aura-blossom/20 blur-3xl pointer-events-none" />

        {/* Top Story Bar & Close Button */}
        <div className="relative z-10 space-y-3">
          <div className="flex gap-1.5 items-center">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-aura-pink transition-all duration-300"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
            <div className="h-1 flex-1 bg-white/30 rounded-full" />
            <div className="h-1 flex-1 bg-white/30 rounded-full" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-aura-pink/20 border border-aura-pink/40 text-[10px] font-bold text-aura-blossom">
              <Sparkles className="w-3 h-3" />
              <span>AURA UNWRAPPED 2026</span>
            </div>
            <button
              onClick={() => setStoryModalOpen(false)}
              className="p-1.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close story mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className="text-[11px] font-bold text-aura-blossom uppercase tracking-wider">
              Your #1 Top Artist
            </span>
            <h2 className="text-xl font-black text-white leading-tight">
              {stats.top_artist || currentSong.artist}
            </h2>
          </div>
        </div>

        {/* Center Artwork Hero */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="relative w-56 aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/20 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSong.cover_url}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 fill-current drop-shadow-lg" />
              ) : (
                <Play className="w-12 h-12 fill-current translate-x-1 drop-shadow-lg" />
              )}
            </button>
          </div>

          <div className="mt-4 text-center space-y-1 w-full px-2">
            <h3 className="text-lg font-extrabold text-white truncate">
              {currentSong.title}
            </h3>
            <p className="text-xs text-slate-300 truncate">
              {currentSong.album ? `${currentSong.album} • ` : ""}
              {currentSong.genre}
            </p>
          </div>
        </div>

        {/* Bottom Metrics & Share Button */}
        <div className="relative z-10 space-y-3">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Batch Percentile:</span>
              <span className="font-extrabold text-aura-blossom truncate max-w-[170px] text-right">
                {stats.percentile_badge}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Minutes Streamed:</span>
              <span className="font-mono text-white font-bold tabular-nums">
                {stats.total_minutes_streamed.toLocaleString()} mins
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1 border-t border-white/10 font-mono">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-aura-pink" />
                <span>RPC Aggregated</span>
              </span>
              <span>Flow B Telemetry</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLike(currentSong.id)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              aria-label="Like track"
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? "fill-aura-pink text-aura-pink" : "text-white"
                }`}
              />
            </button>

            <button
              onClick={handleShare}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-aura-pink to-pink-500 hover:from-pink-600 hover:to-aura-pink text-white font-extrabold text-xs shadow-lg shadow-aura-pink/40 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to Instagram Story</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
