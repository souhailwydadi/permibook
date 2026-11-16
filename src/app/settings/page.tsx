import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import AppShell from "@/components/AppShell";
import SettingsClient from "@/components/SettingsClient";
import type { School, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("school_id", ctx.school.id)
    .single();

  return (
    <AppShell
      school={ctx.school}
      isSuperAdmin={ctx.isSuperAdmin}
      suspended={ctx.suspended}
      suspensionReason={ctx.suspensionReason}
    >
      <SettingsClient
        school={ctx.school as School}
        settings={(settings ?? null) as Settings | null}
        userEmail={ctx.userEmail}
        suspended={ctx.suspended}
      />
    </AppShell>
  );
}
