import { createBrowserClient } from "@supabase/ssr";

/**
 * Aura Music Browser Supabase Client
 * Safely reads from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Falls back to public read-only project configuration for instant out-of-the-box streaming.
 */
const DEFAULT_PUBLIC_SUPABASE_URL = "https://xgzhbythxzyqsbeqepgv.supabase.co";
const DEFAULT_PUBLIC_ANON_KEY = "sb_publishable_Plya0Va8Ei_9-MH8av2gQQ_JfMb75Hq";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_PUBLIC_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
