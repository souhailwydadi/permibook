import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import AppShell from "@/components/AppShell";
import TeamClient from "@/components/TeamClient";
import type { Instructor, Vehicle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await getAppContext();
  const supabase = createClient();

  if (!ctx.school) {
    return (
      <AppShell school={null} isSuperAdmin={ctx.isSuperAdmin} suspended={false} suspensionReason="active">
        <div className="card text-center">
          <h1 className="text-xl font-bold">Aucune école associée à ce compte</h1>
        </div>
      </AppShell>
    );
  }

  const schoolId = ctx.school.id;
  const [{ data: instructors }, { data: vehicles }] = await Promise.all([
    supabase.from("instructors").select("*").eq("school_id", schoolId).order("full_name"),
    supabase.from("vehicles").select("*").eq("school_id", schoolId).order("brand_model"),
  ]);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <TeamClient
        instructors={(instructors ?? []) as Instructor[]}
        vehicles={(vehicles ?? []) as Vehicle[]}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
