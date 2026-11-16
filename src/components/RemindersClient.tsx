"use client";

import {
  LESSON_TYPE_LABELS,
  formatMAD,
  studentBalance,
  waLink,
} from "@/lib/school";
import type { Lesson, Student } from "@/lib/types";

export default function RemindersClient({
  schoolName,
  tomorrowLessons,
  students,
  tomorrowDate,
}: {
  schoolName: string;
  tomorrowLessons: Lesson[];
  students: Student[];
  tomorrowDate: string;
}) {
  const latePayers = students
    .filter((s) => studentBalance(s.price_total, s.paid_amount) > 0)
    .sort(
      (a, b) =>
        studentBalance(b.price_total, b.paid_amount) -
        studentBalance(a.price_total, a.paid_amount),
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Rappels</h1>
      <p className="text-sm text-stone-600">
        PermiBook ne peut pas envoyer de messages WhatsApp tout seul : il
        prépare le message et l'ouvre dans WhatsApp — c'est vous qui appuyez
        sur Envoyer.
      </p>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">
          Rappels de leçon — demain ({tomorrowDate}) · {tomorrowLessons.length}
        </h2>
        {tomorrowLessons.length === 0 ? (
          <p className="text-sm text-stone-500">Aucune leçon prévue demain.</p>
        ) : (
          <ul className="space-y-2">
            {tomorrowLessons.map((l) => {
              const phone = l.students?.phone ?? "";
              const message =
                `Bonjour ${l.students?.full_name ?? ""}, rappel de ${schoolName} : ` +
                `votre ${LESSON_TYPE_LABELS[l.type].toLowerCase()} est prévue demain ` +
                `(${tomorrowDate}) à ${l.time.slice(0, 5)}` +
                (l.instructors ? ` avec ${l.instructors.full_name}` : "") +
                (l.vehicles ? ` — voiture : ${l.vehicles.brand_model}` : "") +
                `. Merci de confirmer votre présence.`;
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-bold">{l.time.slice(0, 5)}</span> ·{" "}
                    {l.students?.full_name ?? "—"} · {LESSON_TYPE_LABELS[l.type]} ·{" "}
                    {l.instructors?.full_name ?? "—"}
                  </span>
                  <a
                    href={waLink(phone, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                  >
                    Rappeler sur WhatsApp →
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">
          Relances de paiement ({latePayers.length})
        </h2>
        {latePayers.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun élève en retard de paiement.</p>
        ) : (
          <ul className="space-y-2">
            {latePayers.map((s) => {
              const balance = studentBalance(s.price_total, s.paid_amount);
              const message =
                `Bonjour ${s.full_name}, rappel de ${schoolName} : ` +
                `il vous reste ${formatMAD(balance)} à régler sur votre formation ` +
                `(permis ${s.category}). Vous pouvez payer en espèces, par virement ` +
                `CIH ou Attijari. Merci !`;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  <span>
                    {s.full_name} · {s.phone} ·{" "}
                    <span className="font-bold text-red-700">
                      Reste {formatMAD(balance)}
                    </span>
                  </span>
                  <a
                    href={waLink(s.phone, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                  >
                    Relancer sur WhatsApp →
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
