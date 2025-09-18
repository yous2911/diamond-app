import Button from "../ui/Button";
import UrgencyBanner from "../ui/UrgencyBanner";

function PriceCard({ title, price, children, cta, isPopular = false, guarantee }: { 
  title: string; 
  price: string; 
  children: React.ReactNode; 
  cta: string; 
  isPopular?: boolean;
  guarantee?: string;
}) {
  return (
    <div className={`rounded-3xl border p-6 flex flex-col relative ${
      isPopular 
        ? 'border-cognitive-gold/50 bg-gradient-to-b from-cognitive-gold/10 to-white/5 shadow-2xl shadow-cognitive-gold/20' 
        : 'border-white/10 bg-white/5'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cognitive-gold text-deep-space px-4 py-1 rounded-full text-sm font-bold">
          🏆 EXCLUSIF FONDATEURS
        </div>
      )}
      <h4 className="font-sora text-2xl mb-2">{title}</h4>
      <div className="text-4xl font-extrabold text-cognitive-gold mb-4">
        {price}<span className="text-base text-white/60 font-normal">/mois</span>
      </div>
      <ul className="text-white/80 space-y-2 mb-6 list-none">
        {children}
      </ul>
      {guarantee && (
        <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-3 mb-4">
          <p className="text-green-200 text-sm text-center">✅ {guarantee}</p>
        </div>
      )}
      <Button className="mt-auto" aria-label={`Choisir l'offre ${title}`}>{cta}</Button>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="py-20 px-6 bg-white/5 border-y border-white/10">
      <div className="max-w-6xl mx-auto">
        <h3 className="font-sora text-3xl md:text-4xl mb-8 text-center">Investissement dans l'avenir de votre enfant</h3>
        <p className="text-center text-white/60 mb-8 text-lg">Moins cher qu'un cours particulier (€40/h) • Plus efficace que 4h d'écrans</p>
        
        <UrgencyBanner />
        
        <div className="grid md:grid-cols-2 gap-8">
          <PriceCard 
            title="Standard" 
            price="€30" 
            cta="Commencer immédiatement"
            guarantee="30 jours satisfait ou remboursé"
          >
            <li>✅ Accès complet à l'app (web + mobile)</li>
            <li>✅ 462 exercices avec répétition espacée</li>
            <li>✅ Rapport de progrès hebdomadaire</li>
            <li>🌍 **1 abonnement acheté = 1 accès offert à un enfant méritant**</li>
            <li>✅ Participation au mouvement d'équité éducative</li>
          </PriceCard>
          
          <PriceCard 
            title="Maîtrise & Impact" 
            price="€100" 
            cta="Postuler au Founders' Circle"
            isPopular={true}
            guarantee="60 jours + consultation gratuite 20min"
          >
            <li>✅ Toutes les fonctions Standard</li>
            <li>🌍 **Impact amplifié : 3 enfants soutenus par votre abonnement**</li>
            <li>✅ Rapports cognitifs détaillés (PDF)</li>
            <li>✅ Accès direct à l'équipe + nouveautés</li>
            <li>✅ **EXCLUSIF:** 3 sessions coaching (20min)</li>
            <li>✅ Certificat d'impact social annuel</li>
            <li>✅ Garantie maîtrise ou remboursé</li>
          </PriceCard>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm mb-4">*Annulable à tout moment. Garantie Maîtrise (voir conditions).</p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto mt-6">
            <div className="bg-deep-space/80 rounded-lg p-4">
              <p className="text-cognitive-gold font-medium">💡 ROI Familial:</p>
              <p className="text-white/80 text-sm">30 min/jour = 15h/semaine économisées en devoirs</p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-400/20 rounded-lg p-4">
              <p className="text-emerald-300 font-medium">🌍 Impact Social:</p>
              <p className="text-emerald-100 text-sm">Votre abonnement = Accès gratuit pour des enfants méritants</p>
            </div>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-400/30 rounded-xl p-6 max-w-3xl mx-auto">
            <p className="text-emerald-200 text-lg font-medium mb-2">
              🏆 Founders' Circle = Double Impact
            </p>
            <p className="text-emerald-100 text-sm">
              Excellence éducative pour votre enfant + Impact social amplifié + Communauté de parents engagés
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}



