'use client';
import React from 'react';

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-white/10 py-4">
      <button className="w-full text-left flex justify-between items-center" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="font-sora text-lg">{q}</span>
        <span className="text-white/50 text-2xl">{open ? '–' : '+'}</span>
      </button>
      {open && <p className="mt-2 text-white/80">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h3 className="font-sora text-3xl md:text-4xl mb-6 text-center">Questions Fréquentes</h3>
        <Item q="Pourquoi ajouter encore de l'écran ?" a="Nous remplaçons 30 minutes d'écran passif par 30 minutes actives et structurées, avec un objectif de compétence et des tests de rétention." />
        <Item q="Comment fonctionne la Garantie Maîtrise ?" a="Respectez le protocole (30 min/jour, 5 j/sem). Si la compétence n'est pas maîtrisée (Tests A & B ≥ 85% + rétention J+7 ≥ 80%), nous remboursons la période concernée." />
        <Item q="Qu'est-ce que le 1 acheté = 1 offert ?" a="Chaque abonnement finance un accès pour un élève d'une zone reculée via nos partenaires (écoles/associations). La transparence est totale." />
        <Item q="Et si mon enfant décroche ?" a="L'app ajuste la difficulté et propose des détours de prérequis. Le protocole est un cadre, pas une prison. Notre support est là pour vous accompagner." />
      </div>
    </section>
  );
}





