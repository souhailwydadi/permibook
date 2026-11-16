import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** DELETE /api/owner/instructors/[id] — remove a moniteur (lessons keep history via null). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const admin = createAdminClient();
  const { error } = await admin
    .from("instructors")
    .delete()
    .eq("id", params.id)
    .eq("school_id", school.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
