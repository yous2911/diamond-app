import Button from "../ui/Button";

export default function MasteryGuarantee() {
  return (
    <section className="py-16 px-6 bg-gradient-to-br from-cognitive-gold/10 via-warm-white to-mastery-blue/10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2">
          <h3 className="font-sora text-3xl md:text-4xl mb-3 text-text-dark">Garantie Maîtrise de Compétence</h3>
          <p className="text-text-dark mb-3 font-medium">Respectez le protocole (30 min/jour, 5 j/sem, ≤ 15 révisions/jour, prérequis validés). Si la compétence ciblée n&apos;est pas maîtrisée (Tests A & B ≥ 85% + rétention J+7 ≥ 80%), nous <strong className="text-cognitive-gold">remboursons</strong> la période.</p>
          <p className="text-text-medium text-sm">*Fondé sur un algorithme dérivé de SM‑2, avec caps adaptés enfants, EF et répétitions tracés.*</p>
        </div>
        <div className="flex md:justify-end"><Button aria-label="Voir la politique de garantie" variant="secondary">Voir la politique</Button></div>
      </div>
    </section>
  );
}





