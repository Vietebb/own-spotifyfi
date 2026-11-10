import { createClient } from "@supabase/supabase-js";

/**
 * Aura Music Admin Supabase Client
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security.
 * Exclusively for server-side API routes and administrative tasks.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_SECRET ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[Aura Admin Security] Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_SECRET). Please verify your environment configuration."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
