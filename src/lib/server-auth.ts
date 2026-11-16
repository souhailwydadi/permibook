import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { School } from "./types";

/** The currently logged-in user (from session cookies), or null. */
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/** The school owned by a user id (via the service-role client). */
export async function getOwnerSchool(userId: string): Promise<School | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("schools")
    .select("*")
    .eq("owner_id", userId)
    .single();
  return (data as School | null) ?? null;
}

/** True when the user id belongs to a super-admin profile. */
export async function isSuperAdminUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return (data as { role?: string } | null)?.role === "super_admin";
}
