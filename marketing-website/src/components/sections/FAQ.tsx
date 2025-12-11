'use client';

import { useState } from 'react';
import AnimatedSection from '../ui/AnimatedSection';
import AnimatedCard from '../ui/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "Pourquoi ajouter encore de l&apos;écran ?",
    a: "RevEd ne rajoute pas du temps d&apos;écran, il en remplace. Nous transformons une partie du temps déjà passé devant les écrans en apprentissage structuré, limité à 30 minutes, avec un objectif clair et des résultats visibles.",
  },
  {
    q: "À partir de quel niveau scolaire RevEd est-il adapté ?",
    a: "RevEd couvre l&apos;ensemble du primaire avec des parcours progressifs adaptés à l&apos;âge de l&apos;enfant et au programme officiel.",
  },
  {
    q: "Comment fonctionne la garantie de maîtrise ?",
    a: "Si le protocole est respecté (30 min/jour, 5 j/sem, utilisation du parcours recommandé) et que la compétence ciblée n&apos;est pas maîtrisée selon nos critères, nous remboursons la période concernée.",
  },
  {
    q: "Comment fonctionne le programme solidaire ?",
    a: "Pour chaque abonnement famille, un accès est offert à un enfant en zone reculée via nos partenaires (écoles et associations). Un suivi agrégé de l&apos;impact est partagé chaque année.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Non. Les abonnements sont sans engagement. Vous pouvez arrêter à tout moment. Les garanties s&apos;appliquent sur les périodes effectivement réglées.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <AnimatedSection delay={0}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Questions fréquentes
            </h2>
            <p className="text-slate-600">
              Si vous hésitez, vous n&apos;êtes probablement pas les seuls.
            </p>
          </div>
        </AnimatedSection>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <AnimatedCard key={item.q} delay={index * 0.1}>
              <motion.div
                className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden"
                initial={false}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex cursor-pointer items-center justify-between gap-2 px-5 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-left">{item.q}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
