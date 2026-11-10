"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  User as UserIcon,
  Library,
  Menu,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  onSearchChange?: (query: string) => void;
}

export function Header({ onMobileMenuToggle, onSearchChange }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { setStoryModalOpen } = usePlayer();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur-xl border-b border-pink-100/90 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle & Luxury Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-pink-50 transition-colors"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Search tracks, albums, unreleased vault..."
              className="w-full pl-10 pr-12 py-2 rounded-full text-sm bg-slate-50/90 hover:bg-white focus:bg-white border border-pink-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aura-pink focus:border-transparent transition-all shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-semibold text-aura-pink bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>

        {/* Right: Unwrapped Story & Profile Link */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Unwrapped 9:16 Story Card Button */}
          <button
            onClick={() => setStoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-aura-pink to-pink-500 hover:from-pink-600 hover:to-aura-pink text-white text-xs font-bold shadow-sm shadow-aura-pink/30 transition-all hover:scale-105 active:scale-95"
            title="Open Aura Unwrapped 9:16 Story"
          >
            <Sparkles className="w-3.5 h-3.5 text-aura-blossom" />
            <span className="hidden sm:inline">Unwrapped</span>
          </button>

          {/* Profile & Library Link */}
          <Link
            href="/library"
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-pink-50 border border-pink-100 transition-all group"
            title="Go to Your Library"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-aura-pink to-aura-blossom text-white font-black text-xs shadow-sm">
              <span>AL</span>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-800 group-hover:text-aura-pink transition-colors">
              Your Library
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
