import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** PATCH /api/owner/settings — update formation prices + working hours. */
export async function PATCH(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.prices && typeof body.prices === "object") {
    const prices: Record<string, number> = {};
    for (const c of ["B", "A", "C"]) {
      const v = Number(body.prices[c]);
      if (Number.isFinite(v) && v >= 0) prices[c] = v;
    }
    if (Object.keys(prices).length > 0) patch.prices = prices;
  }
  if (body.working_hours && typeof body.working_hours === "object") {
    patch.working_hours = body.working_hours;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("settings")
    .upsert({ school_id: school.id, ...patch })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
