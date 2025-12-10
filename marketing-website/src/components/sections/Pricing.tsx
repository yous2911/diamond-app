import { Check } from "lucide-react";

const featuresEssential = [
  "Accès complet RevEd",
  "Répétition espacée personnalisée",
  "Parcours structurés par compétences",
  "Tableau de bord parents hebdomadaire",
  "1 accès offert via le programme solidaire",
];

const featuresExcellence = [
  "Tout le contenu de l&apos;offre Essentiel",
  "Impact triplé : 3 enfants accompagnés",
  "Rapports cognitifs détaillés (PDF)",
  "Accès direct à l&apos;équipe RevEd",
  "Sessions d&apos;accompagnement parents",
];

export default function Pricing() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Un investissement éducatif rationnel
          </h2>
          <p className="text-lg text-slate-600">
            Moins cher qu&apos;un cours particulier, plus structuré que n&apos;importe quel écran.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Essentiel */}
          <div className="border border-slate-200 rounded-3xl p-8 flex flex-col bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
              Offre famille
            </p>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Essentiel</h3>
            <p className="text-sm text-slate-600 mb-4">
              Pour installer une routine d&apos;apprentissage sereine et efficace.
            </p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-slate-900">330 DH</span>
              <span className="text-sm text-slate-500">/ mois</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-slate-700">
              {featuresEssential.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button className="mt-auto w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all">
              Commencer avec Essentiel
            </button>
            <p className="text-[11px] text-slate-500 mt-3">
              Sans engagement. 30 jours satisfait ou remboursé.
            </p>
          </div>
          {/* Excellence */}
          <div className="border border-amber-300 rounded-3xl p-8 flex flex-col bg-gradient-to-b from-amber-50 to-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-wide text-amber-600 mb-2">
              Programme fondateurs
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold mb-3">
              Places limitées
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Excellence & Impact</h3>
            <p className="text-sm text-slate-600 mb-4">
              Pour les familles qui veulent combiner excellence académique
              et engagement social renforcé.
            </p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-slate-900">1100 DH</span>
              <span className="text-sm text-slate-500">/ mois</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-slate-700">
              {featuresExcellence.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button className="mt-auto w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all">
              Postuler au programme Excellence
            </button>
            <p className="text-[11px] text-slate-500 mt-3">
              Garantie étendue. Accompagnement personnalisé inclus.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
