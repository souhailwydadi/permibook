import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_FORMATION_PRICES,
  DEFAULT_WORKING_HOURS,
  getSuspension,
  slugify,
} from "@/lib/school";
import type { School } from "@/lib/types";

/**
 * Normalise a Moroccan phone number so 06.., +2126.., 2126.. and
 * 06 12 34 56 78 all compare equal. Used to enforce one school per
 * phone number (anti trial-abuse).
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s.()\-]/g, "");
  const noPlus = digits.startsWith("+") ? digits.slice(1) : digits;
  if (noPlus.startsWith("212")) return "0" + noPlus.slice(3);
  return noPlus;
}

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

  // Anti-abuse: one school per phone number. Without this, a school whose
  // trial expired (or was switched OFF by the super-admin) could simply
  // re-register with a new email and get a fresh 14-day trial. The phone
  // is required at signup and is much harder to rotate than an email.
  // Checked BEFORE createUser so a rejected attempt creates nothing.
  const normalizedPhone = normalizePhone(phone);
  const { data: existingSchools } = await admin
    .from("schools")
    .select(
      "id, name, status, plan, trial_ends_at, payment_status, paid_until, created_at, phone, whatsapp",
    );
  const clash = (existingSchools ?? []).find((s) => {
    const phones = [s.phone, s.whatsapp].filter(Boolean) as string[];
    return phones.some((p) => normalizePhone(p) === normalizedPhone);
  });
  if (clash) {
    const suspended = getSuspension(clash as unknown as School).suspended;
    return NextResponse.json(
      {
        error: suspended
          ? "Ce numéro est déjà associé à une auto-école suspendue. Contactez Souhail pour réactiver votre compte."
          : "Ce numéro est déjà enregistré. Connectez-vous avec votre compte existant.",
      },
      { status: 400 },
    );
  }

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
