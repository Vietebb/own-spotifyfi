import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      song_id,
      duration_listened_ms = 0,
      user_id = null,
      event_type = "EndSong",
    } = body;

    if (!song_id) {
      return NextResponse.json(
        { error: "song_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated via session if user_id is not passed
    let effectiveUserId = user_id;
    if (!effectiveUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      effectiveUserId = user?.id || null;
    }

    // Only attempt DB insertion if user is present (RLS requires user_id)
    if (effectiveUserId) {
      const { error } = await supabase.from("aura_listening_events").insert({
        song_id,
        user_id: effectiveUserId,
        event_type,
        duration_listened_ms,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.warn("[Aura Telemetry Ingestion] DB insert warning:", error.message);
      }
    }

    return NextResponse.json({
      success: true,
      event: event_type,
      song_id,
      recorded_at: new Date().toISOString(),
      flow: "Flow B: Asynchronous EndSong Event Telemetry (Non-Blocking)",
    });
  } catch (err: unknown) {
    console.error("[Aura Telemetry] Non-blocking worker error:", err);
    // Return 200 with soft error status so client playback is NEVER affected
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown telemetry error",
    });
  }
}
