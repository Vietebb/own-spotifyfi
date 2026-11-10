import { createBrowserClient } from "@supabase/ssr";

/**
 * Aura Music Browser Supabase Client
 * Safely reads from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Designed for Client Components and browser-side hooks.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Aura Security] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure Vercel or .env.local to enable real-time cloud catalog sync."
      );
    }
  }

  return createBrowserClient(
    supabaseUrl || "https://your-project.supabase.co",
    supabaseAnonKey || "your-anon-key"
  );
}
