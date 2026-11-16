"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMAD, trialDaysLeft } from "@/lib/school";
import type { SchoolRow } from "@/app/admin/page";

const STATUS_LABELS: Record<string, string> = {
  paid: "Payé",
  trial: "Essai",
  unpaid: "Non payé",
  overdue: "En retard",
};

export default function AdminClient({
  schools,
  totalSchools,
  totalStudents,
  totalRevenue,
}: {
  schools: SchoolRow[];
  totalSchools: number;
  totalStudents: number;
  totalRevenue: number;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    setError("");
    setBusyId(id);
    const res = await fetch(`/api/admin/schools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) setError(data.error || "Action impossible.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">👑 Super Admin — PermiBook</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Écoles</p>
          <p className="mt-1 text-3xl font-extrabold">{totalSchools}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Élèves (toutes écoles)</p>
          <p className="mt-1 text-3xl font-extrabold">{totalStudents}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Revenu encaissé</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-700">{formatMAD(totalRevenue)}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b text-stone-500">
              <th className="py-2">École</th>
              <th>Plan</th>
              <th>Essai</th>
              <th>Statut paiement</th>
              <th>Échéance</th>
              <th>Élèves</th>
              <th>Revenu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => {
              const days = s.plan === "trial" ? trialDaysLeft(s) : null;
              const due = s.paid_until
                ? s.paid_until.slice(0, 10)
                : s.trial_ends_at
                  ? s.trial_ends_at.slice(0, 10)
                  : "—";
              const off = s.status === "suspended";
              return (
                <tr key={s.id} className="border-b align-top last:border-0">
                  <td className="py-2 font-semibold">
                    {s.name}
                    <span className="block text-xs font-normal text-stone-500">
                      {s.city} · {s.phone}
                      {off && <span className="ml-1 font-bold text-red-700">· SUSPENDUE</span>}
                    </span>
                  </td>
                  <td>
                    <select
                      className="input !w-28"
                      value={s.plan}
                      disabled={busyId === s.id}
                      onChange={(e) => patch(s.id, { plan: e.target.value })}
                    >
                      <option value="trial">Essai</option>
                      <option value="99">99 DH</option>
                      <option value="199">199 DH</option>
                    </select>
                  </td>
                  <td>{days === null ? "—" : days >= 0 ? `${days} j` : "expiré"}</td>
                  <td>{STATUS_LABELS[s.payment_status] ?? s.payment_status}</td>
                  <td>{due}</td>
                  <td>{s.student_count}</td>
                  <td>{formatMAD(s.revenue)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <button
                        className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold hover:bg-stone-200"
                        disabled={busyId === s.id}
                        onClick={() => patch(s.id, { extend_trial_days: 7 })}
                      >
                        +7 j
                      </button>
                      <button
                        className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold hover:bg-stone-200"
                        disabled={busyId === s.id}
                        onClick={() => patch(s.id, { extend_trial_days: 30 })}
                      >
                        +30 j
                      </button>
                      <button
                        className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
                        disabled={busyId === s.id}
                        onClick={() => patch(s.id, { mark_paid: true })}
                      >
                        Marquer payé
                      </button>
                      <button
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          off
                            ? "bg-brand-100 text-brand-800 hover:bg-brand-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                        disabled={busyId === s.id}
                        onClick={() => patch(s.id, { status: off ? "active" : "suspended" })}
                      >
                        {off ? "Réactiver" : "OFF"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-stone-500">
        « Marquer payé » réactive l'école immédiatement pour 30 jours. Le
        bouton OFF suspend l'école : ses écritures sont bloquées côté
        serveur (tableau de bord en lecture seule, aucune création ni
        modification possible). La fin d'essai est automatique : essai = date
        de création + 14 jours (ou date prolongée).
      </p>
    </div>
  );
}
