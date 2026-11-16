import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** POST /api/owner/exams — create an exam (code or conduite). */
export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const { type, date, location } = body;
  if (!type || !date || !location) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (!["code", "conduite"].includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("exams")
    .insert({
      school_id: school.id,
      type,
      date,
      location,
      candidates: [],
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ exam: data }, { status: 201 });
}
