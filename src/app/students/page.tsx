import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import AppShell from "@/components/AppShell";
import StudentsClient from "@/components/StudentsClient";
import type { Instructor, Payment, Settings, Student } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
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
  const [
    { data: students },
    { data: instructors },
    { data: settings },
    { data: payments },
  ] = await Promise.all([
    supabase.from("students").select("*").eq("school_id", schoolId).order("full_name"),
    supabase.from("instructors").select("*").eq("school_id", schoolId).order("full_name"),
    supabase.from("settings").select("*").eq("school_id", schoolId).single(),
    supabase
      .from("payments")
      .select("*, students(full_name)")
      .eq("school_id", schoolId)
      .order("date", { ascending: false })
      .limit(200),
  ]);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <StudentsClient
        students={(students ?? []) as Student[]}
        instructors={(instructors ?? []) as Instructor[]}
        settings={(settings ?? null) as Settings | null}
        payments={(payments ?? []) as unknown as Payment[]}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
