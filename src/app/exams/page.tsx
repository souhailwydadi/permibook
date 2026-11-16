import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import AppShell from "@/components/AppShell";
import ExamsClient from "@/components/ExamsClient";
import type { Exam, Student } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
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
  const [{ data: exams }, { data: students }] = await Promise.all([
    supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .order("date", { ascending: true }),
    supabase.from("students").select("*").eq("school_id", schoolId).order("full_name"),
  ]);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <ExamsClient
        exams={(exams ?? []) as Exam[]}
        students={(students ?? []) as Student[]}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
