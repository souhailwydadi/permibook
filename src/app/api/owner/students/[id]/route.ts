import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** PATCH /api/owner/students/[id] — update a student of the caller's school. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.status && ["code", "conduite", "exam", "licence"].includes(body.status)) {
    patch.status = body.status;
  }
  if ("instructor_id" in body) patch.instructor_id = body.instructor_id || null;
  if (typeof body.code_hours_done === "number") {
    patch.code_hours_done = Math.max(0, body.code_hours_done);
  }
  if (typeof body.driving_hours_done === "number") {
    patch.driving_hours_done = Math.max(0, body.driving_hours_done);
  }
  if (body.documents && typeof body.documents === "object") {
    patch.documents = {
      cin: Boolean(body.documents.cin),
      photos: Boolean(body.documents.photos),
      visite_medicale: Boolean(body.documents.visite_medicale),
    };
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .update(patch)
    .eq("id", params.id)
    .eq("school_id", school.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ student: data });
}
