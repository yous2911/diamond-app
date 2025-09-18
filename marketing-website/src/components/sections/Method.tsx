import { Brain, CheckCircle2, Repeat, KeyRound } from 'lucide-react';

function Pillar({ icon, title, desc, points }: { icon: React.ReactNode; title: string; desc: string; points: string[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-3 rounded-2xl bg-cognitive-gold/15">{icon}</div>
        <h3 className="font-sora text-2xl">{title}</h3>
      </div>
      <p className="text-white/80 mb-4">{desc}</p>
      <ul className="space-y-2 text-white/70">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-cognitive-gold" /><span>{p}</span></li>
        ))}
      </ul>
    </div>
  );
}

export default function Method() {
  return (
    <section className="py-20 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-sora text-4xl md:text-5xl text-center mb-4">Une méthode fondée sur la recherche</h2>
        <p className="text-center text-white/75 max-w-3xl mx-auto mb-12">Répétition espacée (SM‑2 dérivé), effet de test, charge cognitive maîtrisée, prérequis obligatoires.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <Pillar icon={<Repeat className="text-cognitive-gold" />} title="Répétition espacée" desc="Le bon rappel, au bon moment." points={["Planification adaptative", "Rétention long terme", "Moins de temps, plus d'impact"]} />
          <Pillar icon={<Brain className="text-cognitive-gold" />} title="Récupération active" desc="On apprend en cherchant, pas en relisant." points={["Questions ciblées", "Feedback immédiat", "Progression visible"]} />
          <Pillar icon={<CheckCircle2 className="text-cognitive-gold" />} title="Maîtrise garantie" desc="On avance seulement quand c'est acquis." points={["Tests A & B", "Rétention J+7", "EF ≥ 2.2 / reps ≥ 3"]} />
          <Pillar icon={<KeyRound className="text-cognitive-gold" />} title="Prérequis" desc="Chaque chose en son temps." points={["Détours automatiques", "Zero dead‑ends", "Moins de frustration"]} />
        </div>
      </div>
    </section>
  );
}



