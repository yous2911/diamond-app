export default function ProgressionGuarantee() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Un cadre clair, des résultats clairs
          </h2>
          <p className="text-slate-700 mb-6">
            RevEd n&apos;est pas une app « à la carte ». C&apos;est un cadre structuré qui
            fonctionne particulièrement bien avec les familles prêtes à s&apos;engager
            sur une routine simple.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Ce que nous vous demandons
              </h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>• 30 minutes par jour d&apos;utilisation effective</li>
                <li>• 5 jours par semaine, en moyenne</li>
                <li>• Lancement des séances depuis le parcours recommandé</li>
                <li>• Suivi régulier du tableau de bord parents</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Ce que nous garantissons
              </h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>• Une progression mesurable sur les compétences ciblées</li>
                <li>• Un suivi transparent des résultats et de la rétention</li>
                <li>• Une équipe disponible pour répondre à vos questions</li>
                <li>• Un cadre de remboursement si la maîtrise n&apos;est pas atteinte</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Ce contrat moral simple est ce qui permet à RevEd d&apos;être autre chose qu&apos;une
            application supplémentaire sur un écran : un véritable allié éducatif.
          </p>
        </div>
      </div>
    </section>
  );
}

