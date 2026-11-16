import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerSchool, isSuperAdminUser } from "@/lib/server-auth";
import { getSuspension, type SuspensionReason } from "@/lib/school";
import type { School } from "@/lib/types";

export interface AppContext {
  userId: string;
  userEmail: string;
  isSuperAdmin: boolean;
  school: School | null;
  suspended: boolean;
  suspensionReason: SuspensionReason;
}

/**
 * Shared loader for every authenticated page: session -> profile role ->
 * owner school -> suspension state. Redirects to /login when signed out.
 */
export async function getAppContext(): Promise<AppContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [admin, school] = await Promise.all([
    isSuperAdminUser(user.id),
    getOwnerSchool(user.id),
  ]);

  const suspension = school
    ? getSuspension(school)
    : { suspended: false, reason: "active" as SuspensionReason };

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    isSuperAdmin: admin,
    school,
    suspended: suspension.suspended,
    suspensionReason: suspension.reason,
  };
}
