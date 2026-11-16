"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PAYMENT_METHOD_LABELS,
  formatMAD,
  studentBalance,
  todayString,
} from "@/lib/school";
import type { Payment, PaymentMethod, Student } from "@/lib/types";

export default function PaymentsClient({
  payments,
  students,
  suspended,
}: {
  payments: Payment[];
  students: Student[];
  suspended: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState("");

  const selected = students.find((s) => s.id === studentId) ?? null;
  const monthPrefix = todayString().slice(0, 7);
  const monthTotal = payments
    .filter((p) => p.date.slice(0, 7) === monthPrefix)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const monthCash = payments
    .filter((p) => p.date.slice(0, 7) === monthPrefix && p.method === "cash")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const monthTransfer = payments
    .filter((p) => p.date.slice(0, 7) === monthPrefix && p.method === "transfer")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const latePayers = students
    .filter((s) => studentBalance(s.price_total, s.paid_amount) > 0)
    .sort(
      (a, b) =>
        studentBalance(b.price_total, b.paid_amount) -
        studentBalance(a.price_total, a.paid_amount),
    );

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLastReceipt(null);
    setBusy(true);
    const res = await fetch("/api/owner/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        amount,
        method,
        date,
        note,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Impossible d'enregistrer le paiement.");
      return;
    }
    setLastReceipt(data.payment?.receipt_no ?? null);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Paiements</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Encaissé ce mois</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-700">{formatMAD(monthTotal)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Espèces ce mois</p>
          <p className="mt-1 text-2xl font-extrabold">{formatMAD(monthCash)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Virements ce mois</p>
          <p className="mt-1 text-2xl font-extrabold">{formatMAD(monthTransfer)}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Encaisser une tranche</h2>
        <form onSubmit={recordPayment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Élève</label>
            <select className="input" required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Choisir —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — reste {formatMAD(studentBalance(s.price_total, s.paid_amount))}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Montant (DH)</label>
            <input className="input" type="number" min={1} required value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">Moyen de paiement</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(["cash", "transfer", "cheque"] as const).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Note (optionnel)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tranche 2, acompte…" />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={busy || suspended || !selected}>
              {suspended ? "École suspendue" : busy ? "Enregistrement…" : "Encaisser"}
            </button>
          </div>
        </form>
        {selected && (
          <p className="mt-2 text-sm text-stone-600">
            Solde de {selected.full_name} : {formatMAD(selected.paid_amount)} payés sur{" "}
            {formatMAD(selected.price_total)} — reste {formatMAD(studentBalance(selected.price_total, selected.paid_amount))}.
          </p>
        )}
        {lastReceipt && (
          <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
            ✓ Paiement enregistré — reçu n° {lastReceipt}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Derniers paiements</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-stone-500">Aucun paiement enregistré.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {payments.slice(0, 15).map((p) => (
                <li key={p.id} className="flex justify-between gap-2 rounded-lg border border-stone-200 px-3 py-1.5">
                  <span>
                    {p.date} · {p.receipt_no} · {p.students?.full_name ?? "—"} ·{" "}
                    {PAYMENT_METHOD_LABELS[p.method]}
                    {p.note ? ` · ${p.note}` : ""}
                  </span>
                  <span className="font-bold">{formatMAD(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">En retard de paiement ({latePayers.length})</h2>
          {latePayers.length === 0 ? (
            <p className="text-sm text-stone-500">Tous les élèves sont à jour.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {latePayers.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 rounded-lg border border-stone-200 px-3 py-1.5">
                  <span>
                    {s.full_name} · {s.phone}
                  </span>
                  <span className="font-bold text-red-700">
                    Reste {formatMAD(studentBalance(s.price_total, s.paid_amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
