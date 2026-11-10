"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Share2,
  Download,
  Trophy,
  Clock,
  Music,
  Play,
  Pause,
  CheckCircle2,
  Heart,
  Volume2,
  Zap,
} from "lucide-react";
import { toPng } from "html-to-image";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime } from "@/lib/utils";

interface ListeningStats {
  total_minutes_streamed: number;
  total_plays_count: number;
  top_artist: string;
  top_track: string;
  top_genre: string;
  percentile_badge: string;
}

export function StoryCardModal() {
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
    percentile_badge: "Top 0.001% Global Listener",
  });

  const [activeStorySegment, setActiveStorySegment] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  // Load aggregated stats from /api/stats
  useEffect(() => {
    if (isStoryModalOpen) {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data?.stats) {
            setStats({
              total_minutes_streamed: data.stats.total_minutes_streamed || 12450,
              total_plays_count: data.stats.total_plays_count || 3120,
              top_artist: data.stats.top_artist || "Olivia Rodrigo",
              top_track: data.stats.top_track || "vampire",
              top_genre: data.stats.top_genre || "Pop Rock",
              percentile_badge: data.stats.percentile_badge || "Top 0.001% Global Listener",
            });
          }
        })
        .catch((err) => {
          console.debug("[Aura Story Stats Sync]", err);
        });
    }
  }, [isStoryModalOpen]);

  // Auto-progress segmented Instagram story bars
  useEffect(() => {
    if (!isStoryModalOpen) return;
    const interval = setInterval(() => {
      setActiveStorySegment((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isStoryModalOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStoryModalOpen(false);
      }
    };
    if (isStoryModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStoryModalOpen, setStoryModalOpen]);

  if (!isStoryModalOpen || !currentSong) return null;

  const isLiked = likedSongs.has(currentSong.id);
  const topArtistName = stats.top_artist || currentSong.artist || "Olivia Rodrigo";
  const topTrackTitle = stats.top_track || currentSong.title || "vampire";

  // Viral Sharing & PNG Export Handler
  const handleShareOrExport = async () => {
    if (!cardRef.current || isExporting) return;

    try {
      setIsExporting(true);

      // Generate high-resolution PNG data URL from 9:16 card
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: "#06080c",
      });

      // Convert data URL to Blob for native Web Share API
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `aura-unwrapped-${topArtistName.toLowerCase().replace(/\s+/g, "-")}.png`, {
        type: "image/png",
      });

      // Try Native Web Share API with File
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        await navigator.share({
          title: `Aura Unwrapped: ${topArtistName}`,
          text: `I'm in the ${stats.percentile_badge} of ${topArtistName} fans with ${stats.total_minutes_streamed.toLocaleString()} minutes streamed on Aura Music!`,
          files: [file],
        });
        setExportSuccess(true);
      } else {
        // Fallback: Direct PNG Download
        const link = document.createElement("a");
        link.download = `aura-unwrapped-2026-${topArtistName.toLowerCase().replace(/\s+/g, "-")}.png`;
        link.href = dataUrl;
        link.click();
        setExportSuccess(true);
      }

      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.warn("[Aura Story Export Note]:", err);
      // Fallback text copy
      if (navigator.clipboard) {
        navigator.clipboard.writeText(
          `✦ Aura Music Unwrapped 2026: I'm in the ${stats.percentile_badge} of ${topArtistName} fans with ${stats.total_minutes_streamed.toLocaleString()} minutes streamed!`
        );
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-y-auto"
    >
      {/* Background click dismiss */}
      <div
        className="fixed inset-0"
        onClick={() => setStoryModalOpen(false)}
      />

      {/* Main Wrapper (9:16 Card + Controls) */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[360px] my-auto">
        {/* ========================================================================= */}
        {/* 9:16 STORY FRAME (Strict 9:16 Canvas for Viral Sharing)                   */}
        {/* ========================================================================= */}
        <div
          ref={cardRef}
          className="relative w-full aspect-[9/16] rounded-[2.2rem] bg-gradient-to-b from-aura-navy via-slate-950 to-aura-obsidian border-2 border-aura-pink/50 shadow-2xl p-6 flex flex-col justify-between overflow-hidden text-white"
        >
          {/* Animated Aura Glow Accents in Background */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-aura-pink/35 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-aura-blossom/25 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-aura-royal/20 blur-3xl pointer-events-none" />

          {/* 1. TOP HEADER: Segmented Instagram Story Progress Bars & Brand Badge */}
          <div className="relative z-10 space-y-3.5">
            {/* 3 Segmented Story Progress Bars */}
            <div className="flex gap-1.5 items-center">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStorySegment(idx)}
                  className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden focus:outline-none"
                  aria-label={`Jump to story segment ${idx + 1}`}
                >
                  <div
                    className={`h-full bg-aura-pink transition-all duration-300 ${
                      activeStorySegment === idx
                        ? "w-full animate-pulse"
                        : activeStorySegment > idx
                        ? "w-full"
                        : "w-0"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Brand Pill & Verification Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-wider text-aura-blossom">
                <Sparkles className="w-3 h-3 text-aura-pink animate-spin [animation-duration:6s]" />
                <span>AURA UNWRAPPED 2026</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                <Zap className="w-2.5 h-2.5" />
                <span>&lt;100ms</span>
              </div>
            </div>

            {/* Headline Block */}
            <div className="space-y-0.5 text-left">
              <div className="text-[11px] font-black uppercase tracking-widest text-aura-blossom">
                YOUR TOP ARTIST OF THE YEAR
              </div>
              <h1
                id="story-modal-title"
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md leading-none bg-gradient-to-r from-white via-slate-100 to-pink-200 bg-clip-text text-transparent"
              >
                {topArtistName}
              </h1>
            </div>
          </div>

          {/* 2. HERO GRAPHIC: Album Canvas with Animated Pulse Aura */}
          <div className="relative z-10 my-auto flex flex-col items-center">
            {/* Glowing Pulse Rings */}
            <div className="relative group flex items-center justify-center">
              {/* Outer radiant ring */}
              <div className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-tr from-aura-pink via-aura-blossom to-aura-royal opacity-60 blur-xl animate-pulse" />
              
              {/* Image Container with shadow-aura-glow */}
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-[0_0_40px_-5px_rgba(230,25,110,0.65)] border-2 border-white/30 bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentSong.cover_url}
                  alt={`${topArtistName} Hero`}
                  className="w-full h-full object-cover"
                />

                {/* Interactive Play/Pause Button in Story */}
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? (
                    <Pause className="w-12 h-12 fill-current drop-shadow-xl" />
                  ) : (
                    <Play className="w-12 h-12 fill-current translate-x-1 drop-shadow-xl" />
                  )}
                </button>
              </div>

              {/* Floating Rank Badge */}
              <div className="absolute -bottom-3 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-aura-pink text-white text-[11px] font-black shadow-lg shadow-aura-pink/50 border border-white/20">
                <span>#1</span>
              </div>
            </div>

            {/* Currently Playing Track Label */}
            <div className="mt-4 text-center space-y-0.5 max-w-[240px]">
              <div className="text-sm font-black text-white truncate flex items-center justify-center gap-1.5">
                <span>{currentSong.title}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-aura-pink animate-ping" />
              </div>
              <div className="text-[11px] text-slate-300 font-mono truncate">
                {formatTime(progress)} / {formatTime(duration)} • {currentSong.genre || "Pop Rock"}
              </div>
            </div>
          </div>

          {/* 3. PERSONALIZED BADGES: VIP Pill & Metric Counters */}
          <div className="relative z-10 space-y-2.5">
            {/* VIP Pill */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-aura-pink/30 via-pink-600/25 to-aura-royal/30 backdrop-blur-xl border border-aura-pink/50 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-aura-pink flex items-center justify-center text-white shadow-md">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-aura-blossom uppercase tracking-wider">
                    Listener Status
                  </div>
                  <div className="text-xs font-black text-white">
                    Top 0.001% Global Listener
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/20 text-white">
                VIP TIER
              </span>
            </div>

            {/* Metric Counters Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <Clock className="w-4 h-4 text-aura-blossom shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-400 font-medium uppercase truncate">
                    Streamed
                  </div>
                  <div className="text-xs font-black text-white font-mono tabular-nums truncate">
                    12,450 Mins
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <Music className="w-4 h-4 text-aura-pink shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-400 font-medium uppercase truncate">
                    Top Track
                  </div>
                  <div className="text-xs font-black text-white truncate">
                    &apos;{topTrackTitle}&apos;
                  </div>
                </div>
              </div>
            </div>

            {/* Watermark / Attribution Footer */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-mono">
              <span>Aura Music • Univ ICT Proposal</span>
              <span className="text-aura-blossom">@balgynnbb</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ACTION TOOLBAR: Viral Share CTA & Dismiss Controls                 */}
        {/* ========================================================================= */}
        <div className="w-full flex items-center gap-2 px-1">
          {/* Share to Instagram Stories CTA */}
          <button
            onClick={handleShareOrExport}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-aura-pink via-pink-500 to-aura-pink hover:from-pink-600 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-aura-pink/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-75"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating High-Res Story...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Story Exported!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share to Instagram Stories</span>
              </>
            )}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={() => setStoryModalOpen(false)}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-white/15"
            aria-label="Close story modal"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
