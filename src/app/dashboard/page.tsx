import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { addDays, studentBalance, todayString } from "@/lib/school";
import AppShell from "@/components/AppShell";
import DashboardClient from "@/components/DashboardClient";
import type { Exam, Lesson, Payment, Student } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getAppContext();
  const supabase = createClient();

  if (!ctx.school) {
    return (
      <AppShell
        school={null}
        isSuperAdmin={ctx.isSuperAdmin}
        suspended={false}
        suspensionReason="active"
      >
        <div className="card text-center">
          <h1 className="text-xl font-bold">Aucune école associée à ce compte</h1>
          <p className="mt-2 text-sm text-stone-600">
            Créez votre auto-école depuis la page d'inscription, ou
            contactez PermiBook.
          </p>
        </div>
      </AppShell>
    );
  }

  const schoolId = ctx.school.id;
  const today = todayString();
  const in14 = addDays(today, 14);
  const monthPrefix = today.slice(0, 7);

  const [
    { data: lessons },
    { data: exams },
    { data: students },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("*, students(full_name, phone), instructors(full_name), vehicles(brand_model, plate)")
      .eq("school_id", schoolId)
      .eq("date", today)
      .neq("status", "cancelled")
      .order("time", { ascending: true }),
    supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .gte("date", today)
      .lte("date", in14)
      .order("date", { ascending: true }),
    supabase
      .from("students")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("amount, date")
      .eq("school_id", schoolId),
  ]);

  const lessonRows = (lessons ?? []) as unknown as Lesson[];
  const examRows = (exams ?? []) as unknown as Exam[];
  const studentRows = (students ?? []) as unknown as Student[];
  const paymentRows = (payments ?? []) as unknown as Payment[];

  const revenueThisMonth = paymentRows
    .filter((p) => p.date.slice(0, 7) === monthPrefix)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const latePayers = studentRows
    .filter((s) => studentBalance(s.price_total, s.paid_amount) > 0)
    .sort(
      (a, b) =>
        studentBalance(b.price_total, b.paid_amount) -
        studentBalance(a.price_total, a.paid_amount),
    )
    .slice(0, 5);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <DashboardClient
        school={ctx.school}
        todayLessons={lessonRows}
        upcomingExams={examRows}
        latePayers={latePayers}
        revenueThisMonth={revenueThisMonth}
        studentCount={studentRows.length}
        todayDate={today}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
