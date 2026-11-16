import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/** POST /api/owner/vehicles — add a car to the caller's school. */
export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const { brand_model, plate, assurance_expiry, visite_technique_expiry } = body;
  if (!brand_model || !plate) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vehicles")
    .insert({
      school_id: school.id,
      brand_model,
      plate,
      assurance_expiry: assurance_expiry || null,
      visite_technique_expiry: visite_technique_expiry || null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ vehicle: data }, { status: 201 });
}
