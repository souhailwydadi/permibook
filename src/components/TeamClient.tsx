"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { todayString } from "@/lib/school";
import type { Category, Instructor, Vehicle } from "@/lib/types";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff =
    new Date(`${dateStr}T12:00:00`).getTime() -
    new Date(`${todayString()}T12:00:00`).getTime();
  return Math.round(diff / 86400000);
}

export default function TeamClient({
  instructors,
  vehicles,
  suspended,
}: {
  instructors: Instructor[];
  vehicles: Vehicle[];
  suspended: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [instName, setInstName] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instCats, setInstCats] = useState<Category[]>(["B"]);

  const [vehModel, setVehModel] = useState("");
  const [vehPlate, setVehPlate] = useState("");
  const [assurance, setAssurance] = useState("");
  const [visite, setVisite] = useState("");

  function toggleCat(c: Category) {
    setInstCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  async function addInstructor(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/owner/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: instName, phone: instPhone, categories: instCats }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Impossible d'ajouter le moniteur.");
      return;
    }
    setInstName("");
    setInstPhone("");
    router.refresh();
  }

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/owner/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_model: vehModel,
        plate: vehPlate,
        assurance_expiry: assurance || null,
        visite_technique_expiry: visite || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Impossible d'ajouter la voiture.");
      return;
    }
    setVehModel("");
    setVehPlate("");
    setAssurance("");
    setVisite("");
    router.refresh();
  }

  async function remove(kind: "instructors" | "vehicles", id: string) {
    if (!confirm("Supprimer cet élément ?")) return;
    const res = await fetch(`/api/owner/${kind}/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "Suppression impossible.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Équipe & Véhicules</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Moniteurs ({instructors.length})</h2>
          <form onSubmit={addInstructor} className="space-y-3">
            <div>
              <label className="label">Nom complet</label>
              <input className="input" required value={instName} onChange={(e) => setInstName(e.target.value)} placeholder="Youssef El Amrani" />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" required value={instPhone} onChange={(e) => setInstPhone(e.target.value)} placeholder="06 XX XX XX XX" dir="ltr" />
            </div>
            <div>
              <label className="label">Catégories enseignées</label>
              <div className="flex gap-4 text-sm">
                {(["B", "A", "C"] as const).map((c) => (
                  <label key={c} className="flex items-center gap-2">
                    <input type="checkbox" checked={instCats.includes(c)} onChange={() => toggleCat(c)} />
                    Permis {c}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full" disabled={busy || suspended}>
              {suspended ? "École suspendue" : "Ajouter le moniteur"}
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {instructors.map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2">
                <span>
                  <span className="font-semibold">{i.full_name}</span> · {i.phone} ·{" "}
                  {i.categories.map((c) => `Permis ${c}`).join(", ")}
                </span>
                {!suspended && (
                  <button onClick={() => remove("instructors", i.id)} className="text-xs font-semibold text-red-700 underline">
                    Supprimer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Voitures ({vehicles.length})</h2>
          <form onSubmit={addVehicle} className="space-y-3">
            <div>
              <label className="label">Marque / modèle</label>
              <input className="input" required value={vehModel} onChange={(e) => setVehModel(e.target.value)} placeholder="Dacia Logan" />
            </div>
            <div>
              <label className="label">Matricule</label>
              <input className="input" required value={vehPlate} onChange={(e) => setVehPlate(e.target.value)} placeholder="12345 | أ | 34" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Assurance (fin)</label>
                <input className="input" type="date" value={assurance} onChange={(e) => setAssurance(e.target.value)} />
              </div>
              <div>
                <label className="label">Visite technique (fin)</label>
                <input className="input" type="date" value={visite} onChange={(e) => setVisite(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary w-full" disabled={busy || suspended}>
              {suspended ? "École suspendue" : "Ajouter la voiture"}
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {vehicles.map((v) => {
              const ass = daysUntil(v.assurance_expiry);
              const vt = daysUntil(v.visite_technique_expiry);
              return (
                <li key={v.id} className="rounded-lg border border-stone-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-semibold">{v.brand_model}</span> · {v.plate}
                    </span>
                    {!suspended && (
                      <button onClick={() => remove("vehicles", v.id)} className="text-xs font-semibold text-red-700 underline">
                        Supprimer
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-600">
                    Assurance : {v.assurance_expiry ?? "—"}
                    {ass !== null && ass <= 30 && (
                      <span className={ass < 0 ? "font-bold text-red-700" : "font-bold text-amber-700"}>
                        {" "}({ass < 0 ? `expirée depuis ${-ass} j` : `expire dans ${ass} j`})
                      </span>
                    )}
                    {" · "}Visite technique : {v.visite_technique_expiry ?? "—"}
                    {vt !== null && vt <= 30 && (
                      <span className={vt < 0 ? "font-bold text-red-700" : "font-bold text-amber-700"}>
                        {" "}({vt < 0 ? `expirée depuis ${-vt} j` : `expire dans ${vt} j`})
                      </span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
