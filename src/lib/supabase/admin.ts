import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — SERVER ONLY. Bypasses Row Level Security, so it
 * must only ever be used inside API routes / Server Components after the
 * caller's identity and role have been verified. Never import this file
 * from a client component, and never expose SUPABASE_SERVICE_ROLE_KEY
 * to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
