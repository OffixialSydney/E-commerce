import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Privileged Supabase client using the SERVICE ROLE key.
 * BYPASSES Row Level Security entirely.
 *
 * The `server-only` import above makes the build fail if this file
 * is ever accidentally imported from a Client Component.
 *
 * Use this ONLY inside:
 *   - API routes (src/app/api/**)
 *   - Server Actions
 * Never return the raw client to the browser. Never log the key.
 *
 * Legitimate uses: creating orders, recording payments, uploading
 * payment proofs, reserving/adjusting stock — anything that must be
 * trusted regardless of what a guest customer's browser claims.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role configuration. Check SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
