import Button from "../ui/Button";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center text-center overflow-hidden bg-gradient-to-b from-warm-white via-light-bg to-warm-white">
       <div className="absolute inset-0 -z-10">
         <div className="absolute inset-0 bg-gradient-to-br from-cognitive-gold/5 via-mastery-blue/5 to-spark-turquoise/5"/>
       </div>
      <div className="relative z-10 max-w-5xl px-6">
        <h1 className="font-sora text-5xl md:text-7xl font-extrabold leading-tight animate-fade-in-up text-text-dark">
          Transformez le temps d&apos;écran en réussite scolaire
          <span className="block text-cognitive-gold mt-2">(CP, CE1, CE2)</span>
        </h1>
        <p className="mt-6 text-text-medium text-lg md:text-xl max-w-3xl mx-auto animate-fade-in-up font-medium" style={{ animationDelay: '0.15s' }}>
          Votre enfant apprend sans s&apos;en rendre compte. Finis les devoirs conflictuels, place à la fierté de progresser.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button aria-label="Essayer gratuitement">Essayer gratuitement</Button>
          <Button variant="secondary" aria-label="Voir la démo">Voir la démo</Button>
        </div>
        <p className="mt-4 text-sm text-text-medium animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          ✅ 30 jours satisfait ou remboursé • ✅ Approuvé par la science cognitive
        </p>
      </div>
    </section>
  );
}





