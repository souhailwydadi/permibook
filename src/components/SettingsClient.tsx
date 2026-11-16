"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_FORMATION_PRICES, dayLabel } from "@/lib/school";
import type { School, Settings, WorkingHours } from "@/lib/types";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function SettingsClient({
  school,
  settings,
  userEmail,
  suspended,
}: {
  school: School;
  settings: Settings | null;
  userEmail: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(school.name);
  const [city, setCity] = useState(school.city);
  const [phone, setPhone] = useState(school.phone);
  const [whatsapp, setWhatsapp] = useState(school.whatsapp);

  const [prices, setPrices] = useState({
    B: settings?.prices?.B ?? DEFAULT_FORMATION_PRICES.B,
    A: settings?.prices?.A ?? DEFAULT_FORMATION_PRICES.A,
    C: settings?.prices?.C ?? DEFAULT_FORMATION_PRICES.C,
  });

  const [hours, setHours] = useState<WorkingHours>(
    settings?.working_hours ?? {
      mon: ["08:00", "19:00"],
      tue: ["08:00", "19:00"],
      wed: ["08:00", "19:00"],
      thu: ["08:00", "19:00"],
      fri: ["08:00", "19:00"],
      sat: ["08:00", "17:00"],
      sun: null,
    },
  );

  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    setBusy(true);
    const res = await fetch("/api/owner/school", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, phone, whatsapp }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Enregistrement impossible.");
      return;
    }
    setSaved("Profil enregistré.");
    router.refresh();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved("");
    setBusy(true);
    const res = await fetch("/api/owner/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices, working_hours: hours }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Enregistrement impossible.");
      return;
    }
    setSaved("Paramètres enregistrés.");
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage("");
    if (newPassword.length < 6) {
      setPwMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMessage(error.message);
      return;
    }
    setNewPassword("");
    setPwMessage("✓ Mot de passe changé.");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Paramètres</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm font-semibold text-green-700">{saved}</p>}

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Profil de l'école</h2>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nom de l'auto-école</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} disabled={suspended} />
          </div>
          <div>
            <label className="label">Ville</label>
            <input className="input" required value={city} onChange={(e) => setCity(e.target.value)} disabled={suspended} />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={suspended} dir="ltr" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} disabled={suspended} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-stone-500">
              Compte : {userEmail} · Abonnement :{" "}
              {school.plan === "trial" ? "Essai gratuit" : `${school.plan} DH/mois`} · Statut :{" "}
              {school.payment_status === "paid" ? "Payé" : school.payment_status === "trial" ? "Essai" : school.payment_status === "unpaid" ? "Non payé" : "En retard"}
            </p>
          </div>
          <div>
            <button className="btn-primary" disabled={busy || suspended}>
              Enregistrer le profil
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Tarifs des formations (DH)</h2>
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["B", "A", "C"] as const).map((c) => (
              <div key={c}>
                <label className="label">Permis {c}</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={prices[c]}
                  disabled={suspended}
                  onChange={(e) => setPrices({ ...prices, [c]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
          <div>
            <p className="label">Horaires d'ouverture</p>
            <div className="space-y-2">
              {DAYS.map((d) => {
                const slot = hours[d];
                return (
                  <div key={d} className="flex items-center gap-2 text-sm">
                    <span className="w-12 font-semibold">{dayLabel(d)}</span>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={slot !== null}
                        disabled={suspended}
                        onChange={(e) =>
                          setHours({ ...hours, [d]: e.target.checked ? ["08:00", "19:00"] : null })
                        }
                      />
                      Ouvert
                    </label>
                    {slot && (
                      <>
                        <input
                          className="input !w-28"
                          type="time"
                          value={slot[0]}
                          disabled={suspended}
                          onChange={(e) => setHours({ ...hours, [d]: [e.target.value, slot[1]] })}
                        />
                        <span>—</span>
                        <input
                          className="input !w-28"
                          type="time"
                          value={slot[1]}
                          disabled={suspended}
                          onChange={(e) => setHours({ ...hours, [d]: [slot[0], e.target.value] })}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button className="btn-primary" disabled={busy || suspended}>
            Enregistrer les paramètres
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Changer le mot de passe</h2>
        <form onSubmit={changePassword} className="flex max-w-md gap-2">
          <input
            className="input"
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            dir="ltr"
          />
          <button className="btn-secondary whitespace-nowrap">Changer</button>
        </form>
        {pwMessage && <p className="mt-2 text-sm text-stone-600">{pwMessage}</p>}
      </div>
    </div>
  );
}
