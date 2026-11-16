"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          school_name: schoolName,
          city,
          phone,
          whatsapp: phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Inscription impossible. Réessayez.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Erreur réseau. Réessayez.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-8">
      <div className="card w-full max-w-md">
        <Link href="/" className="text-xl font-extrabold text-brand-700">
          PermiBook
        </Link>
        <h1 className="mb-2 mt-4 text-2xl font-bold">Créer mon auto-école</h1>
        <p className="mb-6 text-sm text-stone-600">
          Essai gratuit de 14 jours, sans carte bancaire. Après l'essai :
          99 ou 199 DH par mois, paiement manuel (espèces / CIH / Attijari).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom de l'auto-école</label>
            <input
              className="input"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Auto-École Atlas"
            />
          </div>
          <div>
            <label className="label">Ville</label>
            <input
              className="input"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Casablanca"
            />
          </div>
          <div>
            <label className="label">Téléphone / WhatsApp</label>
            <input
              className="input"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 XX XX XX XX"
              dir="ltr"
            />
          </div>
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
            <label className="label">Mot de passe (6 caractères minimum)</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Création…" : "Créer mon école — essai 14 jours"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-brand-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
