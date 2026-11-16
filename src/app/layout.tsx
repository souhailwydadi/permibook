import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PermiBook — سيّر مدرسة السياقة ديالك بلا صداع",
  description:
    "PermiBook : gestion des auto-écoles au Maroc — élèves, planning des leçons, examens et paiements en plusieurs fois. Essai gratuit 14 jours, puis 99 ou 199 DH par mois. Paiement manuel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
