import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Fond subtil */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
      <div className="container mx-auto px-4 text-center max-w-5xl">
        
        {/* Badge Haut de page */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Nouveau : Programme complet Primaire (CP au CM2)
        </div>
        {/* Titre Principal */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          30 minutes par jour pour construire <br className="hidden md:block" />
          <span className="text-blue-600">des bases solides</span>, sans conflits.
        </h1>
        {/* Sous-titre */}
        <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto font-medium">
          Du CP au CM2 — Lecture, Calcul, Fondamentaux.
        </p>
        {/* Description */}
        <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          RevEd transforme le temps d&apos;écran en apprentissage structuré.
          Votre enfant progresse pas à pas, vous suivez les résultats sans pression ni devoirs interminables.
        </p>
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link 
            href="https://diamond-app-frontend.vercel.app/login" 
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            Commencer l&apos;essai gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-lg transition-all">
            Voir comment ça fonctionne
          </button>
        </div>
        {/* Preuve sociale immédiate */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Méthode fondée sur la science cognitive</span>
          </div>
          <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Garantie maîtrise ou remboursé</span>
          </div>
        </div>
        {/* Image Hero */}
        <div className="mt-16 relative mx-auto max-w-4xl">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 relative">
            <Image
              src="/images/hero-enfant-tablette.png"
              alt="Enfant utilisant RevEd sur tablette dans un environnement serein"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
