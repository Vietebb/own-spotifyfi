"use client";

import React, { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Clock,
  Heart,
  Music2,
} from "lucide-react";
import { AuraSong } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { FALLBACK_SONGS } from "@/lib/constants";
import { usePlayer } from "@/context/PlayerContext";
import { cn, formatTime } from "@/lib/utils";

interface SongGridProps {
  initialSongs?: AuraSong[];
}

export function SongGrid({ initialSongs }: SongGridProps) {
  const [songs, setSongs] = useState<AuraSong[]>(initialSongs || FALLBACK_SONGS);
  const [selectedEra, setSelectedEra] = useState<string>("All");

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    likedSongs,
    toggleLike,
  } = usePlayer();

  // Fetch real songs from Supabase aura_songs if available
  useEffect(() => {
    async function loadCatalog() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("aura_songs")
          .select("*")
          .order("created_at", { ascending: false });

        const uploadedRaw = typeof window !== "undefined" ? localStorage.getItem("aura_uploaded_songs") : null;
        const uploadedList: AuraSong[] = uploadedRaw ? JSON.parse(uploadedRaw) : [];

        if (!error && data && data.length > 0) {
          const seen = new Set(data.map((s: AuraSong) => s.id));
          const extra = uploadedList.filter((u) => !seen.has(u.id));
          setSongs([...extra, ...(data as AuraSong[])]);
        } else {
          setSongs([...uploadedList, ...FALLBACK_SONGS]);
        }
      } catch (err) {
        const uploadedRaw = typeof window !== "undefined" ? localStorage.getItem("aura_uploaded_songs") : null;
        const uploadedList: AuraSong[] = uploadedRaw ? JSON.parse(uploadedRaw) : [];
        setSongs([...uploadedList, ...FALLBACK_SONGS]);
      }
    }

    loadCatalog();
  }, []);

  const eras = ["All", "GUTS", "SOUR", "Unreleased Vault", "Live Sessions"];

  const filteredSongs = selectedEra === "All"
    ? songs
    : songs.filter((s) => s.album?.toLowerCase() === selectedEra.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header with Title and Era Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Vault Catalog
          </h2>
          <p className="text-xs text-slate-500">
            21 tracks available in high-fidelity synchronous audio
          </p>
        </div>

        {/* Era Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {eras.map((era) => (
            <button
              key={era}
              onClick={() => setSelectedEra(era)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 shadow-sm",
                selectedEra === era
                  ? "bg-aura-pink text-white shadow-aura-pink/30 scale-105"
                  : "bg-white hover:bg-pink-50 text-slate-700 border border-pink-100 hover:border-aura-pink/30"
              )}
            >
              {era}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {filteredSongs.map((song) => {
          const isCurrent = currentSong?.id === song.id;
          const isCurrentPlaying = isCurrent && isPlaying;
          const isLiked = likedSongs.has(song.id);

          return (
            <div
              key={song.id}
              onClick={() => {
                if (isCurrent) {
                  togglePlay();
                } else {
                  playSong(song, filteredSongs);
                }
              }}
              className={cn(
                "group relative flex flex-col p-3 rounded-2xl bg-white hover:bg-pink-50/40 border transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer",
                isCurrent
                  ? "border-aura-pink ring-2 ring-aura-pink/30 bg-pink-50/50 shadow-aura-pink/15"
                  : "border-pink-100/90 hover:border-aura-pink/40"
              )}
            >
              {/* Album Cover Canvas (rounded-xl) with Floating Hot Rose Play Button */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.cover_url}
                  alt={`${song.title} Cover`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Animated Equalizer Wave when Playing */}
                {isCurrentPlaying && (
                  <div className="absolute top-2 right-2 flex items-end gap-0.5 h-3.5 px-1.5 py-0.5 rounded bg-aura-pink/90 backdrop-blur-sm shadow-md">
                    <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" />
                  </div>
                )}

                {/* Floating Hot Rose Play/Pause Button on Hover with scale-105 */}
                <div
                  className={cn(
                    "absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300",
                    isCurrentPlaying
                      ? "bg-slate-900 scale-105 ring-2 ring-aura-pink"
                      : isCurrent
                      ? "bg-aura-pink scale-105"
                      : "bg-aura-pink opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-105 hover:bg-pink-600 shadow-aura-pink/50"
                  )}
                >
                  {isCurrentPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </div>
              </div>

              {/* Track Metadata */}
              <div className="flex-1 flex flex-col justify-between space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <h3
                    className={cn(
                      "font-bold text-sm leading-tight truncate transition-colors",
                      isCurrent ? "text-aura-pink" : "text-slate-900 group-hover:text-aura-pink"
                    )}
                  >
                    {song.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song.id);
                    }}
                    aria-label={isLiked ? "Unlike" : "Like"}
                    className="p-1 text-slate-400 hover:text-aura-pink transition-transform hover:scale-110 active:scale-95 shrink-0"
                  >
                    <Heart
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        isLiked ? "fill-aura-pink text-aura-pink" : "hover:text-slate-600"
                      )}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-500 truncate">
                  {song.artist} {song.album ? `• ${song.album}` : ""}
                </p>

                {/* Duration in Monospace Tabular Numerals */}
                <div className="pt-2 mt-auto flex items-center justify-between border-t border-pink-50 text-[11px] text-slate-400 font-mono tabular-nums">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatTime(song.duration_seconds)}
                  </span>
                  {song.genre && (
                    <span className="text-[10px] font-sans font-medium text-slate-500 truncate max-w-[80px]">
                      {song.genre}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
