"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXAM_RESULT_LABELS, todayString } from "@/lib/school";
import type { Exam, ExamResult, Student } from "@/lib/types";

export default function ExamsClient({
  exams,
  students,
  suspended,
}: {
  exams: Exam[];
  students: Student[];
  suspended: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [type, setType] = useState<"code" | "conduite">("code");
  const [date, setDate] = useState(todayString());
  const [location, setLocation] = useState("Centre d'examen Casablanca");
  const [candidateId, setCandidateId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const today = todayString();
  const upcoming = exams.filter((e) => e.date >= today);
  const past = exams.filter((e) => e.date < today).reverse();
  const selected = exams.find((e) => e.id === selectedExamId) ?? null;

  const studentName = (id: string) =>
    students.find((s) => s.id === id)?.full_name ?? id.slice(0, 8);

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/owner/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, date, location }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Impossible de créer l'examen.");
      return;
    }
    router.refresh();
  }

  async function updateCandidates(exam: Exam, candidates: Exam["candidates"]) {
    const res = await fetch(`/api/owner/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "Mise à jour impossible.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Examens</h1>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Nouvel examen</h2>
        <form onSubmit={createExam} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as "code" | "conduite")}>
              <option value="code">Examen du code</option>
              <option value="conduite">Examen de conduite</option>
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Lieu</label>
            <input className="input" required value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={busy || suspended}>
              {suspended ? "École suspendue" : busy ? "Création…" : "Créer l'examen"}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Examens à venir ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun examen prévu.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="rounded-lg border border-stone-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {e.date} · {e.type === "code" ? "Examen du code" : "Examen de conduite"} · {e.location}
                  </p>
                  <button
                    onClick={() => setSelectedExamId(selectedExamId === e.id ? null : e.id)}
                    className="text-sm font-semibold text-brand-700 underline"
                  >
                    Candidats ({e.candidates.length})
                  </button>
                </div>
                {selected?.id === e.id && (
                  <div className="mt-3 space-y-2">
                    {e.candidates.map((c) => (
                      <div key={c.student_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm">
                        <span>{studentName(c.student_id)}</span>
                        <select
                          className="input !w-auto"
                          value={c.result}
                          disabled={suspended}
                          onChange={(ev) =>
                            updateCandidates(
                              e,
                              e.candidates.map((x) =>
                                x.student_id === c.student_id
                                  ? { ...x, result: ev.target.value as ExamResult }
                                  : x,
                              ),
                            )
                          }
                        >
                          {(["pending", "passe", "rate", "ajourne"] as const).map((r) => (
                            <option key={r} value={r}>
                              {EXAM_RESULT_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <select className="input" value={candidateId} onChange={(ev) => setCandidateId(ev.target.value)}>
                        <option value="">— Ajouter un candidat —</option>
                        {students
                          .filter((s) => !e.candidates.some((c) => c.student_id === s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name} (Permis {s.category})
                            </option>
                          ))}
                      </select>
                      <button
                        className="btn-secondary"
                        disabled={!candidateId || suspended}
                        onClick={() =>
                          updateCandidates(e, [...e.candidates, { student_id: candidateId, result: "pending" as ExamResult }])
                        }
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Examens passés ({past.length})</h2>
          <ul className="space-y-2">
            {past.map((e) => (
              <li key={e.id} className="rounded-lg border border-stone-200 p-3 text-sm">
                <p className="font-semibold">
                  {e.date} · {e.type === "code" ? "Examen du code" : "Examen de conduite"} · {e.location}
                </p>
                <ul className="mt-1 space-y-1 text-stone-600">
                  {e.candidates.map((c) => (
                    <li key={c.student_id}>
                      {studentName(c.student_id)} — {EXAM_RESULT_LABELS[c.result]}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
