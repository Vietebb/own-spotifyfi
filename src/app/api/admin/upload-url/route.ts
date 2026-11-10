import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: Request, body?: { passcode?: string }): boolean {
  const configuredPasscode = process.env.ADMIN_PASSCODE;
  if (!configuredPasscode) {
    console.warn(
      "[Admin Security] ADMIN_PASSCODE environment variable is not configured."
    );
    return false;
  }

  const headerCode = request.headers.get("x-admin-passcode");
  if (headerCode === configuredPasscode) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("passcode") === configuredPasscode) return true;

  if (body?.passcode === configuredPasscode) return true;

  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isAuthorized(request, body)) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid admin passcode." },
        { status: 401 }
      );
    }

    const { audioFilename, coverFilename } = body;
    const supabase = createAdminClient();

    let audioData = null;
    let coverData = null;

    // 1. Generate signed upload URL for Audio File
    if (audioFilename) {
      const sanitizedAudio = `${Date.now()}_${audioFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { data, error } = await supabase.storage
        .from("audio-tracks")
        .createSignedUploadUrl(sanitizedAudio, { upsert: true });

      if (error) {
        console.error("[Create Signed URL audio-tracks Error]:", error.message);
        return NextResponse.json(
          { error: `Storage error (audio-tracks): ${error.message}` },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("audio-tracks")
        .getPublicUrl(sanitizedAudio);

      audioData = {
        signedUrl: data.signedUrl,
        path: data.path,
        token: data.token,
        publicUrl: publicUrlData.publicUrl,
      };
    }

    // 2. Generate signed upload URL for Cover Artwork
    if (coverFilename) {
      const sanitizedCover = `${Date.now()}_${coverFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { data, error } = await supabase.storage
        .from("album-covers")
        .createSignedUploadUrl(sanitizedCover, { upsert: true });

      if (error) {
        console.error("[Create Signed URL album-covers Error]:", error.message);
        return NextResponse.json(
          { error: `Storage error (album-covers): ${error.message}` },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("album-covers")
        .getPublicUrl(sanitizedCover);

      coverData = {
        signedUrl: data.signedUrl,
        path: data.path,
        token: data.token,
        publicUrl: publicUrlData.publicUrl,
      };
    }

    return NextResponse.json({
      success: true,
      audio: audioData,
      cover: coverData,
    });
  } catch (err: unknown) {
    console.error("[Admin Upload-URL POST Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate signed upload URL." },
      { status: 500 }
    );
  }
}
