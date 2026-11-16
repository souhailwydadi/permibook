"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  addDays,
  dayLabel,
} from "@/lib/school";
import type { Instructor, Lesson, Student, Vehicle } from "@/lib/types";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function PlanningClient({
  lessons,
  students,
  instructors,
  vehicles,
  weekStart,
  suspended,
}: {
  lessons: Lesson[];
  students: Student[];
  instructors: Instructor[];
  vehicles: Vehicle[];
  weekStart: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<"code" | "conduite">("conduite");
  const [date, setDate] = useState(weekStart);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);

  const days = DAY_KEYS.map((key, i) => ({
    key,
    date: addDays(weekStart, i),
    lessons: lessons.filter((l) => l.date === addDays(weekStart, i)),
  }));

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/owner/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        instructor_id: instructorId,
        vehicle_id: type === "conduite" ? vehicleId || null : null,
        type,
        date,
        time,
        duration_min: duration,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(
        data.error === "double_booking"
          ? "Conflit : le moniteur ou la voiture est déjà réservé à cette heure."
          : data.error || "Impossible de créer la leçon.",
      );
      return;
    }
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/owner/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "Mise à jour impossible.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Planning — semaine du {weekStart}</h1>
        <div className="flex gap-2">
          <Link href={`/planning?week=${addDays(weekStart, -7)}`} className="btn-secondary">
            ← Semaine précédente
          </Link>
          <Link href={`/planning?week=${addDays(weekStart, 7)}`} className="btn-secondary">
            Semaine suivante →
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Nouvelle leçon</h2>
        <form onSubmit={createLesson} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Élève</label>
            <select className="input" required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Choisir —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} (Permis {s.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as "code" | "conduite")}>
              <option value="conduite">Leçon de conduite</option>
              <option value="code">Cours de code</option>
            </select>
          </div>
          <div>
            <label className="label">Moniteur</label>
            <select className="input" required value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">— Choisir —</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.full_name}
                </option>
              ))}
            </select>
          </div>
          {type === "conduite" && (
            <div>
              <label className="label">Voiture</label>
              <select className="input" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">— Choisir —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand_model} · {v.plate}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Heure</label>
            <input className="input" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="label">Durée (minutes)</label>
            <input className="input" type="number" min={30} max={180} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" disabled={busy || suspended}>
              {suspended ? "École suspendue" : busy ? "Création…" : "Créer la leçon"}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((d) => (
          <div key={d.key} className="card !p-4">
            <h3 className="font-bold">
              {dayLabel(d.key)} <span className="font-normal text-stone-500">{d.date.slice(5)}</span>
            </h3>
            {d.lessons.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">Aucune leçon</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {d.lessons.map((l) => (
                  <li key={l.id} className="rounded-lg border border-stone-200 p-2 text-sm">
                    <p className="font-semibold">
                      {l.time.slice(0, 5)} · {LESSON_TYPE_LABELS[l.type]}
                    </p>
                    <p className="text-stone-600">
                      {l.students?.full_name ?? "—"} · {l.instructors?.full_name ?? "—"}
                      {l.vehicles ? ` · ${l.vehicles.brand_model}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      {LESSON_STATUS_LABELS[l.status]}
                    </p>
                    {l.status === "scheduled" && !suspended && (
                      <div className="mt-2 flex gap-1">
                        <button onClick={() => setStatus(l.id, "done")} className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Faite ✓
                        </button>
                        <button onClick={() => setStatus(l.id, "absent")} className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          Absent
                        </button>
                        <button onClick={() => setStatus(l.id, "cancelled")} className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          Annuler
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
