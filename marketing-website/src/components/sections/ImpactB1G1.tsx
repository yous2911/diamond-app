import { Globe2, School } from "lucide-react";

export default function ImpactB1G1() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
              1 abonnement = 1 accès offert
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Un abonnement, deux enfants qui progressent
            </h2>
            <p className="text-slate-700 mb-4">
              Chaque famille qui rejoint RevEd finance l&apos;accès d&apos;un enfant supplémentaire
              en zone reculée, via des écoles ou associations partenaires.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              L&apos;accès n&apos;est pas symbolique : les enfants bénéficiaires utilisent la
              même plateforme structurée, avec les mêmes parcours de progression.
            </p>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• Partenariats avec écoles et associations locales</li>
              <li>• Sélection transparente des bénéficiaires</li>
              <li>• Suivi agrégé de l&apos;utilisation</li>
            </ul>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Globe2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Programme solidaire RevEd
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Impact éducatif mesurable
                </p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Enfants déjà accompagnés</span>
                <span className="text-lg font-semibold text-slate-900">347</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "34%" }} />
              </div>
              <p className="text-xs text-slate-500">
                Objectif : 1 000 enfants accompagnés d&apos;ici fin 2025.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <School className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">
                Un rapport synthétique d&apos;impact est mis à disposition des familles et des
                partenaires chaque année scolaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
