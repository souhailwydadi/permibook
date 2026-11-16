"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { School } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/students", label: "Élèves" },
  { href: "/planning", label: "Planning" },
  { href: "/exams", label: "Examens" },
  { href: "/payments", label: "Paiements" },
  { href: "/team", label: "Équipe & Véhicules" },
  { href: "/reminders", label: "Rappels" },
  { href: "/settings", label: "Paramètres" },
];

export default function AppShell({
  school,
  isSuperAdmin,
  suspended,
  suspensionReason,
  children,
}: {
  school: School | null;
  isSuperAdmin: boolean;
  suspended: boolean;
  suspensionReason: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-xl font-extrabold text-brand-700">
            PermiBook
          </Link>
          <div className="flex items-center gap-2">
            {school && (
              <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 sm:inline">
                {school.name} · {school.plan === "trial" ? "Essai" : `${school.plan} DH/mois`}
              </span>
            )}
            <button onClick={logout} className="btn-secondary !px-3 !py-1.5 text-xs">
              Déconnexion
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-brand-700 text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isSuperAdmin && (
            <Link
              href="/admin"
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${
                pathname === "/admin"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              👑 Super Admin
            </Link>
          )}
        </nav>
      </header>

      {suspended && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3">
          <p className="mx-auto max-w-6xl text-sm font-semibold text-red-800">
            {suspensionReason === "off"
              ? "⛔ Votre école est suspendue. Contactez PermiBook pour réactiver votre abonnement — vos données restent visibles en lecture seule."
              : suspensionReason === "trial_expired"
                ? "⏰ Votre essai gratuit de 14 jours est terminé. Payez votre abonnement (99 ou 199 DH/mois, espèces / CIH / Attijari) pour réactiver l'école."
                : "⏰ Votre abonnement est en retard de paiement. Payez pour réactiver l'école (espèces / CIH / Attijari)."}
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        PermiBook — Gestion des auto-écoles au Maroc · Paiement manuel (espèces / CIH / Attijari)
      </footer>
    </div>
  );
}
