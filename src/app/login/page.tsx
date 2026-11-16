"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeGet, safeSet } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill the last-used email (guarded: storage may be blocked).
  useEffect(() => {
    const last = safeGet("permibook_last_email");
    if (last) setEmail(last);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message || "Erreur de connexion. Vérifiez vos identifiants.");
      return;
    }
    safeSet("permibook_last_email", email);
    router.push("/dashboard");
    router.refresh();
  }

  function fillDemo() {
    setEmail("demo@permibook.ma");
    setPassword("Demo1234");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="card w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-brand-700">
            PermiBook
          </Link>
          <span className="text-xs text-stone-500">Auto-écoles · Maroc</span>
        </div>
        <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <div className="mt-6 rounded-lg bg-stone-100 p-3 text-sm">
          <p className="font-semibold">Compte démo</p>
          <p className="mt-1 text-stone-600" dir="ltr">
            demo@permibook.ma / Demo1234
          </p>
          <button
            type="button"
            onClick={fillDemo}
            className="mt-2 text-sm font-semibold text-brand-700 underline"
          >
            Remplir la démo
          </button>
        </div>
        <p className="mt-4 text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-brand-700">
            Créer mon école (essai 14 jours)
          </Link>
        </p>
      </div>
    </div>
  );
}
