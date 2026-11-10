"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AuraSong } from "@/lib/supabase/types";
import { FALLBACK_SONGS } from "@/lib/constants";
import { logEndSongEvent } from "@/lib/telemetry";

interface PlayerContextType {
  currentSong: AuraSong | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: AuraSong[];
  isShuffle: boolean;
  isRepeat: boolean;
  likedSongs: Set<string>;
  isStoryModalOpen: boolean;
  playSong: (song: AuraSong, playlist?: AuraSong[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (fraction: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (songId: string) => void;
  setStoryModalOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<AuraSong | null>(FALLBACK_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(FALLBACK_SONGS[0].duration_seconds);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [queue, setQueue] = useState<AuraSong[]>(FALLBACK_SONGS);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aura_liked_songs");
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {}
      }
    }
    return new Set(["00000000-0000-0000-0000-000000000001"]);
  });
  const [isStoryModalOpen, setStoryModalOpen] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSongRef = useRef<AuraSong | null>(currentSong);
  const queueRef = useRef<AuraSong[]>(queue);
  const isShuffleRef = useRef<boolean>(isShuffle);
  const isRepeatRef = useRef<boolean>(isRepeat);

  // Keep refs synchronized for audio event listeners
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  // Non-blocking telemetry emission on EndSong
  const emitEndSongTelemetry = useCallback((song: AuraSong | null, listenedSeconds: number) => {
    if (!song) return;
    logEndSongEvent({
      songId: song.id,
      durationMs: listenedSeconds * 1000,
    });
  }, []);

  const nextSong = useCallback(() => {
    const currentQueue = queueRef.current;
    const current = currentSongRef.current;

    if (!current || currentQueue.length === 0) return;

    const currentIndex = currentQueue.findIndex((s) => s.id === current.id);
    let nextIndex = 0;

    if (isShuffleRef.current && currentQueue.length > 1) {
      let rand = Math.floor(Math.random() * currentQueue.length);
      while (rand === currentIndex) {
        rand = Math.floor(Math.random() * currentQueue.length);
      }
      nextIndex = rand;
    } else {
      nextIndex = (currentIndex + 1) % currentQueue.length;
    }

    const nextTrack = currentQueue[nextIndex];
    if (nextTrack) {
      setCurrentSong(nextTrack);
      if (audioRef.current) {
        audioRef.current.src = nextTrack.audio_url;
        audioRef.current.play().catch((err) => {
          console.warn("[Aura Audio Stream Engine] Autoplay note:", err);
        });
      }
    }
  }, []);

  const prevSong = useCallback(() => {
    if (!audioRef.current) return;

    // If more than 3 seconds in, restart the song
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    const currentQueue = queueRef.current;
    const current = currentSongRef.current;
    if (!current || currentQueue.length === 0) return;

    const currentIndex = currentQueue.findIndex((s) => s.id === current.id);
    const prevIndex =
      currentIndex - 1 < 0 ? currentQueue.length - 1 : currentIndex - 1;
    const prevTrack = currentQueue[prevIndex];

    if (prevTrack) {
      setCurrentSong(prevTrack);
      if (audioRef.current) {
        audioRef.current.src = prevTrack.audio_url;
        audioRef.current.play().catch((err) => {
          console.warn("[Aura Audio Stream Engine] Autoplay note:", err);
        });
      }
    }
  }, []);

  // Initialize Audio instance on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = volume;
    if (currentSong?.audio_url) {
      audio.src = currentSong.audio_url;
    }
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(Math.floor(audio.currentTime));
    };

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.floor(audio.duration));
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      // 1. Non-blocking asynchronous telemetry dispatch
      emitEndSongTelemetry(currentSongRef.current, audio.duration || progress);

      // 2. Handle repeat or advance to next song immediately
      if (isRepeatRef.current) {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else {
        nextSong();
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [emitEndSongTelemetry, nextSong, volume]);

  const playSong = useCallback(
    (song: AuraSong, playlist?: AuraSong[]) => {
      if (playlist && playlist.length > 0) {
        setQueue(playlist);
        queueRef.current = playlist;
      }

      setCurrentSong(song);
      currentSongRef.current = song;
      setProgress(0);
      setDuration(song.duration_seconds);

      if (audioRef.current) {
        if (audioRef.current.src !== song.audio_url) {
          audioRef.current.src = song.audio_url;
        }
        audioRef.current.play().catch((err) => {
          console.warn("[Aura Audio Stream Engine] Play rejected:", err);
        });
      }
    },
    []
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (!currentSong && queue.length > 0) {
      playSong(queue[0]);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("[Aura Audio Stream Engine] Play toggle note:", err);
      });
    }
  }, [currentSong, isPlaying, playSong, queue]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setProgress(Math.floor(seconds));
    }
  }, []);

  const setVolume = useCallback((fraction: number) => {
    const clamped = Math.max(0, Math.min(1, fraction));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  const toggleLike = useCallback((songId: string) => {
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("aura_liked_songs", JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        queue,
        isShuffle,
        isRepeat,
        likedSongs,
        isStoryModalOpen,
        playSong,
        togglePlay,
        seek,
        setVolume,
        nextSong,
        prevSong,
        toggleShuffle,
        toggleRepeat,
        toggleLike,
        setStoryModalOpen,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
