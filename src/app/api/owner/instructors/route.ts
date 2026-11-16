import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** POST /api/owner/instructors — add a moniteur to the caller's school. */
export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const { full_name, phone, categories } = body;
  if (!full_name || !phone) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const cats = Array.isArray(categories)
    ? categories.filter((c: unknown) => ["B", "A", "C"].includes(c as string))
    : ["B"];
  if (cats.length === 0) {
    return NextResponse.json({ error: "at least one category required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("instructors")
    .insert({ school_id: school.id, full_name, phone, categories: cats })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ instructor: data }, { status: 201 });
}
