export default function SocialProof() {
  return (
    <section className="py-20 bg-light-bg">
      <div className="max-w-6xl mx-auto text-center px-6">
        <h3 className="font-sora text-3xl md:text-4xl mb-4 text-text-dark">
          Rejoignez un mouvement de parents qui changent l&apos;avenir
        </h3>
        <p className="text-text-medium text-lg mb-12 max-w-3xl mx-auto">
          Chaque abonnement finance l&apos;accès gratuit d&apos;un enfant méritant. Votre investissement a un double impact.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 border-2 border-spark-turquoise/30 rounded-xl bg-gradient-to-br from-spark-turquoise/10 to-spark-turquoise/5">
            <div className="text-5xl font-black text-spark-turquoise mb-2">347</div>
            <div className="text-text-dark font-medium">Enfants soutenus</div>
          </div>
          <div className="p-6 border-2 border-cognitive-gold/30 rounded-xl bg-gradient-to-br from-cognitive-gold/10 to-cognitive-gold/5">
            <div className="text-5xl font-black text-cognitive-gold mb-2">462</div>
            <div className="text-text-dark">Exercices scientifiques</div>
          </div>
          <div className="p-6 border-2 border-mastery-blue/30 rounded-xl bg-gradient-to-br from-mastery-blue/10 to-mastery-blue/5">
            <div className="text-5xl font-black text-mastery-blue mb-2">94%</div>
            <div className="text-text-dark">Amélioration mesurée</div>
          </div>
          <div className="p-6 border-2 border-cognitive-gold/30 rounded-xl bg-gradient-to-br from-cognitive-gold/10 to-cognitive-gold/5">
            <div className="text-5xl font-black text-cognitive-gold mb-2">4.9★</div>
            <div className="text-text-dark">Parents satisfaits</div>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-warm-white rounded-2xl p-6 border-2 border-cognitive-gold/20 shadow-lg">
            <p className="text-text-dark mb-4 italic text-lg">
              &ldquo;Emma adore ses exercices, et savoir qu&apos;on aide un autre enfant en même temps... C&apos;est exactement nos valeurs familiales.&rdquo;
            </p>
            <div className="text-sm text-cognitive-gold font-bold">Marie D. • Maman d&apos;Emma, 8 ans</div>
            <div className="text-xs text-text-medium mt-1">+67% en calcul mental</div>
          </div>
          <div className="bg-warm-white rounded-2xl p-6 border-2 border-mastery-blue/20 shadow-lg">
            <p className="text-text-dark mb-4 italic text-lg">
              &ldquo;Plus qu&apos;une app éducative, c&apos;est un mouvement. Léo progresse ET on contribue à l&apos;équité éducative.&rdquo;
            </p>
            <div className="text-sm text-mastery-blue font-bold">Thomas L. • Papa de Léo, 7 ans</div>
            <div className="text-xs text-text-medium mt-1">+52% en lecture</div>
          </div>
        </div>
        
        {/* Impact Banner */}
        <div className="mt-12 bg-gradient-to-r from-spark-turquoise/20 to-mastery-blue/20 border-2 border-spark-turquoise/30 rounded-2xl p-8 max-w-3xl mx-auto">
          <h4 className="text-2xl font-bold text-text-dark mb-4">🌍 Impact en temps réel</h4>
          <p className="text-text-dark text-lg mb-4">
            Grâce à nos 50 familles fondatrices, <strong className="text-spark-turquoise">347 enfants</strong> accèdent gratuitement à une éducation de qualité.
          </p>
          <p className="text-text-medium text-sm">
            Prochain objectif : 1000 enfants soutenus d&apos;ici décembre 2024
          </p>
        </div>
      </div>
    </section>
  );
}