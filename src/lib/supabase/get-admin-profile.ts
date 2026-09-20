import { createClient } from "@/lib/supabase/server";
import type { AdminProfile } from "@/types/database";

/**
 * Returns the currently signed-in admin's profile, or null if there's no
 * session, or the signed-in Supabase Auth user has no matching row in
 * admin_profiles (e.g. an Auth user that was never linked as an admin).
 *
 * This is a defense-in-depth check on top of the middleware: the
 * middleware only confirms *some* Supabase Auth session exists, while
 * this confirms that session actually belongs to an admin.
 */
export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return profile ?? null;
}
