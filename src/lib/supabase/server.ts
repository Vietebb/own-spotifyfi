import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Aura Music Server Supabase Client
 * Safely reads from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Handles cookie hydration for Server Components, Server Actions, and Route Handlers.
 */
const DEFAULT_PUBLIC_SUPABASE_URL = "https://xgzhbythxzyqsbeqepgv.supabase.co";
const DEFAULT_PUBLIC_ANON_KEY = "sb_publishable_Plya0Va8Ei_9-MH8av2gQQ_JfMb75Hq";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_PUBLIC_ANON_KEY;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
