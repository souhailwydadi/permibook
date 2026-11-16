import Link from "next/link";

/**
 * Branded loading screen (light theme, always visible).
 * Never a blank screen or a bare "..." while content loads.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <p className="text-2xl font-extrabold text-brand-700">PermiBook</p>
      <p className="mt-1 text-sm text-stone-500">
        Gestion des auto-écoles au Maroc
      </p>
      <div
        className="mt-6 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700"
        role="status"
        aria-label="Chargement"
      />
      <p className="mt-4 text-sm text-stone-500">Chargement…</p>
      <Link
        href="/login"
        className="mt-6 text-sm font-semibold text-brand-700 underline"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
