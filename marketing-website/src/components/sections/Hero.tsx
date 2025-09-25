import Button from "../ui/Button";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center text-center overflow-hidden bg-deep-space">
       <div className="absolute inset-0 -z-10">
         <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"/>
         <div className="absolute inset-0 bg-gradient-to-b from-deep-space/0 via-deep-space/40 to-deep-space"/>
       </div>
      <div className="relative z-10 max-w-5xl px-6">
        <h1 className="font-sora text-5xl md:text-7xl font-extrabold leading-tight animate-fade-in-up">
          Ils ont 4 heures d'algorithmes.
          <span className="block text-cognitive-gold">Offrez-lui 30 minutes qui construisent.</span>
        </h1>
        <p className="mt-6 text-white/85 text-lg md:text-xl max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          Répétition espacée (SM‑2), récupération active, prérequis stricts. Des résultats mesurables, des rapports clairs pour les parents.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button aria-label="Postuler pour le Founders' Circle">Postuler au Founders' Circle</Button>
          <Button 
            aria-label="Essayer l'application maintenant"
            className="bg-cognitive-gold hover:bg-cognitive-gold/90 text-deep-space font-semibold"
          >
            🚀 Essayer maintenant
          </Button>
        </div>
      </div>
    </section>
  );
}







