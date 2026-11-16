import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** PATCH /api/owner/lessons/[id] — mark a lesson done / absent / cancelled. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  if (!body.status || !["scheduled", "done", "absent", "cancelled"].includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lessons")
    .update({ status: body.status })
    .eq("id", params.id)
    .eq("school_id", school.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lesson: data });
}
