import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** PATCH /api/owner/school — update the caller's school profile. */
export async function PATCH(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const key of ["name", "city", "phone", "whatsapp"]) {
    if (typeof body[key] === "string" && body[key].trim()) {
      patch[key] = body[key].trim();
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("schools")
    .update(patch)
    .eq("id", school.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ school: data });
}
