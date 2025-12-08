export default function WhyItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Pourquoi ça marche
          </h2>
          <p className="text-lg text-slate-600">
            Trois leviers pédagogiques qui changent tout pour le primaire (CP à CM2).
          </p>
        </div>
        {/* Les 3 Points */}
        <div className="space-y-8 md:space-y-10">
          
          {/* Point 1 - Maths */}
          <div className="flex items-start gap-4 md:gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <span className="flex-shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-base font-bold shadow-sm">
              1
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Maths : la méthode Singapour
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Nous ne faisons pas apprendre par cœur. Nous utilisons l&apos;approche{" "}
                <strong className="text-blue-700">Concret → Imagé → Abstrait</strong>. 
                Votre enfant manipule, visualise, et <em>comprend</em> enfin le sens des nombres.
              </p>
            </div>
          </div>
          {/* Point 2 - Mémoire */}
          <div className="flex items-start gap-4 md:gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <span className="flex-shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-base font-bold shadow-sm">
              2
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Mémoire : l&apos;algorithme anti-oubli
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Fini le bourrage de crâne. RevEd détecte l&apos;instant précis où
                votre enfant va oublier une notion et propose une révision flash de
                2 minutes. <strong className="text-amber-700">Résultat : une mémorisation divisée par 3, ancrée pour la vie.</strong>
              </p>
            </div>
          </div>
          {/* Point 3 - Logique */}
          <div className="flex items-start gap-4 md:gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <span className="flex-shrink-0 mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-base font-bold shadow-sm">
              3
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Logique : apprendre à raisonner
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Avant de calculer, il faut savoir penser. Nos modules de logique
                structurent le cerveau de l&apos;enfant pour qu&apos;il ne soit plus
                jamais bloqué devant un problème complexe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

