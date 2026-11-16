import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/api-guard";

/**
 * POST /api/owner/payments — record an installment tranche for a student.
 * Inserts the payment (with a numbered receipt) and increments the
 * student's paid_amount in the same request.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { school } = ctx;

  const body = await req.json().catch(() => ({}));
  const { student_id, amount, method, date, note } = body;
  if (!student_id || amount === undefined || !method || !date) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }
  if (!["cash", "transfer", "cheque"].includes(method)) {
    return NextResponse.json({ error: "invalid method" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, paid_amount")
    .eq("id", student_id)
    .eq("school_id", school.id)
    .single();
  if (studentError || !student) {
    return NextResponse.json({ error: "student not found" }, { status: 404 });
  }

  const { count } = await admin
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("school_id", school.id);
  const receiptNo = `RC-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      school_id: school.id,
      student_id,
      amount: value,
      method,
      receipt_no: receiptNo,
      date,
      note: note ?? "",
    })
    .select()
    .single();
  if (paymentError || !payment) {
    return NextResponse.json(
      { error: paymentError?.message ?? "could not record payment" },
      { status: 500 },
    );
  }

  const { error: updateError } = await admin
    .from("students")
    .update({ paid_amount: Number(student.paid_amount) + value })
    .eq("id", student_id)
    .eq("school_id", school.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ payment }, { status: 201 });
}
