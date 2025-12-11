'use client';

import Image from "next/image";
import { Sparkles, Layers } from "lucide-react";
import AnimatedSection from "../ui/AnimatedSection";
import AnimatedCard from "../ui/AnimatedCard";
import { motion } from "framer-motion";

export default function Method() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        
        {/* En-tête de section */}
        <AnimatedSection delay={0}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Une méthode pensée pour le cerveau de l&apos;enfant
            </h2>
            <p className="text-lg text-slate-600">
              Pas de quiz aléatoires. Pas de surcharge. <br />
              Une architecture d&apos;apprentissage précise, validée par la recherche.
            </p>
          </div>
        </AnimatedSection>

        {/* Les 3 Piliers */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          
          {/* Pilier 1 */}
          <AnimatedCard delay={0} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Répétition espacée</h3>
            <p className="text-slate-600 mb-4 font-medium">Réviser au bon moment, pas plus.</p>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              RevEd planifie chaque rappel juste avant l&apos;oubli. L&apos;enfant consolide durablement, avec moins d&apos;effort.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Rétention long terme
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Moins de fatigue
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Progression mesurable
              </li>
            </ul>
          </AnimatedCard>

          {/* Pilier 2 */}
          <AnimatedCard delay={0.1} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <Image
                src="/images/gamification.png"
                alt="Mascotte et système de gamification RevEd"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">2. Motivation saine</h3>
            <p className="text-slate-600 mb-4 font-medium">Motiver l&apos;effort, pas la dépendance.</p>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Les récompenses célèbrent la progression réelle. Chaque animation sert à renforcer la confiance.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Effort valorisé
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Erreur dédramatisée
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Engagement durable
              </li>
            </ul>
          </AnimatedCard>

          {/* Pilier 3 */}
          <AnimatedCard delay={0.2} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Programme structuré</h3>
            <p className="text-slate-600 mb-4 font-medium">Le programme officiel, dans l&apos;ordre.</p>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Chaque compétence est liée à ses prérequis. On n&apos;avance jamais sans bases solides.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Conforme Éducation Nationale
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Progression continue
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Zéro saut dangereux
              </li>
            </ul>
          </AnimatedCard>
        </div>

        {/* Bandeau de synthèse */}
        <AnimatedSection delay={0.3}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="mt-16 bg-blue-600 rounded-2xl p-8 md:p-12 text-center text-white"
          >
            <h3 className="text-2xl font-bold mb-4">
              Remplacez 30 minutes d&apos;écran passif par 30 minutes qui construisent vraiment.
            </h3>
            <p className="text-blue-100 text-lg">
              Votre enfant apprend. Vous retrouvez la sérénité.
            </p>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
