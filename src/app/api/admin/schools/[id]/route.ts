import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser, isSuperAdminUser } from "@/lib/server-auth";

/**
 * PATCH /api/admin/schools/[id] — super-admin only.
 * Actions: change plan (trial / 99 / 199), extend the trial
 * (+7 / +30 days), suspend / reactivate (OFF switch), mark as paid
 * (reactivates instantly for 30 days).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await isSuperAdminUser(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: school, error: fetchError } = await admin
    .from("schools")
    .select("*")
    .eq("id", params.id)
    .single();
  if (fetchError || !school) {
    return NextResponse.json({ error: "school not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.plan && ["trial", "99", "199"].includes(body.plan)) {
    patch.plan = body.plan;
    if (body.plan === "trial") patch.payment_status = "trial";
  }

  if (typeof body.extend_trial_days === "number" && body.extend_trial_days > 0) {
    const base = school.trial_ends_at
      ? new Date(school.trial_ends_at)
      : new Date(school.created_at);
    const start = base.getTime() > Date.now() ? base : new Date();
    patch.trial_ends_at = new Date(
      start.getTime() + body.extend_trial_days * 86400000,
    ).toISOString();
    patch.plan = "trial";
    patch.payment_status = "trial";
  }

  if (body.status && ["active", "suspended"].includes(body.status)) {
    patch.status = body.status;
  }

  if (body.mark_paid === true) {
    patch.payment_status = "paid";
    patch.paid_until = new Date(Date.now() + 30 * 86400000).toISOString();
    patch.status = "active";
    if (school.plan === "trial") patch.plan = "99";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("schools")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ school: data });
}
