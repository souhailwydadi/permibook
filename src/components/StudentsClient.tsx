"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_LABELS,
  STUDENT_STATUS_LABELS,
  formatMAD,
  studentBalance,
} from "@/lib/school";
import type { Instructor, Payment, Settings, Student } from "@/lib/types";

export default function StudentsClient({
  students,
  instructors,
  settings,
  payments,
  suspended,
}: {
  students: Student[];
  instructors: Instructor[];
  settings: Settings | null;
  payments: Payment[];
  suspended: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Add-student form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cin, setCin] = useState("");
  const [category, setCategory] = useState<"B" | "A" | "C">("B");
  const [instructorId, setInstructorId] = useState("");

  const priceFor = (cat: "B" | "A" | "C") =>
    settings?.prices?.[cat] ?? (cat === "B" ? 2500 : cat === "A" ? 1800 : 3500);

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const selectedPayments = selected
    ? payments.filter((p) => p.student_id === selected.id)
    : [];

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/owner/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        cin,
        category,
        price_total: priceFor(category),
        instructor_id: instructorId || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Impossible d'ajouter l'élève.");
      return;
    }
    setFullName("");
    setPhone("");
    setCin("");
    setInstructorId("");
    router.refresh();
  }

  async function updateStudent(patch: Partial<Student>) {
    if (!selected) return;
    setError("");
    const res = await fetch(`/api/owner/students/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "Mise à jour impossible.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Élèves ({students.length})</h1>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Inscrire un élève</h2>
        <form onSubmit={addStudent} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Nom complet</label>
            <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Mehdi Rami" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 XX XX XX XX" dir="ltr" />
          </div>
          <div>
            <label className="label">CIN</label>
            <input className="input" value={cin} onChange={(e) => setCin(e.target.value)} placeholder="AB123456" dir="ltr" />
          </div>
          <div>
            <label className="label">Catégorie de permis</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as "B" | "A" | "C")}>
              {(["B", "A", "C"] as const).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]} — {formatMAD(priceFor(c))}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Moniteur</label>
            <select className="input" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">— Non assigné —</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={busy || suspended}>
              {suspended ? "École suspendue" : busy ? "Ajout…" : "Inscrire"}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-stone-500">
              <th className="py-2">Élève</th>
              <th>Permis</th>
              <th>Étape</th>
              <th>Total</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Pièces</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const balance = studentBalance(s.price_total, s.paid_amount);
              const docs = s.documents ?? { cin: false, photos: false, visite_medicale: false };
              const docsDone = [docs.cin, docs.photos, docs.visite_medicale].filter(Boolean).length;
              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-semibold">
                    {s.full_name}
                    <span className="block text-xs font-normal text-stone-500">{s.phone}</span>
                  </td>
                  <td>{s.category}</td>
                  <td>{STUDENT_STATUS_LABELS[s.status]}</td>
                  <td>{formatMAD(s.price_total)}</td>
                  <td>{formatMAD(s.paid_amount)}</td>
                  <td className={balance > 0 ? "font-bold text-red-700" : "text-green-700"}>
                    {formatMAD(balance)}
                  </td>
                  <td>{docsDone}/3</td>
                  <td>
                    <button
                      onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                      className="text-sm font-semibold text-brand-700 underline"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-stone-500">
                  Aucun élève pour le moment — inscrivez le premier ci-dessus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Dossier — {selected.full_name}</h2>
            <button onClick={() => setSelectedId(null)} className="btn-secondary !px-3 !py-1 text-xs">
              Fermer
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Étape de formation</label>
              <select
                className="input"
                value={selected.status}
                disabled={suspended}
                onChange={(e) => updateStudent({ status: e.target.value as Student["status"] })}
              >
                {(["code", "conduite", "exam", "licence"] as const).map((st) => (
                  <option key={st} value={st}>
                    {STUDENT_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Moniteur</label>
              <select
                className="input"
                value={selected.instructor_id ?? ""}
                disabled={suspended}
                onChange={(e) => updateStudent({ instructor_id: e.target.value || null })}
              >
                <option value="">— Non assigné —</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Heures de code effectuées</label>
              <input
                className="input"
                type="number"
                min={0}
                value={selected.code_hours_done}
                disabled={suspended}
                onChange={(e) => updateStudent({ code_hours_done: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label">Heures de conduite effectuées</label>
              <input
                className="input"
                type="number"
                min={0}
                value={selected.driving_hours_done}
                disabled={suspended}
                onChange={(e) => updateStudent({ driving_hours_done: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="label">Pièces du dossier</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["cin", "CIN"],
                  ["photos", "Photos"],
                  ["visite_medicale", "Visite médicale"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.documents?.[key] ?? false}
                    disabled={suspended}
                    onChange={(e) =>
                      updateStudent({
                        documents: { ...(selected.documents ?? { cin: false, photos: false, visite_medicale: false }), [key]: e.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="label">Historique des paiements</p>
            {selectedPayments.length === 0 ? (
              <p className="text-sm text-stone-500">Aucun paiement enregistré.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {selectedPayments.map((p) => (
                  <li key={p.id} className="flex justify-between rounded-lg border border-stone-200 px-3 py-1.5">
                    <span>
                      {p.date} · {p.receipt_no} · {p.method === "cash" ? "Espèces" : p.method === "transfer" ? "Virement" : "Chèque"}
                    </span>
                    <span className="font-bold">{formatMAD(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
