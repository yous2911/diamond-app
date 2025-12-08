export default function SocialProof() {
  return (
    <section className="py-20 bg-gradient-to-b from-white/5 to-white/10 border-b border-white/10">
      <div className="max-w-6xl mx-auto text-center px-6">
        <h3 className="font-sora text-3xl md:text-4xl mb-4 text-white">
          Rejoignez un mouvement de parents qui changent l&apos;avenir
        </h3>
        <p className="text-white/70 text-lg mb-12 max-w-3xl mx-auto">
          Chaque abonnement finance l&apos;accès gratuit d&apos;un enfant méritant. Votre investissement a un double impact.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 border border-emerald-400/30 rounded-xl bg-emerald-900/20">
            <div className="text-5xl font-black text-emerald-300 mb-2">347</div>
            <div className="text-emerald-100 font-medium">Enfants soutenus par le programme 1=1</div>
          </div>
          <div className="p-6 border border-white/10 rounded-xl bg-white/5">
            <div className="text-5xl font-black text-cognitive-gold mb-2">462</div>
            <div className="text-white/80">Exercices scientifiques</div>
          </div>
          <div className="p-6 border border-white/10 rounded-xl bg-white/5">
            <div className="text-5xl font-black text-cognitive-gold mb-2">94%</div>
            <div className="text-white/80">Amélioration mesurée</div>
          </div>
          <div className="p-6 border border-white/10 rounded-xl bg-white/5">
            <div className="text-5xl font-black text-cognitive-gold mb-2">4.9★</div>
            <div className="text-white/80">Parents Founders</div>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-white/90 mb-4 italic">
              &ldquo;Emma adore ses exercices, et savoir qu&apos;on aide un autre enfant en même temps... C&apos;est exactement nos valeurs familiales.&rdquo;
            </p>
            <div className="text-sm text-cognitive-gold">Marie D. • Maman d&apos;Emma, 8 ans</div>
            <div className="text-xs text-white/50 mt-1">+67% en calcul mental • Founders&apos; Circle</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-white/90 mb-4 italic">
              &ldquo;Plus qu&apos;une app éducative, c&apos;est un mouvement. Léo progresse ET on contribue à l&apos;équité éducative.&rdquo;
            </p>
            <div className="text-sm text-cognitive-gold">Thomas L. • Papa de Léo, 7 ans</div>
            <div className="text-xs text-white/50 mt-1">+52% en lecture • Impact social</div>
          </div>
        </div>
        
        {/* Impact Banner */}
        <div className="mt-12 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-400/30 rounded-2xl p-8 max-w-3xl mx-auto">
          <h4 className="text-2xl font-bold text-emerald-200 mb-4">🌍 Impact en temps réel</h4>
          <p className="text-emerald-100 text-lg mb-4">
            Grâce à nos 50 familles fondatrices, <strong>347 enfants</strong> accèdent gratuitement à une éducation de qualité.
          </p>
          <p className="text-emerald-300 text-sm">
            Prochain objectif : 1000 enfants soutenus d&apos;ici décembre 2024
          </p>
        </div>
      </div>
    </section>
  );
}