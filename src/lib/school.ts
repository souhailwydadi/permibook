import type {
  FormationPrices,
  School,
  WorkingHours,
} from "./types";

/** Slugify a school name for URLs (accents stripped, dashes only). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: ["08:00", "19:00"],
  tue: ["08:00", "19:00"],
  wed: ["08:00", "19:00"],
  thu: ["08:00", "19:00"],
  fri: ["08:00", "19:00"],
  sat: ["08:00", "17:00"],
  sun: null,
};

export const DEFAULT_FORMATION_PRICES: FormationPrices = {
  B: 2500,
  A: 1800,
  C: 3500,
};

/** Trial lasts 14 days from the school's creation (or its extended date). */
export function trialEndsAt(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + 14 * 86400000);
}

export type SuspensionReason = "active" | "off" | "trial_expired" | "unpaid";

/**
 * The single suspension rule, used by every page and API route.
 * A school is suspended when the super-admin switched it OFF, when its
 * 14-day trial ended without payment, or when its subscription is overdue.
 */
export function getSuspension(school: School): {
  suspended: boolean;
  reason: SuspensionReason;
} {
  if (school.status === "suspended") return { suspended: true, reason: "off" };
  const now = new Date();
  if (school.plan === "trial") {
    const ends = school.trial_ends_at
      ? new Date(school.trial_ends_at)
      : trialEndsAt(school.created_at);
    if (now > ends) return { suspended: true, reason: "trial_expired" };
  }
  if (school.payment_status === "overdue") {
    return { suspended: true, reason: "unpaid" };
  }
  if (
    school.plan !== "trial" &&
    school.payment_status !== "paid" &&
    school.paid_until &&
    now > new Date(school.paid_until)
  ) {
    return { suspended: true, reason: "unpaid" };
  }
  return { suspended: false, reason: "active" };
}

/** Whole days left on the trial (negative when expired). */
export function trialDaysLeft(school: School): number {
  const ends = school.trial_ends_at
    ? new Date(school.trial_ends_at)
    : trialEndsAt(school.created_at);
  return Math.ceil(
    (ends.getTime() - Date.now()) / 86400000,
  );
}

/** "2026-11-16" for a Date (local time, no timezone shift). */
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** "2 500 DH" — Moroccan formatting with a thin space. */
export function formatMAD(amount: number): string {
  return `${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DH`;
}

/** Remaining balance of a student (total price minus what they paid). */
export function studentBalance(priceTotal: number, paidAmount: number): number {
  return Math.max(0, Math.round(priceTotal - paidAmount));
}

/** Build a one-tap WhatsApp link with a prefilled message (never sends). */
export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  const intl = digits.startsWith("212")
    ? digits
    : digits.startsWith("0")
      ? `212${digits.slice(1)}`
      : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mer",
  thu: "Jeu",
  fri: "Ven",
  sat: "Sam",
  sun: "Dim",
};

export function dayLabel(day: string): string {
  return DAY_LABELS[day] ?? day;
}

export const CATEGORY_LABELS: Record<string, string> = {
  B: "Permis B — voiture",
  A: "Permis A — moto",
  C: "Permis C — camion",
};

export const LESSON_TYPE_LABELS: Record<string, string> = {
  code: "Cours de code",
  conduite: "Leçon de conduite",
};

export const LESSON_STATUS_LABELS: Record<string, string> = {
  scheduled: "Prévue",
  done: "Faite ✓",
  absent: "Absent",
  cancelled: "Annulée",
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  code: "Code",
  conduite: "Conduite",
  exam: "Examen",
  licence: "Permis obtenu",
};

export const EXAM_RESULT_LABELS: Record<string, string> = {
  pending: "En attente",
  passe: "Réussi ✓",
  rate: "Raté",
  ajourne: "Ajourné",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  transfer: "Virement (CIH / Attijari)",
  cheque: "Chèque",
};
