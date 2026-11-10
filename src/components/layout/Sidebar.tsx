"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Music2,
  Heart,
  ListMusic,
  Disc3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { setStoryModalOpen, likedSongs } = usePlayer();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore & Search", href: "/search", icon: Search },
    { label: "Your Library", href: "/library", icon: Library },
    { label: "Admin Studio", href: "/admin", icon: Shield },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-[#0F172A] text-slate-200 transition-all duration-300 ease-in-out z-30 select-none border-r border-[#1E293B] shadow-2xl",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#1E293B]">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-aura-pink to-aura-blossom shadow-lg shadow-aura-pink/30 shrink-0 group-hover:scale-105 transition-transform">
            <Music2 className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0F172A] rounded-full animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-aura-blossom bg-clip-text text-transparent truncate">
                Aura Music
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-aura-blossom/90 truncate">
                Olivia Rodrigo Vault
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div
          className={cn(
            "px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider",
            isCollapsed && "hidden"
          )}
        >
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                isActive
                  ? "bg-aura-pink text-white shadow-md shadow-aura-pink/30"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-aura-blossom"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Unwrapped Story Trigger */}
        <button
          onClick={() => setStoryModalOpen(true)}
          title={isCollapsed ? "Aura Unwrapped Story" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-aura-blossom bg-aura-pink/15 hover:bg-aura-pink/25 hover:text-white border border-aura-pink/30 group mt-2"
        >
          <Sparkles className="w-5 h-5 shrink-0 text-aura-pink group-hover:scale-110 transition-transform" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 truncate">
              <span>Unwrapped Story</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-aura-pink text-white uppercase">
                9:16
              </span>
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="pt-4 pb-2">
          <div className="h-px bg-[#1E293B]" />
        </div>

        {/* Library Shortcuts */}
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Playlists
            </div>

            <Link
              href="/library"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-aura-pink to-pink-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="truncate flex-1">Liked Songs</span>
              <span className="text-[10px] font-mono text-slate-400">
                {likedSongs.size}
              </span>
            </Link>

            <Link
              href="/search?q=Vault"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-aura-blossom shrink-0">
                <Disc3 className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Unreleased Vault</span>
            </Link>

            <Link
              href="/search?q=GUTS"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-aura-blossom shrink-0">
                <ListMusic className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">GUTS & Spilled</span>
            </Link>

            <Link
              href="/search?q=SOUR"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-aura-blossom shrink-0">
                <ListMusic className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">SOUR Era</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 pt-2">
            <Link
              href="/library"
              title="Liked Songs"
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-aura-pink to-pink-500 flex items-center justify-center text-white hover:scale-105 transition-transform"
            >
              <Heart className="w-4 h-4 fill-current" />
            </Link>
          </div>
        )}
      </nav>

      {/* Footer info: Vault track count & Admin entry */}
      <div className="p-4 border-t border-[#1E293B]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>21 Tracks Available</span>
            <Link
              href="/admin"
              className="text-emerald-400 hover:text-aura-blossom font-sans font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio</span>
            </Link>
          </div>
        ) : (
          <Link
            href="/admin"
            title="Admin Studio"
            className="block w-2.5 h-2.5 rounded-full bg-emerald-400 mx-auto hover:scale-125 transition-transform"
          />
        )}
      </div>
    </aside>
  );
}
