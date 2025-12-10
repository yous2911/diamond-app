import Image from "next/image";
import { Star, Users, HeartHandshake } from "lucide-react";

export default function SocialProof() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Des familles engagées, des résultats visibles
          </h2>
          <p className="text-lg text-slate-600">
            RevEd n&apos;est pas une simple application. C&apos;est un cadre éducatif structuré,
            pensé pour la progression et la sérénité des parents.
          </p>
        </div>
        {/* Image Social Proof */}
        <div className="mb-16 max-w-4xl mx-auto">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg border border-slate-100">
            <Image
              src="/images/social-proof.png"
              alt="Familles utilisant RevEd - Preuve sociale"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </div>
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
            <p className="text-3xl font-bold text-slate-900 mb-1">+94%</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Progression moyenne mesurée
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
            <p className="text-3xl font-bold text-slate-900 mb-1">Des milliers</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Exercices structurés
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-2xl font-bold text-slate-900">4,9</span>
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Note moyenne parents
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
            <p className="text-3xl font-bold text-slate-900 mb-1">347</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Enfants déjà accompagnés
            </p>
          </div>
        </div>
        {/* Témoignages */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col justify-between">
            <div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                &ldquo;Pour la première fois, les devoirs ne sont plus une source de tension.
                Les séances sont courtes, claires, et ma fille a repris confiance.&rdquo;
              </p>
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Marie D.</p>
                <p className="text-xs text-slate-500">Maman</p>
              </div>
              <p className="text-xs text-emerald-600 font-semibold">
                +67% en calcul mental
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col justify-between">
            <div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                &ldquo;Léo a retrouvé le plaisir d&apos;apprendre. Et le fait que notre abonnement
                finance un autre enfant correspond exactement à nos valeurs.&rdquo;
              </p>
            </div>
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Thomas L.</p>
                <p className="text-xs text-slate-500">Papa</p>
              </div>
              <p className="text-xs text-emerald-600 font-semibold">
                +52% en lecture
              </p>
            </div>
          </div>
        </div>
        {/* Bandeau impact */}
        <div className="bg-blue-600 rounded-2xl p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">
                Un impact éducatif mesurable
              </h3>
              <p className="text-blue-100 text-sm">
                Chaque nouvelle famille rejoint un mouvement qui finance l&apos;accès
                d&apos;enfants en zones reculées à une plateforme structurée et suivie.
              </p>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-sm text-blue-100 mb-1">
              Objectif 2025 :
            </p>
            <p className="text-lg font-semibold">
              1 000 enfants accompagnés grâce au programme solidaire
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
