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
  ListMusic,
  Maximize2,
  Radio,
  Zap,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
}

export function PlayerDock() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [isLiked, setIsLiked] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  // Default track from university proposal: Olivia Rodrigo - vampire
  const currentTrack: TrackInfo = {
    title: "vampire",
    artist: "Olivia Rodrigo",
    album: "GUTS",
    coverUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    duration: 219, // 3:39
  };

  const progressPercent = (currentTime / currentTrack.duration) * 100;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * currentTrack.duration;
    setCurrentTime(Math.round(newTime));
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-24 bg-aura-obsidian/95 backdrop-blur-xl border-t border-aura-blossom/20 px-4 md:px-8 py-3 text-white shadow-2xl flex items-center justify-between gap-4 select-none">
      {/* 1. Left: Track Metadata & Like Action */}
      <div className="flex items-center gap-3.5 min-w-[200px] max-w-[30%]">
        <div className="relative group shrink-0 overflow-hidden rounded-lg w-14 h-14 bg-slate-800 border border-white/10 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.coverUrl}
            alt={`${currentTrack.title} Cover`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white hover:text-aura-blossom cursor-pointer truncate transition-colors">
              {currentTrack.title}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-aura-pink/20 text-aura-blossom border border-aura-pink/30">
              CDN STREAM
            </span>
          </div>
          <span className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer truncate transition-colors">
            {currentTrack.artist} — {currentTrack.album}
          </span>
        </div>

        <button
          onClick={() => setIsLiked(!isLiked)}
          aria-label={isLiked ? "Unlike track" : "Like track"}
          className="p-2 rounded-full text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-all duration-200",
              isLiked ? "fill-aura-pink text-aura-pink scale-110" : "text-slate-400 hover:scale-110"
            )}
          />
        </button>
      </div>

      {/* 2. Center: Audio Controls & Scrubber Progress Bar */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            aria-label="Shuffle playback"
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isShuffle ? "text-aura-pink" : "text-slate-400 hover:text-white"
            )}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            aria-label="Previous track"
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition-transform hover:scale-110 active:scale-95"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-aura-pink text-white hover:bg-aura-pink/90 hover:scale-105 active:scale-95 shadow-lg shadow-aura-pink/40 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => setCurrentTime(Math.min(currentTrack.duration, currentTime + 10))}
            aria-label="Next track"
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition-transform hover:scale-110 active:scale-95"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => setIsRepeat(!isRepeat)}
            aria-label="Repeat track"
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isRepeat ? "text-aura-pink" : "text-slate-400 hover:text-white"
            )}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Tabular Mono Time & Scrubber Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 tabular-nums w-8 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center group cursor-pointer py-1">
            {/* Background Track */}
            <div className="w-full h-1 bg-slate-700/70 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
              {/* Progress Fill */}
              <div
                className="h-full bg-gradient-to-r from-aura-pink to-aura-blossom rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Scrubber Thumb */}
            <div
              className="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 -translate-x-1/2 transition-opacity pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Invisible Range Input for Interaction */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek track position"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 tabular-nums w-8 text-left shrink-0">
            {formatTime(currentTrack.duration)}
          </span>
        </div>
      </div>

      {/* 3. Right: Volume Controls, Audio Specs & Telemetry Pill */}
      <div className="hidden lg:flex items-center gap-4 min-w-[200px] justify-end">
        {/* HLS / Audio Format Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
          <Zap className="w-3 h-3 text-aura-blossom" />
          <span>HLS 256kbps</span>
        </div>

        {/* Queue Button */}
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Playback queue"
          title="Playback Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
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
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aura-pink"
            aria-label="Volume level"
          />
        </div>
      </div>
    </footer>
  );
}
