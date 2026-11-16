import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** PATCH /api/owner/exams/[id] — replace the candidates list (+ results). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.candidates)) {
    return NextResponse.json({ error: "candidates must be an array" }, { status: 400 });
  }
  const candidates = body.candidates
    .filter(
      (c: { student_id?: unknown; result?: unknown }) =>
        typeof c.student_id === "string" &&
        ["pending", "passe", "rate", "ajourne"].includes(c.result as string),
    )
    .map((c: { student_id: string; result: string }) => ({
      student_id: c.student_id,
      result: c.result,
    }));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("exams")
    .update({ candidates })
    .eq("id", params.id)
    .eq("school_id", school.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ exam: data });
}
