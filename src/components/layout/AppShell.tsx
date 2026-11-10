"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { StoryCardModal } from "@/components/stats/StoryCardModal";
import { PlayerProvider } from "@/context/PlayerContext";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  return (
    <PlayerProvider>
      <div className="relative flex h-screen w-screen overflow-hidden bg-aura-blush">
        {/* Desktop Sidebar (Collapsible Dark Slate #0F172A) */}
        <div className="hidden lg:block h-full shrink-0">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Drawer Overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          />
        )}

        {/* Mobile Drawer Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            isCollapsed={false}
            onToggleCollapse={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Main App Viewport */}
        <div className="relative flex flex-col flex-1 h-full min-w-0 overflow-hidden bg-aura-blush">
          <Header
            onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          {/* Blush Pink Main Content Canvas Area */}
          <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 bg-aura-blush text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </main>

          {/* Persistent Audio Dock Connected to Global Player State */}
          <AudioPlayer />

          {/* 9:16 Aura Unwrapped Story Modal */}
          <StoryCardModal />
        </div>
      </div>
    </PlayerProvider>
  );
}
