import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** DELETE /api/owner/vehicles/[id] — remove a car from the caller's school. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const admin = createAdminClient();
  const { error } = await admin
    .from("vehicles")
    .delete()
    .eq("id", params.id)
    .eq("school_id", school.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
