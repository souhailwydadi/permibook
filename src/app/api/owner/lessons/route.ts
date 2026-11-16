import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/**
 * POST /api/owner/lessons — create a lesson.
 * Double-booking is blocked: the same instructor or the same vehicle
 * cannot have two non-cancelled lessons at the same date + time
 * (also enforced by unique DB indexes).
 */
export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const { student_id, instructor_id, vehicle_id, type, date, time, duration_min } = body;
  if (!student_id || !instructor_id || !type || !date || !time) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (!["code", "conduite"].includes(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }
  if (type === "conduite" && !vehicle_id) {
    return NextResponse.json({ error: "vehicle required for driving lessons" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: clash } = await admin
    .from("lessons")
    .select("id")
    .eq("school_id", school.id)
    .eq("date", date)
    .eq("time", time)
    .neq("status", "cancelled")
    .or(`instructor_id.eq.${instructor_id}${vehicle_id ? `,vehicle_id.eq.${vehicle_id}` : ""}`)
    .limit(1);
  if (clash && clash.length > 0) {
    return NextResponse.json({ error: "double_booking" }, { status: 409 });
  }

  const { data, error } = await admin
    .from("lessons")
    .insert({
      school_id: school.id,
      student_id,
      instructor_id,
      vehicle_id: vehicle_id || null,
      type,
      date,
      time,
      duration_min: Number(duration_min) || 60,
      status: "scheduled",
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "double_booking" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lesson: data }, { status: 201 });
}
