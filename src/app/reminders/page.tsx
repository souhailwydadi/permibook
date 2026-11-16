import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { addDays, todayString } from "@/lib/school";
import AppShell from "@/components/AppShell";
import RemindersClient from "@/components/RemindersClient";
import type { Lesson, Student } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
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
  const tomorrow = addDays(todayString(), 1);
  const [{ data: lessons }, { data: students }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*, students(full_name, phone), instructors(full_name), vehicles(brand_model)")
      .eq("school_id", schoolId)
      .eq("date", tomorrow)
      .eq("status", "scheduled")
      .order("time", { ascending: true }),
    supabase.from("students").select("*").eq("school_id", schoolId).order("full_name"),
  ]);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <RemindersClient
        schoolName={ctx.school.name}
        tomorrowLessons={(lessons ?? []) as unknown as Lesson[]}
        students={(students ?? []) as Student[]}
        tomorrowDate={tomorrow}
      />
    </AppShell>
  );
}
