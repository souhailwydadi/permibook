import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_FORMATION_PRICES,
  DEFAULT_WORKING_HOURS,
  slugify,
} from "@/lib/school";

/**
 * POST /api/auth/signup — create an owner account + their school.
 * Server-side only (uses the service-role client): creates the Supabase
 * Auth user with email already confirmed, then the profile, the school
 * (14-day trial) and default settings. The client then signs in with
 * email/password and lands on the dashboard.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password, school_name, city, phone, whatsapp } = body ?? {};
  if (!email || !password || !school_name || !city || !phone) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "password too short (min 6 characters)" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: school_name },
    });
  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "could not create user" },
      { status: 400 },
    );
  }
  const userId = created.user.id;

  try {
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      email,
      role: "owner",
    });
    if (profileError) throw new Error(profileError.message);

    const slug = slugify(school_name);
    const trialEndsAt = new Date(Date.now() + 14 * 86400000).toISOString();
    const { data: school, error: schoolError } = await admin
      .from("schools")
      .insert({
        slug,
        name: school_name,
        city,
        phone,
        whatsapp: whatsapp ?? phone,
        owner_id: userId,
        plan: "trial",
        trial_ends_at: trialEndsAt,
        payment_status: "trial",
        paid_until: null,
        status: "active",
      })
      .select("id, slug")
      .single();
    if (schoolError || !school) throw new Error(schoolError?.message);

    const { error: profileSchoolError } = await admin
      .from("profiles")
      .update({ school_id: school.id })
      .eq("id", userId);
    if (profileSchoolError) throw new Error(profileSchoolError.message);

    const { error: settingsError } = await admin.from("settings").insert({
      school_id: school.id,
      working_hours: DEFAULT_WORKING_HOURS,
      language: "fr",
      prices: DEFAULT_FORMATION_PRICES,
    });
    if (settingsError) throw new Error(settingsError.message);

    return NextResponse.json({ ok: true, slug: school.slug }, { status: 201 });
  } catch (err) {
    // Roll back the auth user so a failed signup can be retried cleanly.
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "signup failed" },
      { status: 500 },
    );
  }
}
