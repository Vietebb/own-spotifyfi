"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";

export function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffle,
    isRepeat,
    likedSongs,
    togglePlay,
    seek,
    setVolume,
    nextSong,
    prevSong,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    setStoryModalOpen,
  } = usePlayer();

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(volume);

  if (!currentSong) return null;

  const isLiked = likedSongs.has(currentSong.id);
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * duration;
    seek(newTime);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.8);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <footer
      id="aura-audio-dock"
      className="fixed bottom-0 left-0 right-0 z-40 h-24 bg-[#06080c]/95 backdrop-blur-xl border-t border-[#1F2937] px-4 md:px-8 py-3 text-white shadow-2xl flex items-center justify-between gap-4 select-none"
    >
      {/* 1. Left Pane: Now Playing Info & Heart/Favorite Toggle */}
      <div className="flex items-center gap-3.5 min-w-[180px] max-w-[30%]">
        <div className="relative group shrink-0 overflow-hidden rounded-xl w-14 h-14 bg-slate-900 border border-white/10 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSong.cover_url}
            alt={`${currentSong.title} Artwork`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <button
            onClick={() => setStoryModalOpen(true)}
            aria-label="Open 9:16 story mode"
            title="Expand 9:16 Story Card"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
          >
            <Maximize2 className="w-4 h-4 text-aura-blossom drop-shadow" />
          </button>
        </div>

        <div className="flex flex-col min-w-0">
          <span
            onClick={() => setStoryModalOpen(true)}
            className="font-bold text-sm text-white hover:text-aura-blossom cursor-pointer truncate transition-colors leading-tight"
          >
            {currentSong.title}
          </span>
          <span className="text-xs text-slate-400 truncate hover:text-slate-200 transition-colors mt-0.5">
            {currentSong.artist} {currentSong.album ? `• ${currentSong.album}` : ""}
          </span>
        </div>

        <button
          onClick={() => toggleLike(currentSong.id)}
          aria-label={isLiked ? "Unlike track" : "Like track"}
          className="p-2 rounded-full text-slate-400 hover:text-white transition-transform shrink-0 hover:scale-110 active:scale-95 ml-1"
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-all duration-200",
              isLiked
                ? "fill-aura-pink text-aura-pink scale-110 drop-shadow-[0_0_8px_rgba(230,25,110,0.6)]"
                : "text-slate-400 hover:text-slate-200"
            )}
          />
        </button>
      </div>

      {/* 2. Center Controls: Shuffle, Prev, Play/Pause with Glow, Next, Repeat & Gradient Scrubber */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
        {/* Playback Control Buttons */}
        <div className="flex items-center gap-5 sm:gap-6">
          <button
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            title="Shuffle playback"
            className={cn(
              "p-1.5 rounded-full transition-colors relative",
              isShuffle ? "text-aura-pink" : "text-slate-400 hover:text-white"
            )}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-aura-pink rounded-full" />
            )}
          </button>

          <button
            onClick={prevSong}
            aria-label="Previous track"
            title="Previous track"
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition-transform hover:scale-110 active:scale-95"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Prominent Play/Pause Toggle with Hot Rose Glow */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            title={isPlaying ? "Pause" : "Play"}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-aura-pink text-white hover:bg-pink-600 hover:scale-105 active:scale-95 shadow-lg shadow-aura-pink/50 transition-all ring-2 ring-pink-400/30"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextSong}
            aria-label="Next track"
            title="Next track"
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition-transform hover:scale-110 active:scale-95"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            aria-label="Toggle repeat"
            title="Repeat track"
            className={cn(
              "p-1.5 rounded-full transition-colors relative",
              isRepeat ? "text-aura-pink" : "text-slate-400 hover:text-white"
            )}
          >
            <Repeat className="w-4 h-4" />
            {isRepeat && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-aura-pink rounded-full" />
            )}
          </button>
        </div>

        {/* Clean Scrubber Bar with Gradient Fill (#E6196E to #FF99C2) */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 tabular-nums w-8 text-right shrink-0">
            {formatTime(progress)}
          </span>

          <div className="relative flex-1 flex items-center group cursor-pointer py-1">
            {/* Background Track */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
              {/* Gradient Scrubber Fill */}
              <div
                className="h-full bg-gradient-to-r from-[#E6196E] to-[#FF99C2] rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Scrubber Thumb */}
            <div
              className="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 -translate-x-1/2 transition-opacity pointer-events-none ring-2 ring-aura-pink"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Native Slider Input */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={handleSeekChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek playback position"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 tabular-nums w-8 text-left shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right Pane: Volume Slider & 9:16 Story Mode Button */}
      <div className="hidden lg:flex items-center gap-4 min-w-[180px] justify-end">
        {/* Smooth Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMuteToggle}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-aura-pink" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-aura-pink"
            aria-label="Volume level"
          />
        </div>

        {/* 9:16 Story Mode Button */}
        <button
          onClick={() => setStoryModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-aura-pink/20 hover:bg-aura-pink text-aura-blossom hover:text-white text-xs font-bold border border-aura-pink/40 shadow-sm transition-all active:scale-95"
          title="Open Aura Unwrapped Story Mode (9:16)"
        >
          <Sparkles className="w-3.5 h-3.5 text-aura-blossom" />
          <span>Story</span>
        </button>
      </div>
    </footer>
  );
}
