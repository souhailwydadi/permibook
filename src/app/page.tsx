import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-2xl font-extrabold text-brand-700">PermiBook</span>
          <div className="flex gap-2">
            <Link href="/login" className="btn-secondary">
              Connexion
            </Link>
            <Link href="/signup" className="btn-primary">
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero — Darija */}
        <section className="py-14 text-center">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            سيّر مدرسة السياقة ديالك
            <br />
            <span className="text-brand-700">بلا صداع 🚗</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            التلاميذ، البلانينغ ديال الدروس، الامتحانات، والخلاص على دفعات —
            كلشي فبلاصة وحدة. بلا ورق، بلا Excel، بلا نسيان.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn-primary !px-6 !py-3 !text-base">
              جرّب 14 يوم مجاناً
            </Link>
            <Link href="/login" className="btn-secondary !px-6 !py-3 !text-base">
              Voir la démo
            </Link>
          </div>
          <p className="mt-3 text-sm text-stone-500">
            بلا بطاقة بنكية · الدفع يدوي: نقداً، CIH أو Attijari
          </p>
        </section>

        {/* Features */}
        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "👨‍🎓 Élèves",
              text: "Dossier complet de chaque élève : CIN, catégorie de permis (B, A, C), pièces à fournir, heures de code et de conduite, solde restant.",
            },
            {
              title: "📅 Planning",
              text: "Cours de code et leçons de conduite par moniteur et par voiture. Les doubles réservations sont bloquées automatiquement.",
            },
            {
              title: "📝 Examens",
              text: "Examens du code et de la conduite : dates, lieu, candidats inscrits et résultats (réussi, raté, ajourné).",
            },
            {
              title: "💰 Paiements en plusieurs fois",
              text: "Acompte + tranches, reçus numérotés, liste des élèves en retard de paiement et caisse du mois.",
            },
            {
              title: "🔔 Rappels WhatsApp",
              text: "Rappel de leçon la veille et relance de paiement en un clic : un message pré-rempli s'ouvre dans WhatsApp. Vous envoyez, l'app n'envoie rien toute seule.",
            },
            {
              title: "🚗 Moniteurs & voitures",
              text: "Moniteurs avec leurs catégories, voitures avec alertes d'expiration d'assurance et de visite technique.",
            },
          ].map((f) => (
            <div key={f.title} className="card">
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{f.text}</p>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <section className="py-10" id="tarifs">
          <h2 className="text-center text-3xl font-extrabold">Tarifs simples, en dirhams</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="card text-center">
              <h3 className="text-lg font-bold">Essai gratuit</h3>
              <p className="mt-2 text-4xl font-extrabold">0 DH</p>
              <p className="text-sm text-stone-500">14 jours, toutes les fonctions</p>
              <ul className="mt-4 space-y-1 text-left text-sm text-stone-600">
                <li>✓ Élèves, planning, examens</li>
                <li>✓ Paiements et reçus</li>
                <li>✓ Rappels WhatsApp</li>
              </ul>
            </div>
            <div className="card border-2 !border-brand-600 text-center">
              <h3 className="text-lg font-bold">Basique</h3>
              <p className="mt-2 text-4xl font-extrabold text-brand-700">99 DH<span className="text-base font-normal">/mois</span></p>
              <p className="text-sm text-stone-500">Pour une petite auto-école</p>
              <ul className="mt-4 space-y-1 text-left text-sm text-stone-600">
                <li>✓ Tout l'essai, sans limite de temps</li>
                <li>✓ Jusqu'à 3 moniteurs</li>
                <li>✓ Support par WhatsApp</li>
              </ul>
            </div>
            <div className="card text-center">
              <h3 className="text-lg font-bold">Pro</h3>
              <p className="mt-2 text-4xl font-extrabold">199 DH<span className="text-base font-normal">/mois</span></p>
              <p className="text-sm text-stone-500">Pour les grandes écoles</p>
              <ul className="mt-4 space-y-1 text-left text-sm text-stone-600">
                <li>✓ Moniteurs et voitures illimités</li>
                <li>✓ Rapports et caisse avancés</li>
                <li>✓ Support prioritaire</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-stone-500">
            Paiement manuel : espèces, virement CIH ou Attijari. Pas de carte bancaire, pas de prélèvement automatique.
          </p>
        </section>

        {/* Honest FAQ */}
        <section className="py-10">
          <h2 className="text-center text-3xl font-extrabold">Questions fréquentes</h2>
          <div className="mx-auto mt-6 max-w-3xl space-y-3">
            {[
              {
                q: "Est-ce que PermiBook envoie des messages WhatsApp automatiquement ?",
                a: "Non. PermiBook ne peut pas envoyer de messages tout seul : il n'y a pas d'API WhatsApp Business ici. L'app prépare le message (rappel de leçon, relance de paiement) et l'ouvre dans WhatsApp — c'est vous qui appuyez sur Envoyer.",
              },
              {
                q: "Comment je paie mon abonnement ?",
                a: "En espèces, par virement CIH ou Attijari. Vous payez, puis le responsable de PermiBook confirme votre paiement et réactive votre école pour 30 jours.",
              },
              {
                q: "Que se passe-t-il après les 14 jours d'essai ?",
                a: "L'école est suspendue (lecture seule) jusqu'au paiement de l'abonnement. Vos données ne sont jamais supprimées.",
              },
              {
                q: "Mes élèves peuvent-ils réserver une leçon en ligne ?",
                a: "Non — le planning est géré par l'école. Les élèves reçoivent leurs rappels par WhatsApp, et c'est l'école qui place les leçons.",
              },
              {
                q: "Est-ce que mes données sont en sécurité ?",
                a: "Oui : chaque école ne voit que ses propres données (séparation stricte par école), et les paiements ne passent jamais par l'application.",
              },
            ].map((item) => (
              <div key={item.q} className="card">
                <h3 className="font-bold">{item.q}</h3>
                <p className="mt-1 text-sm text-stone-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white py-6 text-center text-sm text-stone-500">
        PermiBook — Gestion des auto-écoles au Maroc · Essai 14 jours · 99 / 199 DH par mois · Paiement manuel
      </footer>
    </div>
  );
}
