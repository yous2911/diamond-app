export default function AttentionEconomy() {
  return (
    <section className="py-14 px-6 bg-deep-space">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-sora text-3xl md:text-4xl mb-4 text-center">
          Le vrai concurrent n'est pas l'école. C'est l'algorithme.
        </h2>
        <div className="max-w-xl mx-auto" aria-label="Comparaison de temps d'écran passif vs actif">
          <div className="h-40 rounded-2xl bg-white/5 border border-white/10 p-4 mt-8">
            <div className="flex items-end gap-6 h-full">
              <div className="flex-1">
                <div className="h-[85%] bg-white/15 rounded-lg relative">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-white/70">~4h</span>
                </div>
                <p className="mt-2 text-xs text-white/60 text-center">Flux passifs</p>
              </div>
              <div className="flex-1">
                <div className="h-[18%] bg-cognitive-gold/90 rounded-lg relative">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-deep-space font-bold bg-cognitive-gold px-1 rounded">30 min</span>
                </div>
                <p className="mt-2 text-xs text-white/60 text-center">RevEd (actif)</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-white/80">
            Notre protocole ne promet pas la magie. C'est un choix quotidien : reconstruire la concentration, l'effort et la fierté de progresser.
          </p>
          <p className="mt-2 text-xs text-white/50 text-center">
            L'objectif est de <strong>remplacer</strong> 30 min passives par 30 min actives.
          </p>
        </div>
      </div>
    </section>
  );
}





