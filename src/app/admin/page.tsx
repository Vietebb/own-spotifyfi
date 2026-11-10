"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Music,
  Image as ImageIcon,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  LogOut,
  Sliders,
  Radio,
  FileAudio,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { FALLBACK_SONGS } from "@/lib/constants";
import { AuraSong } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { cn, formatTime } from "@/lib/utils";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [passcodeError, setPasscodeError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Admin tabs
  const [activeTab, setActiveTab] = useState<"upload" | "manage">("upload");

  // Form states
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [title, setTitle] = useState<string>("");
  const [artist, setArtist] = useState<string>("Olivia Rodrigo");
  const [album, setAlbum] = useState<string>("Unreleased Vault");
  const [genre, setGenre] = useState<string>("Pop Rock");
  const [durationSeconds, setDurationSeconds] = useState<number>(180);
  const [releaseDate, setReleaseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");

  // Uploading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Catalog management state
  const [catalog, setCatalog] = useState<AuraSong[]>(FALLBACK_SONGS);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  // Check saved admin session
  useEffect(() => {
    const saved = sessionStorage.getItem("aura_admin_session");
    const savedCode = sessionStorage.getItem("aura_admin_passcode");
    if (saved === "authenticated" && savedCode) {
      setPasscode(savedCode);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch catalog when manage tab is opened
  useEffect(() => {
    if (isAuthenticated && activeTab === "manage") {
      loadAdminCatalog();
    }
  }, [isAuthenticated, activeTab]);

  const loadAdminCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const currentCode = passcode || sessionStorage.getItem("aura_admin_passcode") || "";
      const res = await fetch("/api/admin/songs", {
        headers: {
          "x-admin-passcode": currentCode,
        },
      });
      const json = await res.json();
      if (json?.songs && json.songs.length > 0) {
        setCatalog(json.songs);
      } else {
        // Merge fallback with any locally uploaded songs
        const localUploaded = localStorage.getItem("aura_uploaded_songs");
        if (localUploaded) {
          const parsed = JSON.parse(localUploaded);
          setCatalog([...parsed, ...FALLBACK_SONGS]);
        } else {
          setCatalog(FALLBACK_SONGS);
        }
      }
    } catch (err) {
      console.debug("[Admin Catalog Load]", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Handle Passcode Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setPasscodeError("Please enter your admin passcode.");
      return;
    }
    setPasscodeError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem("aura_admin_session", "authenticated");
        sessionStorage.setItem("aura_admin_passcode", passcode.trim());
      } else {
        const data = await res.json().catch(() => ({}));
        setPasscodeError(data.error || "Invalid passcode. Access denied.");
      }
    } catch {
      setPasscodeError("Verification failed. Please check network connection.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("aura_admin_session");
    sessionStorage.removeItem("aura_admin_passcode");
    setPasscode("");
  };

  // Handle Audio File Selection (Auto-detect duration)
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Auto-extract duration via HTML5 Audio object
      try {
        const objectUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(objectUrl);
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            setDurationSeconds(Math.round(tempAudio.duration));
          }
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.debug("[Audio Duration Extract]", err);
      }
    }
  };

  // Handle Cover File Selection (Generate preview)
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  // Submit New Track
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: "error", message: "Please enter a track title." });
      return;
    }

    if (uploadMode === "file" && !audioFile) {
      setFeedback({ type: "error", message: "Please select an MP3 audio file." });
      return;
    }

    if (uploadMode === "url" && !audioUrl.trim()) {
      setFeedback({ type: "error", message: "Please provide a valid audio URL." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      let finalAudioUrl = "";
      let finalCoverUrl = "";

      const currentCode = passcode || sessionStorage.getItem("aura_admin_passcode") || "";

      if (uploadMode === "file") {
        setUploadStep("Requesting secure cloud storage authorization...");
        const urlRes = await fetch("/api/admin/upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-passcode": currentCode,
          },
          body: JSON.stringify({
            audioFilename: audioFile?.name,
            coverFilename: coverFile?.name,
            passcode: currentCode,
          }),
        });

        let urlData;
        try {
          urlData = await urlRes.json();
        } catch {
          const text = await urlRes.text();
          throw new Error(text || "Failed to parse authorization response.");
        }

        if (!urlRes.ok || urlData.error) {
          throw new Error(urlData.error || "Failed to initialize cloud storage upload.");
        }

        const supabase = createClient();

        // 1. Stream Audio directly to Supabase Storage (bypasses Next.js body limits)
        if (audioFile && urlData.audio) {
          setUploadStep(`Uploading audio "${audioFile.name}" directly to cloud storage...`);
          const { error: audioUploadErr } = await supabase.storage
            .from("audio-tracks")
            .uploadToSignedUrl(urlData.audio.path, urlData.audio.token, audioFile);

          if (audioUploadErr) {
            throw new Error(`Cloud storage upload failed (audio): ${audioUploadErr.message}`);
          }
          finalAudioUrl = urlData.audio.publicUrl;
        }

        // 2. Stream Cover directly to Supabase Storage
        if (coverFile && urlData.cover) {
          setUploadStep(`Uploading cover artwork "${coverFile.name}" directly to cloud storage...`);
          const { error: coverUploadErr } = await supabase.storage
            .from("album-covers")
            .uploadToSignedUrl(urlData.cover.path, urlData.cover.token, coverFile);

          if (coverUploadErr) {
            throw new Error(`Cloud storage upload failed (artwork): ${coverUploadErr.message}`);
          }
          finalCoverUrl = urlData.cover.publicUrl;
        }
      } else {
        finalAudioUrl = audioUrl.trim();
        finalCoverUrl = coverUrl.trim();
      }

      if (!finalAudioUrl) {
        throw new Error("Audio URL is required.");
      }

      if (!finalCoverUrl) {
        const storageBase =
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.SUPABASE_URL ||
          "https://your-project.supabase.co";
        finalCoverUrl = `${storageBase}/storage/v1/object/public/album-covers/Olivia%20Rodrigo%20iPad%20screen%204%20u.jpg`;
      }

      setUploadStep("Publishing track to catalog and updating feeds...");

      const res = await fetch("/api/admin/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": currentCode,
        },
        body: JSON.stringify({
          passcode: currentCode,
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim(),
          genre: genre.trim(),
          duration_seconds: durationSeconds,
          release_date: releaseDate,
          audio_url: finalAudioUrl,
          cover_url: finalCoverUrl,
        }),
      });

      let json;
      try {
        json = await res.json();
      } catch {
        const text = await res.text();
        throw new Error(text || "Failed to parse publish response.");
      }

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to publish track.");
      }

      const publishedSong: AuraSong = json.song;

      // Update local storage uploaded list so song shows everywhere immediately
      try {
        const existing = localStorage.getItem("aura_uploaded_songs");
        const list: AuraSong[] = existing ? JSON.parse(existing) : [];
        list.unshift(publishedSong);
        localStorage.setItem("aura_uploaded_songs", JSON.stringify(list));
      } catch (err) {
        console.debug("[Save Uploaded Local]", err);
      }

      setFeedback({
        type: "success",
        message: `"${publishedSong.title}" has been published to your Aura Music catalog!`,
      });

      // Reset form
      setTitle("");
      setAudioFile(null);
      setCoverFile(null);
      setAudioUrl("");
      setCoverUrl("");
      setCoverPreview("");
      setDurationSeconds(180);

      // Play the track immediately so admin can hear it!
      playSong(publishedSong, [publishedSong, ...catalog]);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error publishing song.",
      });
    } finally {
      setIsSubmitting(false);
      setUploadStep("");
    }
  };

  // Delete Track from Catalog
  const handleDeleteTrack = async (songId: string, songTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${songTitle}" from the catalog?`)) {
      return;
    }

    try {
      const currentCode = passcode || sessionStorage.getItem("aura_admin_passcode") || "";
      const res = await fetch(
        `/api/admin/songs?id=${songId}&passcode=${encodeURIComponent(currentCode)}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-passcode": currentCode,
          },
        }
      );

      // Remove from state
      setCatalog((prev) => prev.filter((s) => s.id !== songId));

      // Remove from local storage
      const existing = localStorage.getItem("aura_uploaded_songs");
      if (existing) {
        const list: AuraSong[] = JSON.parse(existing);
        const updated = list.filter((s) => s.id !== songId);
        localStorage.setItem("aura_uploaded_songs", JSON.stringify(updated));
      }
    } catch (err) {
      alert("Failed to delete song.");
    }
  };

  // 1. PASSCODE LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 text-white border border-pink-500/20 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aura-pink to-aura-blossom flex items-center justify-center text-white mx-auto shadow-lg shadow-aura-pink/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Aura Admin Portal
            </h1>
            <p className="text-xs text-slate-400">
              Enter master passcode to upload music & manage catalog
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-aura-pink focus:border-transparent text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {passcodeError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-aura-pink hover:bg-pink-600 text-white font-bold text-sm shadow-lg shadow-aura-pink/40 hover:scale-102 active:scale-98 transition-all"
            >
              Unlock Admin Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white border border-pink-500/20 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-aura-pink to-aura-blossom flex items-center justify-center text-white shadow-md shadow-aura-pink/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Admin Music Studio</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Unlocked
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Upload MP3s and album artwork directly to your Supabase Storage buckets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
          >
            View Live App
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-pink-100 pb-2">
        <button
          onClick={() => setActiveTab("upload")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all",
            activeTab === "upload"
              ? "bg-aura-pink text-white shadow-md shadow-aura-pink/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          )}
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Music</span>
        </button>

        <button
          onClick={() => setActiveTab("manage")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all",
            activeTab === "manage"
              ? "bg-aura-pink text-white shadow-md shadow-aura-pink/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-white"
          )}
        >
          <Music className="w-4 h-4" />
          <span>Manage Catalog ({catalog.length})</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD NEW MUSIC */}
      {activeTab === "upload" && (
        <form
          onSubmit={handlePublish}
          className="p-6 md:p-8 rounded-3xl bg-white border border-pink-100 shadow-md space-y-6"
        >
          {/* Feedback message */}
          {feedback && (
            <div
              className={cn(
                "p-4 rounded-2xl flex items-center gap-3 text-sm font-medium",
                feedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              )}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center justify-between pb-4 border-b border-pink-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Track Files & Artwork
              </h2>
              <p className="text-xs text-slate-500">
                Choose between uploading files from your device or using direct storage URLs
              </p>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  uploadMode === "file"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Upload File (.mp3)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  uploadMode === "url"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Direct URL
              </button>
            </div>
          </div>

          {/* FILE UPLOAD DROPZONES */}
          {uploadMode === "file" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audio File Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Audio File (.mp3 / .wav / .m4a) *
                </label>
                <div className="relative border-2 border-dashed border-pink-200 hover:border-aura-pink rounded-2xl p-6 text-center transition-colors bg-pink-50/20 cursor-pointer group">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a"
                    onChange={handleAudioChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 group-hover:bg-aura-pink/20 flex items-center justify-center text-aura-pink mx-auto transition-colors">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    {audioFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {audioFile.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-mono font-semibold">
                          Detected duration: {formatTime(durationSeconds)} ({durationSeconds}s)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Click or drag MP3 file here
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Duration is automatically detected
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Artwork Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cover Artwork (.jpg / .png / .webp)
                </label>
                <div className="relative border-2 border-dashed border-pink-200 hover:border-aura-pink rounded-2xl p-6 text-center transition-colors bg-pink-50/20 cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    {coverPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-16 h-16 rounded-xl object-cover shadow-md"
                        />
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {coverFile?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-pink-100 group-hover:bg-aura-pink/20 flex items-center justify-center text-aura-pink mx-auto transition-colors">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Click or drag cover artwork
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Recommended: 1000x1000px square
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Audio URL (MP3 stream link) *
                </label>
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://...supabase.co/.../audio-tracks/song.mp3"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://...supabase.co/.../album-covers/cover.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink"
                />
              </div>
            </div>
          )}

          {/* TRACK METADATA INPUTS */}
          <div className="pt-4 border-t border-pink-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Track Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Track Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. good 4 u"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Artist
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Olivia Rodrigo"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Album / Era
                </label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="GUTS / SOUR / Unreleased Vault"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Genre
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Pop Punk / Pop Rock"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Release Date
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none focus:ring-2 focus:ring-aura-pink font-mono"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT ACTION BUTTON */}
          <div className="pt-4 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            {uploadStep ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-aura-pink animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{uploadStep}</span>
              </div>
            ) : <div />}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-aura-pink hover:bg-pink-600 text-white font-bold text-sm shadow-xl shadow-aura-pink/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none shrink-0"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading & Publishing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Publish Track</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MANAGE CATALOG */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Total tracks in catalog: <strong className="text-slate-900">{catalog.length}</strong>
            </span>
            <button
              onClick={loadAdminCatalog}
              className="inline-flex items-center gap-1 text-aura-pink font-semibold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-pink-100 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-pink-100">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">Track</th>
                    <th className="p-3.5">Album</th>
                    <th className="p-3.5">Genre</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {catalog.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isCurrentPlaying = isCurrent && isPlaying;

                    return (
                      <tr key={song.id} className="hover:bg-pink-50/40 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={song.cover_url}
                              alt={song.title}
                              className="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {song.title}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {song.album || "—"}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {song.genre || "—"}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {formatTime(song.duration_seconds)}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              if (isCurrent) {
                                togglePlay();
                              } else {
                                playSong(song, catalog);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-pink-50 hover:bg-aura-pink hover:text-white text-aura-pink transition-colors"
                            title="Preview playback"
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(song.id, song.title)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 transition-colors"
                            title="Delete track"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
