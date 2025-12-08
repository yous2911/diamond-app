const faqs = [
  {
    q: "Pourquoi ajouter encore de l&apos;écran ?",
    a: "RevEd ne rajoute pas du temps d&apos;écran, il en remplace. Nous transformons une partie du temps déjà passé devant les écrans en apprentissage structuré, limité à 30 minutes, avec un objectif clair et des résultats visibles.",
  },
  {
    q: "À partir de quel niveau scolaire RevEd est-il adapté ?",
    a: "RevEd couvre l&apos;ensemble du primaire, du CP au CM2, avec des parcours progressifs adaptés à l&apos;âge de l&apos;enfant et au programme officiel.",
  },
  {
    q: "Comment fonctionne la garantie de maîtrise ?",
    a: "Si le protocole est respecté (30 min/jour, 5 j/sem, utilisation du parcours recommandé) et que la compétence ciblée n&apos;est pas maîtrisée selon nos critères, nous remboursons la période concernée.",
  },
  {
    q: "Comment fonctionne le programme solidaire ?",
    a: "Pour chaque abonnement famille, un accès est offert à un enfant en zone reculée via nos partenaires (écoles et associations). Un suivi agrégé de l&apos;impact est partagé chaque année.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Non. Les abonnements sont sans engagement. Vous pouvez arrêter à tout moment. Les garanties s&apos;appliquent sur les périodes effectivement réglées.",
  },
];

export default function FAQ() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Questions fréquentes
          </h2>
          <p className="text-slate-600">
            Si vous hésitez, vous n&apos;êtes probablement pas les seuls.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                <span>{item.q}</span>
                <span className="shrink-0 text-slate-400 group-open:hidden">+</span>
                <span className="shrink-0 text-slate-400 hidden group-open:block">−</span>
              </summary>
              <div className="mt-3 text-sm text-slate-600 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
