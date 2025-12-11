'use client';

import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "../ui/AnimatedSection";
import MagneticButton from "../ui/MagneticButton";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Fond subtil */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
      <div className="container mx-auto px-4 text-center max-w-5xl">
        
        {/* Badge Haut de page */}
        <AnimatedSection delay={0}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Nouveau : Programme complet Primaire
          </motion.div>
        </AnimatedSection>

        {/* Titre Principal */}
        <AnimatedSection delay={0.1}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]"
          >
            30 minutes par jour pour construire <br className="hidden md:block" />
            <span className="text-blue-600">des bases solides</span>, sans conflits.
          </motion.h1>
        </AnimatedSection>

        {/* Sous-titre */}
        <AnimatedSection delay={0.2}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto font-medium"
          >
            Lecture, Calcul, Fondamentaux.
          </motion.p>
        </AnimatedSection>

        {/* Description */}
        <AnimatedSection delay={0.3}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            RevEd transforme le temps d&apos;écran en apprentissage structuré.
            Votre enfant progresse pas à pas, vous suivez les résultats sans pression ni devoirs interminables.
          </motion.p>
        </AnimatedSection>

        {/* CTAs */}
        <AnimatedSection delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <MagneticButton
              href="https://diamond-app-frontend.vercel.app/login"
              variant="primary"
              className="flex items-center gap-2"
            >
              Commencer l&apos;essai gratuit
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
            <MagneticButton variant="secondary">
              Voir comment ça fonctionne
            </MagneticButton>
          </div>
        </AnimatedSection>
        {/* Preuve sociale immédiate */}
        <AnimatedSection delay={0.5}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm font-medium text-slate-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Méthode fondée sur la science cognitive</span>
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Garantie maîtrise ou remboursé</span>
            </div>
          </motion.div>
        </AnimatedSection>

        {/* Image Hero */}
        <AnimatedSection delay={0.6}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 relative mx-auto max-w-4xl"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 relative"
            >
              <Image
                src="/images/hero-enfants-marocains.png"
                alt="Enfants marocains utilisant RevEd sur tablette dans un environnement serein"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
            </motion.div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
