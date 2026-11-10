"use client";

import React from "react";
import {
  Play,
  Pause,
  Shuffle,
  Sparkles,
  Disc3,
  Heart,
  Radio,
  Music2,
} from "lucide-react";
import { SongGrid } from "@/components/catalog/SongGrid";
import { usePlayer } from "@/context/PlayerContext";
import { FALLBACK_SONGS } from "@/lib/constants";

export default function HomePage() {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleShuffle,
    isShuffle,
    setStoryModalOpen,
  } = usePlayer();

  const firstTrack = FALLBACK_SONGS[0];
  const isFirstPlaying = isPlaying && currentSong?.id === firstTrack.id;

  const handlePlayAll = () => {
    if (isPlaying) {
      togglePlay();
    } else {
      playSong(firstTrack, FALLBACK_SONGS);
    }
  };

  const handleShufflePlay = () => {
    if (!isShuffle) toggleShuffle();
    // Pick random song to start
    const randomIndex = Math.floor(Math.random() * FALLBACK_SONGS.length);
    playSong(FALLBACK_SONGS[randomIndex], FALLBACK_SONGS);
  };

  return (
    <div className="space-y-10 pb-8 animate-in fade-in-50 duration-500">
      {/* 1. HERO SECTION: Olivia Rodrigo Vault Spotlight Card */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-pink-500/20 text-white p-7 sm:p-10 shadow-2xl">
        {/* Ambient Hot Pink Glow Orbs Behind Hero */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-aura-pink/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-24 w-80 h-80 rounded-full bg-aura-blossom/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Hero Left Content */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-aura-blossom tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-aura-pink" />
              <span>Spotlight Collection</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Olivia Rodrigo{" "}
                <span className="bg-gradient-to-r from-aura-pink via-pink-400 to-aura-blossom bg-clip-text text-transparent">
                  Vault
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 font-medium">
                21 Tracks • Unreleased & Studio Sessions
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Experience the complete collection in master fidelity — including rare unreleased vault recordings, NPR Tiny Desk live concerts, and all iconic tracks from GUTS and SOUR.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Big "Play All" Button with Hot Rose Fill */}
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-aura-pink hover:bg-pink-600 text-white font-bold text-sm shadow-xl shadow-aura-pink/40 hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    <span>Play All</span>
                  </>
                )}
              </button>

              {/* Shuffle Vault Button */}
              <button
                onClick={handleShufflePlay}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/15 hover:scale-105 active:scale-95 transition-all"
              >
                <Shuffle className="w-4 h-4 text-aura-blossom" />
                <span>Shuffle Vault</span>
              </button>

              {/* Unwrapped Story Shortcut */}
              <button
                onClick={() => setStoryModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-full text-xs font-semibold text-aura-blossom hover:text-white transition-colors"
              >
                <Sparkles className="w-4 h-4 text-aura-pink" />
                <span>Unwrapped Story</span>
              </button>
            </div>
          </div>

          {/* Hero Right Visual: Artwork Spotlight */}
          <div className="relative shrink-0 w-full sm:w-auto flex items-center justify-center">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl shadow-aura-pink/30 border-2 border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstTrack.cover_url}
                alt="Olivia Rodrigo Artwork"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-bold text-white tracking-wider uppercase">
                  Featured Master
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOG SECTION: Full 21 Tracks Music Grid */}
      <section id="catalog" className="space-y-4">
        <SongGrid />
      </section>
    </div>
  );
}
