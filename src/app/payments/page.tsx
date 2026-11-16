import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import AppShell from "@/components/AppShell";
import PaymentsClient from "@/components/PaymentsClient";
import type { Payment, Student } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
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
  const [{ data: payments }, { data: students }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, students(full_name)")
      .eq("school_id", schoolId)
      .order("date", { ascending: false })
      .limit(200),
    supabase.from("students").select("*").eq("school_id", schoolId).order("full_name"),
  ]);

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <PaymentsClient
        payments={(payments ?? []) as unknown as Payment[]}
        students={(students ?? []) as Student[]}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
