import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import AppShell from "@/components/AppShell";
import AdminClient from "@/components/AdminClient";
import type { School } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface SchoolRow extends School {
  student_count: number;
  revenue: number;
}

export default async function AdminPage() {
  const ctx = await getAppContext();
  if (!ctx.isSuperAdmin) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: schools } = await admin
    .from("schools")
    .select("*")
    .order("created_at", { ascending: false });

  const schoolRows = (schools ?? []) as School[];
  const rows: SchoolRow[] = [];
  for (const s of schoolRows) {
    const [{ count }, { data: payments }] = await Promise.all([
      admin.from("students").select("*", { count: "exact", head: true }).eq("school_id", s.id),
      admin.from("payments").select("amount").eq("school_id", s.id),
    ]);
    rows.push({
      ...s,
      student_count: count ?? 0,
      revenue: (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0),
    });
  }

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalStudents = rows.reduce((sum, r) => sum + r.student_count, 0);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <AdminClient
        schools={rows}
        totalSchools={rows.length}
        totalStudents={totalStudents}
        totalRevenue={totalRevenue}
      />
    </AppShell>
  );
}
