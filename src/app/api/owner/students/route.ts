import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** POST /api/owner/students — enrol a student in the caller's school. */
export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const { full_name, phone, cin, category, price_total, instructor_id } = body;
  if (!full_name || !phone || !category || price_total === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (!["B", "A", "C"].includes(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .insert({
      school_id: school.id,
      full_name,
      phone,
      cin: cin ?? "",
      category,
      price_total: Number(price_total),
      paid_amount: 0,
      status: "code",
      instructor_id: instructor_id || null,
      documents: { cin: false, photos: false, visite_medicale: false },
      code_hours_done: 0,
      driving_hours_done: 0,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ student: data }, { status: 201 });
}
