"use client";

import Link from "next/link";
import {
  LESSON_STATUS_LABELS,
  LESSON_TYPE_LABELS,
  formatMAD,
  studentBalance,
} from "@/lib/school";
import type { Exam, Lesson, School, Student } from "@/lib/types";

export default function DashboardClient({
  school,
  todayLessons,
  upcomingExams,
  latePayers,
  revenueThisMonth,
  studentCount,
  todayDate,
  suspended,
}: {
  school: School;
  todayLessons: Lesson[];
  upcomingExams: Exam[];
  latePayers: Student[];
  revenueThisMonth: number;
  studentCount: number;
  todayDate: string;
  suspended: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
        <p className="text-sm text-stone-500">
          {school.name} · {school.city} · {todayDate}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Leçons aujourd'hui</p>
          <p className="mt-1 text-3xl font-extrabold">{todayLessons.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Élèves actifs</p>
          <p className="mt-1 text-3xl font-extrabold">{studentCount}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Examens (14 j)</p>
          <p className="mt-1 text-3xl font-extrabold">{upcomingExams.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-stone-500">Encaissé ce mois</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-700">
            {formatMAD(revenueThisMonth)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Leçons d'aujourd'hui</h2>
            <Link href="/planning" className="text-sm font-semibold text-brand-700">
              Planning →
            </Link>
          </div>
          {todayLessons.length === 0 ? (
            <p className="text-sm text-stone-500">Aucune leçon prévue aujourd'hui.</p>
          ) : (
            <ul className="space-y-2">
              {todayLessons.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-bold">{l.time.slice(0, 5)}</span> ·{" "}
                    {l.students?.full_name ?? "—"} ·{" "}
                    {LESSON_TYPE_LABELS[l.type]} · {l.instructors?.full_name ?? "—"}
                    {l.vehicles ? ` · ${l.vehicles.brand_model}` : ""}
                  </span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold">
                    {LESSON_STATUS_LABELS[l.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Examens à venir</h2>
            <Link href="/exams" className="text-sm font-semibold text-brand-700">
              Examens →
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-stone-500">Aucun examen dans les 14 prochains jours.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingExams.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-bold">{e.date}</span> ·{" "}
                    {e.type === "code" ? "Examen du code" : "Examen de conduite"} ·{" "}
                    {e.location}
                  </span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
                    {e.candidates.length} candidat(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Élèves en retard de paiement</h2>
          <Link href="/payments" className="text-sm font-semibold text-brand-700">
            Paiements →
          </Link>
        </div>
        {latePayers.length === 0 ? (
          <p className="text-sm text-stone-500">
            Aucun retard : tous les élèves sont à jour.
          </p>
        ) : (
          <ul className="space-y-2">
            {latePayers.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                <span>
                  {s.full_name} · Permis {s.category} · {s.phone}
                </span>
                <span className="font-bold text-red-700">
                  Reste {formatMAD(studentBalance(s.price_total, s.paid_amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {suspended && (
        <p className="text-sm text-red-700">
          Votre école est suspendue : les modifications sont bloquées jusqu'au
          paiement de l'abonnement.
        </p>
      )}
    </div>
  );
}
