"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Play,
  Pause,
  Clock,
  Heart,
  Music2,
  Sparkles,
  Filter,
} from "lucide-react";
import { FALLBACK_SONGS } from "@/lib/constants";
import { AuraSong } from "@/lib/supabase/types";
import { usePlayer } from "@/context/PlayerContext";
import { cn, formatTime } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "GUTS",
  "SOUR",
  "Unreleased Vault",
  "Live Sessions",
  "Pop Punk",
  "Pop Rock",
  "Alt-Rock",
  "Acoustic Pop",
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    likedSongs,
    toggleLike,
  } = usePlayer();

  const allSongs = useMemo(() => {
    if (typeof window !== "undefined") {
      const localUploaded = localStorage.getItem("aura_uploaded_songs");
      if (localUploaded) {
        try {
          const list: AuraSong[] = JSON.parse(localUploaded);
          return [...list, ...FALLBACK_SONGS];
        } catch {}
      }
    }
    return FALLBACK_SONGS;
  }, []);

  // Filter songs based on search query and category
  const filteredSongs = useMemo(() => {
    return allSongs.filter((song) => {
      const matchesQuery =
        !query.trim() ||
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(query.toLowerCase())) ||
        (song.genre && song.genre.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" ||
        (song.album && song.album.toLowerCase() === selectedCategory.toLowerCase()) ||
        (song.genre && song.genre.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchesQuery && matchesCategory;
    });
  }, [allSongs, query, selectedCategory]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Page Header & Search Input */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore & Search
          </h1>
          <p className="text-sm text-slate-500">
            Browse the 21-track Vault, filter by era, or search by title and genre.
          </p>
        </div>

        {/* Large Dedicated Search Box */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks, albums, unreleased songs..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-pink-200/90 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-aura-pink focus:border-transparent transition-all text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 shadow-sm",
                selectedCategory === cat
                  ? "bg-aura-pink text-white shadow-aura-pink/30 scale-105"
                  : "bg-white hover:bg-pink-50 text-slate-700 border border-pink-100/90 hover:border-aura-pink/30"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium border-b border-pink-100 pb-2">
          <span>
            Showing <strong className="text-slate-900">{filteredSongs.length}</strong> {filteredSongs.length === 1 ? "track" : "tracks"}
          </span>
          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-aura-pink hover:underline font-semibold"
            >
              Reset filter
            </button>
          )}
        </div>

        {filteredSongs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-pink-100/90 shadow-sm space-y-3">
            <Music2 className="w-12 h-12 text-pink-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No tracks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any songs matching "{query}". Try searching for "vampire", "all-american bitch", or "unreleased".
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 rounded-full bg-aura-pink text-white text-xs font-bold shadow-md shadow-aura-pink/30 hover:bg-pink-600 transition-colors"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    "group flex items-center gap-3.5 p-3 rounded-2xl bg-white hover:bg-pink-50/50 border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer",
                    isCurrent
                      ? "border-aura-pink ring-2 ring-aura-pink/20 bg-pink-50/40"
                      : "border-pink-100 hover:border-aura-pink/40"
                  )}
                >
                  {/* Artwork with hover play button */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity",
                        isCurrentPlaying
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Info */}
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
                    <div className="flex items-center gap-2 mt-1">
                      {song.genre && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                          {song.genre}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {formatTime(song.duration_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* Heart button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song.id);
                    }}
                    className="p-2 text-slate-400 hover:text-aura-pink transition-transform hover:scale-110 active:scale-95 shrink-0"
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isLiked && "fill-aura-pink text-aura-pink"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-medium">
          Loading Aura Search...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
