'use client';

import { Brain, LineChart, ShieldCheck } from "lucide-react";
import ForgettingCurve from "../ui/ForgettingCurve";
import AnimatedSection from "../ui/AnimatedSection";
import AnimatedCard from "../ui/AnimatedCard";
import { motion } from "framer-motion";

export default function Science() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <AnimatedSection delay={0}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Une méthode alignée avec la recherche en sciences cognitives
            </h2>
            <p className="text-lg text-slate-600">
              Répétition espacée, récupération active, gestion de la charge cognitive,
              prérequis stricts : RevEd applique les principes reconnus de l&apos;apprentissage durable.
            </p>
          </div>
        </AnimatedSection>

        {/* 3 blocs scientifiques */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-10 mb-16">
          <AnimatedCard delay={0} className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Répétition espacée & récupération active
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              La plateforme combine un algorithme de répétition espacée et des questions
              de rappel actif pour consolider les connaissances au moment optimal.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Moins de relecture passive</li>
              <li>• Plus de rappels ciblés</li>
              <li>• Rétention long terme</li>
            </ul>
          </AnimatedCard>

          <AnimatedCard delay={0.1} className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Maîtrise vérifiée, pas supposée
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              L&apos;enfant ne progresse vers une nouvelle compétence que lorsque les tests
              montrent une acquisition réelle, stable dans le temps.
            </p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Tests réguliers intégrés</li>
              <li>• Retours immédiats</li>
              <li>• Suivi parents lisible</li>
            </ul>
          </AnimatedCard>

          <AnimatedCard delay={0.2} className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Évaluation indépendante
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              La conception pédagogique a fait l&apos;objet d&apos;une évaluation par un
              neuropsychologue clinicien spécialisé dans les troubles de l&apos;apprentissage.
            </p>
            <p className="text-xs text-slate-500">
              Rapport disponible sur demande pour les établissements et partenaires.
            </p>
          </AnimatedCard>
        </div>

        {/* Graphique de la courbe de l'oubli */}
        <AnimatedSection delay={0.3}>
          <div className="mb-16 max-w-4xl mx-auto">
            <ForgettingCurve />
          </div>
        </AnimatedSection>

        {/* Bandeau bas avec mention protocole */}
        <AnimatedSection delay={0.4}>
          <div className="bg-white rounded-2xl p-8 border border-slate-100 max-w-4xl mx-auto">
          <p className="text-sm text-slate-600 leading-relaxed">
            RevEd ne remplace pas une prise en charge clinique individuelle.
            La plateforme propose un cadre structuré qui respecte le rythme de
            l&apos;enfant, limite la charge cognitive inutile, et consolide les fondamentaux
            du primaire grâce à une progression rigoureuse.
          </p>
        </div>
      </div>
    </section>
  );
}

