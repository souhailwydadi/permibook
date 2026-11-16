import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { addDays, toDateString, todayString } from "@/lib/school";
import AppShell from "@/components/AppShell";
import PlanningClient from "@/components/PlanningClient";
import type { Instructor, Lesson, Student, Vehicle } from "@/lib/types";

export const dynamic = "force-dynamic";

function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
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

  const weekStart = mondayOf(searchParams.week ?? todayString());
  const weekEnd = addDays(weekStart, 6);

  const schoolId = ctx.school.id;
  const [
    { data: lessons },
    { data: students },
    { data: instructors },
    { data: vehicles },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("*, students(full_name, phone), instructors(full_name), vehicles(brand_model, plate)")
      .eq("school_id", schoolId)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true })
      .order("time", { ascending: true }),
    supabase.from("students").select("*").eq("school_id", schoolId).order("full_name"),
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
      <PlanningClient
        lessons={(lessons ?? []) as unknown as Lesson[]}
        students={(students ?? []) as Student[]}
        instructors={(instructors ?? []) as Instructor[]}
        vehicles={(vehicles ?? []) as Vehicle[]}
        weekStart={weekStart}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
