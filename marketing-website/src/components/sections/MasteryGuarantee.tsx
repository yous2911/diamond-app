import { BadgeCheck, Info } from "lucide-react";

export default function MasteryGuarantee() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Garantie de maîtrise des compétences
            </h2>
          </div>
          <p className="text-slate-700 mb-6">
            RevEd s&apos;adresse aux familles qui souhaitent un cadre clair et des résultats
            objectivés. Si le protocole est respecté et que la compétence ciblée n&apos;est pas
            maîtrisée, nous remboursons la période concernée.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Engagement de la famille
              </h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>• 30 minutes par jour</li>
                <li>• 5 jours par semaine</li>
                <li>• Prérequis validés dans l&apos;app</li>
                <li>• Utilisation du parcours recommandé</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Engagement RevEd
              </h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>• Objectifs de maîtrise clairs pour chaque compétence</li>
                <li>• Tests réguliers intégrés dans le parcours</li>
                <li>• Suivi de rétention (J+7) dans le tableau de bord</li>
                <li>• Remboursement si la compétence n&apos;est pas acquise</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 mt-0.5" />
            <p>
              Les critères de maîtrise sont définis à l&apos;avance pour chaque compétence
              (combinaison de résultats aux tests et de stabilité dans le temps).
              Les conditions détaillées sont disponibles dans la politique de garantie.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
