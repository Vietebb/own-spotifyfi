/**
 * Aura Music Telemetry Engine & Local Store
 *
 * Tracks individual listening telemetry in browser localStorage AND
 * dispatches asynchronous non-blocking telemetry beacons to /api/telemetry
 * for master collective aggregation.
 */

export interface LocalListeningTelemetry {
  totalSecondsStreamed: number;
  totalPlaysCount: number;
  songPlays: Record<string, number>;
  songSeconds: Record<string, number>;
  recentHistory: Array<{
    songId: string;
    durationSeconds: number;
    playedAt: string;
  }>;
}

const STORAGE_KEY = "aura_local_telemetry";

export function getLocalTelemetry(): LocalListeningTelemetry {
  if (typeof window === "undefined") {
    return {
      totalSecondsStreamed: 0,
      totalPlaysCount: 0,
      songPlays: {},
      songSeconds: {},
      recentHistory: [],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.debug("[Aura Telemetry Storage Error]:", err);
  }

  return {
    totalSecondsStreamed: 0,
    totalPlaysCount: 0,
    songPlays: {},
    songSeconds: {},
    recentHistory: [],
  };
}

export function saveLocalTelemetry(data: LocalListeningTelemetry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.debug("[Aura Telemetry Save Error]:", err);
  }
}

export interface LogEndSongParams {
  songId: string;
  durationMs: number;
  userId?: string | null;
}

export function logEndSongEvent({
  songId,
  durationMs,
  userId = null,
}: LogEndSongParams): void {
  if (!songId || typeof window === "undefined") {
    return;
  }

  const durationSeconds = Math.max(0, Math.round(durationMs / 1000));

  // 1. Update Local Storage Telemetry Store
  try {
    const local = getLocalTelemetry();
    local.totalSecondsStreamed += durationSeconds;
    local.totalPlaysCount += 1;
    local.songPlays[songId] = (local.songPlays[songId] || 0) + 1;
    local.songSeconds[songId] = (local.songSeconds[songId] || 0) + durationSeconds;

    local.recentHistory.unshift({
      songId,
      durationSeconds,
      playedAt: new Date().toISOString(),
    });

    // Keep history capped at recent 50
    if (local.recentHistory.length > 50) {
      local.recentHistory = local.recentHistory.slice(0, 50);
    }

    saveLocalTelemetry(local);
  } catch (storageErr) {
    console.debug("[Aura Local Telemetry Update Note]:", storageErr);
  }

  // 2. Dispatch Non-blocking Global Beacon to /api/telemetry
  const payload = {
    event: "EndSong",
    song_id: songId,
    duration_listened_ms: Math.max(0, Math.round(durationMs)),
    user_id: userId || "00000000-0000-0000-0000-000000000000",
    timestamp: new Date().toISOString(),
    client_metadata: {
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      platform: navigator.platform,
    },
  };

  try {
    const serializedPayload = JSON.stringify(payload);

    // Primary: navigator.sendBeacon (Non-blocking browser API)
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([serializedPayload], {
        type: "application/json",
      });
      const enqueued = navigator.sendBeacon("/api/telemetry", blob);
      if (enqueued) return;
    }

    // Secondary: Non-blocking fetch with keepalive flag
    fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: serializedPayload,
      keepalive: true,
    }).catch((networkErr) => {
      console.debug("[Aura Telemetry Fail-Safe] Discarded:", networkErr);
    });
  } catch (beaconErr) {
    console.debug("[Aura Telemetry Non-Blocking]", beaconErr);
  }
}
